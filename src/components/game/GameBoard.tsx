import { BubbleData, Position } from '@/data/gameConstants';
import { Bubble } from './Bubble';
import { BonusMovePopup } from './BonusMovePopup';
import type { BonusPopupData } from './BonusMovePopup';
import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface GameBoardProps {
  grid: BubbleData[][];
  selectedBubble: Position | null;
  poppingCells: Set<string>;
  onBubbleClick: (row: number, col: number) => void;
  onSwipe?: (row: number, col: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  bonusPopups?: BonusPopupData[];
  onBonusPopupDone?: (id: string) => void;
  /** Visual state for the satellite (Adventure 2-3). */
  laserCharge?: { ready: boolean; current: number; max: number; arming: boolean };
}

export interface GameBoardHandle {
  /** Returns the absolute viewport rect of cell (row, col), or null if missing. */
  getCellRect: (row: number, col: number) => DOMRect | null;
}

export const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(function GameBoard(
  { grid, selectedBubble, poppingCells, onBubbleClick, onSwipe, bonusPopups, onBonusPopupDone },
  ref,
) {
  const pointerStartRef = useRef<{ x: number; y: number; row: number; col: number } | null>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { settings } = useSettings();
  const isRubik = settings.tileStyle === 'rubik';

  useImperativeHandle(ref, () => ({
    getCellRect: (row, col) => {
      const el = cellRefs.current.get(`${row}-${col}`);
      return el ? el.getBoundingClientRect() : null;
    },
  }));

  const handlePointerDown = useCallback((row: number, col: number, e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, row, col };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const { row, col } = pointerStartRef.current;
    pointerStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 25;

    if (absDx < threshold && absDy < threshold) {
      onBubbleClick(row, col);
      return;
    }

    if (onSwipe) {
      if (absDx > absDy) {
        onSwipe(row, col, dx > 0 ? 'right' : 'left');
      } else {
        onSwipe(row, col, dy > 0 ? 'down' : 'up');
      }
    }
  }, [onSwipe, onBubbleClick]);

  return (
    <div
      className="relative rounded-lg md:rounded-2xl w-full border-2 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all"
      style={{
        background: 'rgba(0,0,0,0.25)',
        padding: isRubik ? '2px' : 'clamp(2px, 0.5vw, 12px)',
        touchAction: 'none'
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${grid[0]?.length ?? 8}, 1fr)`,
          gap: isRubik ? '0px' : 'clamp(1px, 0.4vw, 4px)',
        }}
      >
        {grid.map((row, r) =>
          row.map((bubble, c) => {
            const isSelected = selectedBubble?.row === r && selectedBubble?.col === c;
            const isPopping = poppingCells.has(`${r}-${c}`);
            return (
              <div
                key={bubble.id}
                ref={(el) => {
                  const k = `${r}-${c}`;
                  if (el) cellRefs.current.set(k, el);
                  else cellRefs.current.delete(k);
                }}
                onPointerDown={(e) => handlePointerDown(r, c, e)}
                onPointerUp={handlePointerUp}
                style={{ touchAction: 'none' }}
              >
                <Bubble
                  bubble={bubble}
                  isSelected={isSelected}
                  isPopping={isPopping}
                />
              </div>
            );
          })
        )}
      </div>

      {bonusPopups && onBonusPopupDone && bonusPopups.map((popup) => (
        <BonusMovePopup key={popup.id} popup={popup} onDone={onBonusPopupDone} />
      ))}
    </div>
  );
});
