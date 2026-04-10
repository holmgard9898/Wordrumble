import { useState, useCallback, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/data/translations';

const PROGRESS_KEY = 'wr-game-progress';

export interface GameProgress {
  classicPlayed: number;
  surgeBestMoves: number;
  bestSingleWordScore: number;
  onlineWins: number;
  bombBestScore: number;
}

const DEFAULT_PROGRESS: GameProgress = {
  classicPlayed: 0, surgeBestMoves: 0, bestSingleWordScore: 0, onlineWins: 0, bombBestScore: 0,
};

export function useGameProgress() {
  const { settings } = useSettings();
  const t = getTranslations(settings.language);

  const [progress, setProgress] = useState<GameProgress>(() => {
    try { const saved = localStorage.getItem(PROGRESS_KEY); if (saved) return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) }; } catch {}
    return { ...DEFAULT_PROGRESS };
  });

  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }, [progress]);

  const recordClassicPlayed = useCallback(() => setProgress((p) => ({ ...p, classicPlayed: p.classicPlayed + 1 })), []);
  const recordSurgeMoves = useCallback((totalMovesUsed: number) => setProgress((p) => ({ ...p, surgeBestMoves: Math.max(p.surgeBestMoves, totalMovesUsed) })), []);
  const recordBestSingleWord = useCallback((wordScore: number) => setProgress((p) => ({ ...p, bestSingleWordScore: Math.max(p.bestSingleWordScore, wordScore) })), []);
  const recordBombScore = useCallback((score: number) => setProgress((p) => ({ ...p, bombBestScore: Math.max(p.bombBestScore, score) })), []);

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
      case 'surge': return t.unlockSurge;
      case 'bomb': return t.unlockBomb;
      case 'fiveplus': return t.unlockFiveplus;
      case 'oneword': return t.unlockOneword;
      default: return '';
    }
  };

  return { progress, recordClassicPlayed, recordSurgeMoves, recordBestSingleWord, recordBombScore, isModeUnlocked, getUnlockHint };
}
