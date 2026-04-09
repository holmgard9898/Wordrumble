import { useCallback, useRef } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MIN_WORD_LENGTH, MAX_WORD_LENGTH,
  BUBBLE_COLORS, REDUCED_COLORS,
} from '@/data/gameConstants';

type GameMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

interface AIMove {
  from: Position;
  to: Position;
  expectedWord?: string;
  expectedScore?: number;
}

function getMinWordLen(mode: GameMode) {
  return mode === 'fiveplus' ? 5 : MIN_WORD_LENGTH;
}

/**
 * AI scans the board for possible swaps that create words.
 * It evaluates all adjacent swaps and picks the best word-forming one.
 * If no word-forming swap exists, it picks a random swap.
 */
function findBestSwap(
  grid: BubbleData[][],
  isValidWord: (w: string) => boolean,
  usedWords: Set<string>,
  mode: GameMode,
): AIMove | null {
  const minLen = getMinWordLen(mode);
  let bestMove: AIMove | null = null;
  let bestScore = -1;

  const directions: [number, number][] = [[0, 1], [1, 0]];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= ROWS || nc >= COLS) continue;

        // Simulate swap
        const simGrid = grid.map(row => [...row]);
        const temp = simGrid[r][c];
        simGrid[r][c] = simGrid[nr][nc];
        simGrid[nr][nc] = temp;

        // Check for words in simulated grid
        const words = findWordsInGrid(simGrid, isValidWord, usedWords, minLen);
        if (words.length > 0) {
          const best = words[0];
          const score = calcSimpleScore(best.positions, simGrid, mode);
          if (score > bestScore) {
            bestScore = score;
            bestMove = {
              from: { row: r, col: c },
              to: { row: nr, col: nc },
              expectedWord: best.word,
              expectedScore: score,
            };
          }
        }
      }
    }
  }

  return bestMove;
}

function findWordsInGrid(
  grid: BubbleData[][],
  isValidWord: (w: string) => boolean,
  usedWords: Set<string>,
  minLen: number,
): { word: string; positions: Position[]; }[] {
  const found: { word: string; positions: Position[]; len: number }[] = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const color = grid[r][c].color;
      let end = c;
      while (end < COLS && grid[r][end].color === color) end++;
      const run = end - c;
      if (run >= minLen) {
        for (let len = Math.min(run, MAX_WORD_LENGTH); len >= minLen; len--) {
          for (let s = c; s + len <= end; s++) {
            let word = '';
            const positions: Position[] = [];
            for (let i = s; i < s + len; i++) {
              word += grid[r][i].letter;
              positions.push({ row: r, col: i });
            }
            const wl = word.toLowerCase();
            if (!usedWords.has(wl) && isValidWord(wl)) {
              found.push({ word: word.toUpperCase(), positions, len });
            }
          }
        }
      }
      c = end;
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const color = grid[r][c].color;
      let end = r;
      while (end < ROWS && grid[end][c].color === color) end++;
      const run = end - r;
      if (run >= minLen) {
        for (let len = Math.min(run, MAX_WORD_LENGTH); len >= minLen; len--) {
          for (let s = r; s + len <= end; s++) {
            let word = '';
            const positions: Position[] = [];
            for (let i = s; i < s + len; i++) {
              word += grid[i][c].letter;
              positions.push({ row: i, col: c });
            }
            const wl = word.toLowerCase();
            if (!usedWords.has(wl) && isValidWord(wl)) {
              found.push({ word: word.toUpperCase(), positions, len });
            }
          }
        }
      }
      r = end;
    }
  }

  // Sort by length (longest first), then alphabetically for consistency
  found.sort((a, b) => b.len - a.len || a.word.localeCompare(b.word));
  return found;
}

function calcSimpleScore(positions: Position[], grid: BubbleData[][], mode: GameMode): number {
  const len = positions.length;
  const letterPoints = positions.reduce((s, p) => s + grid[p.row][p.col].value, 0);
  if (mode === 'surge') return letterPoints;
  if (len <= 3) return letterPoints;
  if (len === 4) return letterPoints + 2;
  if (len === 5) return letterPoints + 4;
  if (len === 6) return letterPoints + 6;
  if (len === 7) return letterPoints + 8;
  if (len === 8) return letterPoints + 10;
  if (len === 9) return letterPoints * 2;
  if (len >= 10) return letterPoints * 3;
  return letterPoints;
}

/**
 * If no word-forming swap is found, make a random valid swap
 */
function getRandomSwap(): AIMove {
  const r = Math.floor(Math.random() * ROWS);
  const c = Math.floor(Math.random() * COLS);
  const dirs: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const validDirs = dirs.filter(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS;
  });
  const [dr, dc] = validDirs[Math.floor(Math.random() * validDirs.length)];
  return { from: { row: r, col: c }, to: { row: r + dr, col: c + dc } };
}

export interface AIRoundResult {
  score: number;
  words: { word: string; score: number }[];
  movesUsed: number;
}

/**
 * Simulates the AI playing a full round.
 * Returns the result after all moves are used.
 */
export function simulateAIRound(
  grid: BubbleData[][],
  isValidWord: (w: string) => boolean,
  mode: GameMode,
  maxMoves: number,
  sharedUsedWords: string[] = [],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): AIRoundResult {
  const { createRandomBubble } = require('@/data/gameConstants');
  const colors = mode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
  const minLen = getMinWordLen(mode);

  // Deep copy grid
  let simGrid: BubbleData[][] = grid.map(row => row.map(b => ({ ...b })));
  const usedWords = new Set(sharedUsedWords.map(w => w.toLowerCase()));
  const foundWords: { word: string; score: number }[] = [];
  let totalScore = 0;
  let movesUsed = 0;

  // Difficulty affects how often AI finds optimal moves
  const findChance = difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.7 : 0.95;

  while (movesUsed < maxMoves) {
    // Try to find a word-forming swap
    const bestSwap = Math.random() < findChance
      ? findBestSwap(simGrid, isValidWord, usedWords, mode)
      : null;

    if (bestSwap) {
      // Perform swap
      const { from, to } = bestSwap;
      const temp = simGrid[from.row][from.col];
      simGrid[from.row][from.col] = simGrid[to.row][to.col];
      simGrid[to.row][to.col] = temp;
    } else {
      // Random swap
      const rSwap = getRandomSwap();
      const temp = simGrid[rSwap.from.row][rSwap.from.col];
      simGrid[rSwap.from.row][rSwap.from.col] = simGrid[rSwap.to.row][rSwap.to.col];
      simGrid[rSwap.to.row][rSwap.to.col] = temp;
    }
    movesUsed++;

    // Check for cascading words
    let cascading = true;
    while (cascading) {
      const words = findWordsInGrid(simGrid, isValidWord, usedWords, minLen);
      if (words.length === 0) {
        cascading = false;
        break;
      }

      const word = words[0];
      const score = calcSimpleScore(word.positions, simGrid, mode);
      totalScore += score;
      foundWords.push({ word: word.word, score });
      usedWords.add(word.word.toLowerCase());

      // Surge bonus moves
      if (mode === 'surge') {
        const wl = word.positions.length;
        if (wl >= 10) maxMoves += 50;
        else if (wl >= 7) maxMoves += 25;
        else if (wl >= 5) maxMoves += 10;
        if (score >= 15) maxMoves += 25;
        else if (score >= 10) maxMoves += 10;
      }

      // Pop and cascade
      const colsAffected = new Set(word.positions.map(p => p.col));
      for (const c of colsAffected) {
        const poppedRows = new Set(word.positions.filter(p => p.col === c).map(p => p.row));
        const remaining: BubbleData[] = [];
        for (let r = 0; r < ROWS; r++) {
          if (!poppedRows.has(r)) remaining.push(simGrid[r][c]);
        }
        const newBubbles: BubbleData[] = [];
        for (let i = 0; i < poppedRows.size; i++) {
          newBubbles.push(createRandomBubble(colors));
        }
        const fullColumn = [...newBubbles, ...remaining];
        for (let r = 0; r < ROWS; r++) simGrid[r][c] = fullColumn[r];
      }
    }
  }

  // For oneword mode, score = best single word
  if (mode === 'oneword' && foundWords.length > 0) {
    const best = foundWords.reduce((a, b) => a.score > b.score ? a : b);
    return { score: best.score, words: foundWords, movesUsed };
  }

  return { score: totalScore, words: foundWords, movesUsed };
}

export function useAIOpponent() {
  const isRunning = useRef(false);

  const runAIRound = useCallback(async (
    grid: BubbleData[][],
    isValidWord: (w: string) => boolean,
    mode: GameMode,
    maxMoves: number,
    sharedUsedWords: string[] = [],
  ): Promise<AIRoundResult> => {
    isRunning.current = true;

    // Run in a timeout to avoid blocking UI
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = simulateAIRound(grid, isValidWord, mode, maxMoves, sharedUsedWords, 'medium');
        isRunning.current = false;
        resolve(result);
      }, 500);
    });
  }, []);

  return { runAIRound, isRunning: isRunning.current };
}
