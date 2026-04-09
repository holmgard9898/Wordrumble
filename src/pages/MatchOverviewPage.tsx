import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Flag, Sparkles, Swords, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useDictionary } from '@/hooks/useDictionary';
import { useAIOpponent } from '@/hooks/useAIOpponent';
import { useGameBackground } from '@/hooks/useGameBackground';
import {
  buildMatchUpdate,
  fetchHeadToHeadStats,
  fetchMatchById,
  fetchProfileNames,
  getOpponentUserId,
  updateMatch,
  type MatchRow,
} from '@/features/multiplayer/api';
import { MODE_LABELS } from '@/features/multiplayer/rules';
import {
  applyTurnResult,
  beginNextRound,
  calculateMatchTotals,
  getBlockedWords,
  getCurrentRound,
  getCurrentTurn,
  getRoundSummary,
  getTurnStartingGrid,
  parseMatchProgress,
} from '@/features/multiplayer/state';
import type { HeadToHeadStats, MatchProgressState, MatchTurnResult } from '@/features/multiplayer/types';
import { getLanguageConfig } from '@/data/languages';

const MatchOverviewPage = () => {
  const { matchId = '' } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const bg = useGameBackground();
  const { user, loading: authLoading } = useAuth();
  const { isValidWord, loading: dictionaryLoading } = useDictionary(settings.language);
  const { runAIRound } = useAIOpponent();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [progress, setProgress] = useState<MatchProgressState | null>(null);
  const [opponentName, setOpponentName] = useState('Datorn');
  const [headToHead, setHeadToHead] = useState<HeadToHeadStats>({ wins: 0, losses: 0, draws: 0 });
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [updating, setUpdating] = useState(false);
  const aiRunningRef = useRef(false);
  const langConfig = getLanguageConfig(settings.language);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, navigate, user]);

  const loadMatch = useCallback(async () => {
    if (!user || !matchId) return;

    setLoadingMatch(true);
    try {
      const row = await fetchMatchById(matchId);
      if (row.player1_id !== user.id && row.player2_id !== user.id) {
        navigate('/challenge', { replace: true });
        return;
      }

      const parsed = parseMatchProgress(row.round_grids, row.mode, settings.language);
      const stats = await fetchHeadToHeadStats(user.id, row);
      const opponentId = getOpponentUserId(row, user.id);

      if (row.is_ai_match || !opponentId) {
        setOpponentName('Datorn');
      } else {
        const names = await fetchProfileNames([opponentId]);
        setOpponentName(names[opponentId] ?? 'Motståndare');
      }

      setHeadToHead(stats);
      setMatch(row);
      setProgress(parsed);
    } catch {
      toast({
        title: 'Kunde inte hämta matchen',
        description: 'Du skickas tillbaka till Utmana-menyn.',
      });
      navigate('/challenge', { replace: true });
    } finally {
      setLoadingMatch(false);
    }
  }, [matchId, navigate, settings.language, user]);

  useEffect(() => {
    if (user) {
      loadMatch();
    }
  }, [loadMatch, user]);

  useEffect(() => {
    if (!match || !progress || dictionaryLoading || !match.is_ai_match || aiRunningRef.current) return;
    if (progress.phase !== 'awaiting_ai') return;

    const round = getCurrentRound(progress);
    const turn = getCurrentTurn(round);
    if (!round || !turn || turn.player !== 'player2') return;

    aiRunningRef.current = true;
    setUpdating(true);

    runAIRound(
      getTurnStartingGrid(round),
      isValidWord,
      progress.mode,
      turn.moves,
      getBlockedWords(round),
      langConfig.letterPool,
      langConfig.letterValues,
    )
      .then(async (result) => {
        const updatedProgress = applyTurnResult(progress, round.roundNumber, {
          player: 'player2',
          moves: turn.moves,
          score: result.score,
          words: result.words,
          bestWord: result.bestWord,
          bestWordScore: result.bestWordScore,
          finalGrid: result.finalGrid,
          completedAt: new Date().toISOString(),
        } satisfies MatchTurnResult);

        const saved = await updateMatch(match.id, buildMatchUpdate(match, updatedProgress));
        setMatch(saved);
        setProgress(updatedProgress);
      })
      .catch(() => {
        toast({
          title: 'Kunde inte köra motståndarens tur',
          description: 'Öppna matchen igen om ett ögonblick.',
        });
      })
      .finally(() => {
        aiRunningRef.current = false;
        setUpdating(false);
      });
  }, [dictionaryLoading, isValidWord, langConfig.letterPool, langConfig.letterValues, match, progress, runAIRound]);

  const currentRound = progress ? getCurrentRound(progress) : null;
  const currentTurn = currentRound ? getCurrentTurn(currentRound) : null;
  const completedRounds = progress?.rounds.filter((round) => round.completed) ?? [];
  const visibleRound = useMemo(() => {
    if (!progress) return null;
    if (progress.phase === 'between_rounds') {
      return completedRounds[completedRounds.length - 1] ?? currentRound;
    }
    return currentRound;
  }, [completedRounds, currentRound, progress]);
  const visibleSummary = progress && visibleRound ? getRoundSummary(visibleRound, progress.mode) : null;
  const totals = progress ? calculateMatchTotals(progress) : { player1: 0, player2: 0 };
  const isPlayerAction = progress && (progress.phase === 'ready' || (progress.phase === 'review' && progress.nextActionFor === 'player1'));

  const handleForfeit = useCallback(async () => {
    if (!match || !progress) return;
    setUpdating(true);
    try {
      const saved = await updateMatch(match.id, buildMatchUpdate(match, progress, { forfeitBy: 'player1' }));
      setMatch(saved);
      setProgress({ ...progress, phase: 'match_over', nextActionFor: null, lastActor: 'player1' });
    } catch {
      toast({
        title: 'Kunde inte ge upp matchen',
        description: 'Försök igen.',
      });
    } finally {
      setUpdating(false);
    }
  }, [match, progress]);

  const handlePrimaryAction = useCallback(async () => {
    if (!match || !progress) return;

    if (progress.phase === 'between_rounds') {
      setUpdating(true);
      try {
        const nextProgress = beginNextRound(progress);
        const saved = await updateMatch(match.id, buildMatchUpdate(match, nextProgress));
        setMatch(saved);
        setProgress(nextProgress);

        if (nextProgress.phase === 'ready') {
          navigate(`/challenge/match/${match.id}/play`);
        }
      } catch {
        toast({
          title: 'Kunde inte starta nästa omgång',
          description: 'Försök igen.',
        });
      } finally {
        setUpdating(false);
      }
      return;
    }

    navigate(`/challenge/match/${match.id}/play`);
  }, [match, navigate, progress]);

  const statusLabel = (() => {
    if (!progress) return 'Laddar match...';
    if (match?.status === 'forfeit') return 'Matchen är avgjord';
    switch (progress.phase) {
      case 'awaiting_ai':
        return 'Inväntar motståndare';
      case 'between_rounds':
        return 'Omgång klar';
      case 'review':
        return 'Din tur igen';
      case 'match_over':
        return 'Slutresultat';
      default:
        return 'Din tur';
    }
  })();

  const primaryLabel = (() => {
    if (!progress || !currentRound) return 'Spela';
    if (progress.phase === 'between_rounds') return `Starta omgång ${currentRound.roundNumber}`;
    if (currentRound.currentSubTurnIndex > 0) return 'Fortsätt omgång';
    return 'Spela nu';
  })();

  if (authLoading || loadingMatch || !match || !progress) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Laddar match...</div>
        <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${bg.className}`} style={bg.style}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate('/challenge')} className="gap-2 text-white/70 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Utmana
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">Matchstatus</p>
            <p className="text-sm font-semibold text-white">{statusLabel}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{MODE_LABELS[progress.mode]}</p>
                <h1 className="text-3xl font-bold text-white">Du vs {opponentName}</h1>
                <p className="mt-1 text-sm text-white/60">
                  Omgång {currentRound?.roundNumber ?? progress.rounds.length}/{progress.rounds.length}
                  {currentTurn ? ` • ${currentTurn.moves} drag i denna tur` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-white/50">Du</p>
                  <p className="text-3xl font-bold text-white">{totals.player1}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-white/50">{opponentName}</p>
                  <p className="text-3xl font-bold text-white">{totals.player2}</p>
                </div>
              </div>
            </div>

            {progress.phase === 'awaiting_ai' ? (
              <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/10 p-6 text-center">
                <Clock3 className="mx-auto mb-3 h-10 w-10 animate-pulse text-primary" />
                <h2 className="text-2xl font-bold text-white">Inväntar motståndare</h2>
                <p className="mt-2 text-white/60">
                  {opponentName} spelar{currentTurn ? ` ${currentTurn.moves} drag` : ''}...
                </p>
                <div className="mx-auto mt-4 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full animate-pulse rounded-full bg-primary" />
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                      {progress.phase === 'between_rounds' ? `Omgång ${visibleRound?.roundNumber ?? '-'} avslutad` : `Omgång ${visibleRound?.roundNumber ?? '-'} just nu`}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">Din poäng</p>
                        <p className="text-3xl font-bold text-white">{visibleSummary?.player1Score ?? 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/60">{opponentName}</p>
                        <p className="text-3xl font-bold text-white">{visibleSummary?.player2Score ?? 0}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/60">
                      <div className="rounded-2xl bg-black/20 p-3">
                        <p>Du hittade</p>
                        <p className="text-lg font-semibold text-white">{visibleSummary?.player1Words.length ?? 0} ord</p>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <p>{opponentName}</p>
                        <p className="text-lg font-semibold text-white">{visibleSummary?.player2Words.length ?? 0} ord</p>
                      </div>
                    </div>
                    {progress.mode === 'oneword' && (
                      <div className="mt-4 rounded-2xl bg-black/20 p-3 text-sm text-white/70">
                        <p>Starkaste ord</p>
                        <p className="mt-1 text-white">
                          Du: {visibleSummary?.player1BestWord ?? '—'} ({visibleSummary?.player1BestWordScore ?? 0}p)
                        </p>
                        <p className="text-white">
                          {opponentName}: {visibleSummary?.player2BestWord ?? '—'} ({visibleSummary?.player2BestWordScore ?? 0}p)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">Motståndarens ord</p>
                    <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                      {(visibleSummary?.player2Words.length ?? 0) > 0 ? (
                        visibleSummary?.player2Words.map((word, index) => (
                          <div key={`${word.word}-${index}`} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2 text-sm">
                            <span className="font-semibold text-white">{word.word}</span>
                            <span className="text-white/60">+{word.score}</span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-black/20 px-3 py-6 text-center text-sm text-white/50">
                          Inga motståndarord ännu.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {isPlayerAction || progress.phase === 'between_rounds' ? (
                    <Button onClick={handlePrimaryAction} disabled={updating} className="h-12 rounded-2xl px-6 text-base">
                      <Swords className="mr-2 h-4 w-4" /> {primaryLabel}
                    </Button>
                  ) : null}
                  {progress.phase !== 'match_over' && match.status !== 'forfeit' ? (
                    <Button
                      onClick={handleForfeit}
                      disabled={updating}
                      variant="outline"
                      className="h-12 rounded-2xl border-destructive/40 bg-destructive/10 px-6 text-base text-destructive hover:bg-destructive/20"
                    >
                      <Flag className="mr-2 h-4 w-4" /> Ge upp
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-2xl backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">Matchöverblick</p>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-white/50">Vems tur</p>
                  <p className="mt-1 font-semibold text-white">
                    {progress.phase === 'awaiting_ai'
                      ? `${opponentName}s tur`
                      : progress.phase === 'between_rounds'
                        ? 'Nästa omgång väntar'
                        : progress.phase === 'match_over'
                          ? 'Matchen är slut'
                          : 'Din tur'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-white/50">Senaste händelse</p>
                  <p className="mt-1 font-semibold text-white">
                    {progress.lastActor === 'player2'
                      ? `${opponentName} spelade senast`
                      : progress.lastActor === 'player1'
                        ? 'Du spelade senast'
                        : 'Matchen har just startat'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-white/50">Tidigare möten</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-black/20 p-2">
                      <p className="text-xs text-white/40">Vunna</p>
                      <p className="text-lg font-bold text-white">{headToHead.wins}</p>
                    </div>
                    <div className="rounded-xl bg-black/20 p-2">
                      <p className="text-xs text-white/40">Förlorade</p>
                      <p className="text-lg font-bold text-white">{headToHead.losses}</p>
                    </div>
                    <div className="rounded-xl bg-black/20 p-2">
                      <p className="text-xs text-white/40">Oavgjorda</p>
                      <p className="text-lg font-bold text-white">{headToHead.draws}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-white">Matchregel just nu</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">
                {progress.mode === 'classic' || progress.mode === 'fiveplus'
                  ? 'Classic delar bräde och ord per omgång. När någon har spelat klart tar nästa spelare över exakt där förra slutade.'
                  : progress.mode === 'surge'
                    ? 'Word Surge använder samma startbräde för båda, men ni delar inte ord.'
                    : 'Längsta Ordet jämför bästa ordet per omgång och totalmatchen avgörs av starkaste ordet.'}
              </p>
              {progress.phase === 'match_over' || match.status === 'forfeit' ? (
                <div className="mt-4 rounded-2xl bg-black/20 p-4 text-center">
                  <Trophy className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="font-semibold text-white">Matchen är avslutad</p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MatchOverviewPage;
