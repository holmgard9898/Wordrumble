import { useCallback, useEffect, useState } from 'react';

export type PowerupId = 'swapletter' | 'swapcolor' | 'rocket';

const STORAGE_KEY = 'wr-powerup-inventory';

type Inventory = Record<PowerupId, number>;

const DEFAULT: Inventory = { swapletter: 0, swapcolor: 0, rocket: 0 };

function load(): Inventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT };
}

const listeners = new Set<(inv: Inventory) => void>();
let current: Inventory = load();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* ignore */ }
  listeners.forEach(l => l(current));
}

export function usePowerupInventory() {
  const [inv, setInv] = useState<Inventory>(current);

  useEffect(() => {
    const fn = (next: Inventory) => setInv({ ...next });
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const add = useCallback((id: PowerupId, qty = 1) => {
    current = { ...current, [id]: (current[id] ?? 0) + qty };
    persist();
  }, []);

  const consume = useCallback((id: PowerupId): boolean => {
    if ((current[id] ?? 0) <= 0) return false;
    current = { ...current, [id]: current[id] - 1 };
    persist();
    return true;
  }, []);

  return { inventory: inv, add, consume };
}

export const POWERUP_COST = 100;
