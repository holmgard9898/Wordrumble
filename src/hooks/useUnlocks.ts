import { useState, useCallback, useEffect } from 'react';

const UNLOCKS_KEY = 'wr-unlocks';

// Items unlocked by default
const DEFAULT_UNLOCKS = new Set([
  'bg-default',
  'tile-bubble',
  'tile-shapes',
]);

export function useUnlocks() {
  const [unlocked, setUnlocked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(UNLOCKS_KEY);
      if (saved) {
        const arr: string[] = JSON.parse(saved);
        return new Set([...DEFAULT_UNLOCKS, ...arr]);
      }
    } catch { /* ignore */ }
    return new Set(DEFAULT_UNLOCKS);
  });

  useEffect(() => {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify([...unlocked]));
  }, [unlocked]);

  const isUnlocked = useCallback((id: string) => unlocked.has(id), [unlocked]);

  const unlock = useCallback((id: string) => {
    setUnlocked((prev) => new Set([...prev, id]));
  }, []);

  return { isUnlocked, unlock };
}
