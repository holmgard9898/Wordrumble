import {
  BUBBLE_COLORS,
  COLS,
  MAX_WORD_LENGTH,
  ROWS,
  createGrid,
  createRandomBubble,
  type BubbleColor,
  type BubbleData,
  type Position,
} from '@/data/gameConstants';

// ─── Word formability helpers (used by adventure levels) ─────────────────

/** Multiset of letters required to spell `word` (uppercase). */
function letterCounts(word: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const ch of word.toUpperCase()) m.set(ch, (m.get(ch) ?? 0) + 1);
  return m;
}

/** True if `grid` contains, in `color`, at least N copies of every letter in `word`. */
export function colorHasLetters(
  grid: BubbleData[][],
  word: string,
  color: BubbleColor,
): boolean {
  const need = letterCounts(word);
  const have = new Map<string, number>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const b = grid[r][c];
      if (b.color !== color) continue;
      have.set(b.letter, (have.get(b.letter) ?? 0) + 1);
    }
  }
  for (const [letter, n] of need) {
    if ((have.get(letter) ?? 0) < n) return false;
  }
  return true;
}

/** True if `word` is formable in some color on the board (counts letters with multiplicity). */
export function wordIsFormable(grid: BubbleData[][], word: string): boolean {
  for (const color of BUBBLE_COLORS) {
    if (colorHasLetters(grid, word, color)) return true;
  }
  return false;
}

/**
 * Return the color that is *closest* to being able to form `word`
 * (fewest missing letters), along with which letters/how many are missing.
 * Restricts to `allowedColors` if provided.
 */
export function findBestColorForWord(
  grid: BubbleData[][],
  word: string,
  allowedColors?: BubbleColor[],
): { color: BubbleColor; missing: Map<string, number>; missingTotal: number } | null {
  const need = letterCounts(word);
  const colors = allowedColors ?? BUBBLE_COLORS;
  let best: { color: BubbleColor; missing: Map<string, number>; missingTotal: number } | null = null;
  for (const color of colors) {
    const have = new Map<string, number>();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = grid[r][c];
        if (b.color !== color) continue;
        have.set(b.letter, (have.get(b.letter) ?? 0) + 1);
      }
    }
    const missing = new Map<string, number>();
    let total = 0;
    for (const [letter, n] of need) {
      const deficit = Math.max(0, n - (have.get(letter) ?? 0));
      if (deficit > 0) {
        missing.set(letter, deficit);
        total += deficit;
      }
    }
    if (!best || total < best.missingTotal) {
      best = { color, missing, missingTotal: total };
    }
  }
  return best;
}

interface RepairOptions {
  values: Record<string, number>;
  allowedColors?: BubbleColor[];
  /** Override for ID generator (mostly for tests). */
  newBubbleId?: () => string;
}

let repairBubbleCounter = 0;

/**
 * Mutates `grid` (returns the same reference) so that every word in
 * `requiredWords` is formable in at least one color. Prefers to overwrite
 * bubbles in `newCells` first; falls back to any non-special bubble in the
 * grid as a last resort.
 *
 * Skips words that are already formable.
 */
export function repairFormability(
  grid: BubbleData[][],
  requiredWords: string[],
  newCells: Position[],
  options: RepairOptions,
): BubbleData[][] {
  const { values, allowedColors, newBubbleId } = options;
  const colors = allowedColors ?? BUBBLE_COLORS;

  // Working copy of `newCells` we can pop from. Shuffle for variety.
  const pool: Position[] = [...newCells].sort(() => Math.random() - 0.5);

  const makeBubble = (letter: string, color: BubbleColor): BubbleData => ({
    id: (newBubbleId ?? (() => `repair-${repairBubbleCounter++}`))(),
    letter: letter.toUpperCase(),
    value: values[letter.toUpperCase()] ?? 1,
    color,
  });

  const isOverwritable = (b: BubbleData) => b.bomb === undefined && !b.powerup;

  for (const rawWord of requiredWords) {
    const word = rawWord.toUpperCase();
    if (wordIsFormable(grid, word)) continue;

    // Try a few placements until the word is formable or we exhaust options.
    let safety = 50;
    while (!wordIsFormable(grid, word) && safety-- > 0) {
      const best = findBestColorForWord(grid, word, colors);
      if (!best || best.missingTotal === 0) break;

      // Pick a missing letter.
      const missingLetters = Array.from(best.missing.entries()).flatMap(
        ([letter, count]) => Array(count).fill(letter) as string[],
      );
      const letter = missingLetters[Math.floor(Math.random() * missingLetters.length)];

      // Find a target cell — prefer fresh `pool`, then any overwritable cell.
      let target: Position | null = null;
      while (pool.length > 0) {
        const candidate = pool.pop()!;
        if (isOverwritable(grid[candidate.row][candidate.col])) {
          target = candidate;
          break;
        }
      }
      if (!target) {
        // Fallback: scan the whole grid for any overwritable cell.
        const fallback: Position[] = [];
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (isOverwritable(grid[r][c])) fallback.push({ row: r, col: c });
          }
        }
        if (fallback.length === 0) break;
        target = fallback[Math.floor(Math.random() * fallback.length)];
      }

      grid[target.row][target.col] = makeBubble(letter, best.color);
    }
  }

  return grid;
}


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
