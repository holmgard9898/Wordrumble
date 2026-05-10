import { BubbleData, Position } from '@/data/gameConstants';
import { Bubble } from './Bubble';
import { BonusMovePopup } from './BonusMovePopup';
import type { BonusPopupData } from './BonusMovePopup';
import { useRef, useCallback, useImperativeHandle, forwardRef, useState, useLayoutEffect } from 'react';
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
  /** Click-handler when player taps the satellite directly. */
  onSatelliteClick?: () => void;
  /** When set, draw a laser beam from satellite to (row,col) in given color. */
  laserShot?: { row: number; col: number; color: 'green' | 'red'; id: string } | null;
}

export interface GameBoardHandle {
  /** Returns the absolute viewport rect of cell (row, col), or null if missing. */
  getCellRect: (row: number, col: number) => DOMRect | null;
}

export const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(function GameBoard(
  { grid, selectedBubble, poppingCells, onBubbleClick, onSwipe, bonusPopups, onBonusPopupDone, laserCharge, onSatelliteClick, laserShot },
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
        {(() => {
          // Find satellite bounds (2x2). Grid-area is 1-indexed.
          let topRow = grid.length, botRow = -1, leftCol = grid[0]?.length ?? 0, rightCol = -1;
          for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
              if (grid[r][c].satellite) {
                if (r < topRow) topRow = r;
                if (r > botRow) botRow = r;
                if (c < leftCol) leftCol = c;
                if (c > rightCol) rightCol = c;
              }
            }
          }
          if (botRow < 0) return null;
          const rowSpan = botRow - topRow + 1;
          const colSpan = rightCol - leftCol + 1;
          const ready = laserCharge?.ready;
          const arming = laserCharge?.arming;
          return (
            <div
              style={{
                gridRow: `${topRow + 1} / span ${rowSpan}`,
                gridColumn: `${leftCol + 1} / span ${colSpan}`,
                pointerEvents: 'none',
                position: 'relative',
              }}
            >
              <div
                className={`absolute inset-0.5 rounded-xl flex items-center justify-center ${ready ? 'animate-pulse' : ''}`}
                style={{
                  background: 'radial-gradient(circle at 30% 30%, hsl(220, 18%, 55%), hsl(220, 22%, 28%) 60%, hsl(220, 28%, 12%))',
                  border: `2px solid ${ready ? 'hsl(140,90%,55%)' : arming ? 'hsl(30,100%,55%)' : 'hsl(220,30%,18%)'}`,
                  boxShadow: ready
                    ? '0 0 18px hsl(140,90%,55%), inset 0 0 12px rgba(0,0,0,0.5)'
                    : 'inset 0 -4px 8px rgba(0,0,0,0.55), 0 4px 10px rgba(0,0,0,0.5)',
                }}
              >
                <span className="text-3xl md:text-4xl lg:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">🛰️</span>
                {laserCharge && (
                  <span
                    className="absolute bottom-1 right-1 text-[10px] md:text-xs font-extrabold px-1.5 py-0.5 rounded"
                    style={{
                      background: ready ? 'hsl(140,90%,40%)' : 'hsl(220,30%,18%)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      textShadow: '0 1px 1px rgba(0,0,0,0.5)',
                    }}
                  >
                    {ready ? '⚡ READY' : `${laserCharge.current}/${laserCharge.max}`}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {bonusPopups && onBonusPopupDone && bonusPopups.map((popup) => (
        <BonusMovePopup key={popup.id} popup={popup} onDone={onBonusPopupDone} />
      ))}
    </div>
  );
});
