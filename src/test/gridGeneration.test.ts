import { describe, expect, it } from 'vitest';
import type { BubbleData } from '@/data/gameConstants';
import { ensureGridHasNoWords, gridHasWords } from '@/utils/gridGeneration';

function bubble(letter: string, color: BubbleData['color'], id: string): BubbleData {
  return { id, letter, color, value: 1 };
}

describe('gridGeneration', () => {
  it('removes ready-made horizontal words from a start grid', () => {
    const grid: BubbleData[][] = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) => bubble('Q', 'blue', `${row}-${col}`)),
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
});
