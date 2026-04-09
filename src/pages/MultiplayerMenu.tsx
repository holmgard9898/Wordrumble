import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Clock3, Shuffle, Swords, Trophy, Users, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfileNames, fetchUserMatches, getOpponentUserId } from '@/features/multiplayer/api';
import { MODE_LABELS } from '@/features/multiplayer/rules';
import { getCurrentRound, parseMatchProgress } from '@/features/multiplayer/state';
import type { MPMode } from '@/features/multiplayer/types';
import { useSettings } from '@/contexts/SettingsContext';

const modes = [
  { id: 'classic', icon: Clock3, label: 'Classic', desc: '2 omgångar, 25+50+25 drag' },
  { id: 'surge', icon: Zap, label: 'Word Surge', desc: '3 omgångar, samma startbräde' },
  { id: 'fiveplus', icon: Star, label: '5+ Bokstäver', desc: '2 omgångar, min 5 bokstäver' },
  { id: 'oneword', icon: Trophy, label: 'Längsta Ordet', desc: '2 omgångar, bästa ordet vinner' },
] satisfies { id: MPMode; icon: typeof Clock3; label: string; desc: string }[];

const MultiplayerMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { settings } = useSettings();
  const { user, loading } = useAuth();
  const [selectedMode, setSelectedMode] = useState<MPMode | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>('ai');
  const [matches, setMatches] = useState<any[]>([]);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
  const [matchesLoading, setMatchesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, navigate, user]);

  const loadMatches = useCallback(async () => {
    if (!user) return;
    setMatchesLoading(true);
    try {
      const rows = await fetchUserMatches(user.id);
      setMatches(rows);
      const opponentIds = rows.map((match) => getOpponentUserId(match, user.id)).filter(Boolean) as string[];
      const names = await fetchProfileNames(opponentIds);
      setOpponentNames(names);
    } catch {
      toast({
        title: 'Kunde inte läsa pågående matcher',
        description: 'Prova att öppna sidan igen.',
      });
    } finally {
      setMatchesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [loadMatches, user]);

  const go = (path: string) => {
    playClick();
    navigate(path);
  };

  const matchCards = useMemo(() => {
    return matches.map((match) => {
      const progress = parseMatchProgress(match.round_grids, match.mode, settings.language);
      const currentRound = getCurrentRound(progress);
      const opponentName = match.is_ai_match
        ? 'Datorn'
        : (getOpponentUserId(match, user?.id ?? '') ? opponentNames[getOpponentUserId(match, user?.id ?? '') ?? ''] : null) ?? 'Motståndare';

      const turnLabel = progress.phase === 'awaiting_ai'
        ? `${opponentName}s tur`
        : progress.phase === 'between_rounds'
          ? 'Nästa omgång'
          : progress.phase === 'review' || progress.phase === 'ready'
            ? 'Din tur'
            : 'Matchen klar';

      return {
        id: match.id,
        opponentName,
        modeLabel: MODE_LABELS[match.mode as MPMode],
        roundLabel: currentRound ? `Omgång ${currentRound.roundNumber}/${progress.rounds.length}` : 'Pågår',
        turnLabel,
      };
    });
  }, [matches, opponentNames, settings.language, user?.id]);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${bg.className}`} style={bg.style}>
        <div className="text-white/60">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen p-4 ${bg.className}`} style={bg.style}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Utmana</h1>
          <p className="mt-2 text-white/50">Riktiga turbaserade matcher med överblick mellan turerna</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-2xl backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Motståndare</p>
            <div className="mt-4 flex flex-col gap-3">
              {[
                { id: 'random', icon: Shuffle, label: 'Slumpmässig', desc: 'Kommer i nästa steg' },
                { id: 'friend', icon: Users, label: 'Vän', desc: 'Kommer i nästa steg' },
                { id: 'ai', icon: Bot, label: 'Dator', desc: 'Färdig multiplayer-logik' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => { playClick(); setSelectedOpponent(option.id); }}
                  className={`rounded-2xl border p-4 text-left transition-all ${selectedOpponent === option.id ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <option.icon className={`h-5 w-5 ${selectedOpponent === option.id ? 'text-primary' : 'text-white/70'}`} />
                    <div>
                      <div className="font-semibold text-white">{option.label}</div>
                      <div className="text-xs text-white/50">{option.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedOpponent ? (
              <>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Spelläge</p>
                <div className="mt-4 flex flex-col gap-3">
                  {modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => { playClick(); setSelectedMode(mode.id); }}
                      className={`rounded-2xl border p-4 text-left transition-all ${selectedMode === mode.id ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <mode.icon className={`h-5 w-5 ${selectedMode === mode.id ? 'text-primary' : 'text-white/70'}`} />
                        <div>
                          <div className="font-semibold text-white">{mode.label}</div>
                          <div className="text-xs text-white/50">{mode.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {selectedOpponent && selectedMode ? (
              <Button
                onClick={() => {
                  if (selectedOpponent !== 'ai') {
                    playClick();
                    toast({
                      title: 'Det här läget kommer strax',
                      description: 'AI-matcherna använder nu den riktiga multiplayer-logiken först.',
                    });
                    return;
                  }
                  go(`/game/mp-${selectedMode}`);
                }}
                size="lg"
                className="mt-6 h-14 w-full text-lg"
              >
                <Swords className="mr-2 h-5 w-5" /> Starta match
              </Button>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Pågående spel</p>
                <p className="mt-1 text-sm text-white/45">Scrolla och öppna varje match för statistik och spela-knapp</p>
              </div>
              <Button variant="ghost" onClick={loadMatches} className="text-white/70 hover:bg-white/10 hover:text-white">Uppdatera</Button>
            </div>

            <div className="mt-4 max-h-[30rem] space-y-3 overflow-y-auto pr-1">
              {matchesLoading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-white/50">Laddar matcher...</div>
              ) : matchCards.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-white/50">Inga pågående matcher ännu.</div>
              ) : (
                matchCards.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => go(`/challenge/match/${match.id}`)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{match.opponentName}</p>
                        <p className="text-sm text-white/55">{match.modeLabel}</p>
                      </div>
                      <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{match.turnLabel}</span>
                    </div>
                    <p className="mt-3 text-sm text-white/55">{match.roundLabel}</p>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        <Button onClick={() => go('/')} variant="ghost" className="mx-auto gap-2 text-white/60 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Huvudmeny
        </Button>
      </div>
    </div>
  );
};

export default MultiplayerMenu;
