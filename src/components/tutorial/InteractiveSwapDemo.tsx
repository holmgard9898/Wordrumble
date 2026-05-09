import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatedHand } from './AnimatedHand';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  /** Word to spell, uppercase. */
  word: string;
  /** Called when player has placed all word letters in row 0. */
  onComplete: () => void;
}

const COLS = 4;
const ROWS = 4;
const CELL = 44; // px
const GAP = 6; // px

const WORD_COLOR = '#22C55E'; // emerald — "same color" letters
const FILLER_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#A855F7', '#06B6D4'];
const FILLER_LETTERS = ['B', 'M', 'P', 'R', 'L', 'N', 'D', 'F', 'H', 'X', 'Z'];

interface Cell {
  id: string;
  letter: string;
  color: string;
  isWord: boolean;
}

function buildInitialGrid(word: string): Cell[][] {
  const W = word.split('');
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (_, c) => ({
      id: `f-${Math.random().toString(36).slice(2, 8)}`,
      letter: FILLER_LETTERS[Math.floor(Math.random() * FILLER_LETTERS.length)],
      color: FILLER_COLORS[(c + Math.floor(Math.random() * 3)) % FILLER_COLORS.length],
      isWord: false,
    })),
  );

  const wordLen = Math.min(W.length, COLS);
  const displacedIdx = Math.min(1, wordLen - 1);

  for (let i = 0; i < wordLen; i++) {
    if (i === displacedIdx) continue;
    grid[0][i] = {
      id: `w-${i}`,
      letter: W[i],
      color: WORD_COLOR,
      isWord: true,
    };
  }

  const dRow = 3;
  const dCol = displacedIdx;
  grid[dRow][dCol] = {
    id: `w-${displacedIdx}`,
    letter: W[displacedIdx],
    color: WORD_COLOR,
    isWord: true,
  };

  if (grid[0][dCol].letter === W[displacedIdx]) {
    grid[0][dCol].letter = 'X';
  }

  return grid;
}

function isAdjacent(a: { r: number; c: number }, b: { r: number; c: number }) {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return dr + dc === 1;
}

export const InteractiveSwapDemo: React.FC<Props> = ({ word, onComplete }) => {
  const { t, lang } = useTranslation();
  const [grid, setGrid] = useState<Cell[][]>(() => buildInitialGrid(word));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  
  // Pointer Ref som ersätter touchStartRef
  const pointerStartRef = useRef<{ x: number; y: number; r: number; c: number } | null>(null);

  useEffect(() => {
    setGrid(buildInitialGrid(word));
    setSelected(null);
    setInteracted(false);
    setDone(false);
    completedRef.current = false;
  }, [word, lang]);

  const wordLen = Math.min(word.length, COLS);

  useEffect(() => {
    if (completedRef.current) return;
    let ok = true;
    for (let i = 0; i < wordLen; i++) {
      const cell = grid[0][i];
      if (!cell.isWord || cell.letter !== word[i]) { ok = false; break; }
    }
    if (ok) {
      completedRef.current = true;
      setDone(true);
      setTimeout(() => onComplete(), 600);
    }
  }, [grid, word, wordLen, onComplete]);

  const executeSwap = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    if (r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS) return;
    
    setGrid((g) => {
      const ng = g.map((row) => row.slice());
      const a = ng[r1][c1];
      const b = ng[r2][c2];
      ng[r1][c1] = b;
      ng[r2][c2] = a;
      return ng;
    });
    setInteracted(true);
  }, []);

  // NYA POINTER FUNKTIONER FÖR ATT FIXA DATOR-SUPPORT
  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, r, c };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const { r, c } = pointerStartRef.current;
    pointerStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 20;

    // KLICK-LOGIK (Räddar klick på desktop)
    if (absDx < threshold && absDy < threshold) {
      if (!selected) {
        setSelected({ r, c });
      } else if (selected.r === r && selected.c === c) {
        setSelected(null);
      } else if (isAdjacent(selected, { r, c })) {
        executeSwap(selected.r, selected.c, r, c);
        setSelected(null);
      } else {
        setSelected({ r, c });
      }
      return;
    }

    // DRAG-LOGIK (Simulerar swipe med mus/finger)
    if (absDx > absDy) {
      executeSwap(r, c, r, c + (dx > 0 ? 1 : -1));
    } else {
      executeSwap(r, c, r + (dy > 0 ? 1 : -1), c);
    }
    setSelected(null);
  };

  const displacedIdx = Math.min(1, wordLen - 1);
  const displacedPos = useMemo(() => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].isWord && grid[r][c].letter === word[displacedIdx] && !(r === 0 && c === displacedIdx)) {
          return { r, c };
        }
      }
    }
    return null;
  }, [grid, word, displacedIdx, wordLen]);

  const handFrom = displacedPos ? cellCenter(displacedPos.r, displacedPos.c) : null;
  const handTo = displacedPos ? cellCenter(Math.max(0, displacedPos.r - 1), displacedPos.c) : null;

  const boardW = COLS * CELL + (COLS - 1) * GAP;
  const boardH = ROWS * CELL + (ROWS - 1) * GAP;

  const hint = lang === 'sv'
    ? `Swipa bokstäverna så att de stavar ${word} i översta raden`
    : `Swap letters so they spell ${word} in the top row`;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-white/80 text-xs text-center px-4">{hint}</p>
      <div
        className="relative rounded-xl"
        style={{
          width: boardW + 8,
          height: boardH + 8,
          padding: 4,
          background: 'rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="relative"
          style={{
            width: boardW,
            height: boardH,
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
            gap: GAP,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isSel = selected?.r === r && selected?.c === c;
              const inTargetRow = r === 0 && c < wordLen;
              const targetGlow = inTargetRow && !cell.isWord ? 'ring-1 ring-white/40' : '';
              return (
                <button
                  key={`${r}-${c}-${cell.id}`}
                  // Uppdaterat till Pointer händelser
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  onPointerUp={handlePointerUp}
                  className={`relative rounded-full flex items-center justify-center font-bold text-white text-base select-none transition-all touch-none ${isSel ? 'ring-2 ring-yellow-300 scale-110 z-10' : ''} ${targetGlow}`}
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${cell.color}ee, ${cell.color}99)`,
                    boxShadow: isSel
                      ? `0 0 14px rgba(253,224,71,0.8), inset 0 -2px 4px rgba(0,0,0,0.2)`
                      : 'inset 0 -2px 4px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.3)',
                    touchAction: 'none' // Hindrar scroll
                  }}
                >
                  <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{cell.letter}</span>
                </button>
              );
            }),
          )}

          {handFrom && handTo && !done && (
            <AnimatedHand from={handFrom} to={handTo} paused={interacted} />
          )}
        </div>
      </div>

      {done && (
        <div
          className="text-emerald-300 font-bold text-lg animate-fade-in"
          style={{ textShadow: '0 0 10px rgba(34,197,94,0.6)' }}
        >
          {lang === 'sv' ? `Snyggt! Du stavade ${word}!` : `Nice! You spelled ${word}!`}
        </div>
      )}
    </div>
  );
};

function cellCenter(r: number, c: number) {
  return {
    x: c * (CELL + GAP) + CELL / 2,
    y: r * (CELL + GAP) + CELL / 2,
  };
}
