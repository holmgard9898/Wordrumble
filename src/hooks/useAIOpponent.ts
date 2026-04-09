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
            const lowerWord = word.toLowerCase();
            if (!usedWords.has(lowerWord) && isValidWord(lowerWord)) {
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
            const lowerWord = word.toLowerCase();
            if (!usedWords.has(lowerWord) && isValidWord(lowerWord)) {
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
  const letterPoints = positions.reduce((sum, position) => sum + grid[position.row][position.col].value, 0);
  if (mode === 'surge') return letterPoints;
  if (len <= 3) return letterPoints;
  if (len === 4) return letterPoints + 2;
  if (len === 5) return letterPoints + 4;
  if (len === 6) return letterPoints + 6;
  if (len === 7) return letterPoints + 8;
  if (len === 8) return letterPoints + 10;
  if (len === 9) return letterPoints * 2;
  return letterPoints * 3;
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

  const directions: [number, number][] = [[0, 1], [1, 0]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= ROWS || nc >= COLS) continue;
        const simulationGrid = grid.map((row) => [...row]);
        const temp = simulationGrid[r][c];
        simulationGrid[r][c] = simulationGrid[nr][nc];
        simulationGrid[nr][nc] = temp;
        const words = findWordsInGrid(simulationGrid, isValidWord, usedWords, minLen);
        if (words.length > 0) {
          const score = calcScore(words[0].positions, simulationGrid, mode);
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
  finalGrid: BubbleData[][];
  usedWordsList: string[];
}

export function simulateAIRound(
  startGrid: BubbleData[][],
  isValidWord: (w: string) => boolean,
  mode: GameMode,
  totalMoves: number,
  sharedUsedWords: string[] = [],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  pool?: string,
  values?: Record<string, number>,
): AIRoundResult {
  const colors = mode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
  const minLen = getMinWordLen(mode);
  let simulationGrid: BubbleData[][] = startGrid.map((row) => row.map((bubble) => ({ ...bubble })));
  const usedWords = new Set(sharedUsedWords.map((word) => word.toLowerCase()));
  const foundWords: { word: string; score: number }[] = [];
  let totalScore = 0;
  let movesUsed = 0;
  let maxMoves = totalMoves;

  const findChance = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.65 : 0.9;

  while (movesUsed < maxMoves) {
    const swap = Math.random() < findChance
      ? findBestSwap(simulationGrid, isValidWord, usedWords, mode)
      : null;

    if (swap) {
      const temp = simulationGrid[swap.from.row][swap.from.col];
      simulationGrid[swap.from.row][swap.from.col] = simulationGrid[swap.to.row][swap.to.col];
      simulationGrid[swap.to.row][swap.to.col] = temp;
    } else {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      const directions: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      const validDirections = directions.filter(([dr, dc]) => row + dr >= 0 && row + dr < ROWS && col + dc >= 0 && col + dc < COLS);
      const [dr, dc] = validDirections[Math.floor(Math.random() * validDirections.length)];
      const temp = simulationGrid[row][col];
      simulationGrid[row][col] = simulationGrid[row + dr][col + dc];
      simulationGrid[row + dr][col + dc] = temp;
    }
    movesUsed++;

    let cascading = true;
    while (cascading) {
      const words = findWordsInGrid(simulationGrid, isValidWord, usedWords, minLen);
      if (words.length === 0) {
        cascading = false;
        break;
      }

      const word = words[0];
      const score = calcScore(word.positions, simulationGrid, mode);
      totalScore += score;
      foundWords.push({ word: word.word, score });
      usedWords.add(word.word.toLowerCase());

      if (mode === 'surge') {
        const wordLength = word.positions.length;
        if (wordLength >= 10) maxMoves += 50;
        else if (wordLength >= 7) maxMoves += 25;
        else if (wordLength >= 5) maxMoves += 10;
        if (score >= 15) maxMoves += 25;
        else if (score >= 10) maxMoves += 10;
      }

      const affectedColumns = new Set(word.positions.map((position) => position.col));
      for (const column of affectedColumns) {
        const poppedRows = new Set(word.positions.filter((position) => position.col === column).map((position) => position.row));
        const remaining: BubbleData[] = [];
        for (let r = 0; r < ROWS; r++) {
          if (!poppedRows.has(r)) remaining.push(simulationGrid[r][column]);
        }
        const newBubbles: BubbleData[] = [];
        for (let i = 0; i < poppedRows.size; i++) {
          newBubbles.push(createRandomBubble(colors, pool, values));
        }
        const fullColumn = [...newBubbles, ...remaining];
        for (let r = 0; r < ROWS; r++) {
          simulationGrid[r][column] = fullColumn[r];
        }
      }
    }
  }

  const bestEntry = foundWords.length > 0
    ? foundWords.reduce((best, current) => best.score > current.score ? best : current)
    : null;

  return {
    score: mode === 'oneword' && bestEntry ? bestEntry.score : totalScore,
    words: foundWords,
    movesUsed,
    bestWord: bestEntry?.word ?? null,
    bestWordScore: bestEntry?.score ?? 0,
    finalGrid: simulationGrid,
    usedWordsList: Array.from(usedWords),
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
    pool?: string,
    values?: Record<string, number>,
  ): Promise<AIRoundResult> => {
    isRunning.current = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = simulateAIRound(grid, isValidWord, mode, maxMoves, sharedUsedWords, 'medium', pool, values);
        isRunning.current = false;
        resolve(result);
      }, 600);
    });
  }, []);

  return { runAIRound, isRunning };
}
