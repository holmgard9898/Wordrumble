import { useState, useCallback } from 'react';

export interface HighScoreEntry {
  score: number;
  wordsFound: number;
  mode: string;
  date: string;
}

const STORAGE_KEY = 'wr-highscores';

function loadScores(): HighScoreEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useHighScores() {
  const [scores, setScores] = useState<HighScoreEntry[]>(loadScores);

  const addScore = useCallback((entry: HighScoreEntry) => {
    setScores((prev) => {
      const updated = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { scores, addScore };
}
