import { useCallback, useRef } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MIN_WORD_LENGTH, MAX_WORD_LENGTH,
  BUBBLE_COLORS, REDUCED_COLORS, createRandomBubble,
} from '@/data/gameConstants';

type GameMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

interface AIMove {
  from: Position;
  to: Position;
}

function getMinWordLen(mode: GameMode) {
  return mode === 'fiveplus' ? 5 : MIN_WORD_LENGTH;
}

function findWordsInGrid(
  grid: BubbleData[][],
  isValidWord: (w: string) => boolean,
  usedWords: Set<string>,
  minLen: number,
): { word: string; positions: Position[] }[] {
  const found: { word: string; positions: Position[]; len: number }[] = [];

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

  found.sort((a, b) => b.len - a.len);
  return found;
}

function calcScore(positions: Position[], grid: BubbleData[][], mode: GameMode): number {
  const len = positions.length;
  const lp = positions.reduce((s, p) => s + grid[p.row][p.col].value, 0);
  if (mode === 'surge') return lp;
  if (len <= 3) return lp;
  if (len === 4) return lp + 2;
  if (len === 5) return lp + 4;
  if (len === 6) return lp + 6;
  if (len === 7) return lp + 8;
  if (len === 8) return lp + 10;
  if (len === 9) return lp * 2;
  return lp * 3;
}

function findBestSwap(
  grid: BubbleData[][],
  isValidWord: (w: string) => boolean,
  usedWords: Set<string>,
  mode: GameMode,
): AIMove | null {
  const minLen = getMinWordLen(mode);
  let bestMove: AIMove | null = null;
  let bestScore = -1;

  const dirs: [number, number][] = [[0, 1], [1, 0]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= ROWS || nc >= COLS) continue;
        const simGrid = grid.map(row => [...row]);
        const temp = simGrid[r][c];
        simGrid[r][c] = simGrid[nr][nc];
        simGrid[nr][nc] = temp;
        const words = findWordsInGrid(simGrid, isValidWord, usedWords, minLen);
        if (words.length > 0) {
          const score = calcScore(words[0].positions, simGrid, mode);
          if (score > bestScore) {
            bestScore = score;
            bestMove = { from: { row: r, col: c }, to: { row: nr, col: nc } };
          }
        }
      }
    }
  }
  return bestMove;
}

export interface AIRoundResult {
  score: number;
  words: { word: string; score: number }[];
  movesUsed: number;
  bestWord: string | null;
  bestWordScore: number;
}

export function simulateAIRound(
  startGrid: BubbleData[][],
  isValidWord: (w: string) => boolean,
  mode: GameMode,
  totalMoves: number,
  sharedUsedWords: string[] = [],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): AIRoundResult {
  const colors = mode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
  const minLen = getMinWordLen(mode);
  let simGrid: BubbleData[][] = startGrid.map(row => row.map(b => ({ ...b })));
  const usedWords = new Set(sharedUsedWords.map(w => w.toLowerCase()));
  const foundWords: { word: string; score: number }[] = [];
  let totalScore = 0;
  let movesUsed = 0;
  let maxMoves = totalMoves;

  const findChance = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.65 : 0.9;

  while (movesUsed < maxMoves) {
    const swap = Math.random() < findChance
      ? findBestSwap(simGrid, isValidWord, usedWords, mode)
      : null;

    if (swap) {
      const temp = simGrid[swap.from.row][swap.from.col];
      simGrid[swap.from.row][swap.from.col] = simGrid[swap.to.row][swap.to.col];
      simGrid[swap.to.row][swap.to.col] = temp;
    } else {
      // Random swap
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      const d: [number, number][] = [[0,1],[0,-1],[1,0],[-1,0]];
      const valid = d.filter(([dr,dc]) => r+dr>=0&&r+dr<ROWS&&c+dc>=0&&c+dc<COLS);
      const [dr,dc] = valid[Math.floor(Math.random()*valid.length)];
      const temp = simGrid[r][c];
      simGrid[r][c] = simGrid[r+dr][c+dc];
      simGrid[r+dr][c+dc] = temp;
    }
    movesUsed++;

    // Cascade
    let cascading = true;
    while (cascading) {
      const words = findWordsInGrid(simGrid, isValidWord, usedWords, minLen);
      if (words.length === 0) { cascading = false; break; }
      const word = words[0];
      const score = calcScore(word.positions, simGrid, mode);
      totalScore += score;
      foundWords.push({ word: word.word, score });
      usedWords.add(word.word.toLowerCase());

      if (mode === 'surge') {
        const wl = word.positions.length;
        if (wl >= 10) maxMoves += 50;
        else if (wl >= 7) maxMoves += 25;
        else if (wl >= 5) maxMoves += 10;
        if (score >= 15) maxMoves += 25;
        else if (score >= 10) maxMoves += 10;
      }

      const colsAffected = new Set(word.positions.map(p => p.col));
      for (const col of colsAffected) {
        const poppedRows = new Set(word.positions.filter(p => p.col === col).map(p => p.row));
        const remaining: BubbleData[] = [];
        for (let r2 = 0; r2 < ROWS; r2++) {
          if (!poppedRows.has(r2)) remaining.push(simGrid[r2][col]);
        }
        const newBubbles: BubbleData[] = [];
        for (let i = 0; i < poppedRows.size; i++) newBubbles.push(createRandomBubble(colors));
        const fullCol = [...newBubbles, ...remaining];
        for (let r2 = 0; r2 < ROWS; r2++) simGrid[r2][col] = fullCol[r2];
      }
    }
  }

  const bestEntry = foundWords.length > 0
    ? foundWords.reduce((a, b) => a.score > b.score ? a : b)
    : null;

  const finalScore = mode === 'oneword' && bestEntry ? bestEntry.score : totalScore;

  return {
    score: finalScore,
    words: foundWords,
    movesUsed,
    bestWord: bestEntry?.word ?? null,
    bestWordScore: bestEntry?.score ?? 0,
  };
}

export function useAIOpponent() {
  const isRunning = useRef(false);

  const runAIRound = useCallback((
    grid: BubbleData[][],
    isValidWord: (w: string) => boolean,
    mode: GameMode,
    maxMoves: number,
    sharedUsedWords: string[] = [],
  ): Promise<AIRoundResult> => {
    isRunning.current = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = simulateAIRound(grid, isValidWord, mode, maxMoves, sharedUsedWords, 'medium');
        isRunning.current = false;
        resolve(result);
      }, 500);
    });
  }, []);

  return { runAIRound };
}
