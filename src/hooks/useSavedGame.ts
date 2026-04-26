import { useCallback } from 'react';
import type { BubbleData } from '@/data/gameConstants';

export interface SavedGameState {
  grid: BubbleData[][];
  movesLeft: number;
  score: number;
  usedWords: { word: string; score: number }[];
  movesUsed: number;
  freeMovesRemaining: number;
  savedAt: number;
}

const PREFIX = 'wr-saved-game-';

function keyFor(slot: string) {
  return `${PREFIX}${slot}`;
}

export function loadSavedGame(slot: string): SavedGameState | null {
  try {
    const raw = localStorage.getItem(keyFor(slot));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameState;
    if (!parsed.grid || !Array.isArray(parsed.grid)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGame(slot: string, state: Omit<SavedGameState, 'savedAt'>) {
  try {
    const payload: SavedGameState = { ...state, savedAt: Date.now() };
    localStorage.setItem(keyFor(slot), JSON.stringify(payload));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearSavedGame(slot: string) {
  try { localStorage.removeItem(keyFor(slot)); } catch { /* noop */ }
}

export function hasSavedGame(slot: string): boolean {
  try { return localStorage.getItem(keyFor(slot)) !== null; } catch { return false; }
}

export function useSavedGame(slot: string) {
  return {
    load: useCallback(() => loadSavedGame(slot), [slot]),
    save: useCallback((s: Omit<SavedGameState, 'savedAt'>) => saveGame(slot, s), [slot]),
    clear: useCallback(() => clearSavedGame(slot), [slot]),
    has: useCallback(() => hasSavedGame(slot), [slot]),
  };
}
