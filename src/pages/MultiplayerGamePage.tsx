import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { GameBoard } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { InGameMenu } from '@/components/game/InGameMenu';
import { WordHistory } from '@/components/game/WordHistory';
import { toast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSfx } from '@/hooks/useSfx';
import { buildMatchUpdate, fetchMatchById, updateMatch, type MatchRow } from '@/features/multiplayer/api';
import { MODE_LABELS } from '@/features/multiplayer/rules';
import {
  applyTurnResult,
  calculateMatchTotals,
  getBlockedWords,
  getCurrentRound,
  getCurrentTurn,
  getRoundSummary,
  getTurnBannerText,
  getTurnStartingGrid,
  parseMatchProgress,
} from '@/features/multiplayer/state';
import type { MatchProgressState, MatchTurnResult, MPMode } from '@/features/multiplayer/types';
import type { GameMode } from '@/pages/GamePage';

const MultiplayerGamePage = () => {
  const { matchId = '' } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const bg = useGameBackground();
  const { user, loading: authLoading } = useAuth();
  const { isValidWord, loading: dictionaryLoading } = useDictionary(settings.language);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [progress, setProgress] = useState<MatchProgressState | null>(null);
  const [showWords, setShowWords] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [turnReady, setTurnReady] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const savingTurnRef = useRef(false);
  const { playSwap, playWordFound } = useSfx();
  const fallbackMode: GameMode = 'classic';
  const gameMode = (progress?.mode ?? fallbackMode) as GameMode;
  const game = useGameState(isValidWord, gameMode, settings.language);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, navigate, user]);

  const loadPlayableMatch = useCallback(async () => {
    if (!user || !matchId) return;

    try {
      const row = await fetchMatchById(matchId);
      if (row.player1_id !== user.id && row.player2_id !== user.id) {
        navigate('/challenge', { replace: true });
        return;
      }

      const parsed = parseMatchProgress(row.round_grids, row.mode as MPMode, settings.language);
      const currentRound = getCurrentRound(parsed);
      const currentTurn = getCurrentTurn(currentRound);
      const isUsersTurn = currentTurn?.player === 'player1' && row.player1_id === user.id;

      if (!currentRound || !currentTurn || !isUsersTurn || parsed.phase === 'between_rounds' || parsed.phase === 'awaiting_ai' || parsed.phase === 'match_over') {
        navigate(`/challenge/match/${matchId}`, { replace: true });
        return;
      }

      game.startFromState(getTurnStartingGrid(currentRound), currentTurn.moves, getBlockedWords(currentRound));
      setBannerText(getTurnBannerText(currentRound));
      setShowBanner(true);
      setMatch(row);
      setProgress(parsed);
      setTurnReady(true);
    } catch {
      toast({
        title: 'Kunde inte öppna matchen',
        description: 'Du skickas tillbaka till matchöverblicken.',
      });
      navigate(`/challenge/${matchId ? `match/${matchId}` : ''}`, { replace: true });
    }
  }, [game, matchId, navigate, settings.language, user]);

  useEffect(() => {
    if (user) {
      loadPlayableMatch();
    }
  }, [loadPlayableMatch, user]);

  useEffect(() => {
    if (!showBanner) return;
    const timer = setTimeout(() => setShowBanner(false), 1300);
    return () => clearTimeout(timer);
  }, [showBanner]);

  useEffect(() => {
    if (game.lastFoundWord) {
      playWordFound();
    }
  }, [game.lastFoundWord, playWordFound]);

  useBackgroundMusic(turnReady && !showMenu && !game.gameOver);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    const hadSelection = game.selectedBubble !== null;
    game.handleBubbleClick(row, col);
    if (hadSelection) playSwap();
  }, [game, playSwap]);

  useEffect(() => {
    if (!turnReady || !match || !progress || !game.gameOver || savingTurnRef.current) return;

    const currentRound = getCurrentRound(progress);
    const currentTurn = getCurrentTurn(currentRound);
    if (!currentRound || !currentTurn) {
      navigate(`/challenge/match/${match.id}`, { replace: true });
      return;
    }

    savingTurnRef.current = true;

    const updatedProgress = applyTurnResult(progress, currentRound.roundNumber, {
      player: 'player1',
      moves: currentTurn.moves,
      score: progress.mode === 'oneword' ? game.bestWordScore : game.score,
      words: game.usedWords.map((word) => ({ word: word.word, score: word.score })),
      bestWord: game.bestWord,
      bestWordScore: game.bestWordScore,
      finalGrid: game.grid.map((gridRow) => gridRow.map((bubble) => ({ ...bubble }))),
      completedAt: new Date().toISOString(),
    } satisfies MatchTurnResult);

    updateMatch(match.id, buildMatchUpdate(match, updatedProgress))
      .then(() => {
        navigate(`/challenge/match/${match.id}`, { replace: true });
      })
      .catch(() => {
        savingTurnRef.current = false;
        toast({
          title: 'Kunde inte spara turen',
          description: 'Försök igen.',
        });
      });
  }, [game.bestWord, game.bestWordScore, game.gameOver, game.grid, game.score, game.usedWords, match, navigate, progress, turnReady]);

  const handleForfeit = useCallback(async () => {
    if (!match || !progress) return;
    try {
      await updateMatch(match.id, buildMatchUpdate(match, progress, { forfeitBy: 'player1' }));
      navigate(`/challenge/match/${match.id}`, { replace: true });
    } catch {
      toast({
        title: 'Kunde inte ge upp matchen',
        description: 'Försök igen.',
      });
    }
  }, [match, navigate, progress]);

  const currentRound = progress ? getCurrentRound(progress) : null;
  const currentSummary = progress && currentRound ? getRoundSummary(currentRound, progress.mode) : null;
  const totals = progress ? calculateMatchTotals(progress) : { player1: 0, player2: 0 };

  if (authLoading || dictionaryLoading || !turnReady || !progress || !match) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Laddar din tur...</div>
        <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center p-2 md:p-4 ${bg.className}`} style={bg.style}>
      {showBanner ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="animate-scale-in rounded-full border border-white/15 bg-card/95 px-6 py-3 text-center shadow-2xl backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Omgång {currentRound?.roundNumber}</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{bannerText}</p>
          </div>
        </div>
      ) : null}

      <div className="w-full max-w-4xl px-1 mb-2 md:mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">{MODE_LABELS[progress.mode]}</h1>
          <p className="text-xs text-white/50">
            Omgång {currentRound?.roundNumber}/{progress.rounds.length}
            {currentSummary ? ` • ${totals.player1 + currentSummary.player1Score} - ${totals.player2 + currentSummary.player2Score}` : ''}
          </p>
        </div>
        <button onClick={() => setShowMenu(true)} className="rounded-lg p-2 transition-colors hover:bg-white/10">
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-3 lg:flex-row lg:items-start md:gap-6">
        <GameBoard
          grid={game.grid}
          selectedBubble={game.selectedBubble}
          poppingCells={game.poppingCells}
          onBubbleClick={handleBubbleClick}
          onSwipe={game.handleSwipe}
        />
        <GameInfo
          movesLeft={game.movesLeft}
          score={game.score}
          lastFoundWord={game.lastFoundWord}
          onResetGame={() => undefined}
          onShowWords={() => setShowWords(true)}
          usedWordsCount={game.usedWords.length}
          mode={gameMode}
          bestWordScore={game.bestWordScore}
          bestWord={game.bestWord}
          hideReset
        />
      </div>

      <WordHistory open={showWords} onOpenChange={setShowWords} words={game.usedWords} />
      <InGameMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        returnPath={`/challenge/match/${match.id}`}
        returnLabel="Till matchöverblick"
        onForfeit={handleForfeit}
      />
    </div>
  );
};

export default MultiplayerGamePage;
