import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MAX_MOVES, MIN_WORD_LENGTH, MAX_WORD_LENGTH,
  createGrid, createRandomBubble, BUBBLE_COLORS, REDUCED_COLORS,
} from '@/data/gameConstants';
import { getLanguageConfig } from '@/data/languages';
import type { GameLanguage } from '@/data/languages';
import type { GameMode } from '@/pages/GamePage';

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
  const colors = getColorsForMode(mode);
  const minLen = getMinWordLength(mode);
  let attempts = 0;
  while (attempts < 50) {
    const grid = createGrid(colors, pool, values);
    if (!gridHasWords(grid, isValidWord, minLen)) return grid;
    attempts++;
  }
  return createGrid(colors, pool, values);
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
  const letterPoints = positions.reduce((s, p) => s + grid[p.row][p.col].value, 0);

  if (mode === 'classic' || mode === 'fiveplus' || mode === 'oneword') {
    if (len <= 3) return letterPoints;
    if (len === 4) return letterPoints + 2;
    if (len === 5) return letterPoints + 4;
    if (len === 6) return letterPoints + 6;
    if (len === 7) return letterPoints + 8;
    if (len === 8) return letterPoints + 10;
    if (len === 9) return letterPoints * 2;
    if (len >= 10) return letterPoints * 3;
  }

  return letterPoints;
}

function addBombsToGrid(grid: BubbleData[][], count: number, vowelSet: Set<string>): void {
  const vowelPositions: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (vowelSet.has(grid[r][c].letter) && !grid[r][c].bomb) {
        vowelPositions.push({ row: r, col: c });
      }
    }
  }
  for (let i = vowelPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vowelPositions[i], vowelPositions[j]] = [vowelPositions[j], vowelPositions[i]];
  }
  const toAdd = Math.min(count, vowelPositions.length);
  for (let i = 0; i < toAdd; i++) {
    const p = vowelPositions[i];
    const timer = 10 + Math.floor(Math.random() * 11);
    grid[p.row][p.col] = { ...grid[p.row][p.col], bomb: timer };
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

function decrementBombs(grid: BubbleData[][]): { newGrid: BubbleData[][]; exploded: boolean } {
  const newGrid = grid.map(row => row.map(b => {
    if (b.bomb !== undefined) {
      return { ...b, bomb: b.bomb - 1 };
    }
    return b;
  }));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newGrid[r][c].bomb !== undefined && newGrid[r][c].bomb! <= 0) {
        return { newGrid, exploded: true };
      }
    }
  }
  return { newGrid, exploded: false };
}

export function useGameState(isValidWord: (word: string) => boolean, mode: GameMode = 'classic', language: GameLanguage = 'en') {
  const langConfig = getLanguageConfig(language);
  const pool = langConfig.letterPool;
  const values = langConfig.letterValues;
  const vowelSet = langConfig.vowels;

  const [grid, setGrid] = useState<BubbleData[][]>(() => {
    const g = createCleanGrid(isValidWord, mode, pool, values);
    if (mode === 'bomb') addBombsToGrid(g, 1, vowelSet);
    return g;
  });
  const [selectedBubble, setSelectedBubble] = useState<Position | null>(null);
  const [movesLeft, setMovesLeft] = useState(getMaxMoves(mode));
  const [score, setScore] = useState(0);
  const [usedWords, setUsedWords] = useState<UsedWord[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [poppingCells, setPoppingCells] = useState<Set<string>>(new Set());
  const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [movesUsed, setMovesUsed] = useState(0);
  const [bonusPopups, setBonusPopups] = useState<BonusMovesEvent[]>([]);

  const usedWordsRef = useRef(usedWords);
  usedWordsRef.current = usedWords;

  const blockedWordsRef = useRef<Set<string>>(new Set());

  const pendingBombDecrement = useRef(false);

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

  // After cascade completes in bomb mode, decrement bomb timers
  useEffect(() => {
    if (!isProcessing && pendingBombDecrement.current && !gameOver) {
      pendingBombDecrement.current = false;
      setGrid(prev => {
        const { newGrid, exploded } = decrementBombs(prev);
        if (exploded) {
          setGameOver(true);
        }
        // Ensure at least 1 bomb exists
        const bc = countBombs(newGrid);
        if (!exploded && bc === 0) {
          const toSpawn = 1 + Math.floor(Math.random() * 3);
          addBombsToGrid(newGrid, toSpawn, vowelSet);
        } else if (!exploded && bc < 3 && Math.random() < 0.3) {
          addBombsToGrid(newGrid, 1, vowelSet);
        }
        return newGrid;
      });
    }
  }, [isProcessing, gameOver, vowelSet]);

  const popAndCascade = useCallback((currentGrid: BubbleData[][], foundWords: FoundWord[]) => {
    if (foundWords.length === 0) {
      setIsProcessing(false);
      return;
    }

    const word = foundWords[0];
    const popKeys = new Set(word.positions.map((p) => `${p.row}-${p.col}`));
    setPoppingCells(popKeys);
    setLastFoundWord(word.word);

    setScore((prev) => prev + word.score);
    setUsedWords((prev) => [...prev, { word: word.word, score: word.score }]);

    if (mode === 'surge') {
      const wordLen = word.positions.length;
      const centerPos = word.positions[Math.floor(word.positions.length / 2)];
      const wordColor = grid[word.positions[0].row][word.positions[0].col].color;
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
        for (let i = 0; i < poppedRows.size; i++) newBubbles.push(createRandomBubble(colors, pool, values));
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
  }, [findWords, mode, pool, values]);

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
        pendingBombDecrement.current = true;
        setIsProcessing(true);
        popAndCascade(newGrid, foundWords);
      } else {
        // No words found, decrement bombs now
        const { newGrid: bombGrid, exploded } = decrementBombs(newGrid);
        if (exploded) {
          setGrid(bombGrid);
          setGameOver(true);
          return;
        }
        // Ensure bombs exist
        const bc = countBombs(bombGrid);
        if (bc === 0) {
          const toSpawn = 1 + Math.floor(Math.random() * 3);
          addBombsToGrid(bombGrid, toSpawn, vowelSet);
        } else if (bc < 3 && Math.random() < 0.3) {
          addBombsToGrid(bombGrid, 1, vowelSet);
        }
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

  const resetGame = useCallback(() => {
    const newGrid = createCleanGrid(isValidWord, mode, pool, values);
    if (mode === 'bomb') addBombsToGrid(newGrid, 1, vowelSet);
    setGrid(newGrid);
    setSelectedBubble(null);
    setMovesLeft(getMaxMoves(mode));
    setScore(0);
    setUsedWords([]);
    setGameOver(false);
    setPoppingCells(new Set());
    setLastFoundWord(null);
    setIsProcessing(false);
    setMovesUsed(0);
    setBonusPopups([]);
    pendingBombDecrement.current = false;
  }, [isValidWord, mode, pool, values, vowelSet]);

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
    pendingBombDecrement.current = false;
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
    bestWordScore,
    bestWord,
    movesUsed,
    bonusPopups,
    removeBonusPopup,
  };
}
