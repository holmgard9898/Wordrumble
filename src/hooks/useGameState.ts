import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MAX_MOVES, MIN_WORD_LENGTH, MAX_WORD_LENGTH,
  createRandomBubble, BUBBLE_COLORS, REDUCED_COLORS, type BubbleColor,
} from '@/data/gameConstants';
import { getLanguageConfig } from '@/data/languages';
import type { GameLanguage } from '@/data/languages';
import type { GameMode } from '@/pages/GamePage';
import { createWordlessGrid, ensureGridHasNoWords } from '@/utils/gridGeneration';

export interface AdventureSeed {
  /** Target words (any case) that should be plantable on the start grid in matching color. */
  targetWords: string[];
  /** Override max moves for this run (adventure mode). */
  maxMoves?: number;
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

  // Try a few times; then run ensureGridHasNoWords with weighted refill on non-seed cells.
  // To preserve seeded letters, mark them: we treat any pre-existing valid word as a problem, but
  // ensureGridHasNoWords replaces matched runs entirely. To keep it simple we just re-build a few times.
  for (let attempt = 0; attempt < 25; attempt++) {
    const g = tryBuild();
    if (!g) continue;
    // Use ensureGridHasNoWords with weightedRefill — this may overwrite seeded letters in rare cases,
    // but planted letters of one word share a color and are scattered, so collisions are unlikely.
    const cleaned = ensureGridHasNoWords(g, {
      isValidWord,
      minWordLength: minWordLen,
      createBubble: weightedRefill,
      maxPasses: 50,
    });
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
  // Apply per-letter powerup multipliers (x2 / x3) to letter values
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
  // Generate timers — strict minimum 10, max 20.
  const timers: number[] = [];
  for (let i = 0; i < toAdd; i++) {
    timers.push(10 + Math.floor(Math.random() * 11)); // 10..20
  }
  if (toAdd >= 3) {
    const minIdx = timers.reduce((m, v, i, a) => (v < a[m] ? i : m), 0);
    if (timers[minIdx] < 13) timers[minIdx] = 13;
  }
  for (let i = 0; i < toAdd; i++) {
    const p = vowelPositions[i];
    const t = Math.max(10, timers[i]); // hard floor 10
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
      if (
        !grid[r][c].bomb &&
        !grid[r][c].powerup &&
        !isCorner(r, c)
      ) {
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
  // Localized FREE label (used for free5 powerup popup)
  const FREE_LABELS: Record<string, string> = {
    en: 'FREE', sv: 'FRI', de: 'FREI', es: 'GRATIS', fr: 'LIBRE', it: 'LIBERO',
    pt: 'GRÁTIS', nl: 'VRIJ', no: 'FRI', da: 'FRI', fi: 'VAPAA',
  };
  const freeLabel = FREE_LABELS[language] ?? 'FREE';
  const langConfig = getLanguageConfig(language);
  const pool = langConfig.letterPool;
  const values = langConfig.letterValues;
  const vowelSet = langConfig.vowels;

  // Stable target letters for adventure refill bias
  const targetLettersRef = useRef<string>('');
  targetLettersRef.current = (adventureSeed?.targetWords ?? []).join('').toUpperCase();

  const createInitialGrid = useCallback((): BubbleData[][] => {
    if (adventureSeed && adventureSeed.targetWords.length > 0) {
      return buildSeededGrid(
        adventureSeed.targetWords,
        isValidWord,
        getMinWordLength(mode),
        getColorsForMode(mode),
        pool,
        values,
      );
    }
    return createCleanGrid(isValidWord, mode, pool, values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidWord, mode, pool, values, adventureSeed?.targetWords.join('|')]);

// Refill bubble for cascades — dynamically ensures secret words are possible
  const refillBubble = useCallback((colors: BubbleColor[]): BubbleData => {
    const tl = targetLettersRef.current; // Det hemliga ordet (t.ex. "SKEPP")
    
    if (tl.length > 0) {
      // 1. Kolla vilka bokstäver som faktiskt finns på brädet just nu
      const currentLettersOnBoard = grid.flat().map(b => b.letter.toUpperCase());
      
      // 2. Hitta vilka bokstäver från det hemliga ordet som saknas
      const missingLetters = tl.split('').filter(char => {
        const index = currentLettersOnBoard.indexOf(char);
        if (index !== -1) {
          currentLettersOnBoard.splice(index, 1); // Ta bort så vi räknar dubbletter rätt (t.ex. två P)
          return false;
        }
        return true;
      });

      // 3. Om bokstäver saknas, öka chansen rejält (80%) att vi skapar en av de som fattas
      if (missingLetters.length > 0 && Math.random() < 0.80) {
        const letter = missingLetters[Math.floor(Math.random() * missingLetters.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return makeSeedBubble(letter, color, values);
      }
      
      // 4. Som fallback, använd Lovables gamla 45% chans för slumpmässig bokstav från ordet
      if (Math.random() < 0.45) {
        const letter = tl[Math.floor(Math.random() * tl.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return makeSeedBubble(letter, color, values);
      }
    }
    
    // Annars helt slumpmässig som vanligt
    return createRandomBubble(colors, pool, values);
  }, [pool, values, grid]); // Viktigt: la till 'grid' här så den känner av brädets innehåll
  const [grid, setGrid] = useState<BubbleData[][]>(() => {
    const g = createInitialGrid();
    if (mode === 'bomb') addBombsToGrid(g, 1, vowelSet);
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

  const usedWordsRef = useRef(usedWords);
  usedWordsRef.current = usedWords;

  const blockedWordsRef = useRef<Set<string>>(new Set());

  // Use a numeric tick id so duplicate effect fires can't double-decrement.
  const pendingBombTick = useRef(0);
  const lastProcessedBombTick = useRef(0);
  const freeMovesRef = useRef(0);
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
        const color = currentGrid[r][c].color;
        let end = c;
        while (end < COLS && currentGrid[r][end].color === color) end++;
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
        c = end;
      }
    }

    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const color = currentGrid[r][c].color;
        let end = r;
        while (end < ROWS && currentGrid[end][c].color === color) end++;
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
        r = end;
      }
    }

    if (found.length === 0) return [];
    found.sort((a, b) => {
      if (b.positions.length !== a.positions.length) return b.positions.length - a.positions.length;
      return b.score - a.score;
    });
    return [found[0]];
  }, [isValidWord, minWordLen, mode]);

  // Powerup spawn helper (mutates grid in place) — bomb mode only
  const maybeSpawnExtras = useCallback((grid: BubbleData[][]) => {
    // x2 / x3 letter multipliers — same chance as bombs (~30%), max 3 total
    const multCount = countPowerups(grid, ['x2', 'x3']);
    if (multCount < 3 && Math.random() < 0.3) {
      const type: 'x2' | 'x3' = Math.random() < 0.6 ? 'x2' : 'x3';
      addPowerupToGrid(grid, type);
    }
    // 5 free moves — 1/50 chance, max 2 simultaneous
    const freeCount = countPowerups(grid, ['free5']);
    if (freeCount < 2 && Math.random() < 1 / 50) {
      addPowerupToGrid(grid, 'free5');
    }
  }, []);

  // After cascade completes in bomb mode, decrement bomb timers (guarded against double-fire)
  useEffect(() => {
    if (mode !== 'bomb') return;
    if (isProcessing || gameOver) return;
    if (pendingBombTick.current === lastProcessedBombTick.current) return;
    lastProcessedBombTick.current = pendingBombTick.current;

    setGrid(prev => {
      // If free moves are active, skip decrement but consume one free move
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

    // Word popup: show the formed word at every match
    setBonusPopups((prev) => [...prev, {
      id: `bonus-${bonusEventId++}`,
      amount: word.score,
      color: wordColor,
      row: centerPos.row,
      col: centerPos.col,
      label: word.word.toUpperCase(),
    }]);

    // Multiplier popup for 8+ letter words (all modes that use calcWordScore)
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

    // Oneword mode: popup when new best word score
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

    // Word Surge bonus moves
    if (mode === 'surge') {
      let totalBonus = 0;

      if (wordLen >= 10) {
        totalBonus += 50;
      } else if (wordLen >= 7) {
        totalBonus += 25;
      } else if (wordLen >= 5) {
        totalBonus += 10;
      }
      if (word.score >= 15) {
        totalBonus += 25;
      } else if (word.score >= 10) {
        totalBonus += 10;
      }

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

    // Bomb mode: detect free5 powerup popped within the word
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

    setTimeout(() => {
      setPoppingCells(new Set());
      setLastFoundWord(null);

      const newGrid = currentGrid.map((row) => [...row]);
      const colsAffected = new Set(word.positions.map((p) => p.col));

      for (const c of colsAffected) {
        const poppedRows = new Set(word.positions.filter((p) => p.col === c).map((p) => p.row));
        const remaining: BubbleData[] = [];
        for (let r = 0; r < ROWS; r++) {
          if (!poppedRows.has(r)) remaining.push(newGrid[r][c]);
        }
        const newBubbles: BubbleData[] = [];
        for (let i = 0; i < poppedRows.size; i++) newBubbles.push(refillBubble(colors));
        const fullColumn = [...newBubbles, ...remaining];
        for (let r = 0; r < ROWS; r++) newGrid[r][c] = fullColumn[r];
      }

      // In bomb mode, ensure bombs after cascade (handled in useEffect after processing ends)
      // For non-bomb modes with bomb-unrelated logic, keep as is

      setGrid(newGrid);

      setTimeout(() => {
        const nextWords = findWords(newGrid);
        if (nextWords.length > 0) {
          popAndCascade(newGrid, nextWords);
        } else {
          setIsProcessing(false);
        }
      }, 300);
    }, 500);
  }, [findWords, mode, pool, values, refillBubble]);

  const checkForWords = useCallback((currentGrid: BubbleData[][]) => {
    const foundWords = findWords(currentGrid);
    if (foundWords.length > 0) {
      setIsProcessing(true);
      popAndCascade(currentGrid, foundWords);
    }
  }, [findWords, popAndCascade]);

  const performSwap = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const newGrid = grid.map((r) => [...r]);
    const temp = newGrid[fromRow][fromCol];
    newGrid[fromRow][fromCol] = newGrid[toRow][toCol];
    newGrid[toRow][toCol] = temp;

    setMovesUsed((prev) => prev + 1);

    if (mode === 'bomb') {
      // In bomb mode: swap → check words → after cascade, decrement bombs
      setGrid(newGrid);
      setSelectedBubble(null);

      const foundWords = findWords(newGrid);
      if (foundWords.length > 0) {
        pendingBombTick.current += 1;
        setIsProcessing(true);
        popAndCascade(newGrid, foundWords);
      } else {
        // No words found — decrement bombs now (unless free moves active)
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
  }, [grid, checkForWords, findWords, popAndCascade, mode, vowelSet]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    if (gameOver || isProcessing) return;

    if (!selectedBubble) {
      setSelectedBubble({ row, col });
    } else {
      const pos = { row, col };
      if (selectedBubble.row === row && selectedBubble.col === col) {
        setSelectedBubble(null);
      } else if (isAdjacent(selectedBubble, pos)) {
        performSwap(selectedBubble.row, selectedBubble.col, row, col);
      } else {
        setSelectedBubble(pos);
      }
    }
  }, [gameOver, isProcessing, selectedBubble, performSwap]);

  const handleSwipe = useCallback((fromRow: number, fromCol: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || isProcessing) return;
    const toRow = fromRow + (direction === 'down' ? 1 : direction === 'up' ? -1 : 0);
    const toCol = fromCol + (direction === 'right' ? 1 : direction === 'left' ? -1 : 0);
    if (toRow < 0 || toRow >= ROWS || toCol < 0 || toCol >= COLS) return;
    performSwap(fromRow, fromCol, toRow, toCol);
  }, [gameOver, isProcessing, performSwap]);

  /** Adventure rocket powerup: pop entire column, score letter values as if a word. */
  const fireRocket = useCallback((col: number) => {
    if (gameOver || isProcessing) return 0;
    if (col < 0 || col >= COLS) return 0;

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
      setGrid(newGrid);
      setTimeout(() => {
        const next = findWords(newGrid);
        if (next.length > 0) popAndCascade(newGrid, next);
        else setIsProcessing(false);
      }, 250);
    }, 500);

    return letterPoints;
  }, [gameOver, isProcessing, grid, mode, refillBubble, findWords, popAndCascade]);

  const resetGame = useCallback(() => {
    const newGrid = createInitialGrid();
    if (mode === 'bomb') addBombsToGrid(newGrid, 1, vowelSet);
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
  }, [createInitialGrid, mode, vowelSet, adventureSeed?.maxMoves]);

  /** Grant additional moves (e.g. ad reward) and clear game over if applicable. */
  const addMoves = useCallback((amount: number) => {
    if (amount <= 0) return;
    setMovesLeft((prev) => prev + amount);
    setGameOver(false);
  }, []);

  /** Restore a previously-saved in-progress game (preserves score, usedWords, etc.) */
  const restoreSavedGame = useCallback((saved: {
    grid: BubbleData[][];
    movesLeft: number;
    score: number;
    usedWords: { word: string; score: number }[];
    movesUsed: number;
    freeMovesRemaining: number;
  }) => {
    setGrid(saved.grid.map(row => row.map(b => ({ ...b }))));
    setSelectedBubble(null);
    setMovesLeft(saved.movesLeft);
    setScore(saved.score);
    setUsedWords(saved.usedWords);
    setGameOver(false);
    setPoppingCells(new Set());
    setLastFoundWord(null);
    setIsProcessing(false);
    setMovesUsed(saved.movesUsed);
    setBonusPopups([]);
    pendingBombTick.current = 0;
    lastProcessedBombTick.current = 0;
    setFreeMovesRemaining(saved.freeMovesRemaining);
    setExplodedAt(null);
  }, []);

  const startFromState = useCallback((newGrid: BubbleData[][], maxMoves: number, blockedWords: string[] = []) => {
    setGrid(newGrid.map(row => row.map(b => ({ ...b }))));
    setSelectedBubble(null);
    setMovesLeft(maxMoves);
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
    blockedWordsRef.current = new Set(blockedWords.map(w => w.toLowerCase()));
  }, []);

  // Track best word for oneword mode
  const bestWordEntry = usedWords.length > 0
    ? usedWords.reduce((best, w) => w.score > best.score ? w : best, usedWords[0])
    : null;
  const bestWordScore = bestWordEntry?.score ?? 0;
  const bestWord = bestWordEntry?.word ?? null;

  const removeBonusPopup = useCallback((id: string) => {
    setBonusPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    grid,
    selectedBubble,
    movesLeft,
    score,
    usedWords,
    gameOver,
    poppingCells,
    lastFoundWord,
    isProcessing,
    handleBubbleClick,
    handleSwipe,
    resetGame,
    startFromState,
    restoreSavedGame,
    bestWordScore,
    bestWord,
    movesUsed,
    bonusPopups,
    removeBonusPopup,
    freeMovesRemaining,
    explodedAt,
    addMoves,
    fireRocket,
  };
}
