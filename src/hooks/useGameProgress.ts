import { useState, useCallback, useEffect } from 'react';

const PROGRESS_KEY = 'wr-game-progress';

export interface GameProgress {
  classicPlayed: number;       // times classic completed
  surgeBestMoves: number;      // highest total moves used in a single surge game
  bestSingleWordScore: number; // highest single word score across all modes
  onlineWins: number;          // online multiplayer wins
  bombBestScore: number;       // highest score in bomb mode
}

const DEFAULT_PROGRESS: GameProgress = {
  classicPlayed: 0,
  surgeBestMoves: 0,
  bestSingleWordScore: 0,
  onlineWins: 0,
  bombBestScore: 0,
};

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      if (saved) return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return { ...DEFAULT_PROGRESS };
  });

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const recordClassicPlayed = useCallback(() => {
    setProgress((p) => ({ ...p, classicPlayed: p.classicPlayed + 1 }));
  }, []);

  const recordSurgeMoves = useCallback((totalMovesUsed: number) => {
    setProgress((p) => ({
      ...p,
      surgeBestMoves: Math.max(p.surgeBestMoves, totalMovesUsed),
    }));
  }, []);

  const recordBestSingleWord = useCallback((wordScore: number) => {
    setProgress((p) => ({
      ...p,
      bestSingleWordScore: Math.max(p.bestSingleWordScore, wordScore),
    }));
  }, []);

  const recordBombScore = useCallback((score: number) => {
    setProgress((p) => ({
      ...p,
      bombBestScore: Math.max(p.bombBestScore, score),
    }));
  }, []);

  // Mode unlock checks
  const isModeUnlocked = useCallback((mode: string): boolean => {
    switch (mode) {
      case 'classic': return true;
      case 'surge': return progress.classicPlayed >= 1;
      case 'bomb': return progress.classicPlayed >= 1;
      case 'fiveplus': return progress.surgeBestMoves >= 120;
      case 'oneword': return progress.bestSingleWordScore >= 25;
      default: return false;
    }
  }, [progress]);

  const getUnlockHint = (mode: string): string => {
    switch (mode) {
      case 'surge': return 'Spela klart ett Classic-spel för att låsa upp detta spelläge.';
      case 'bomb': return 'Spela klart ett Classic-spel för att låsa upp detta spelläge.';
      case 'fiveplus': return 'Använd över 120 drag i en enda Word Surge-omgång för att låsa upp detta spelläge.';
      case 'oneword': return 'Få mer än 25 poäng på ett enda ord (i valfritt spelläge) för att låsa upp detta spelläge.';
      default: return '';
    }
  };

  return {
    progress,
    recordClassicPlayed,
    recordSurgeMoves,
    recordBestSingleWord,
    recordBombScore,
    isModeUnlocked,
    getUnlockHint,
  };
}
