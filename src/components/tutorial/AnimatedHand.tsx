import React, { useEffect, useState } from 'react';

interface Props {
  /** Start position relative to parent (px). */
  from: { x: number; y: number };
  /** End position relative to parent (px). */
  to: { x: number; y: number };
  /** Pause when user interacts. */
  paused?: boolean;
  /** Loop duration ms (out + back). */
  duration?: number;
}

/**
 * Cartoon white-glove hand that glides from `from` → `to` with a soft white
 * trail behind it, looping until paused. Pure CSS transitions; no deps.
 */
export const AnimatedHand: React.FC<Props> = ({ from, to, paused, duration = 1200 }) => {
  const [at, setAt] = useState<'from' | 'to'>('from');

  useEffect(() => {
    if (paused) return;
    setAt('from');
    const id = setInterval(() => {
      setAt((cur) => (cur === 'from' ? 'to' : 'from'));
    }, duration);
    return () => clearInterval(id);
  }, [paused, duration, from.x, from.y, to.x, to.y]);

  if (paused) return null;

  const pos = at === 'from' ? from : to;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <>
      {/* Trail */}
      <div
        className="pointer-events-none absolute z-30"
        style={{
          left: from.x,
          top: from.y,
          width: length,
          height: 4,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 100%)',
          borderRadius: 2,
          opacity: at === 'to' ? 0.8 : 0,
          transition: `opacity ${duration * 0.4}ms ease-out`,
          filter: 'blur(0.5px) drop-shadow(0 0 4px rgba(255,255,255,0.6))',
        }}
      />
      {/* Hand */}
      <div
        className="pointer-events-none absolute z-40"
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-30%, -10%)',
          transition: `left ${duration}ms cubic-bezier(0.45,0,0.25,1), top ${duration}ms cubic-bezier(0.45,0,0.25,1)`,
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
        }}
      >
        <HandSvg />
      </div>
    </>
  );
};

const HandSvg: React.FC = () => (
  <svg width="38" height="44" viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg">
    {/* Cartoon white glove pointing up-left */}
    <g>
      {/* Cuff */}
      <path
        d="M14 50 Q12 60 18 66 L42 66 Q48 60 46 50 Z"
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Palm */}
      <path
        d="M14 30 Q10 20 16 14 Q22 10 26 18 L26 12 Q26 4 32 4 Q38 4 38 12 L38 20 L42 18 Q48 16 50 22 L50 32 Q52 38 50 44 Q48 52 42 54 L20 54 Q14 52 14 44 Z"
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Knuckle creases */}
      <path d="M22 30 Q24 32 22 36" stroke="#bbb" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M30 32 Q32 34 30 38" stroke="#bbb" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M38 32 Q40 34 38 38" stroke="#bbb" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);
