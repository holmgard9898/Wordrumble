import {
  COLS,
  MAX_WORD_LENGTH,
  ROWS,
  createGrid,
  createRandomBubble,
  type BubbleColor,
  type BubbleData,
  type Position,
} from '@/data/gameConstants';

interface GridWordMatch {
  positions: Position[];
}

interface GridGenerationOptions {
  isValidWord: (word: string) => boolean;
  minWordLength: number;
  colors?: BubbleColor[];
  pool?: string;
  values?: Record<string, number>;
  maxPasses?: number;
}

interface EnsureGridHasNoWordsOptions extends GridGenerationOptions {
  createBubble?: () => BubbleData;
}

function findFirstWord(
  grid: BubbleData[][],
  isValidWord: (word: string) => boolean,
  minWordLength: number,
): GridWordMatch | null {
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const color = grid[r][c].color;
      let end = c;
      while (end < COLS && grid[r][end].color === color) end++;
      const runLength = end - c;

      if (runLength >= minWordLength) {
        for (let len = minWordLength; len <= Math.min(runLength, MAX_WORD_LENGTH); len++) {
          for (let start = c; start + len <= end; start++) {
            const positions: Position[] = [];
            let word = '';

            for (let i = start; i < start + len; i++) {
              positions.push({ row: r, col: i });
              word += grid[r][i].letter;
            }

            if (isValidWord(word.toLowerCase())) {
              return { positions };
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
      const runLength = end - r;

      if (runLength >= minWordLength) {
        for (let len = minWordLength; len <= Math.min(runLength, MAX_WORD_LENGTH); len++) {
          for (let start = r; start + len <= end; start++) {
            const positions: Position[] = [];
            let word = '';

            for (let i = start; i < start + len; i++) {
              positions.push({ row: i, col: c });
              word += grid[i][c].letter;
            }

            if (isValidWord(word.toLowerCase())) {
              return { positions };
            }
          }
        }
      }

      r = end;
    }
  }

  return null;
}

export function gridHasWords(
  grid: BubbleData[][],
  isValidWord: (word: string) => boolean,
  minWordLength: number,
): boolean {
  return findFirstWord(grid, isValidWord, minWordLength) !== null;
}

export function ensureGridHasNoWords(
  grid: BubbleData[][],
  options: EnsureGridHasNoWordsOptions,
): BubbleData[][] {
  const {
    isValidWord,
    minWordLength,
    colors,
    pool,
    values,
    maxPasses = 250,
    createBubble,
  } = options;

  const nextGrid = grid.map((row) => row.map((bubble) => ({ ...bubble })));
  const makeBubble = createBubble ?? (() => createRandomBubble(colors, pool, values));

  for (let pass = 0; pass < maxPasses; pass++) {
    const match = findFirstWord(nextGrid, isValidWord, minWordLength);
    if (!match) return nextGrid;

    for (const position of match.positions) {
      nextGrid[position.row][position.col] = makeBubble();
    }
  }

  return nextGrid;
}

export function createWordlessGrid(options: GridGenerationOptions): BubbleData[][] {
  const { colors, pool, values } = options;
  const grid = createGrid(colors, pool, values);
  return ensureGridHasNoWords(grid, options);
}
