import { useState, useCallback } from 'react';
import {
  BubbleData, Position, ROWS, COLS, MAX_MOVES, MIN_WORD_LENGTH,
  createGrid, createRandomBubble,
} from '@/data/gameConstants';

interface UsedWord {
  word: string;
  score: number;
}

export function useGameState(isValidWord: (word: string) => boolean) {
  const [grid, setGrid] = useState<BubbleData[][]>(createGrid);
  const [selectedBubble, setSelectedBubble] = useState<Position | null>(null);
  const [selectedWord, setSelectedWord] = useState<Position[]>([]);
  const [movesLeft, setMovesLeft] = useState(MAX_MOVES);
  const [score, setScore] = useState(0);
  const [usedWords, setUsedWords] = useState<UsedWord[]>([]);
  const [mode, setMode] = useState<'swap' | 'select'>('swap');
  const [gameOver, setGameOver] = useState(false);
  const [poppingCells, setPoppingCells] = useState<Set<string>>(new Set());

  const isAdjacent = (a: Position, b: Position): boolean => {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  };

  const swapBubbles = useCallback((a: Position, b: Position) => {
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      const temp = newGrid[a.row][a.col];
      newGrid[a.row][a.col] = newGrid[b.row][b.col];
      newGrid[b.row][b.col] = temp;
      return newGrid;
    });
    setMovesLeft((prev) => {
      const next = prev - 1;
      if (next <= 0) setGameOver(true);
      return next;
    });
  }, []);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    if (gameOver) return;

    if (mode === 'swap') {
      if (!selectedBubble) {
        setSelectedBubble({ row, col });
      } else {
        const pos = { row, col };
        if (selectedBubble.row === row && selectedBubble.col === col) {
          setSelectedBubble(null);
        } else if (isAdjacent(selectedBubble, pos)) {
          swapBubbles(selectedBubble, pos);
          setSelectedBubble(null);
        } else {
          setSelectedBubble(pos);
        }
      }
    } else {
      // Select mode
      const alreadySelected = selectedWord.findIndex((p) => p.row === row && p.col === col);
      if (alreadySelected !== -1) {
        // Deselect from this point onward
        setSelectedWord((prev) => prev.slice(0, alreadySelected));
        return;
      }

      if (selectedWord.length === 0) {
        setSelectedWord([{ row, col }]);
        return;
      }

      const last = selectedWord[selectedWord.length - 1];
      const bubbleColor = grid[selectedWord[0].row][selectedWord[0].col].color;
      const clickedColor = grid[row][col].color;

      if (clickedColor !== bubbleColor) return;
      if (!isAdjacent(last, { row, col })) return;

      // Must be in same row or same column as existing selection
      if (selectedWord.length >= 2) {
        const isHorizontal = selectedWord[0].row === selectedWord[1].row;
        if (isHorizontal && row !== selectedWord[0].row) return;
        if (!isHorizontal && col !== selectedWord[0].col) return;
      } else {
        // Second bubble - any adjacent is fine (sets direction)
      }

      setSelectedWord((prev) => [...prev, { row, col }]);
    }
  }, [gameOver, mode, selectedBubble, selectedWord, grid, swapBubbles]);

  const getSelectedWordString = useCallback((): string => {
    // Sort positions by natural reading order
    const sorted = [...selectedWord].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
    return sorted.map((p) => grid[p.row][p.col].letter).join('');
  }, [selectedWord, grid]);

  const submitWord = useCallback(() => {
    if (selectedWord.length < MIN_WORD_LENGTH) return;

    const word = getSelectedWordString();
    const wordLower = word.toLowerCase();

    // Check if already used
    if (usedWords.some((w) => w.word.toLowerCase() === wordLower)) {
      setSelectedWord([]);
      return;
    }

    if (!isValidWord(wordLower)) {
      setSelectedWord([]);
      return;
    }

    // Calculate score
    const wordScore = selectedWord.reduce((sum, p) => sum + grid[p.row][p.col].value, 0);
    // Bonus for longer words
    const lengthBonus = selectedWord.length >= 5 ? (selectedWord.length - 4) * 5 : 0;
    const totalScore = wordScore + lengthBonus;

    // Pop animation
    const popKeys = new Set(selectedWord.map((p) => `${p.row}-${p.col}`));
    setPoppingCells(popKeys);

    setTimeout(() => {
      setPoppingCells(new Set());

      setGrid((prev) => {
        const newGrid = prev.map((row) => [...row]);

        // Determine affected columns
        const colsAffected = new Set(selectedWord.map((p) => p.col));

        // For each affected column, remove popped bubbles and add new ones at top
        for (const c of colsAffected) {
          const poppedRows = selectedWord.filter((p) => p.col === c).map((p) => p.row);
          // Collect non-popped bubbles in this column (top to bottom)
          const remaining: BubbleData[] = [];
          for (let r = 0; r < ROWS; r++) {
            if (!poppedRows.includes(r)) {
              remaining.push(newGrid[r][c]);
            }
          }
          // Add new bubbles at top
          const newBubbles: BubbleData[] = [];
          for (let i = 0; i < poppedRows.length; i++) {
            newBubbles.push(createRandomBubble());
          }
          const fullColumn = [...newBubbles, ...remaining];
          for (let r = 0; r < ROWS; r++) {
            newGrid[r][c] = fullColumn[r];
          }
        }

        return newGrid;
      });
    }, 400);

    setScore((prev) => prev + totalScore);
    setUsedWords((prev) => [...prev, { word: word.toUpperCase(), score: totalScore }]);
    setSelectedWord([]);
  }, [selectedWord, getSelectedWordString, usedWords, isValidWord, grid]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      setSelectedBubble(null);
      setSelectedWord([]);
      return prev === 'swap' ? 'select' : 'swap';
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBubble(null);
    setSelectedWord([]);
  }, []);

  const resetGame = useCallback(() => {
    setGrid(createGrid());
    setSelectedBubble(null);
    setSelectedWord([]);
    setMovesLeft(MAX_MOVES);
    setScore(0);
    setUsedWords([]);
    setMode('swap');
    setGameOver(false);
    setPoppingCells(new Set());
  }, []);

  return {
    grid,
    selectedBubble,
    selectedWord,
    movesLeft,
    score,
    usedWords,
    mode,
    gameOver,
    poppingCells,
    handleBubbleClick,
    submitWord,
    toggleMode,
    clearSelection,
    resetGame,
    getSelectedWordString,
  };
}
