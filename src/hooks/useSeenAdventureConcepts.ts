import { useCallback, useEffect, useState } from 'react';

const KEY = 'wr-adv-seen-concepts';

function read(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function write(map: Record<string, boolean>) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

/**
 * Tracks which adventure concepts the player has had explained.
 * A concept tutorial is only shown the FIRST time it's encountered.
 */
export function useSeenAdventureConcepts() {
  const [seen, setSeen] = useState<Record<string, boolean>>(() => read());

  useEffect(() => { setSeen(read()); }, []);

  const isSeen = useCallback((id: string) => !!seen[id], [seen]);

  const markSeen = useCallback((ids: string[]) => {
    if (!ids.length) return;
    const cur = read();
    let changed = false;
    for (const id of ids) {
      if (!cur[id]) { cur[id] = true; changed = true; }
    }
    if (changed) {
      write(cur);
      setSeen({ ...cur });
    }
  }, []);

  return { isSeen, markSeen };
}

export function resetAllAdventureConcepts() {
  try { localStorage.removeItem(KEY); } catch {}
}
