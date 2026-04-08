import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MAX_MOVES, MIN_WORD_LENGTH, MAX_WORD_LENGTH,
  createGrid, createRandomBubble, BUBBLE_COLORS, REDUCED_COLORS, VOWELS,
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

function getColorsForMode(mode: GameMode) {
  return mode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
}

function getMinWordLength(mode: GameMode) {
  return mode === 'fiveplus' ? 5 : MIN_WORD_LENGTH;
}

function getMaxMoves(mode: GameMode) {
  if (mode === 'bomb') return Infinity;
  if (mode === 'fiveplus') return 100;
  return MAX_MOVES;
}

// Ensure no valid words exist on the initial grid
function createCleanGrid(isValidWord: (w: string) => boolean, mode: GameMode): BubbleData[][] {
  const colors = getColorsForMode(mode);
  const minLen = getMinWordLength(mode);
  let attempts = 0;
  while (attempts < 50) {
    const grid = createGrid(colors);
    if (!gridHasWords(grid, isValidWord, minLen)) return grid;
    attempts++;
  }
  return createGrid(colors);
}

function gridHasWords(grid: BubbleData[][], isValidWord: (w: string) => boolean, minLen: number): boolean {
  // Horizontal
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
  // Vertical
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

// Calculate score for a word based on mode
function calcWordScore(positions: Position[], grid: BubbleData[][], mode: GameMode): number {
  const len = positions.length;
  const letterPoints = positions.reduce((s, p) => s + grid[p.row][p.col].value, 0);

  if (mode === 'classic' || mode === 'fiveplus') {
    // Classic/fiveplus: length-based bonus
    if (len <= 3) return letterPoints;
    if (len === 4) return letterPoints + 2;
    if (len === 5) return letterPoints + 4;
    if (len === 6) return letterPoints + 6;
    if (len === 7) return letterPoints + 8;
    if (len === 8) return letterPoints + 10;
    if (len === 9) return letterPoints * 2;
    if (len >= 10) return letterPoints * 3;
  }

  // Surge and bomb: just letter points (no length bonus)
  return letterPoints;
}

// Add bombs to grid for bomb mode
function addBombsToGrid(grid: BubbleData[][], count: number): void {
  const vowelPositions: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (VOWELS.has(grid[r][c].letter) && !grid[r][c].bomb) {
        vowelPositions.push({ row: r, col: c });
      }
    }
  }
  // Shuffle and pick
  for (let i = vowelPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vowelPositions[i], vowelPositions[j]] = [vowelPositions[j], vowelPositions[i]];
  }
  const toAdd = Math.min(count, vowelPositions.length);
  for (let i = 0; i < toAdd; i++) {
    const p = vowelPositions[i];
    const timer = 10 + Math.floor(Math.random() * 11); // 10-20
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
  // Check for explosions
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newGrid[r][c].bomb !== undefined && newGrid[r][c].bomb! <= 0) {
        return { newGrid, exploded: true };
      }
    }
  }
  return { newGrid, exploded: false };
}

export function useGameState(isValidWord: (word: string) => boolean, mode: GameMode = 'classic') {
  const [grid, setGrid] = useState<BubbleData[][]>(() => {
    const g = createCleanGrid(isValidWord, mode);
    if (mode === 'bomb') {
      const startBombs = 1 + Math.floor(Math.random() * 3); // 1-3
      addBombsToGrid(g, startBombs);
    }
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

  const usedWordsRef = useRef(usedWords);
  usedWordsRef.current = usedWords;

  const minWordLen = getMinWordLength(mode);

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
        if (runLength >= minWordLen) {
          // Scan from longest to shortest
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

    // Vertical scan
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
    // Sort by length desc, then score desc — longest word wins
    found.sort((a, b) => {
      if (b.positions.length !== a.positions.length) return b.positions.length - a.positions.length;
      return b.score - a.score;
    });
    return [found[0]];
  }, [isValidWord, minWordLen, mode]);

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

    // Surge mode: bonus moves based on score and length
    if (mode === 'surge') {
      const wordLen = word.positions.length;
      // Length bonuses (checked first, highest wins)
      if (wordLen >= 10) {
        setMovesLeft((prev) => prev + 50);
      } else if (wordLen >= 7) {
        setMovesLeft((prev) => prev + 25);
      } else if (wordLen >= 5) {
        setMovesLeft((prev) => prev + 10);
      }
      // Score bonuses (additive with length bonuses)
      if (word.score >= 15) {
        setMovesLeft((prev) => prev + 25);
      } else if (word.score >= 10) {
        setMovesLeft((prev) => prev + 10);
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
        for (let i = 0; i < poppedRows.size; i++) newBubbles.push(createRandomBubble(colors));
        const fullColumn = [...newBubbles, ...remaining];
        for (let r = 0; r < ROWS; r++) newGrid[r][c] = fullColumn[r];
      }

      // Bomb mode: maybe spawn new bombs on new bubbles
      if (mode === 'bomb') {
        const current = countBombs(newGrid);
        if (current < 5 && Math.random() < 0.3) {
          addBombsToGrid(newGrid, 1);
        }
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

  const performSwap = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const newGrid = grid.map((r) => [...r]);
    const temp = newGrid[fromRow][fromCol];
    newGrid[fromRow][fromCol] = newGrid[toRow][toCol];
    newGrid[toRow][toCol] = temp;

    // Bomb mode: decrement bomb timers
    if (mode === 'bomb') {
      const { newGrid: bombGrid, exploded } = decrementBombs(newGrid);
      if (exploded) {
        setGrid(bombGrid);
        setGameOver(true);
        return;
      }
      setGrid(bombGrid);
      setSelectedBubble(null);
      if (mode !== 'bomb') {
        setMovesLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) setGameOver(true);
          return next;
        });
      }
      setTimeout(() => checkForWords(bombGrid), 200);
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
  }, [grid, checkForWords, mode]);

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
    const newGrid = createCleanGrid(isValidWord, mode);
    if (mode === 'bomb') {
      const startBombs = 1 + Math.floor(Math.random() * 3);
      addBombsToGrid(newGrid, startBombs);
    }
    setGrid(newGrid);
    setSelectedBubble(null);
    setMovesLeft(getMaxMoves(mode));
    setScore(0);
    setUsedWords([]);
    setGameOver(false);
    setPoppingCells(new Set());
    setLastFoundWord(null);
    setIsProcessing(false);
  }, [isValidWord, mode]);

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
