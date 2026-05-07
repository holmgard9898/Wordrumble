import { useCallback, useEffect, useState } from 'react';

const KEY = 'wr-tutorials-seen';

function read(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function useTutorialSeen(modeKey: string) {
  const [seen, setSeen] = useState<boolean>(() => !!read()[modeKey]);

  useEffect(() => { setSeen(!!read()[modeKey]); }, [modeKey]);

  const markSeen = useCallback(() => {
    const cur = read();
    cur[modeKey] = true;
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch {}
    setSeen(true);
  }, [modeKey]);

  return { seen, markSeen };
}

export function resetAllTutorials() {
  try { localStorage.removeItem(KEY); } catch {}
}
