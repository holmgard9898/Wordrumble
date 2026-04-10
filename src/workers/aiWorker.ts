// AI Worker — runs simulateAIRound off the main thread

type BubbleColor = 'red' | 'green' | 'blue' | 'yellow' | 'pink';

interface BubbleData {
  id: string;
  letter: string;
  value: number;
  color: BubbleColor;
  bomb?: number;
}

interface Position {
  row: number;
  col: number;
}

interface AIMove {
  from: Position;
  to: Position;
}

type GameMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

interface AIRoundResult {
  score: number;
  words: { word: string; score: number }[];
  movesUsed: number;
  bestWord: string | null;
  bestWordScore: number;
  finalGrid: BubbleData[][];
  usedWordsList: string[];
}

const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

const LETTER_POOL =
  "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUVVWWXYYZ";

const BUBBLE_COLORS: BubbleColor[] = ['red', 'green', 'blue', 'yellow', 'pink'];
const REDUCED_COLORS: BubbleColor[] = ['red', 'green', 'blue'];

const ROWS = 10;
const COLS = 8;
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 10;

let bubbleIdCounter = 100000;

function createRandomBubble(colors: BubbleColor[]): BubbleData {
  const letter = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return {
    id: `wb-${bubbleIdCounter++}`,
    letter,
    value: LETTER_VALUES[letter] ?? 1,
    color,
  };
}

function getMinWordLen(mode: GameMode) {
  return mode === 'fiveplus' ? 5 : MIN_WORD_LENGTH;
}

function findWordsInGrid(
  grid: BubbleData[][],
  validWords: Set<string>,
  usedWords: Set<string>,
  minLen: number,
): { word: string; positions: Position[]; len: number }[] {
  const found: { word: string; positions: Position[]; len: number }[] = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const color = grid[r][c].color;
      let end = c;
      while (end < COLS && grid[r][end].color === color) end++;
      const run = end - c;
      if (run >= minLen) {
        for (let len = Math.min(run, MAX_WORD_LENGTH); len >= minLen; len--) {
          for (let s = c; s + len <= end; s++) {
            let word = '';
            const positions: Position[] = [];
            for (let i = s; i < s + len; i++) {
              word += grid[r][i].letter;
              positions.push({ row: r, col: i });
            }
            const wl = word.toLowerCase();
            if (!usedWords.has(wl) && validWords.has(wl)) {
              found.push({ word: word.toUpperCase(), positions, len });
            }
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
        for (let len = Math.min(run, MAX_WORD_LENGTH); len >= minLen; len--) {
          for (let s = r; s + len <= end; s++) {
            let word = '';
            const positions: Position[] = [];
            for (let i = s; i < s + len; i++) {
              word += grid[i][c].letter;
              positions.push({ row: i, col: c });
            }
            const wl = word.toLowerCase();
            if (!usedWords.has(wl) && validWords.has(wl)) {
              found.push({ word: word.toUpperCase(), positions, len });
            }
          }
        }
      }
      r = end;
    }
  }

  found.sort((a, b) => b.len - a.len);
  return found;
}

function calcScore(positions: Position[], grid: BubbleData[][], mode: GameMode): number {
  const len = positions.length;
  const lp = positions.reduce((s, p) => s + grid[p.row][p.col].value, 0);
  if (mode === 'surge') return lp;
  if (len <= 3) return lp;
  if (len === 4) return lp + 2;
  if (len === 5) return lp + 4;
  if (len === 6) return lp + 6;
  if (len === 7) return lp + 8;
  if (len === 8) return lp + 10;
  if (len === 9) return lp * 2;
  return lp * 3;
}

function findBestSwap(
  grid: BubbleData[][],
  validWords: Set<string>,
  usedWords: Set<string>,
  mode: GameMode,
): AIMove | null {
  const minLen = getMinWordLen(mode);
  let bestMove: AIMove | null = null;
  let bestScore = -1;

  const dirs: [number, number][] = [[0, 1], [1, 0]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= ROWS || nc >= COLS) continue;
        const simGrid = grid.map(row => [...row]);
        const temp = simGrid[r][c];
        simGrid[r][c] = simGrid[nr][nc];
        simGrid[nr][nc] = temp;
        const words = findWordsInGrid(simGrid, validWords, usedWords, minLen);
        if (words.length > 0) {
          const score = calcScore(words[0].positions, simGrid, mode);
          if (score > bestScore) {
            bestScore = score;
            bestMove = { from: { row: r, col: c }, to: { row: nr, col: nc } };
            // Early termination: if we found a long word, good enough
            if (words[0].len >= 7) return bestMove;
          }
        }
      }
    }
  }
  return bestMove;
}

function simulateAIRound(
  startGrid: BubbleData[][],
  validWords: Set<string>,
  mode: GameMode,
  totalMoves: number,
  sharedUsedWords: string[],
  difficulty: 'easy' | 'medium' | 'hard',
): AIRoundResult {
  const colors = mode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;
  const minLen = getMinWordLen(mode);
  let simGrid = startGrid.map(row => row.map(b => ({ ...b })));
  const usedWords = new Set(sharedUsedWords.map(w => w.toLowerCase()));
  const foundWords: { word: string; score: number }[] = [];
  let totalScore = 0;
  let movesUsed = 0;
  let maxMoves = totalMoves;

  const findChance = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.65 : 0.9;

  while (movesUsed < maxMoves) {
    const swap = Math.random() < findChance
      ? findBestSwap(simGrid, validWords, usedWords, mode)
      : null;

    if (swap) {
      const temp = simGrid[swap.from.row][swap.from.col];
      simGrid[swap.from.row][swap.from.col] = simGrid[swap.to.row][swap.to.col];
      simGrid[swap.to.row][swap.to.col] = temp;
    } else {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      const d: [number, number][] = [[0,1],[0,-1],[1,0],[-1,0]];
      const valid = d.filter(([dr,dc]) => r+dr>=0&&r+dr<ROWS&&c+dc>=0&&c+dc<COLS);
      const [dr,dc] = valid[Math.floor(Math.random()*valid.length)];
      const temp = simGrid[r][c];
      simGrid[r][c] = simGrid[r+dr][c+dc];
      simGrid[r+dr][c+dc] = temp;
    }
    movesUsed++;

    // Cascade
    let cascading = true;
    while (cascading) {
      const words = findWordsInGrid(simGrid, validWords, usedWords, minLen);
      if (words.length === 0) { cascading = false; break; }
      const word = words[0];
      const score = calcScore(word.positions, simGrid, mode);
      totalScore += score;
      foundWords.push({ word: word.word, score });
      usedWords.add(word.word.toLowerCase());

      if (mode === 'surge') {
        const wl = word.positions.length;
        if (wl >= 10) maxMoves += 50;
        else if (wl >= 7) maxMoves += 25;
        else if (wl >= 5) maxMoves += 10;
        if (score >= 15) maxMoves += 25;
        else if (score >= 10) maxMoves += 10;
      }

      const colsAffected = new Set(word.positions.map(p => p.col));
      for (const col of colsAffected) {
        const poppedRows = new Set(word.positions.filter(p => p.col === col).map(p => p.row));
        const remaining: BubbleData[] = [];
        for (let r2 = 0; r2 < ROWS; r2++) {
          if (!poppedRows.has(r2)) remaining.push(simGrid[r2][col]);
        }
        const newBubbles: BubbleData[] = [];
        for (let i = 0; i < poppedRows.size; i++) newBubbles.push(createRandomBubble(colors));
        const fullCol = [...newBubbles, ...remaining];
        for (let r2 = 0; r2 < ROWS; r2++) simGrid[r2][col] = fullCol[r2];
      }
    }
  }

  const bestEntry = foundWords.length > 0
    ? foundWords.reduce((a, b) => a.score > b.score ? a : b)
    : null;

  const finalScore = mode === 'oneword' && bestEntry ? bestEntry.score : totalScore;

  return {
    score: finalScore,
    words: foundWords,
    movesUsed,
    bestWord: bestEntry?.word ?? null,
    bestWordScore: bestEntry?.score ?? 0,
    finalGrid: simGrid,
    usedWordsList: Array.from(usedWords),
  };
}

// Worker message handler
self.onmessage = (e: MessageEvent) => {
  const { grid, validWordsList, mode, totalMoves, sharedUsedWords, difficulty } = e.data;
  const validWords = new Set<string>(validWordsList);
  const result = simulateAIRound(grid, validWords, mode, totalMoves, sharedUsedWords, difficulty);
  self.postMessage(result);
};
