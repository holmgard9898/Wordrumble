import { describe, expect, it } from 'vitest';
import type { BubbleData, Position } from '@/data/gameConstants';
import { COLS, ROWS } from '@/data/gameConstants';
import {
  ensureGridHasNoWords,
  gridHasWords,
  repairFormability,
  wordIsFormable,
} from '@/utils/gridGeneration';

function bubble(letter: string, color: BubbleData['color'], id: string): BubbleData {
  return { id, letter, color, value: 1 };
}

describe('gridGeneration', () => {
  it('removes ready-made horizontal words from a start grid', () => {
    const grid: BubbleData[][] = Array.from({ length: ROWS }, (_, row) =>
      Array.from({ length: COLS }, (_, col) => bubble('Q', 'blue', `${row}-${col}`)),
    );

    grid[0][0] = bubble('S', 'red', 's');
    grid[0][1] = bubble('U', 'red', 'u');
    grid[0][2] = bubble('N', 'red', 'n');

    expect(gridHasWords(grid, (word) => word === 'sun', 3)).toBe(true);

    const replacements = ['X', 'Y', 'Z'];
    let replacementIndex = 0;

    const cleanedGrid = ensureGridHasNoWords(grid, {
      isValidWord: (word) => word === 'sun',
      minWordLength: 3,
      createBubble: () => bubble(replacements[replacementIndex++ % replacements.length], 'green', `r-${replacementIndex}`),
      maxPasses: 20,
    });

    expect(gridHasWords(cleanedGrid, (word) => word === 'sun', 3)).toBe(false);
  });

  it('repairFormability restores a word that lost a letter in every color', () => {
    // All-Q yellow grid with no S/K/E/P anywhere.
    const grid: BubbleData[][] = Array.from({ length: ROWS }, (_, row) =>
      Array.from({ length: COLS }, (_, col) => bubble('Q', 'yellow', `${row}-${col}`)),
    );

    expect(wordIsFormable(grid, 'SKEPP')).toBe(false);

    // Pretend the top row was just refilled.
    const newCells: Position[] = Array.from({ length: COLS }, (_, c) => ({ row: 0, col: c }));

    repairFormability(grid, ['SKEPP'], newCells, {
      values: { S: 1, K: 5, E: 1, P: 3, Q: 10 },
    });

    expect(wordIsFormable(grid, 'SKEPP')).toBe(true);
  });

  it('repairFormability is a no-op when the word is already formable', () => {
    const grid: BubbleData[][] = Array.from({ length: ROWS }, (_, row) =>
      Array.from({ length: COLS }, (_, col) => bubble('Q', 'blue', `${row}-${col}`)),
    );
    grid[0][0] = bubble('S', 'red', 's');
    grid[0][1] = bubble('K', 'red', 'k');
    grid[0][2] = bubble('E', 'red', 'e');
    grid[1][0] = bubble('P', 'red', 'p1');
    grid[1][1] = bubble('P', 'red', 'p2');

    const before = grid.map(row => row.map(b => b.id));
    repairFormability(grid, ['SKEPP'], [{ row: 5, col: 5 }], { values: { S: 1, K: 5, E: 1, P: 3, Q: 10 } });
    const after = grid.map(row => row.map(b => b.id));
    expect(after).toEqual(before);
  });
});
