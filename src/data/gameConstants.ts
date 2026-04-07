export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

// Weighted letter pool (Scrabble-like distribution)
const LETTER_POOL =
  "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUVVWWXYYZ";

export type BubbleColor = 'red' | 'green' | 'blue' | 'yellow' | 'pink';

export const BUBBLE_COLORS: BubbleColor[] = ['red', 'green', 'blue', 'yellow', 'pink'];

export const BUBBLE_COLOR_STYLES: Record<BubbleColor, { bg: string; highlight: string; border: string; text: string }> = {
  red:    { bg: 'hsl(0, 75%, 50%)',   highlight: 'hsl(0, 80%, 75%)',   border: 'hsl(0, 70%, 35%)',   text: '#fff' },
  green:  { bg: 'hsl(140, 65%, 42%)', highlight: 'hsl(140, 70%, 65%)', border: 'hsl(140, 60%, 28%)', text: '#fff' },
  blue:   { bg: 'hsl(210, 80%, 52%)', highlight: 'hsl(210, 85%, 75%)', border: 'hsl(210, 75%, 35%)', text: '#fff' },
  yellow: { bg: 'hsl(45, 90%, 52%)',  highlight: 'hsl(45, 90%, 78%)',  border: 'hsl(45, 80%, 35%)',  text: '#1a1a1a' },
  pink:   { bg: 'hsl(330, 75%, 58%)', highlight: 'hsl(330, 80%, 78%)', border: 'hsl(330, 70%, 38%)', text: '#fff' },
};

export const ROWS = 10;
export const COLS = 8;
export const MAX_MOVES = 50;
export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = 10;

export interface BubbleData {
  id: string;
  letter: string;
  value: number;
  color: BubbleColor;
}

export interface Position {
  row: number;
  col: number;
}

let bubbleIdCounter = 0;

export function createRandomBubble(): BubbleData {
  const letter = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
  const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
  return {
    id: `bubble-${bubbleIdCounter++}`,
    letter,
    value: LETTER_VALUES[letter],
    color,
  };
}

export function createGrid(): BubbleData[][] {
  const grid: BubbleData[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: BubbleData[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(createRandomBubble());
    }
    grid.push(row);
  }
  return grid;
}
