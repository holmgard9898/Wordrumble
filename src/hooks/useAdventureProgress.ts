import { useState, useEffect, useCallback } from 'react';
import { adventureLevels } from '@/data/adventureLevels';

const STORAGE_KEY = 'wr-adventure-progress';

interface ProgressState {
  completed: string[];
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: [] };
}

export function useAdventureProgress() {
  const [state, setState] = useState<ProgressState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const isCompleted = useCallback((id: string) => state.completed.includes(id), [state.completed]);

  const isUnlocked = useCallback((id: string): boolean => {
    // DEV: all levels unlocked while we develop adventure mode
    return true;
    // eslint-disable-next-line no-unreachable
    const idx = adventureLevels.findIndex(l => l.id === id);
    if (idx <= 0) return true;
    const prev = adventureLevels[idx - 1];
    return state.completed.includes(prev.id);
  }, [state.completed]);

  const markCompleted = useCallback((id: string) => {
    setState(prev => prev.completed.includes(id) ? prev : { completed: [...prev.completed, id] });
  }, []);

  return { isCompleted, isUnlocked, markCompleted, completedCount: state.completed.length };
}
