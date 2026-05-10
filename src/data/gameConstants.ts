export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

// Default English letter pool
const LETTER_POOL =
  "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUVVWWXYYZ";

export type BubbleColor = 'red' | 'green' | 'blue' | 'yellow' | 'pink';

export const BUBBLE_COLORS: BubbleColor[] = ['red', 'green', 'blue', 'yellow', 'pink'];
export const REDUCED_COLORS: BubbleColor[] = ['red', 'green', 'blue'];

export const BUBBLE_COLOR_STYLES: Record<BubbleColor, { bg: string; highlight: string; border: string; text: string }> = {
  red:    { bg: 'hsl(0, 75%, 50%)',   highlight: 'hsl(0, 80%, 75%)',   border: 'hsl(0, 70%, 35%)',   text: '#fff' },
  green:  { bg: 'hsl(140, 65%, 42%)', highlight: 'hsl(140, 70%, 65%)', border: 'hsl(140, 60%, 28%)', text: '#fff' },
  blue:   { bg: 'hsl(210, 80%, 52%)', highlight: 'hsl(210, 85%, 75%)', border: 'hsl(210, 75%, 35%)', text: '#fff' },
  yellow: { bg: 'hsl(45, 90%, 52%)',  highlight: 'hsl(45, 90%, 78%)',  border: 'hsl(45, 80%, 35%)',  text: '#fff' },
  pink:   { bg: 'hsl(330, 75%, 58%)', highlight: 'hsl(330, 80%, 78%)', border: 'hsl(330, 70%, 38%)', text: '#fff' },
};

/** Sports ball emoji per color */
export const SPORTS_BALLS: Record<BubbleColor, { emoji: string; label: string }> = {
  red:    { emoji: '⚽', label: 'football' },
  green:  { emoji: '🏑', label: 'bandy' },
  blue:   { emoji: '🏒', label: 'hockey puck' },
  yellow: { emoji: '🎾', label: 'tennis' },
  pink:   { emoji: '🏀', label: 'basketball' },
};

export const ROWS = 10;
export const COLS = 8;
export const MAX_MOVES = 50;
export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = 10;

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export type PowerupType = 'x2' | 'x3' | 'free5';

export interface BubbleData {
  id: string;
  letter: string;
  value: number;
  color: BubbleColor;
  bomb?: number;
  powerup?: PowerupType;
  /** Adventure-only obstacle: cannot be moved or formed into words.
   *  Falls when bubbles below it pop. Destroyed when it reaches the bottom row. */
  asteroid?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

let bubbleIdCounter = 0;

export function createRandomBubble(
  colors: BubbleColor[] = BUBBLE_COLORS,
  pool?: string,
  values?: Record<string, number>,
): BubbleData {
  const letterPool = pool || LETTER_POOL;
  const letterValues = values || LETTER_VALUES;
  const letter = letterPool[Math.floor(Math.random() * letterPool.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return {
    id: `bubble-${bubbleIdCounter++}`,
    letter,
    value: letterValues[letter] ?? 1,
    color,
  };
}

export function createGrid(
  colors: BubbleColor[] = BUBBLE_COLORS,
  pool?: string,
  values?: Record<string, number>,
): BubbleData[][] {
  const grid: BubbleData[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: BubbleData[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(createRandomBubble(colors, pool, values));
    }
    grid.push(row);
  }
  return grid;
}
