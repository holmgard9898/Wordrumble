import { useState, useCallback, useEffect, useRef } from 'react';
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
import { Menu, ArrowLeft, Trophy, Swords, Eye, Clock } from 'lucide-react';
import { createGrid, BubbleData, BUBBLE_COLORS, REDUCED_COLORS } from '@/data/gameConstants';
import { getLanguageConfig } from '@/data/languages';
import type { GameMode } from '@/pages/GamePage';

type MPMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

interface SubTurn {
  player: 'human' | 'ai';
  moves: number;
}

interface SubTurnResult {
  player: 'human' | 'ai';
  score: number;
  words: { word: string; score: number }[];
  bestWord?: string | null;
  bestWordScore?: number;
  finalGrid: BubbleData[][];
}

interface RoundData {
  humanScore: number;
  aiScore: number;
  humanWords: { word: string; score: number }[];
  aiWords: { word: string; score: number }[];
  humanBestWord?: string | null;
  humanBestWordScore?: number;
  aiBestWord?: string | null;
  aiBestWordScore?: number;
}

interface MatchState {
  mode: MPMode;
  totalRounds: number;
  currentRound: number;
  subTurns: SubTurn[];
  currentSubTurnIndex: number;
  rounds: RoundData[];
  /** All sub-turn results for the current round */
  currentRoundResults: SubTurnResult[];
  /** Shared used words for the current round (Classic/5+) */
  sharedUsedWords: string[];
  /** The current grid state passed between sub-turns */
  currentGrid: BubbleData[][] | null;
  /** For surge: the initial grid for the round */
  surgeInitialGrid: BubbleData[][] | null;
  playerTotalScore: number;
  aiTotalScore: number;
  phase: 'playing' | 'ai-playing' | 'waiting-opponent' | 'sub-turn-result' | 'between-rounds' | 'match-over';
  winner: 'player' | 'ai' | 'draw' | null;
}

function getSubTurns(mode: MPMode, round: number): SubTurn[] {
  if (mode === 'classic' || mode === 'fiveplus') {
    const humanStarts = round % 2 === 1;
    if (humanStarts) {
      return [
        { player: 'human', moves: 25 },
        { player: 'ai', moves: 50 },
        { player: 'human', moves: 25 },
      ];
    } else {
      return [
        { player: 'ai', moves: 25 },
        { player: 'human', moves: 50 },
        { player: 'ai', moves: 25 },
      ];
    }
  }
  if (mode === 'surge') {
    return [
      { player: 'human', moves: 50 },
      { player: 'ai', moves: 50 },
    ];
  }
  if (mode === 'oneword') {
    return [
      { player: 'human', moves: 60 },
      { player: 'ai', moves: 60 },
    ];
  }
  return [{ player: 'human', moves: 50 }];
}

function getTotalRounds(mode: MPMode): number {
  return mode === 'surge' ? 3 : 2;
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
  const colors = mpMode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
  const { isValidWord, loading } = useDictionary(settings.language);
  const { runAIRound } = useAIOpponent();
  const { playSwap, playWordFound, playGameOver } = useSfx();

  const gameMode: GameMode = mpMode === 'surge' ? 'surge' : mpMode === 'fiveplus' ? 'fiveplus' : mpMode === 'oneword' ? 'oneword' : 'classic';
  const game = useGameState(isValidWord, gameMode, settings.language);

  const [showWords, setShowWords] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showOpponentWords, setShowOpponentWords] = useState(false);

  const initialSubTurns = getSubTurns(mpMode, 1);
  const initialGrid = useRef<BubbleData[][] | null>(null);

  const [matchState, setMatchState] = useState<MatchState>(() => ({
    mode: mpMode,
    totalRounds: getTotalRounds(mpMode),
    currentRound: 1,
    subTurns: initialSubTurns,
    currentSubTurnIndex: 0,
    rounds: [],
    currentRoundResults: [],
    sharedUsedWords: [],
    currentGrid: null,
    surgeInitialGrid: null,
    playerTotalScore: 0,
    aiTotalScore: 0,
    phase: initialSubTurns[0].player === 'human' ? 'playing' : 'ai-playing',
    winner: null,
  }));

  // If round starts with AI turn, trigger it
  const aiTriggered = useRef(false);
  useEffect(() => {
    if (matchState.phase === 'ai-playing' && !aiTriggered.current) {
      aiTriggered.current = true;
      triggerAISubTurn();
    }
  }, [matchState.phase]);

  useBackgroundMusic(matchState.phase === 'playing' && !showMenu);

  // Save initial grid for surge mode
  useEffect(() => {
    if (mpMode === 'surge' && !initialGrid.current && game.grid) {
      initialGrid.current = game.grid.map(row => row.map(b => ({ ...b })));
    }
  }, [mpMode, game.grid]);

  useEffect(() => {
    if (game.lastFoundWord) playWordFound();
  }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    const hadSelection = game.selectedBubble !== null;
    game.handleBubbleClick(row, col);
    if (hadSelection) playSwap();
  }, [game, playSwap]);

  const triggerAISubTurn = useCallback(async () => {
    const st = matchState.subTurns[matchState.currentSubTurnIndex];
    if (!st || st.player !== 'ai') return;

    // Determine which grid AI plays on
    let aiGrid: BubbleData[][];
    if (mpMode === 'surge') {
      // Surge: AI plays on the same initial grid (independent)
      aiGrid = initialGrid.current
        ? initialGrid.current.map(row => row.map(b => ({ ...b })))
        : createGrid(colors, langConfig.letterPool, langConfig.letterValues);
    } else {
      // Classic/5+/oneword: AI continues from shared grid
      aiGrid = matchState.currentGrid
        ? matchState.currentGrid.map(row => row.map(b => ({ ...b })))
        : game.grid.map(row => row.map(b => ({ ...b })));
    }

    const sharedWords = mpMode === 'surge' ? [] : matchState.sharedUsedWords;
    const result = await runAIRound(aiGrid, isValidWord, mpMode, st.moves, sharedWords);

    // Store result
    const subResult: SubTurnResult = {
      player: 'ai',
      score: result.score,
      words: result.words,
      bestWord: result.bestWord,
      bestWordScore: result.bestWordScore,
      finalGrid: result.finalGrid,
    };

    const newResults = [...matchState.currentRoundResults, subResult];
    const newSharedWords = mpMode === 'surge'
      ? matchState.sharedUsedWords
      : [...matchState.sharedUsedWords, ...result.words.map(w => w.word.toLowerCase())];

    const nextSubTurnIndex = matchState.currentSubTurnIndex + 1;

    if (nextSubTurnIndex >= matchState.subTurns.length) {
      // Round complete
      finishRound(newResults, newSharedWords);
    } else {
      // More sub-turns remain — show result screen
      setMatchState(prev => ({
        ...prev,
        currentRoundResults: newResults,
        sharedUsedWords: newSharedWords,
        currentGrid: result.finalGrid,
        currentSubTurnIndex: nextSubTurnIndex,
        phase: 'sub-turn-result',
      }));
      aiTriggered.current = false;
    }
  }, [matchState, mpMode, colors, langConfig, game.grid, runAIRound, isValidWord]);

  // Handle human sub-turn completion (game over)
  useEffect(() => {
    if (game.gameOver && matchState.phase === 'playing') {
      handleHumanSubTurnComplete();
    }
  }, [game.gameOver, matchState.phase]);

  const handleHumanSubTurnComplete = useCallback(() => {
    const subResult: SubTurnResult = {
      player: 'human',
      score: gameMode === 'oneword' ? game.bestWordScore : game.score,
      words: game.usedWords.map(w => ({ word: w.word, score: w.score })),
      bestWord: game.bestWord,
      bestWordScore: game.bestWordScore,
      finalGrid: game.grid.map(row => row.map(b => ({ ...b }))),
    };

    const newResults = [...matchState.currentRoundResults, subResult];
    const newSharedWords = mpMode === 'surge'
      ? matchState.sharedUsedWords
      : [...matchState.sharedUsedWords, ...game.usedWords.map(w => w.word.toLowerCase())];

    const nextSubTurnIndex = matchState.currentSubTurnIndex + 1;

    if (nextSubTurnIndex >= matchState.subTurns.length) {
      // Round complete
      finishRound(newResults, newSharedWords);
    } else {
      const nextSubTurn = matchState.subTurns[nextSubTurnIndex];
      if (nextSubTurn.player === 'ai') {
        // Show "waiting for opponent" then AI plays
        setMatchState(prev => ({
          ...prev,
          currentRoundResults: newResults,
          sharedUsedWords: newSharedWords,
          currentGrid: game.grid.map(row => row.map(b => ({ ...b }))),
          currentSubTurnIndex: nextSubTurnIndex,
          phase: 'waiting-opponent',
        }));
      } else {
        // Next is human again — show sub-turn result first
        setMatchState(prev => ({
          ...prev,
          currentRoundResults: newResults,
          sharedUsedWords: newSharedWords,
          currentGrid: game.grid.map(row => row.map(b => ({ ...b }))),
          currentSubTurnIndex: nextSubTurnIndex,
          phase: 'sub-turn-result',
        }));
      }
    }
  }, [game, matchState, mpMode, gameMode]);

  const finishRound = useCallback((results: SubTurnResult[], sharedWords: string[]) => {
    let humanScore = 0;
    let aiScore = 0;
    let humanWords: { word: string; score: number }[] = [];
    let aiWords: { word: string; score: number }[] = [];
    let humanBestWord: string | null = null;
    let humanBestWordScore = 0;
    let aiBestWord: string | null = null;
    let aiBestWordScore = 0;

    for (const r of results) {
      if (r.player === 'human') {
        humanScore += r.score;
        humanWords = [...humanWords, ...r.words];
        if ((r.bestWordScore ?? 0) > humanBestWordScore) {
          humanBestWordScore = r.bestWordScore ?? 0;
          humanBestWord = r.bestWord ?? null;
        }
      } else {
        aiScore += r.score;
        aiWords = [...aiWords, ...r.words];
        if ((r.bestWordScore ?? 0) > aiBestWordScore) {
          aiBestWordScore = r.bestWordScore ?? 0;
          aiBestWord = r.bestWord ?? null;
        }
      }
    }

    // For oneword mode, use best single word score
    if (gameMode === 'oneword') {
      humanScore = humanBestWordScore;
      aiScore = aiBestWordScore;
    }

    const roundData: RoundData = {
      humanScore, aiScore, humanWords, aiWords,
      humanBestWord, humanBestWordScore, aiBestWord, aiBestWordScore,
    };

    const newPlayerTotal = matchState.playerTotalScore + humanScore;
    const newAiTotal = matchState.aiTotalScore + aiScore;
    const newRounds = [...matchState.rounds, roundData];
    const nextRound = matchState.currentRound + 1;

    if (nextRound > matchState.totalRounds) {
      let winner: 'player' | 'ai' | 'draw';
      if (newPlayerTotal > newAiTotal) winner = 'player';
      else if (newAiTotal > newPlayerTotal) winner = 'ai';
      else winner = 'draw';
      playGameOver();
      setMatchState(prev => ({
        ...prev,
        rounds: newRounds,
        playerTotalScore: newPlayerTotal,
        aiTotalScore: newAiTotal,
        phase: 'match-over',
        winner,
      }));
    } else {
      setMatchState(prev => ({
        ...prev,
        rounds: newRounds,
        playerTotalScore: newPlayerTotal,
        aiTotalScore: newAiTotal,
        currentRound: nextRound,
        phase: 'between-rounds',
      }));
    }
  }, [matchState, gameMode, playGameOver]);

  // "Waiting for opponent" → trigger AI after a brief delay
  const waitingTriggered = useRef(false);
  useEffect(() => {
    if (matchState.phase === 'waiting-opponent' && !waitingTriggered.current) {
      waitingTriggered.current = true;
      const timer = setTimeout(() => {
        setMatchState(prev => ({ ...prev, phase: 'ai-playing' }));
        waitingTriggered.current = false;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [matchState.phase]);

  const continueAfterSubTurn = useCallback(() => {
    const st = matchState.subTurns[matchState.currentSubTurnIndex];
    if (!st) return;

    if (st.player === 'human') {
      // Start human sub-turn with the current shared grid
      const gridToUse = matchState.currentGrid!;
      game.startFromState(gridToUse, st.moves, matchState.sharedUsedWords);
      setMatchState(prev => ({ ...prev, phase: 'playing' }));
    } else if (st.player === 'ai') {
      setMatchState(prev => ({ ...prev, phase: 'ai-playing' }));
    }
  }, [matchState, game]);

  const startNextRound = useCallback(() => {
    const nextRound = matchState.currentRound;
    const newSubTurns = getSubTurns(mpMode, nextRound);
    const newGrid = createGrid(colors, langConfig.letterPool, langConfig.letterValues);

    if (mpMode === 'surge') {
      initialGrid.current = newGrid.map(row => row.map(b => ({ ...b })));
    }

    const firstIsHuman = newSubTurns[0].player === 'human';

    if (firstIsHuman) {
      game.startFromState(newGrid, newSubTurns[0].moves, []);
    }

    setMatchState(prev => ({
      ...prev,
      subTurns: newSubTurns,
      currentSubTurnIndex: 0,
      currentRoundResults: [],
      sharedUsedWords: [],
      currentGrid: newGrid,
      surgeInitialGrid: mpMode === 'surge' ? newGrid : null,
      phase: firstIsHuman ? 'playing' : 'ai-playing',
    }));
    aiTriggered.current = false;
    setShowOpponentWords(false);
  }, [matchState, mpMode, colors, langConfig, game]);

  const currentSubTurn = matchState.subTurns[matchState.currentSubTurnIndex];
  const humanSubTurnNumber = matchState.subTurns
    .slice(0, matchState.currentSubTurnIndex + 1)
    .filter(s => s.player === 'human').length;
  const totalHumanSubTurns = matchState.subTurns.filter(s => s.player === 'human').length;

  // Get current round scores so far
  const currentRoundHumanScore = matchState.currentRoundResults
    .filter(r => r.player === 'human')
    .reduce((sum, r) => sum + r.score, 0);
  const currentRoundAiScore = matchState.currentRoundResults
    .filter(r => r.player === 'ai')
    .reduce((sum, r) => sum + r.score, 0);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Word Rumble</div>
        <div className="text-white/60">Laddar ordlista...</div>
      </div>
    );
  }

  // Waiting for opponent screen
  if (matchState.phase === 'waiting-opponent') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <Clock className="w-12 h-12 text-purple-400 animate-pulse" />
        <div className="text-white text-2xl font-bold">Inväntar motståndare...</div>
        <p className="text-white/50 text-sm">Datorn spelar sina {currentSubTurn?.moves ?? 50} drag</p>
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full animate-pulse w-full" />
        </div>
      </div>
    );
  }

  // AI playing screen
  if (matchState.phase === 'ai-playing') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <div className="text-white text-2xl font-bold">Datorn spelar...</div>
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full animate-pulse w-full" />
        </div>
        <p className="text-white/50 text-sm">Omgång {matchState.currentRound}/{matchState.totalRounds}</p>
      </div>
    );
  }

  // Sub-turn result screen (between sub-turns within a round)
  if (matchState.phase === 'sub-turn-result') {
    const lastResult = matchState.currentRoundResults[matchState.currentRoundResults.length - 1];
    const isNextHuman = currentSubTurn?.player === 'human';

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${bg.className}`} style={bg.style}>
        <h2 className="text-2xl font-bold text-white">
          {lastResult.player === 'ai' ? 'Motståndarens tur klar!' : 'Din tur klar!'}
        </h2>

        <div className="flex gap-8 w-full max-w-md">
          <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-blue-400 text-sm font-semibold mb-1">Du (denna omgång)</p>
            <p className="text-white text-3xl font-bold">{currentRoundHumanScore + (matchState.phase === 'sub-turn-result' && lastResult.player === 'human' ? 0 : 0)}</p>
            <p className="text-white/50 text-xs">
              {matchState.currentRoundResults.filter(r => r.player === 'human').reduce((s, r) => s + r.words.length, 0)} ord
            </p>
          </div>
          <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm font-semibold mb-1">Dator (denna omgång)</p>
            <p className="text-white text-3xl font-bold">{currentRoundAiScore}</p>
            <p className="text-white/50 text-xs">
              {matchState.currentRoundResults.filter(r => r.player === 'ai').reduce((s, r) => s + r.words.length, 0)} ord
            </p>
          </div>
        </div>

        {lastResult.player === 'ai' && (
          <>
            <button
              onClick={() => setShowOpponentWords(!showOpponentWords)}
              className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              {showOpponentWords ? 'Dölj' : 'Visa'} datorns ord
            </button>
            {showOpponentWords && (
              <div className="rounded-xl p-4 w-full max-w-md max-h-40 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {lastResult.words.map((w, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                    <span className="text-white/70">{w.word}</span>
                    <span className="text-yellow-400">+{w.score}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {matchState.playerTotalScore > 0 || matchState.aiTotalScore > 0 ? (
          <div className="rounded-xl p-4 w-full max-w-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-white/70 text-sm mb-2">Totalställning (alla omgångar)</p>
            <div className="flex justify-between">
              <span className="text-blue-400 font-bold text-xl">{matchState.playerTotalScore}</span>
              <span className="text-white/30">vs</span>
              <span className="text-red-400 font-bold text-xl">{matchState.aiTotalScore}</span>
            </div>
          </div>
        ) : null}

        <Button
          onClick={() => {
            setShowOpponentWords(false);
            continueAfterSubTurn();
          }}
          size="lg"
          className="h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white"
        >
          <Swords className="w-5 h-5 mr-2" />
          {isNextHuman
            ? `Fortsätt omgång (${currentSubTurn.moves} drag)`
            : 'Fortsätt'}
        </Button>
      </div>
    );
  }

  // Between rounds screen
  if (matchState.phase === 'between-rounds') {
    const lastRound = matchState.rounds[matchState.rounds.length - 1];
    const roundNumber = matchState.rounds.length;

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${bg.className}`} style={bg.style}>
        <h2 className="text-3xl font-bold text-white">Omgång {roundNumber} avslutad</h2>

        <div className="flex gap-8 w-full max-w-md">
          <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-blue-400 text-sm font-semibold mb-1">Du</p>
            <p className="text-white text-3xl font-bold">{lastRound.humanScore}</p>
            <p className="text-white/50 text-xs">{lastRound.humanWords.length} ord</p>
            {gameMode === 'oneword' && lastRound.humanBestWord && (
              <p className="text-blue-300 text-xs mt-1">Bästa: {lastRound.humanBestWord} ({lastRound.humanBestWordScore}p)</p>
            )}
          </div>
          <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm font-semibold mb-1">Dator</p>
            <p className="text-white text-3xl font-bold">{lastRound.aiScore}</p>
            <p className="text-white/50 text-xs">{lastRound.aiWords.length} ord</p>
            {gameMode === 'oneword' && lastRound.aiBestWord && (
              <p className="text-red-300 text-xs mt-1">Bästa: {lastRound.aiBestWord} ({lastRound.aiBestWordScore}p)</p>
            )}
          </div>
        </div>

        <div className="rounded-xl p-3 w-full max-w-md text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-white/50 text-xs mb-1">Vem vann omgången?</p>
          <p className="text-white text-lg font-bold">
            {lastRound.humanScore > lastRound.aiScore
              ? '🎉 Du vann omgången!'
              : lastRound.aiScore > lastRound.humanScore
              ? '😤 Datorn vann omgången'
              : '🤝 Oavgjort denna omgång'}
          </p>
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
          onClick={() => setShowOpponentWords(!showOpponentWords)}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          {showOpponentWords ? 'Dölj' : 'Visa'} datorns ord
        </button>

        {showOpponentWords && (
          <div className="rounded-xl p-4 w-full max-w-md max-h-40 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {lastRound.aiWords.map((w, i) => (
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

  // Match over
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
          {matchState.rounds.map((rd, i) => (
            <div key={i} className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/50 text-sm">Omgång {i + 1}</span>
              <span className="text-blue-400 text-sm">{rd.humanScore}</span>
              <span className="text-white/30 text-sm">vs</span>
              <span className="text-red-400 text-sm">{rd.aiScore}</span>
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
              const newSubTurns = getSubTurns(mpMode, 1);
              const firstIsHuman = newSubTurns[0].player === 'human';
              game.resetGame();
              initialGrid.current = null;
              setMatchState({
                mode: mpMode,
                totalRounds: getTotalRounds(mpMode),
                currentRound: 1,
                subTurns: newSubTurns,
                currentSubTurnIndex: 0,
                rounds: [],
                currentRoundResults: [],
                sharedUsedWords: [],
                currentGrid: null,
                surgeInitialGrid: null,
                playerTotalScore: 0,
                aiTotalScore: 0,
                phase: firstIsHuman ? 'playing' : 'ai-playing',
                winner: null,
              });
              aiTriggered.current = false;
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
  const subTurnLabel = totalHumanSubTurns > 1
    ? ` • Del ${humanSubTurnNumber}/${totalHumanSubTurns} (${currentSubTurn?.moves} drag)`
    : '';

  return (
    <div className={`min-h-screen flex flex-col items-center p-2 md:p-4 ${bg.className}`} style={bg.style}>
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 md:mb-4 px-1">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
            {MODE_LABELS[mpMode]}
          </h1>
          <p className="text-white/50 text-xs">
            Omgång {matchState.currentRound}/{matchState.totalRounds} • vs Dator{subTurnLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(matchState.playerTotalScore > 0 || matchState.aiTotalScore > 0 || currentRoundHumanScore > 0 || currentRoundAiScore > 0) && (
            <div className="text-right">
              <p className="text-white/40 text-xs">Totalt</p>
              <div className="flex gap-2 text-sm">
                <span className="text-blue-400 font-bold">{matchState.playerTotalScore + currentRoundHumanScore}</span>
                <span className="text-white/30">-</span>
                <span className="text-red-400 font-bold">{matchState.aiTotalScore + currentRoundAiScore}</span>
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
