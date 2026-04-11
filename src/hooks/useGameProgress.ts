import { useState, useCallback, useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/data/translations';
import { supabase } from '@/integrations/supabase/client';

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

/** Merge two progress objects, keeping the best/highest values */
function mergeProgress(a: GameProgress, b: Partial<GameProgress>): GameProgress {
  return {
    classicPlayed: Math.max(a.classicPlayed, b.classicPlayed ?? 0),
    surgeBestMoves: Math.max(a.surgeBestMoves, b.surgeBestMoves ?? 0),
    bestSingleWordScore: Math.max(a.bestSingleWordScore, b.bestSingleWordScore ?? 0),
    onlineWins: Math.max(a.onlineWins, b.onlineWins ?? 0),
    bombBestScore: Math.max(a.bombBestScore, b.bombBestScore ?? 0),
  };
}

export function useGameProgress() {
  const { settings } = useSettings();
  const t = getTranslations(settings.language);
  const syncingRef = useRef(false);

  const [progress, setProgress] = useState<GameProgress>(() => {
    try { const saved = localStorage.getItem(PROGRESS_KEY); if (saved) return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) }; } catch {}
    return { ...DEFAULT_PROGRESS };
  });

  // Load from Supabase on mount & merge with localStorage
  useEffect(() => {
    const loadFromDb = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('game_progress')
        .eq('user_id', session.user.id)
        .single();
      if (profile?.game_progress && typeof profile.game_progress === 'object') {
        setProgress(prev => {
          const merged = mergeProgress(prev, profile.game_progress as Partial<GameProgress>);
          return merged;
        });
      }
    };
    loadFromDb();
  }, []);

  // Save to localStorage + Supabase whenever progress changes
  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    
    if (syncingRef.current) return;
    syncingRef.current = true;
    const timeout = setTimeout(async () => {
      syncingRef.current = false;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase
        .from('profiles')
        .update({ game_progress: progress as any })
        .eq('user_id', session.user.id);
    }, 1000);
    return () => { clearTimeout(timeout); syncingRef.current = false; };
  }, [progress]);

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
