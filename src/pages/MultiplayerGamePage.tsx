import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { useAIOpponent, AIRoundResult } from '@/hooks/useAIOpponent';
import { useSfx } from '@/hooks/useSfx';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { GameBoard } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { WordHistory } from '@/components/game/WordHistory';
import { InGameMenu } from '@/components/game/InGameMenu';
import { Button } from '@/components/ui/button';
import { Menu, ArrowLeft, Trophy, Swords, Eye } from 'lucide-react';
import { createGrid, BubbleData, BUBBLE_COLORS, REDUCED_COLORS } from '@/data/gameConstants';
import { getLanguageConfig } from '@/data/languages';
import type { GameMode } from '@/pages/GamePage';

type MPMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

interface RoundData {
  score: number;
  words: { word: string; score: number }[];
  bestWord?: string | null;
  bestWordScore?: number;
  movesUsed?: number;
}

interface MatchState {
  mode: MPMode;
  totalRounds: number;
  currentRound: number;
  /** Whose turn: 'player' or 'ai' */
  currentTurn: 'player' | 'ai';
  /** Which sub-turn within the round (for Classic's 25+50+25 split) */
  playerRounds: RoundData[];
  aiRounds: RoundData[];
  playerTotalScore: number;
  aiTotalScore: number;
  sharedUsedWords: string[];
  /** Saved grids for surge mode (same grid for both players) */
  roundGrids: BubbleData[][][];
  phase: 'playing' | 'between-rounds' | 'ai-playing' | 'match-over';
  winner: 'player' | 'ai' | 'draw' | null;
  /** Moves for current sub-turn */
  currentMoves: number;
}

function getTotalRounds(mode: MPMode): number {
  return mode === 'surge' ? 3 : 2;
}

function getMovesForTurn(mode: MPMode, _round: number, _isFirst: boolean): number {
  if (mode === 'surge') return 50;
  if (mode === 'fiveplus') return 100;
  if (mode === 'oneword') return 60;
  return 50; // classic
}

const MODE_LABELS: Record<MPMode, string> = {
  classic: 'Classic',
  surge: 'Word Surge',
  fiveplus: '5+ Bokstäver',
  oneword: 'Längsta Ordet',
};

const MultiplayerGamePage = () => {
  const { mode = 'mp-classic' } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const bg = useGameBackground();
  const mpMode = mode.replace('mp-', '') as MPMode;

  const langConfig = getLanguageConfig(settings.language);
  const { isValidWord, loading } = useDictionary(settings.language);
  const { runAIRound } = useAIOpponent();
  const { playSwap, playWordFound, playGameOver } = useSfx();

  const [matchState, setMatchState] = useState<MatchState>(() => ({
    mode: mpMode,
    totalRounds: getTotalRounds(mpMode),
    currentRound: 1,
    currentTurn: 'player',
    playerRounds: [],
    aiRounds: [],
    playerTotalScore: 0,
    aiTotalScore: 0,
    sharedUsedWords: [],
    roundGrids: [],
    phase: 'playing',
    winner: null,
    currentMoves: getMovesForTurn(mpMode, 1, true),
  }));

  const colors = mpMode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
  const gameMode: GameMode = mpMode === 'surge' ? 'surge' : mpMode === 'fiveplus' ? 'fiveplus' : mpMode === 'oneword' ? 'oneword' : 'classic';

  // For surge, save initial grid so AI gets the same one
  const [initialGrid, setInitialGrid] = useState<BubbleData[][] | null>(null);

  const game = useGameState(isValidWord, gameMode, settings.language);
  const [showWords, setShowWords] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showOpponentResults, setShowOpponentResults] = useState(false);

  useBackgroundMusic(matchState.phase === 'playing' && !showMenu);

  // Save initial grid for surge mode
  useEffect(() => {
    if (mpMode === 'surge' && !initialGrid && game.grid) {
      setInitialGrid(game.grid.map(row => row.map(b => ({ ...b }))));
    }
  }, [mpMode, initialGrid, game.grid]);

  const finalScore = gameMode === 'oneword' ? game.bestWordScore : game.score;

  // Handle round completion
  const handleRoundComplete = useCallback(async () => {
    const roundData: RoundData = {
      score: finalScore,
      words: game.usedWords.map(w => ({ word: w.word, score: w.score })),
      bestWord: game.bestWord,
      bestWordScore: game.bestWordScore,
      movesUsed: game.movesUsed,
    };

    const newPlayerRounds = [...matchState.playerRounds, roundData];
    const newPlayerTotal = matchState.playerTotalScore + (gameMode === 'oneword' ? game.bestWordScore : game.score);
    const newSharedWords = mpMode === 'surge'
      ? matchState.sharedUsedWords
      : [...matchState.sharedUsedWords, ...game.usedWords.map(w => w.word)];

    // AI plays its round
    setMatchState(prev => ({ ...prev, phase: 'ai-playing' }));

    const aiGrid = mpMode === 'surge' && initialGrid
      ? initialGrid.map(row => row.map(b => ({ ...b })))
      : createGrid(colors, langConfig.letterPool, langConfig.letterValues);

    const aiMoves = getMovesForTurn(mpMode, matchState.currentRound, false);
    const aiSharedWords = mpMode === 'surge' ? [] : newSharedWords;
    const aiResult = await runAIRound(aiGrid, isValidWord, mpMode, aiMoves, aiSharedWords);

    const newAiRounds = [...matchState.aiRounds, aiResult];
    const newAiTotal = matchState.aiTotalScore + aiResult.score;
    const newRound = matchState.currentRound + 1;

    const allSharedWords = mpMode === 'surge'
      ? newSharedWords
      : [...newSharedWords, ...aiResult.words.map(w => w.word)];

    if (newRound > matchState.totalRounds) {
      // Match over
      let winner: 'player' | 'ai' | 'draw';
      if (newPlayerTotal > newAiTotal) winner = 'player';
      else if (newAiTotal > newPlayerTotal) winner = 'ai';
      else winner = 'draw';

      playGameOver();
      setMatchState(prev => ({
        ...prev,
        playerRounds: newPlayerRounds,
        aiRounds: newAiRounds,
        playerTotalScore: newPlayerTotal,
        aiTotalScore: newAiTotal,
        sharedUsedWords: allSharedWords,
        phase: 'match-over',
        winner,
      }));
    } else {
      setMatchState(prev => ({
        ...prev,
        playerRounds: newPlayerRounds,
        aiRounds: newAiRounds,
        playerTotalScore: newPlayerTotal,
        aiTotalScore: newAiTotal,
        sharedUsedWords: mpMode === 'surge' ? [] : allSharedWords,
        currentRound: newRound,
        phase: 'between-rounds',
      }));
    }
  }, [finalScore, game, matchState, mpMode, initialGrid, colors, langConfig, runAIRound, isValidWord, playGameOver, gameMode]);

  // Auto-trigger round complete when game ends
  useEffect(() => {
    if (game.gameOver && matchState.phase === 'playing') {
      handleRoundComplete();
    }
  }, [game.gameOver, matchState.phase, handleRoundComplete]);

  useEffect(() => {
    if (game.lastFoundWord) playWordFound();
  }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    const hadSelection = game.selectedBubble !== null;
    game.handleBubbleClick(row, col);
    if (hadSelection) playSwap();
  }, [game, playSwap]);

  const startNextRound = useCallback(() => {
    if (mpMode === 'surge') {
      setInitialGrid(null); // Will regenerate
    }
    game.resetGame();
    setMatchState(prev => ({
      ...prev,
      phase: 'playing',
      currentMoves: getMovesForTurn(mpMode, prev.currentRound, true),
    }));
  }, [game, mpMode]);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Word Rumble</div>
        <div className="text-white/60">Laddar ordlista...</div>
      </div>
    );
  }

  // Between rounds view
  if (matchState.phase === 'between-rounds') {
    const lastAiRound = matchState.aiRounds[matchState.aiRounds.length - 1];
    const lastPlayerRound = matchState.playerRounds[matchState.playerRounds.length - 1];

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${bg.className}`} style={bg.style}>
        <h2 className="text-3xl font-bold text-white">Omgång {matchState.currentRound - 1} avslutad</h2>

        <div className="flex gap-8 w-full max-w-md">
          <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-blue-400 text-sm font-semibold mb-1">Du</p>
            <p className="text-white text-3xl font-bold">{lastPlayerRound.score}</p>
            <p className="text-white/50 text-xs">{lastPlayerRound.words.length} ord</p>
            {gameMode === 'oneword' && lastPlayerRound.bestWord && (
              <p className="text-blue-300 text-xs mt-1">Bästa: {lastPlayerRound.bestWord} ({lastPlayerRound.bestWordScore}p)</p>
            )}
          </div>
          <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm font-semibold mb-1">Dator</p>
            <p className="text-white text-3xl font-bold">{lastAiRound.score}</p>
            <p className="text-white/50 text-xs">{lastAiRound.words.length} ord</p>
            {gameMode === 'oneword' && lastAiRound.bestWord && (
              <p className="text-red-300 text-xs mt-1">Bästa: {lastAiRound.bestWord} ({lastAiRound.bestWordScore}p)</p>
            )}
          </div>
        </div>

        <div className="rounded-xl p-4 w-full max-w-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-white/70 text-sm mb-2">Totalställning</p>
          <div className="flex justify-between">
            <span className="text-blue-400 font-bold text-xl">{matchState.playerTotalScore}</span>
            <span className="text-white/30">vs</span>
            <span className="text-red-400 font-bold text-xl">{matchState.aiTotalScore}</span>
          </div>
        </div>

        <button
          onClick={() => setShowOpponentResults(!showOpponentResults)}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          {showOpponentResults ? 'Dölj' : 'Visa'} datorns ord
        </button>

        {showOpponentResults && (
          <div className="rounded-xl p-4 w-full max-w-md max-h-40 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {lastAiRound.words.map((w, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                <span className="text-white/70">{w.word}</span>
                <span className="text-yellow-400">+{w.score}</span>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={startNextRound}
          size="lg"
          className="h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white"
        >
          <Swords className="w-5 h-5 mr-2" />
          Starta omgång {matchState.currentRound}
        </Button>
      </div>
    );
  }

  // AI playing view
  if (matchState.phase === 'ai-playing') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Datorn spelar...</div>
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full animate-pulse w-full" />
        </div>
        <p className="text-white/50 text-sm">Omgång {matchState.currentRound}</p>
      </div>
    );
  }

  // Match over view
  if (matchState.phase === 'match-over') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${bg.className}`} style={bg.style}>
        <Trophy className={`w-16 h-16 ${matchState.winner === 'player' ? 'text-yellow-400' : matchState.winner === 'ai' ? 'text-red-400' : 'text-white/50'}`} />
        <h2 className="text-4xl font-bold text-white">
          {matchState.winner === 'player' ? 'Du vann!' : matchState.winner === 'ai' ? 'Datorn vann!' : 'Oavgjort!'}
        </h2>

        <div className="flex gap-8 w-full max-w-md">
          <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-blue-400 text-sm font-semibold mb-1">Du</p>
            <p className="text-white text-4xl font-bold">{matchState.playerTotalScore}</p>
          </div>
          <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm font-semibold mb-1">Dator</p>
            <p className="text-white text-4xl font-bold">{matchState.aiTotalScore}</p>
          </div>
        </div>

        <div className="rounded-xl p-4 w-full max-w-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-white/70 text-sm mb-2">Omgångar</p>
          {matchState.playerRounds.map((pr, i) => (
            <div key={i} className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/50 text-sm">Omgång {i + 1}</span>
              <span className="text-blue-400 text-sm">{pr.score}</span>
              <span className="text-white/30 text-sm">vs</span>
              <span className="text-red-400 text-sm">{matchState.aiRounds[i]?.score ?? '-'}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/challenge')}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka
          </Button>
          <Button
            onClick={() => {
              game.resetGame();
              setMatchState({
                mode: mpMode,
                totalRounds: getTotalRounds(mpMode),
                currentRound: 1,
                currentTurn: 'player',
                playerRounds: [],
                aiRounds: [],
                playerTotalScore: 0,
                aiTotalScore: 0,
                sharedUsedWords: [],
                roundGrids: [],
                phase: 'playing',
                winner: null,
                currentMoves: getMovesForTurn(mpMode, 1, true),
              });
              setInitialGrid(null);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white"
          >
            Spela igen
          </Button>
        </div>
      </div>
    );
  }

  // Playing phase
  return (
    <div className={`min-h-screen flex flex-col items-center p-2 md:p-4 ${bg.className}`} style={bg.style}>
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 md:mb-4 px-1">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
            {MODE_LABELS[mpMode]}
          </h1>
          <p className="text-white/50 text-xs">
            Omgång {matchState.currentRound}/{matchState.totalRounds} • vs Dator
          </p>
        </div>
        <div className="flex items-center gap-3">
          {matchState.playerTotalScore > 0 && (
            <div className="text-right">
              <p className="text-white/40 text-xs">Totalt</p>
              <div className="flex gap-2 text-sm">
                <span className="text-blue-400 font-bold">{matchState.playerTotalScore}</span>
                <span className="text-white/30">-</span>
                <span className="text-red-400 font-bold">{matchState.aiTotalScore}</span>
              </div>
            </div>
          )}
          <button onClick={() => setShowMenu(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 md:gap-6 items-center lg:items-start w-full max-w-4xl justify-center">
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
          onResetGame={() => {}}
          onShowWords={() => setShowWords(true)}
          usedWordsCount={game.usedWords.length}
          mode={gameMode}
          bestWordScore={game.bestWordScore}
          bestWord={game.bestWord}
        />
      </div>

      <WordHistory open={showWords} onOpenChange={setShowWords} words={game.usedWords} />
      <InGameMenu open={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
};

export default MultiplayerGamePage;
