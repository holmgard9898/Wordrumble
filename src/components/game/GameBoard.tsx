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
}

export interface GameBoardHandle {
  /** Returns the absolute viewport rect of cell (row, col), or null if missing. */
  getCellRect: (row: number, col: number) => DOMRect | null;
}

export const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(function GameBoard(
  { grid, selectedBubble, poppingCells, onBubbleClick, onSwipe, bonusPopups, onBonusPopupDone },
  ref,
) {
  const touchStartRef = useRef<{ x: number; y: number; row: number; col: number } | null>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { settings } = useSettings();
  const isRubik = settings.tileStyle === 'rubik';

  useImperativeHandle(ref, () => ({
    getCellRect: (row, col) => {
      const el = cellRefs.current.get(`${row}-${col}`);
      return el ? el.getBoundingClientRect() : null;
    },
  }));

  const handleTouchStart = useCallback((row: number, col: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, row, col };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !onSwipe) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const { row, col } = touchStartRef.current;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 20;

    if (absDx < threshold && absDy < threshold) {
      onBubbleClick(row, col);
      return;
    }

    if (absDx > absDy) {
      onSwipe(row, col, dx > 0 ? 'right' : 'left');
    } else {
      onSwipe(row, col, dy > 0 ? 'down' : 'up');
    }
  }, [onSwipe, onBubbleClick]);

  return (
    <div
      className="relative rounded-lg md:rounded-2xl w-full md:w-auto"
      style={{
        background: 'rgba(0,0,0,0.25)',
        padding: isRubik ? '2px' : 'clamp(2px, 0.5vw, 12px)',
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
              >
                <Bubble
                  bubble={bubble}
                  isSelected={isSelected}
                  isPopping={isPopping}
                  onClick={() => onBubbleClick(r, c)}
                  onTouchStart={(e) => handleTouchStart(r, c, e)}
                  onTouchEnd={handleTouchEnd}
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
