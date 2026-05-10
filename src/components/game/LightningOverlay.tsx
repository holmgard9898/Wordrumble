import { useEffect, useState } from 'react';
import { type Position, type BubbleColor, BUBBLE_COLOR_STYLES } from '@/data/gameConstants';
import type { LightningEvent } from '@/hooks/useGameEffects';

interface Props {
  event: LightningEvent | null;
  getCellRect: (row: number, col: number) => DOMRect | null;
  containerEl: HTMLElement | null;
}

/** Renders animated lightning bolts above the cells of a 7-letter word. */
export function LightningOverlay({ event, getCellRect, containerEl }: Props) {
  const [bolts, setBolts] = useState<Array<{ id: string; x: number; y: number; w: number; h: number; rot: number; delay: number }>>([]);

  useEffect(() => {
    if (!event || !containerEl) { setBolts([]); return; }
    const cRect = containerEl.getBoundingClientRect();
    const next = event.positions.map((p, i) => {
      const r = getCellRect(p.row, p.col);
      if (!r) return null;
      return {
        id: `${event.id}-${i}`,
        x: r.left - cRect.left + r.width / 2,
        y: r.top - cRect.top + r.height / 2,
        w: r.width * 0.9,
        h: r.height * 1.6,
        rot: (Math.random() - 0.5) * 30,
        delay: i * 35,
      };
    }).filter(Boolean) as typeof bolts;
    setBolts(next);
    const t = window.setTimeout(() => setBolts([]), 900);
    return () => window.clearTimeout(t);
  }, [event, getCellRect, containerEl]);

  if (!event || bolts.length === 0) return null;
  const color = BUBBLE_COLOR_STYLES[event.color].bg;
  const highlight = BUBBLE_COLOR_STYLES[event.color].highlight;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      {bolts.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
            animation: `lightning-flash 0.55s ease-out ${b.delay}ms forwards`,
            opacity: 0,
          }}
        >
          <svg viewBox="0 0 40 100" preserveAspectRatio="none" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 22px ${highlight})` }}>
            <polyline
              points="22,0 14,38 26,42 8,100"
              fill="none"
              stroke={highlight}
              strokeWidth="6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline
              points="22,0 14,38 26,42 8,100"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
