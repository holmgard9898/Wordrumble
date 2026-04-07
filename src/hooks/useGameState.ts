import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MAX_MOVES, MIN_WORD_LENGTH, MAX_WORD_LENGTH,
  createGrid, createRandomBubble,
} from '@/data/gameConstants';
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

// Ensure no valid words exist on the initial grid
function createCleanGrid(isValidWord: (w: string) => boolean): BubbleData[][] {
  let attempts = 0;
  while (attempts < 50) {
    const grid = createGrid();
    if (!gridHasWords(grid, isValidWord)) return grid;
    attempts++;
  }
  // Fallback: just return a grid (very rare to still have words)
  return createGrid();
}

function gridHasWords(grid: BubbleData[][], isValidWord: (w: string) => boolean): boolean {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const color = grid[r][c].color;
      let end = c;
      while (end < COLS && grid[r][end].color === color) end++;
      const run = end - c;
      if (run >= MIN_WORD_LENGTH) {
        for (let len = MIN_WORD_LENGTH; len <= Math.min(run, MAX_WORD_LENGTH); len++) {
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
  // Vertical
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const color = grid[r][c].color;
      let end = r;
      while (end < ROWS && grid[end][c].color === color) end++;
      const run = end - r;
      if (run >= MIN_WORD_LENGTH) {
        for (let len = MIN_WORD_LENGTH; len <= Math.min(run, MAX_WORD_LENGTH); len++) {
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

export function useGameState(isValidWord: (word: string) => boolean, mode: GameMode = 'classic') {
  const [grid, setGrid] = useState<BubbleData[][]>(() => createCleanGrid(isValidWord));
  const [selectedBubble, setSelectedBubble] = useState<Position | null>(null);
  const [movesLeft, setMovesLeft] = useState(MAX_MOVES);
  const [score, setScore] = useState(0);
  const [usedWords, setUsedWords] = useState<UsedWord[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [poppingCells, setPoppingCells] = useState<Set<string>>(new Set());
  const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const usedWordsRef = useRef(usedWords);
  usedWordsRef.current = usedWords;

  const isAdjacent = (a: Position, b: Position): boolean => {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  };

  const findWords = useCallback((currentGrid: BubbleData[][]): FoundWord[] => {
    const found: FoundWord[] = [];
    const usedWordSet = new Set(usedWordsRef.current.map((w) => w.word.toLowerCase()));

    // Horizontal scan
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        const color = currentGrid[r][c].color;
        let end = c;
        while (end < COLS && currentGrid[r][end].color === color) end++;
        const runLength = end - c;
        if (runLength >= MIN_WORD_LENGTH) {
          for (let len = MIN_WORD_LENGTH; len <= Math.min(runLength, MAX_WORD_LENGTH); len++) {
            for (let start = c; start + len <= end; start++) {
              const positions: Position[] = [];
              let word = '';
              for (let i = start; i < start + len; i++) {
                positions.push({ row: r, col: i });
                word += currentGrid[r][i].letter;
              }
              const wordLower = word.toLowerCase();
              if (!usedWordSet.has(wordLower) && isValidWord(wordLower)) {
                const wordScore = positions.reduce((s, p) => s + currentGrid[p.row][p.col].value, 0);
                const bonus = len >= 5 ? (len - 4) * 5 : 0;
                found.push({ word: word.toUpperCase(), positions, score: wordScore + bonus });
              }
            }
          }
        }
        c = end;
      }
    }

    // Vertical scan
    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const color = currentGrid[r][c].color;
        let end = r;
        while (end < ROWS && currentGrid[end][c].color === color) end++;
        const runLength = end - r;
        if (runLength >= MIN_WORD_LENGTH) {
          for (let len = MIN_WORD_LENGTH; len <= Math.min(runLength, MAX_WORD_LENGTH); len++) {
            for (let start = r; start + len <= end; start++) {
              const positions: Position[] = [];
              let word = '';
              for (let i = start; i < start + len; i++) {
                positions.push({ row: i, col: c });
                word += currentGrid[i][c].letter;
              }
              const wordLower = word.toLowerCase();
              if (!usedWordSet.has(wordLower) && isValidWord(wordLower)) {
                const wordScore = positions.reduce((s, p) => s + currentGrid[p.row][p.col].value, 0);
                const bonus = len >= 5 ? (len - 4) * 5 : 0;
                found.push({ word: word.toUpperCase(), positions, score: wordScore + bonus });
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
  }, [isValidWord]);

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

    // Surge mode: bonus moves
    if (mode === 'surge') {
      const wordLen = word.positions.length;
      if (word.score >= 40 || wordLen >= 10) {
        setMovesLeft((prev) => prev + 25);
      } else if (word.score >= 10 || wordLen >= 8) {
        setMovesLeft((prev) => prev + 10);
      }
    }

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
        for (let i = 0; i < poppedRows.size; i++) newBubbles.push(createRandomBubble());
        const fullColumn = [...newBubbles, ...remaining];
        for (let r = 0; r < ROWS; r++) newGrid[r][c] = fullColumn[r];
      }

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
  }, [findWords, mode]);

  const checkForWords = useCallback((currentGrid: BubbleData[][]) => {
    const foundWords = findWords(currentGrid);
    if (foundWords.length > 0) {
      setIsProcessing(true);
      popAndCascade(currentGrid, foundWords);
    }
  }, [findWords, popAndCascade]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    if (gameOver || isProcessing) return;

    if (!selectedBubble) {
      setSelectedBubble({ row, col });
    } else {
      const pos = { row, col };
      if (selectedBubble.row === row && selectedBubble.col === col) {
        setSelectedBubble(null);
      } else if (isAdjacent(selectedBubble, pos)) {
        const newGrid = grid.map((r) => [...r]);
        const temp = newGrid[selectedBubble.row][selectedBubble.col];
        newGrid[selectedBubble.row][selectedBubble.col] = newGrid[row][col];
        newGrid[row][col] = temp;
        setGrid(newGrid);
        setSelectedBubble(null);

        setMovesLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) setGameOver(true);
          return next;
        });

        setTimeout(() => checkForWords(newGrid), 200);
      } else {
        setSelectedBubble(pos);
      }
    }
  }, [gameOver, isProcessing, selectedBubble, grid, checkForWords]);

  // Touch swipe: swap by dragging one bubble toward an adjacent one
  const handleSwipe = useCallback((fromRow: number, fromCol: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || isProcessing) return;
    const toRow = fromRow + (direction === 'down' ? 1 : direction === 'up' ? -1 : 0);
    const toCol = fromCol + (direction === 'right' ? 1 : direction === 'left' ? -1 : 0);
    if (toRow < 0 || toRow >= ROWS || toCol < 0 || toCol >= COLS) return;

    const newGrid = grid.map((r) => [...r]);
    const temp = newGrid[fromRow][fromCol];
    newGrid[fromRow][fromCol] = newGrid[toRow][toCol];
    newGrid[toRow][toCol] = temp;
    setGrid(newGrid);
    setSelectedBubble(null);

    setMovesLeft((prev) => {
      const next = prev - 1;
      if (next <= 0) setGameOver(true);
      return next;
    });

    setTimeout(() => checkForWords(newGrid), 200);
  }, [gameOver, isProcessing, grid, checkForWords]);

  const resetGame = useCallback(() => {
    const newGrid = createCleanGrid(isValidWord);
    setGrid(newGrid);
    setSelectedBubble(null);
    setMovesLeft(MAX_MOVES);
    setScore(0);
    setUsedWords([]);
    setGameOver(false);
    setPoppingCells(new Set());
    setLastFoundWord(null);
    setIsProcessing(false);
  }, [isValidWord]);

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
  };
}
