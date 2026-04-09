import { BubbleData, Position } from '@/data/gameConstants';
import { Bubble } from './Bubble';
import { useRef, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface GameBoardProps {
  grid: BubbleData[][];
  selectedBubble: Position | null;
  poppingCells: Set<string>;
  onBubbleClick: (row: number, col: number) => void;
  onSwipe?: (row: number, col: number, direction: 'up' | 'down' | 'left' | 'right') => void;
}

export function GameBoard({ grid, selectedBubble, poppingCells, onBubbleClick, onSwipe }: GameBoardProps) {
  const touchStartRef = useRef<{ x: number; y: number; row: number; col: number } | null>(null);
  const { settings } = useSettings();
  const isRubik = settings.tileStyle === 'rubik';

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
      className={`flex flex-col ${isRubik ? 'gap-0' : 'gap-0.5 md:gap-1'} p-2 md:p-3 rounded-2xl`}
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      {grid.map((row, r) => (
        <div key={r} className={`flex ${isRubik ? 'gap-0' : 'gap-0.5 md:gap-1'} justify-center`}>
          {row.map((bubble, c) => {
            const isSelected = selectedBubble?.row === r && selectedBubble?.col === c;
            const isPopping = poppingCells.has(`${r}-${c}`);
            return (
              <Bubble
                key={bubble.id}
                bubble={bubble}
                isSelected={isSelected}
                isPopping={isPopping}
                onClick={() => onBubbleClick(r, c)}
                onTouchStart={(e) => handleTouchStart(r, c, e)}
                onTouchEnd={handleTouchEnd}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
