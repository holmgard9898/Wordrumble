import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MAX_MOVES, MIN_WORD_LENGTH, MAX_WORD_LENGTH,
  createRandomBubble, BUBBLE_COLORS, REDUCED_COLORS, LETTER_VALUES, type BubbleColor,
} from '@/data/gameConstants';
import { getLanguageConfig } from '@/data/languages';
import type { GameLanguage } from '@/data/languages';
import type { GameMode } from '@/pages/GamePage';
import { createWordlessGrid, ensureGridHasNoWords, repairFormability, wordIsFormable } from '@/utils/gridGeneration';

export interface AdventureSeed {
  /** Target words (any case) that should be plantable on the start grid in matching color. */
  targetWords: string[];
  /** Override max moves for this run (adventure mode). */
  maxMoves?: number;
  /** Words that must remain formable in some color throughout the game. */
  keepFormableWords?: string[];
  /** Reverse gravity: existing bubbles move up; new bubbles spawn at the bottom. */
  antigravity?: boolean;
  /** Place immovable asteroids on rows 4 & 6 (alternating cols). Destroyed at bottom row. */
  asteroids?: boolean;
  /** Place an immovable 2x2 satellite in the center; new bubbles below it spawn from below the satellite. */
  satellite?: boolean;
  /** Place immovable UFOs (rows 4 & 6 alternating) that swap the bubble below them every move. */
  ufos?: boolean;
  /** Collapsing cave: starting at move 5, top-row tiles get replaced by immovable rocks each move. */
  collapsingCave?: boolean;
  /** Fully pre-determined start grid (overrides random/seeded generation). */
  presetGrid?: Array<Array<{ l: string; c: BubbleColor }>>;
}

/** 0-indexed asteroid seed positions: row 3 (4th) cols 0,2,4,6; row 5 (6th) cols 1,3,5,7. */
function asteroidSeedPositions(): Position[] {
  const out: Position[] = [];
  for (let c = 0; c < COLS; c += 2) out.push({ row: 3, col: c });
  for (let c = 1; c < COLS; c += 2) out.push({ row: 5, col: c });
  return out;
}

function placeAsteroids(grid: BubbleData[][]): void {
  for (const p of asteroidSeedPositions()) {
    grid[p.row][p.col] = { ...grid[p.row][p.col], asteroid: true, bomb: undefined, powerup: undefined };
  }
}

/** 2x2 satellite at the geometric center of the grid. */
function satelliteSeedPositions(): Position[] {
  const r0 = Math.floor(ROWS / 2) - 1; // 4 for ROWS=10
  const c0 = Math.floor(COLS / 2) - 1; // 3 for COLS=8
  return [
    { row: r0, col: c0 }, { row: r0, col: c0 + 1 },
    { row: r0 + 1, col: c0 }, { row: r0 + 1, col: c0 + 1 },
  ];
}

function placeSatellite(grid: BubbleData[][]): void {
  for (const p of satelliteSeedPositions()) {
    grid[p.row][p.col] = { ...grid[p.row][p.col], satellite: true, asteroid: undefined, bomb: undefined, powerup: undefined };
  }
}

function placeUfos(grid: BubbleData[][]): void {
  for (const p of asteroidSeedPositions()) {
    grid[p.row][p.col] = { ...grid[p.row][p.col], ufo: true, asteroid: undefined, satellite: undefined, bomb: undefined, powerup: undefined };
  }
}

/** Ordered queue of rock placement batches for the collapsing-cave mechanic.
 *  Per row: right-corner, left-corner, middle-pair, then outer→inner pairs. */
function buildRockSchedule(): Position[][] {
  const out: Position[][] = [];
  for (let r = 0; r < ROWS; r++) {
    out.push([{ row: r, col: COLS - 1 }]);
    out.push([{ row: r, col: 0 }]);
    const m1 = Math.floor(COLS / 2) - 1;
    const m2 = Math.floor(COLS / 2);
    out.push([{ row: r, col: m1 }, { row: r, col: m2 }]);
    let left = 1, right = COLS - 2;
    while (left < m1 && right > m2) {
      out.push([{ row: r, col: right }, { row: r, col: left }]);
      left++; right--;
    }
  }
  return out;
}
const ROCK_SCHEDULE: Position[][] = buildRockSchedule();

let rockIdCounter = 0;
function applyRockBatch(grid: BubbleData[][], batch: Position[]): void {
  for (const p of batch) {
    const cell = grid[p.row]?.[p.col];
    if (!cell || cell.satellite || cell.asteroid || cell.ufo || cell.rock) continue;
    grid[p.row][p.col] = {
      id: `rock-${rockIdCounter++}`,
      letter: '',
      value: 0,
      color: cell.color,
      rock: true,
    };
  }
}


function getColumnBlockers(grid: BubbleData[][]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (let c = 0; c < COLS; c++) {
    const rows: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][c].satellite || grid[r][c].ufo || grid[r][c].rock) rows.push(r);
    }
    if (rows.length > 0) map.set(c, rows);
  }
  return map;
}

function getSatelliteBounds(grid: BubbleData[][]): { topRow: number; botRow: number; cols: Set<number> } | null {
  let topRow = ROWS, botRow = -1;
  const cols = new Set<number>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].satellite) {
        if (r < topRow) topRow = r;
        if (r > botRow) botRow = r;
        cols.add(c);
      }
    }
  }
  if (botRow === -1) return null;
  return { topRow, botRow, cols };
}

let seedBubbleCounter = 0;
function makeSeedBubble(letter: string, color: BubbleColor, values: Record<string, number>): BubbleData {
  return {
    id: `seed-${seedBubbleCounter++}`,
    letter: letter.toUpperCase(),
    value: values[letter.toUpperCase()] ?? 1,
    color,
  };
}

function buildSeededGrid(
  targetWords: string[],
  isValidWord: (w: string) => boolean,
  minWordLen: number,
  colors: BubbleColor[],
  pool: string,
  values: Record<string, number>,
  keepFormableWords: string[] = [],
): BubbleData[][] {
  // Build target letter pool (weighted) for refill bias
  const targetLetters = targetWords.join('').toUpperCase().replace(/[^A-ZÅÄÖÉÈÊËÀÂÎÏÔÛÙÜÇÑ]/g, '');
  const weightedRefill = () => {
    if (targetLetters.length > 0 && Math.random() < 0.6) {
      const letter = targetLetters[Math.floor(Math.random() * targetLetters.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return makeSeedBubble(letter, color, values);
    }
    return createRandomBubble(colors, pool, values);
  };

  const tryBuild = (): BubbleData[][] | null => {
    const grid: (BubbleData | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    // Plant each word in a chosen color, scattered randomly on free cells
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    for (let wi = 0; wi < targetWords.length; wi++) {
      const word = targetWords[wi].toUpperCase();
      const color = shuffledColors[wi % shuffledColors.length];
      // Collect free cells, shuffle, take word.length
      const free: Position[] = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!grid[r][c]) free.push({ row: r, col: c });
      if (free.length < word.length) return null;
      free.sort(() => Math.random() - 0.5);
      for (let i = 0; i < word.length; i++) {
        const p = free[i];
        grid[p.row][p.col] = makeSeedBubble(word[i], color, values);
      }
    }
    // Fill remaining
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) grid[r][c] = weightedRefill();
      }
    }
    return grid as BubbleData[][];
  };

  for (let attempt = 0; attempt < 25; attempt++) {
    const g = tryBuild();
    if (!g) continue;
    let cleaned = ensureGridHasNoWords(g, {
      isValidWord,
      minWordLength: minWordLen,
      createBubble: weightedRefill,
      maxPasses: 50,
    });
    // Make sure every keep-formable word is plantable in some color from the start.
    // Plant any missing ones into the cleaned grid; then re-clean.
    const missing = keepFormableWords.filter(w => !wordIsFormable(cleaned, w));
    if (missing.length > 0) {
      // Collect random "fresh" cell positions to overwrite (every cell is fair game here).
      const allCells: Position[] = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) allCells.push({ row: r, col: c });
      repairFormability(cleaned, missing, allCells, { values, allowedColors: colors });
      cleaned = ensureGridHasNoWords(cleaned, {
        isValidWord,
        minWordLength: minWordLen,
        createBubble: weightedRefill,
        maxPasses: 50,
      });
      // Final guard: if cleanup broke formability, re-repair once more.
      const stillMissing = keepFormableWords.filter(w => !wordIsFormable(cleaned, w));
      if (stillMissing.length > 0) {
        repairFormability(cleaned, stillMissing, allCells, { values, allowedColors: colors });
      }
    }
    return cleaned;
  }
  // Fallback
  return createWordlessGrid({ isValidWord, minWordLength: minWordLen, colors, pool, values });
}

interface UsedWord {
  word: string;
  score: number;
}

interface FoundWord {
  word: string;
  positions: Position[];
  score: number;
}

export interface BonusMovesEvent {
  id: string;
  amount: number;
  color: import('@/data/gameConstants').BubbleColor;
  row: number;
  col: number;
  label?: string;
}

let bonusEventId = 0;

function getColorsForMode(mode: GameMode) {
  return mode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
}

function getMinWordLength(mode: GameMode) {
  return mode === 'fiveplus' ? 5 : MIN_WORD_LENGTH;
}

function getMaxMoves(mode: GameMode) {
  if (mode === 'bomb') return Infinity;
  if (mode === 'fiveplus') return 100;
  if (mode === 'oneword') return 60;
  return MAX_MOVES;
}

function createCleanGrid(isValidWord: (w: string) => boolean, mode: GameMode, pool: string, values: Record<string, number>): BubbleData[][] {
  return createWordlessGrid({
    isValidWord,
    minWordLength: getMinWordLength(mode),
    colors: getColorsForMode(mode),
    pool,
    values,
  });
}

function gridHasWords(grid: BubbleData[][], isValidWord: (w: string) => boolean, minLen: number): boolean {
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const color = grid[r][c].color;
      let end = c;
      while (end < COLS && grid[r][end].color === color) end++;
      const run = end - c;
      if (run >= minLen) {
        for (let len = minLen; len <= Math.min(run, MAX_WORD_LENGTH); len++) {
          for (let s = c; s + len <= end; s++) {
            let word = '';
            for (let i = s; i < s + len; i++) word += grid[r][i].letter;
            if (isValidWord(word.toLowerCase())) return true;
          }
        }
      }
      c = end;
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const color = grid[r][c].color;
      let end = r;
      while (end < ROWS && grid[end][c].color === color) end++;
      const run = end - r;
      if (run >= minLen) {
        for (let len = minLen; len <= Math.min(run, MAX_WORD_LENGTH); len++) {
          for (let s = r; s + len <= end; s++) {
            let word = '';
            for (let i = s; i < s + len; i++) word += grid[i][c].letter;
            if (isValidWord(word.toLowerCase())) return true;
          }
        }
      }
      r = end;
    }
  }
  return false;
}

function calcWordScore(positions: Position[], grid: BubbleData[][], mode: GameMode): number {
  const len = positions.length;
  const letterPoints = positions.reduce((s, p) => {
    const b = grid[p.row][p.col];
    let v = b.value;
    if (b.powerup === 'x2') v *= 2;
    else if (b.powerup === 'x3') v *= 3;
    return s + v;
  }, 0);

  if (mode === 'classic' || mode === 'fiveplus' || mode === 'oneword') {
    if (len <= 3) return letterPoints;
    if (len === 4) return letterPoints + 3;
    if (len === 5) return letterPoints + 6;
    if (len === 6) return letterPoints + 9;
    if (len === 7) return letterPoints + 12;
    if (len === 8) return (letterPoints + 12) * 2;
    if (len === 9) return (letterPoints + 12) * 3;
    if (len >= 10) return (letterPoints + 12) * 4;
  }
  return letterPoints;
}

const CORNERS = new Set(['0-0', `0-${COLS - 1}`, `${ROWS - 1}-0`, `${ROWS - 1}-${COLS - 1}`]);

function isCorner(r: number, c: number) {
  return CORNERS.has(`${r}-${c}`);
}

function minTimerForOrdinal(ordinal: number, rareVowel: boolean): number {
  // ordinal = how many bombs will be on board including this one (1-based)
  if (ordinal <= 1) return rareVowel ? 12 : 10;
  if (ordinal === 2) return rareVowel ? 17 : 15;
  return rareVowel ? 21 : 20;
}

function addBombsToGrid(grid: BubbleData[][], count: number, vowelSet: Set<string>): void {
  const vowelPositions: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (
        vowelSet.has(grid[r][c].letter) &&
        !grid[r][c].bomb &&
        !grid[r][c].powerup &&
        !isCorner(r, c)
      ) {
        vowelPositions.push({ row: r, col: c });
      }
    }
  }
  for (let i = vowelPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vowelPositions[i], vowelPositions[j]] = [vowelPositions[j], vowelPositions[i]];
  }
  const toAdd = Math.min(count, vowelPositions.length);
  const existing = countBombs(grid);
  for (let i = 0; i < toAdd; i++) {
    const p = vowelPositions[i];
    const letter = grid[p.row][p.col].letter;
    const rareVowel = (LETTER_VALUES[letter] ?? 1) >= 4;
    const ordinal = existing + i + 1;
    const minTimer = minTimerForOrdinal(ordinal, rareVowel);
    const rand = 10 + Math.floor(Math.random() * 11);
    const t = Math.max(minTimer, rand);
    grid[p.row][p.col] = { ...grid[p.row][p.col], bomb: t };
  }
}

function countBombs(grid: BubbleData[][]): number {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].bomb !== undefined) count++;
    }
  }
  return count;
}

function countPowerups(grid: BubbleData[][], types: ReadonlyArray<'x2' | 'x3' | 'free5'>): number {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = grid[r][c].powerup;
      if (p && types.includes(p)) count++;
    }
  }
  return count;
}

function addPowerupToGrid(grid: BubbleData[][], type: 'x2' | 'x3' | 'free5'): void {
  const candidates: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c].bomb && !grid[r][c].powerup && !isCorner(r, c)) {
        candidates.push({ row: r, col: c });
      }
    }
  }
  if (candidates.length === 0) return;
  const p = candidates[Math.floor(Math.random() * candidates.length)];
  grid[p.row][p.col] = { ...grid[p.row][p.col], powerup: type };
}

function decrementBombs(grid: BubbleData[][]): { newGrid: BubbleData[][]; exploded: boolean; explodedAt: Position | null } {
  const newGrid = grid.map(row => row.map(b => {
    if (b.bomb !== undefined) {
      return { ...b, bomb: b.bomb - 1 };
    }
    return b;
  }));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newGrid[r][c].bomb !== undefined && newGrid[r][c].bomb! <= 0) {
        return { newGrid, exploded: true, explodedAt: { row: r, col: c } };
      }
    }
  }
  return { newGrid, exploded: false, explodedAt: null };
}

export function useGameState(
  isValidWord: (word: string) => boolean,
  mode: GameMode = 'classic',
  language: GameLanguage = 'en',
  adventureSeed?: AdventureSeed,
) {
  const FREE_LABELS: Record<string, string> = {
    en: 'FREE', sv: 'FRI', de: 'FREI', es: 'GRATIS', fr: 'LIBRE', it: 'LIBERO',
    pt: 'GRÁTIS', nl: 'VRIJ', no: 'FRI', da: 'FRI', fi: 'VAPAA',
  };
  const freeLabel = FREE_LABELS[language] ?? 'FREE';
  const langConfig = getLanguageConfig(language);
  const pool = langConfig.letterPool;
  const values = langConfig.letterValues;
  const vowelSet = langConfig.vowels;

  const targetLettersRef = useRef<string>('');
  targetLettersRef.current = (adventureSeed?.targetWords ?? []).join('').toUpperCase();

  // Words that must remain formable in some color throughout the game.
  // Updated reactively from outside via setKeepFormableWords.
  const keepFormableRef = useRef<string[]>(adventureSeed?.keepFormableWords ?? []);
  const setKeepFormableWords = useCallback((words: string[]) => {
    keepFormableRef.current = words.map(w => w.toUpperCase());
  }, []);

  const createInitialGrid = useCallback((): BubbleData[][] => {
    if (adventureSeed?.presetGrid) {
      return adventureSeed.presetGrid.map(row =>
        row.map(cell => makeSeedBubble(cell.l, cell.c, values))
      );
    }
    if (adventureSeed && adventureSeed.targetWords.length > 0) {
      return buildSeededGrid(
        adventureSeed.targetWords,
        isValidWord,
        getMinWordLength(mode),
        getColorsForMode(mode),
        pool,
        values,
        keepFormableRef.current,
      );
    }
    return createCleanGrid(isValidWord, mode, pool, values);
  }, [isValidWord, mode, pool, values, adventureSeed?.targetWords.join('|'), adventureSeed?.presetGrid]);

  const refillBubble = useCallback((colors: BubbleColor[]): BubbleData => {
    const tl = targetLettersRef.current;
    if (tl.length > 0 && Math.random() < 0.45) {
      const letter = tl[Math.floor(Math.random() * tl.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return makeSeedBubble(letter, color, values);
    }
    return createRandomBubble(colors, pool, values);
  }, [pool, values]);

  /** After refilling some cells, ensure all keep-formable words are still formable. */
  const repairAfterRefill = useCallback(
    (newGrid: BubbleData[][], newCellPositions: Position[], colors: BubbleColor[]) => {
      const required = keepFormableRef.current;
      if (!required || required.length === 0) return newGrid;
      repairFormability(newGrid, required, newCellPositions, {
        values,
        allowedColors: colors,
      });
      return newGrid;
    },
    [values],
  );

  const [grid, setGrid] = useState<BubbleData[][]>(() => {
    const g = createInitialGrid();
    if (mode === 'bomb') addBombsToGrid(g, 1, vowelSet);
    if (adventureSeed?.asteroids) placeAsteroids(g);
    if (adventureSeed?.satellite) placeSatellite(g);
    if (adventureSeed?.ufos) placeUfos(g);
    return g;
  });
  const [selectedBubble, setSelectedBubble] = useState<Position | null>(null);
  const [movesLeft, setMovesLeft] = useState(adventureSeed?.maxMoves ?? getMaxMoves(mode));
  const [score, setScore] = useState(0);
  const [usedWords, setUsedWords] = useState<UsedWord[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [explodedAt, setExplodedAt] = useState<Position | null>(null);
  const [poppingCells, setPoppingCells] = useState<Set<string>>(new Set());
  const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [movesUsed, setMovesUsed] = useState(0);
  const [bonusPopups, setBonusPopups] = useState<BonusMovesEvent[]>([]);
  const [freeMovesRemaining, setFreeMovesRemaining] = useState(0);
  const [asteroidsDestroyed, setAsteroidsDestroyed] = useState(0);

  const usedWordsRef = useRef(usedWords);
  usedWordsRef.current = usedWords;
  const blockedWordsRef = useRef<Set<string>>(new Set());

  const pendingBombTick = useRef(0);
  const lastProcessedBombTick = useRef(0);
  const freeMovesRef = useRef(0);
  const rocksPlacedRef = useRef(0);
  freeMovesRef.current = freeMovesRemaining;

  const minWordLen = getMinWordLength(mode);

  const isAdjacent = (a: Position, b: Position): boolean => {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  };

  const findWords = useCallback((currentGrid: BubbleData[][]): FoundWord[] => {
    const found: FoundWord[] = [];
    const usedWordSet = new Set(usedWordsRef.current.map((w) => w.word.toLowerCase()));
    blockedWordsRef.current.forEach(w => usedWordSet.add(w));
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        if (currentGrid[r][c].asteroid || currentGrid[r][c].satellite || currentGrid[r][c].ufo || currentGrid[r][c].rock) { c++; continue; }
        const color = currentGrid[r][c].color;
        let end = c;
        while (end < COLS && !currentGrid[r][end].asteroid && !currentGrid[r][end].satellite && !currentGrid[r][end].ufo && !currentGrid[r][end].rock && currentGrid[r][end].color === color) end++;
        const runLength = end - c;
        if (runLength >= minWordLen) {
          for (let len = Math.min(runLength, MAX_WORD_LENGTH); len >= minWordLen; len--) {
            for (let start = c; start + len <= end; start++) {
              const positions: Position[] = [];
              let word = '';
              for (let i = start; i < start + len; i++) {
                positions.push({ row: r, col: i });
                word += currentGrid[r][i].letter;
              }
              const wordLower = word.toLowerCase();
              if (!usedWordSet.has(wordLower) && isValidWord(wordLower)) {
                const wordScore = calcWordScore(positions, currentGrid, mode);
                found.push({ word: word.toUpperCase(), positions, score: wordScore });
              }
            }
          }
        }
        c = end === c ? c + 1 : end;
      }
    }

    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        if (currentGrid[r][c].asteroid || currentGrid[r][c].satellite || currentGrid[r][c].ufo || currentGrid[r][c].rock) { r++; continue; }
        const color = currentGrid[r][c].color;
        let end = r;
        while (end < ROWS && !currentGrid[end][c].asteroid && !currentGrid[end][c].satellite && !currentGrid[end][c].ufo && !currentGrid[end][c].rock && currentGrid[end][c].color === color) end++;
        const runLength = end - r;
        if (runLength >= minWordLen) {
          for (let len = Math.min(runLength, MAX_WORD_LENGTH); len >= minWordLen; len--) {
            for (let start = r; start + len <= end; start++) {
              const positions: Position[] = [];
              let word = '';
              for (let i = start; i < start + len; i++) {
                positions.push({ row: i, col: c });
                word += currentGrid[i][c].letter;
              }
              const wordLower = word.toLowerCase();
              if (!usedWordSet.has(wordLower) && isValidWord(wordLower)) {
                const wordScore = calcWordScore(positions, currentGrid, mode);
                found.push({ word: word.toUpperCase(), positions, score: wordScore });
              }
            }
          }
        }
        r = end === r ? r + 1 : end;
      }
    }

    if (found.length === 0) return [];
    found.sort((a, b) => {
      if (b.positions.length !== a.positions.length) return b.positions.length - a.positions.length;
      return b.score - a.score;
    });
    return [found[0]];
  }, [isValidWord, minWordLen, mode]);

  const maybeSpawnExtras = useCallback((grid: BubbleData[][]) => {
    const multCount = countPowerups(grid, ['x2', 'x3']);
    if (multCount < 3 && Math.random() < 0.3) {
      const type: 'x2' | 'x3' = Math.random() < 0.6 ? 'x2' : 'x3';
      addPowerupToGrid(grid, type);
    }
    const freeCount = countPowerups(grid, ['free5']);
    if (freeCount < 2 && Math.random() < 1 / 50) {
      addPowerupToGrid(grid, 'free5');
    }
  }, []);

  useEffect(() => {
    if (mode !== 'bomb') return;
    if (isProcessing || gameOver) return;
    if (pendingBombTick.current === lastProcessedBombTick.current) return;
    lastProcessedBombTick.current = pendingBombTick.current;

    setGrid(prev => {
      if (freeMovesRef.current > 0) {
        setFreeMovesRemaining(n => Math.max(0, n - 1));
        const newGrid = prev.map(row => row.map(b => ({ ...b })));
        maybeSpawnExtras(newGrid);
        return newGrid;
      }

      const { newGrid, exploded, explodedAt: pos } = decrementBombs(prev);
      if (exploded) {
        if (pos) setExplodedAt(pos);
        setGameOver(true);
        return newGrid;
      }
      const bc = countBombs(newGrid);
      if (bc === 0) {
        const toSpawn = 1 + Math.floor(Math.random() * 3);
        addBombsToGrid(newGrid, toSpawn, vowelSet);
      } else if (bc < 3 && Math.random() < 0.3) {
        addBombsToGrid(newGrid, 1, vowelSet);
      }
      maybeSpawnExtras(newGrid);
      return newGrid;
    });
  }, [isProcessing, gameOver, vowelSet, mode, maybeSpawnExtras]);

  const popAndCascade = useCallback((currentGrid: BubbleData[][], foundWords: FoundWord[]) => {
    if (foundWords.length === 0) {
      setIsProcessing(false);
      return;
    }

    const word = foundWords[0];
    const popKeys = new Set(word.positions.map((p) => `${p.row}-${p.col}`));
    setPoppingCells(popKeys);
    setLastFoundWord(word.word);

    const wordLen = word.positions.length;
    const centerPos = word.positions[Math.floor(word.positions.length / 2)];
    const wordColor = currentGrid[word.positions[0].row][word.positions[0].col].color;

    setScore((prev) => prev + word.score);
    setUsedWords((prev) => [...prev, { word: word.word, score: word.score }]);

    setBonusPopups((prev) => [...prev, {
      id: `bonus-${bonusEventId++}`,
      amount: word.score,
      color: wordColor,
      row: centerPos.row,
      col: centerPos.col,
      label: word.word.toUpperCase(),
    }]);

    if (mode !== 'bomb') {
      let multiplier = 0;
      let label = '';
      if (wordLen >= 10) { multiplier = 4; label = 'X4'; }
      else if (wordLen === 9) { multiplier = 3; label = 'X3'; }
      else if (wordLen === 8) { multiplier = 2; label = 'X2'; }

      if (multiplier > 0) {
        setBonusPopups((prev) => [...prev, {
          id: `bonus-${bonusEventId++}`,
          amount: multiplier,
          color: wordColor,
          row: centerPos.row,
          col: centerPos.col,
          label,
        }]);
      }
    }

    if (mode === 'oneword') {
      const currentBest = usedWordsRef.current.reduce((best, w) => Math.max(best, w.score), 0);
      if (word.score > currentBest) {
        setBonusPopups((prev) => [...prev, {
          id: `bonus-${bonusEventId++}`,
          amount: word.score,
          color: wordColor,
          row: centerPos.row,
          col: centerPos.col,
        }]);
      }
    }

    if (mode === 'surge') {
      let totalBonus = 0;
      if (wordLen >= 10) totalBonus += 50;
      else if (wordLen >= 7) totalBonus += 25;
      else if (wordLen >= 5) totalBonus += 10;
      
      if (word.score >= 15) totalBonus += 25;
      else if (word.score >= 10) totalBonus += 10;

      if (totalBonus > 0) {
        setMovesLeft((prev) => prev + totalBonus);
        setBonusPopups((prev) => [...prev, {
          id: `bonus-${bonusEventId++}`,
          amount: totalBonus,
          color: wordColor,
          row: centerPos.row,
          col: centerPos.col,
        }]);
      }
    }

    if (mode === 'bomb') {
      const free5Hit = word.positions.some(p => currentGrid[p.row][p.col].powerup === 'free5');
      if (free5Hit) {
        setFreeMovesRemaining(n => n + 5);
        setBonusPopups((prev) => [...prev, {
          id: `bonus-${bonusEventId++}`,
          amount: 5,
          color: wordColor,
          row: centerPos.row,
          col: centerPos.col,
          label: `+5 ${freeLabel}`,
        }]);
      }
    }

    const colors = getColorsForMode(mode);
    const antigravity = adventureSeed?.antigravity === true;
    const colBlockers = getColumnBlockers(currentGrid);

    setTimeout(() => {
      setPoppingCells(new Set());
      setLastFoundWord(null);
      const newGrid = currentGrid.map((row) => [...row]);
      const colsAffected = new Set(word.positions.map((p) => p.col));
      const newCellPositions: Position[] = [];

      for (const c of colsAffected) {
        const poppedRows = new Set(word.positions.filter((p) => p.col === c).map((p) => p.row));
        const blockers = colBlockers.get(c);

        if (blockers && !antigravity) {
          // Split column into segments separated by blockers (satellite/ufo).
          // Each segment refills new bubbles at its TOP.
          const segments: { lo: number; hi: number }[] = [];
          let lo = 0;
          for (const br of blockers) {
            if (br - 1 >= lo) segments.push({ lo, hi: br - 1 });
            lo = br + 1;
          }
          if (lo <= ROWS - 1) segments.push({ lo, hi: ROWS - 1 });

          for (const region of segments) {
            const remaining: BubbleData[] = [];
            for (let r = region.lo; r <= region.hi; r++) {
              if (!poppedRows.has(r)) remaining.push(newGrid[r][c]);
            }
            const popCount = (region.hi - region.lo + 1) - remaining.length;
            if (popCount === 0) continue;
            const newBubbles: BubbleData[] = [];
            for (let i = 0; i < popCount; i++) newBubbles.push(refillBubble(colors));
            const fullColumn = [...newBubbles, ...remaining];
            for (let i = 0; i < fullColumn.length; i++) newGrid[region.lo + i][c] = fullColumn[i];
            for (let i = 0; i < newBubbles.length; i++) newCellPositions.push({ row: region.lo + i, col: c });
          }
        } else {
          const remaining: BubbleData[] = [];
          for (let r = 0; r < ROWS; r++) if (!poppedRows.has(r)) remaining.push(newGrid[r][c]);
          const newBubbles: BubbleData[] = [];
          for (let i = 0; i < poppedRows.size; i++) newBubbles.push(refillBubble(colors));
          if (antigravity) {
            const fullColumn = [...remaining, ...newBubbles];
            for (let r = 0; r < ROWS; r++) newGrid[r][c] = fullColumn[r];
            for (let i = 0; i < newBubbles.length; i++) {
              newCellPositions.push({ row: ROWS - 1 - i, col: c });
            }
          } else {
            const fullColumn = [...newBubbles, ...remaining];
            for (let r = 0; r < ROWS; r++) newGrid[r][c] = fullColumn[r];
            for (let r = 0; r < newBubbles.length; r++) newCellPositions.push({ row: r, col: c });
          }
        }
      }

      // Asteroid destruction: any asteroid that ends up on the bottom row is destroyed.
      let destroyedThisPass = 0;
      const destroyRow = antigravity ? 0 : ROWS - 1;
      for (let cc = 0; cc < COLS; cc++) {
        if (newGrid[destroyRow][cc].asteroid) {
          destroyedThisPass++;
          newGrid[destroyRow][cc] = refillBubble(colors);
          newCellPositions.push({ row: destroyRow, col: cc });
        }
      }
      if (destroyedThisPass > 0) {
        setAsteroidsDestroyed(n => n + destroyedThisPass);
      }

      // Adventure: ensure required words remain formable.
      repairAfterRefill(newGrid, newCellPositions, colors);

      setGrid(newGrid);
      setTimeout(() => {
        const nextWords = findWords(newGrid);
        if (nextWords.length > 0) popAndCascade(newGrid, nextWords);
        else setIsProcessing(false);
      }, 300);
    }, 500);
  }, [findWords, mode, refillBubble, freeLabel, repairAfterRefill, adventureSeed?.antigravity]);

  const checkForWords = useCallback((currentGrid: BubbleData[][]) => {
    const foundWords = findWords(currentGrid);
    if (foundWords.length > 0) {
      setIsProcessing(true);
      popAndCascade(currentGrid, foundWords);
    }
  }, [findWords, popAndCascade]);

  const tickUfos = useCallback((g: BubbleData[][], colors: BubbleColor[]) => {
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS; c++) {
        if (g[r][c].ufo) {
          const below = g[r + 1][c];
          if (below.satellite || below.asteroid || below.ufo) continue;
          // Replace with a fresh random bubble (new color & letter).
          g[r + 1][c] = createRandomBubble(colors, pool, values);
        }
      }
    }
  }, [pool, values]);

  const performSwap = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    // Asteroids/satellite/UFOs/rocks cannot be moved.
    const a = grid[fromRow][fromCol];
    const b = grid[toRow][toCol];
    if (a.asteroid || b.asteroid || a.satellite || b.satellite || a.ufo || b.ufo || a.rock || b.rock) {
      setSelectedBubble(null);
      return;
    }
    const newGrid = grid.map((r) => [...r]);
    const temp = newGrid[fromRow][fromCol];
    newGrid[fromRow][fromCol] = newGrid[toRow][toCol];
    newGrid[toRow][toCol] = temp;

    const nextMovesUsed = movesUsed + 1;
    setMovesUsed(nextMovesUsed);

    const colors = getColorsForMode(mode);
    const hasUfos = adventureSeed?.ufos === true;
    if (hasUfos) tickUfos(newGrid, colors);

    // Collapsing cave: place next rock batch(es) so total batches placed = max(0, nextMovesUsed - 4).
    if (adventureSeed?.collapsingCave) {
      const targetBatches = Math.max(0, Math.min(ROCK_SCHEDULE.length, nextMovesUsed - 4));
      while (rocksPlacedRef.current < targetBatches) {
        applyRockBatch(newGrid, ROCK_SCHEDULE[rocksPlacedRef.current]);
        rocksPlacedRef.current += 1;
      }
    }

    if (mode === 'bomb') {
      setGrid(newGrid);
      setSelectedBubble(null);
      const foundWords = findWords(newGrid);
      if (foundWords.length > 0) {
        pendingBombTick.current += 1;
        setIsProcessing(true);
        popAndCascade(newGrid, foundWords);
      } else {
        if (freeMovesRef.current > 0) {
          setFreeMovesRemaining(n => Math.max(0, n - 1));
          maybeSpawnExtras(newGrid);
          setGrid(newGrid);
          return;
        }
        const { newGrid: bombGrid, exploded, explodedAt: pos } = decrementBombs(newGrid);
        if (exploded) {
          setGrid(bombGrid);
          if (pos) setExplodedAt(pos);
          setGameOver(true);
          return;
        }
        const bc = countBombs(bombGrid);
        if (bc === 0) {
          const toSpawn = 1 + Math.floor(Math.random() * 3);
          addBombsToGrid(bombGrid, toSpawn, vowelSet);
        } else if (bc < 3 && Math.random() < 0.3) {
          addBombsToGrid(bombGrid, 1, vowelSet);
        }
        maybeSpawnExtras(bombGrid);
        setGrid(bombGrid);
      }
      return;
    }

    setGrid(newGrid);
    setSelectedBubble(null);
    setMovesLeft((prev) => {
      const next = prev - 1;
      if (next <= 0) setGameOver(true);
      return next;
    });
    setTimeout(() => checkForWords(newGrid), 200);
  }, [grid, movesUsed, checkForWords, findWords, popAndCascade, mode, vowelSet, maybeSpawnExtras, adventureSeed?.ufos, adventureSeed?.collapsingCave, tickUfos]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    if (gameOver || isProcessing) return;
    if (!selectedBubble) setSelectedBubble({ row, col });
    else {
      const pos = { row, col };
      if (selectedBubble.row === row && selectedBubble.col === col) setSelectedBubble(null);
      else if (isAdjacent(selectedBubble, pos)) performSwap(selectedBubble.row, selectedBubble.col, row, col);
      else setSelectedBubble(pos);
    }
  }, [gameOver, isProcessing, selectedBubble, performSwap]);

  const handleSwipe = useCallback((fromRow: number, fromCol: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || isProcessing) return;
    const toRow = fromRow + (direction === 'down' ? 1 : direction === 'up' ? -1 : 0);
    const toCol = fromCol + (direction === 'right' ? 1 : direction === 'left' ? -1 : 0);
    if (toRow < 0 || toRow >= ROWS || toCol < 0 || toCol >= COLS) return;
    performSwap(fromRow, fromCol, toRow, toCol);
  }, [gameOver, isProcessing, performSwap]);

  const fireRocket = useCallback((col: number) => {
    if (gameOver || isProcessing) return 0;
    const positions: Position[] = [];
    let letterPoints = 0;
    let label = '';
    for (let r = 0; r < ROWS; r++) {
      const b = grid[r][col];
      positions.push({ row: r, col });
      let v = b.value;
      if (b.powerup === 'x2') v *= 2;
      else if (b.powerup === 'x3') v *= 3;
      letterPoints += v;
      label += b.letter;
    }
    const popKeys = new Set(positions.map(p => `${p.row}-${p.col}`));
    setIsProcessing(true);
    setPoppingCells(popKeys);
    setLastFoundWord(`🚀 ${label}`);
    setScore(prev => prev + letterPoints);
    setUsedWords(prev => [...prev, { word: `🚀${label}`, score: letterPoints }]);
    const colors = getColorsForMode(mode);
    setTimeout(() => {
      setPoppingCells(new Set());
      setLastFoundWord(null);
      const newGrid = grid.map(row => [...row]);
      const newCol: BubbleData[] = [];
      for (let r = 0; r < ROWS; r++) newCol.push(refillBubble(colors));
      for (let r = 0; r < ROWS; r++) newGrid[r][col] = newCol[r];
      // The whole rocket column is freshly spawned.
      const newCellPositions: Position[] = [];
      for (let r = 0; r < ROWS; r++) newCellPositions.push({ row: r, col });
      repairAfterRefill(newGrid, newCellPositions, colors);
      setGrid(newGrid);
      setTimeout(() => {
        const next = findWords(newGrid);
        if (next.length > 0) popAndCascade(newGrid, next);
        else setIsProcessing(false);
      }, 250);
    }, 500);
    return letterPoints;
  }, [gameOver, isProcessing, grid, mode, refillBubble, findWords, popAndCascade, repairAfterRefill]);

  const resetGame = useCallback(() => {
    const newGrid = createInitialGrid();
    if (mode === 'bomb') addBombsToGrid(newGrid, 1, vowelSet);
    if (adventureSeed?.asteroids) placeAsteroids(newGrid);
    if (adventureSeed?.satellite) placeSatellite(newGrid);
    if (adventureSeed?.ufos) placeUfos(newGrid);
    setGrid(newGrid);
    setSelectedBubble(null);
    setMovesLeft(adventureSeed?.maxMoves ?? getMaxMoves(mode));
    setScore(0);
    setUsedWords([]);
    setGameOver(false);
    setPoppingCells(new Set());
    setLastFoundWord(null);
    setIsProcessing(false);
    setMovesUsed(0);
    setBonusPopups([]);
    pendingBombTick.current = 0;
    lastProcessedBombTick.current = 0;
    setFreeMovesRemaining(0);
    setExplodedAt(null);
    setAsteroidsDestroyed(0);
  }, [createInitialGrid, mode, vowelSet, adventureSeed?.maxMoves, adventureSeed?.asteroids, adventureSeed?.satellite, adventureSeed?.ufos]);

  const addMoves = useCallback((amount: number) => {
    if (amount <= 0) return;
    setMovesLeft((prev) => prev + amount);
    setGameOver(false);
  }, []);

  const restoreSavedGame = useCallback((saved: {
    grid: BubbleData[][]; movesLeft: number; score: number;
    usedWords: { word: string; score: number }[]; movesUsed: number; freeMovesRemaining: number;
  }) => {
    setGrid(saved.grid.map(row => row.map(b => ({ ...b }))));
    setMovesLeft(saved.movesLeft);
    setScore(saved.score);
    setUsedWords(saved.usedWords);
    setGameOver(false);
    setIsProcessing(false);
    setMovesUsed(saved.movesUsed);
    setFreeMovesRemaining(saved.freeMovesRemaining);
  }, []);

  const startFromState = useCallback((newGrid: BubbleData[][], maxMoves: number, blockedWords: string[] = []) => {
    setGrid(newGrid.map(row => row.map(b => ({ ...b }))));
    setMovesLeft(maxMoves);
    setScore(0);
    setUsedWords([]);
    setGameOver(false);
    setIsProcessing(false);
    setMovesUsed(0);
    blockedWordsRef.current = new Set(blockedWords.map(w => w.toLowerCase()));
  }, []);

  /** Adventure laser: replace one bubble's letter (color & flags preserved). */
  const swapBubbleLetter = useCallback((row: number, col: number, newLetter: string) => {
    if (gameOver || isProcessing) return;
    const upper = newLetter.toUpperCase();
    if (!upper) return;
    setGrid(prev => {
      const b = prev[row][col];
      if (!b || b.satellite || b.asteroid) return prev;
      const ng = prev.map(r => [...r]);
      ng[row][col] = { ...b, letter: upper, value: values[upper] ?? 1 };
      // Schedule a word-check on the new grid.
      setTimeout(() => checkForWords(ng), 120);
      return ng;
    });
  }, [gameOver, isProcessing, values, checkForWords]);

  const bestWordEntry = usedWords.length > 0
    ? usedWords.reduce((best, w) => w.score > best.score ? w : best, usedWords[0])
    : null;

  const removeBonusPopup = useCallback((id: string) => {
    setBonusPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    grid, selectedBubble, movesLeft, score, usedWords, gameOver, poppingCells,
    lastFoundWord, isProcessing, handleBubbleClick, handleSwipe, resetGame,
    startFromState, restoreSavedGame, bestWordScore: bestWordEntry?.score ?? 0,
    bestWord: bestWordEntry?.word ?? null, movesUsed, bonusPopups, removeBonusPopup,
    freeMovesRemaining, explodedAt, addMoves, fireRocket, setKeepFormableWords,
    asteroidsDestroyed, swapBubbleLetter,
  };
}
