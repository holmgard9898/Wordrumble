import { BubbleData, Position, BUBBLE_COLOR_STYLES, SPORTS_BALLS } from '@/data/gameConstants';
import { Bubble } from './Bubble';
import { BonusMovePopup } from './BonusMovePopup';
import type { BonusPopupData } from './BonusMovePopup';
import { useRef, useCallback, useImperativeHandle, forwardRef, useState, useLayoutEffect, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type Particle = {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  content: { kind: 'dot'; color: string } | { kind: 'emoji'; char: string } | { kind: 'shape'; color: string; shape: 'square' | 'circle' | 'triangle' | 'diamond' | 'star' };
};

const SHAPE_OF: Record<string, 'star' | 'square' | 'circle' | 'triangle' | 'diamond'> = {
  red: 'star', green: 'square', blue: 'circle', yellow: 'triangle', pink: 'diamond',
};

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

  // Compute laser beam geometry (relative to board container) when a shot fires.
  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const [beam, setBeam] = useState<{ x: number; y: number; length: number; angle: number; color: 'green' | 'red'; id: string } | null>(null);

  useLayoutEffect(() => {
    if (!laserShot) { setBeam(null); return; }
    const board = boardContainerRef.current;
    if (!board) return;
    // Find satellite center
    let sTop = grid.length, sBot = -1, sLeft = grid[0]?.length ?? 0, sRight = -1;
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (grid[r][c].satellite) {
        if (r < sTop) sTop = r; if (r > sBot) sBot = r;
        if (c < sLeft) sLeft = c; if (c > sRight) sRight = c;
      }
    }
    if (sBot < 0) return;
    const tlEl = cellRefs.current.get(`${sTop}-${sLeft}`);
    const brEl = cellRefs.current.get(`${sBot}-${sRight}`);
    const tgtEl = cellRefs.current.get(`${laserShot.row}-${laserShot.col}`);
    if (!tlEl || !brEl || !tgtEl) return;
    const boardRect = board.getBoundingClientRect();
    const tl = tlEl.getBoundingClientRect();
    const br = brEl.getBoundingClientRect();
    const tg = tgtEl.getBoundingClientRect();
    const sx = (tl.left + br.right) / 2 - boardRect.left;
    const sy = (tl.top + br.bottom) / 2 - boardRect.top;
    const tx = tg.left + tg.width / 2 - boardRect.left;
    const ty = tg.top + tg.height / 2 - boardRect.top;
    const dx = tx - sx, dy = ty - sy;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    setBeam({ x: sx, y: sy, length, angle, color: laserShot.color, id: laserShot.id });
    const t = setTimeout(() => setBeam(null), 550);
    return () => clearTimeout(t);
    // Only re-fire when a NEW shot is dispatched (id changes), not on grid updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laserShot?.id]);

  // ─── Pop particle bursts (themed) ───
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastPopKeysRef = useRef<string>('');
  useEffect(() => {
    const keys = Array.from(poppingCells).sort().join('|');
    if (!keys || keys === lastPopKeysRef.current) {
      lastPopKeysRef.current = keys;
      return;
    }
    lastPopKeysRef.current = keys;
    const board = boardContainerRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    const newParticles: Particle[] = [];
    poppingCells.forEach((key) => {
      const [rs, cs] = key.split('-');
      const r = +rs, c = +cs;
      const el = cellRefs.current.get(key);
      if (!el) return;
      const cellRect = el.getBoundingClientRect();
      const cx = cellRect.left + cellRect.width / 2 - boardRect.left;
      const cy = cellRect.top + cellRect.height / 2 - boardRect.top;
      const bubble = grid[r]?.[c];
      if (!bubble) return;
      const colorBg = BUBBLE_COLOR_STYLES[bubble.color]?.bg ?? '#fff';
      const count = settings.tileStyle === 'sports' ? 4 : 8;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 22 + Math.random() * 26;
        let content: Particle['content'];
        if (settings.tileStyle === 'sports') {
          content = { kind: 'emoji', char: SPORTS_BALLS[bubble.color]?.emoji ?? '⚪' };
        } else if (settings.tileStyle === 'shapes') {
          content = { kind: 'shape', color: colorBg, shape: SHAPE_OF[bubble.color] };
        } else if (settings.tileStyle === 'rubik') {
          content = { kind: 'shape', color: colorBg, shape: 'square' };
        } else if (settings.tileStyle === 'soapbubble') {
          content = { kind: 'dot', color: 'rgba(255,255,255,0.85)' };
        } else {
          content = { kind: 'dot', color: colorBg };
        }
        newParticles.push({
          id: `${key}-${i}-${Date.now()}-${Math.random()}`,
          x: cx,
          y: cy,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: settings.tileStyle === 'sports' ? 14 : settings.tileStyle === 'shapes' ? 10 : 8,
          delay: Math.random() * 30,
          content,
        });
      }
    });
    if (newParticles.length === 0) return;
    setParticles((prev) => [...prev, ...newParticles]);
    const ids = new Set(newParticles.map(p => p.id));
    const t = window.setTimeout(() => {
      setParticles((prev) => prev.filter(p => !ids.has(p.id)));
    }, 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poppingCells]);

  return (
    <div
      ref={boardContainerRef}
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
                style={{
                  touchAction: 'none',
                  // Explicit grid placement so the satellite overlay can't push cells out of view.
                  gridRow: r + 1,
                  gridColumn: c + 1,
                  visibility: bubble.satellite ? 'hidden' : undefined,
                }}
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
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => onSatelliteClick?.()}
                aria-label="satellite"
                className={`absolute inset-0 flex items-center justify-center cursor-pointer ${ready ? 'animate-pulse' : ''}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  filter: ready
                    ? 'drop-shadow(0 0 10px hsl(140,90%,55%)) drop-shadow(0 2px 3px rgba(0,0,0,0.6))'
                    : arming
                      ? 'drop-shadow(0 0 8px hsl(30,100%,60%)) drop-shadow(0 2px 3px rgba(0,0,0,0.6))'
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))',
                }}
              >
                <span className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] leading-none select-none">🛰️</span>
                {laserCharge && (
                  <span
                    className="absolute bottom-0 right-0 text-[10px] md:text-xs font-extrabold px-1.5 py-0.5 rounded pointer-events-none"
                    style={{
                      background: ready ? 'hsl(140,90%,40%)' : 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      textShadow: '0 1px 1px rgba(0,0,0,0.5)',
                    }}
                  >
                    {ready ? '⚡' : `${laserCharge.current}/${laserCharge.max}`}
                  </span>
                )}
              </button>
            </div>
          );
        })()}
      </div>

      {/* Laser beam overlay */}
      {beam && (
        <div
          key={beam.id}
          className="pointer-events-none absolute"
          style={{
            left: beam.x,
            top: beam.y,
            width: beam.length,
            height: 6,
            transform: `translateY(-50%) rotate(${beam.angle}deg)`,
            transformOrigin: '0 50%',
            background: beam.color === 'green'
              ? 'linear-gradient(90deg, hsla(140,100%,70%,0.95), hsla(140,100%,55%,0.85) 50%, hsla(140,100%,40%,0))'
              : 'linear-gradient(90deg, hsla(0,100%,70%,0.95), hsla(0,100%,55%,0.85) 50%, hsla(0,100%,40%,0))',
            boxShadow: beam.color === 'green'
              ? '0 0 12px hsl(140,90%,55%), 0 0 24px hsl(140,90%,55%)'
              : '0 0 12px hsl(0,90%,55%), 0 0 24px hsl(0,90%,55%)',
            borderRadius: 999,
            animation: 'laser-fade 0.55s ease-out forwards',
            zIndex: 30,
          }}
        />
      )}

      {bonusPopups && onBonusPopupDone && bonusPopups.map((popup) => (
        <BonusMovePopup key={popup.id} popup={popup} onDone={onBonusPopupDone} />
      ))}

      {/* Pop particles overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-visible z-30">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              ['--px' as any]: `${p.dx}px`,
              ['--py' as any]: `${p.dy}px`,
              animation: `pop-particle 0.6s ease-out ${p.delay}ms forwards`,
            }}
          >
            {p.content.kind === 'dot' && (
              <div className="w-full h-full rounded-full" style={{ background: p.content.color, boxShadow: `0 0 6px ${p.content.color}` }} />
            )}
            {p.content.kind === 'emoji' && (
              <div className="w-full h-full flex items-center justify-center text-base leading-none">{p.content.char}</div>
            )}
            {p.content.kind === 'shape' && (
              <div
                className="w-full h-full"
                style={{
                  background: p.content.color,
                  borderRadius: p.content.shape === 'circle' ? '50%' : p.content.shape === 'square' ? '2px' : 0,
                  clipPath:
                    p.content.shape === 'triangle' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' :
                    p.content.shape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' :
                    p.content.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                    'none',
                  boxShadow: `0 0 6px ${p.content.color}`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
