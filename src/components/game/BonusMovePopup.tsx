import { useEffect, useState } from 'react';
import type { BubbleColor, BUBBLE_COLOR_STYLES } from '@/data/gameConstants';

export interface BonusPopupData {
  id: string;
  amount: number;
  color: BubbleColor;
  /** Grid row where the word center was */
  row: number;
  /** Grid col where the word center was */
  col: number;
  /** Optional label override, e.g. "X2", "X3" */
  label?: string;
}

const COLOR_MAP: Record<BubbleColor, string> = {
  red: 'hsl(0, 80%, 60%)',
  green: 'hsl(140, 70%, 55%)',
  blue: 'hsl(210, 85%, 65%)',
  yellow: 'hsl(45, 95%, 60%)',
  pink: 'hsl(330, 80%, 65%)',
};

const SHADOW_MAP: Record<BubbleColor, string> = {
  red: '0 0 12px hsla(0,80%,50%,0.6), 0 0 24px hsla(0,80%,50%,0.3)',
  green: '0 0 12px hsla(140,70%,45%,0.6), 0 0 24px hsla(140,70%,45%,0.3)',
  blue: '0 0 12px hsla(210,85%,55%,0.6), 0 0 24px hsla(210,85%,55%,0.3)',
  yellow: '0 0 12px hsla(45,95%,50%,0.6), 0 0 24px hsla(45,95%,50%,0.3)',
  pink: '0 0 12px hsla(330,80%,55%,0.6), 0 0 24px hsla(330,80%,55%,0.3)',
};

interface BonusMovePopupProps {
  popup: BonusPopupData;
  onDone: (id: string) => void;
}

export function BonusMovePopup({ popup, onDone }: BonusMovePopupProps) {
  const [phase, setPhase] = useState<'enter' | 'float' | 'gone'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('float'), 50);
    const t2 = setTimeout(() => setPhase('gone'), 1200);
    const t3 = setTimeout(() => onDone(popup.id), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [popup.id, onDone]);

  const color = COLOR_MAP[popup.color];
  const shadow = SHADOW_MAP[popup.color];

  const displayText = popup.label ?? `+${popup.amount}`;
  const isMultiplier = popup.label?.startsWith('X');
  const isWord = !!popup.label && !isMultiplier && !popup.label.startsWith('+');
  const fontSize = isMultiplier
    ? 'clamp(2rem, 6vw, 3.5rem)'
    : isWord
      ? 'clamp(1rem, 2.6vw, 1.6rem)'
      : 'clamp(1.5rem, 4vw, 2.5rem)';

  const floatOffset = isWord ? -90 : -70;
  const goneOffset = isWord ? -130 : -100;

  return (
    <div
      className="absolute pointer-events-none z-30 font-black"
      style={{
        left: `${(popup.col / 8) * 100 + 6}%`,
        top: `${(popup.row / 10) * 100}%`,
        transform: phase === 'enter'
          ? 'scale(0.3) translateY(0px)'
          : phase === 'float'
            ? `scale(${isMultiplier ? 1.2 : 1}) translateY(${floatOffset}px)`
            : `scale(0.8) translateY(${goneOffset}px)`,
        opacity: phase === 'gone' ? 0 : phase === 'enter' ? 0.5 : 1,
        transition: phase === 'enter'
          ? 'all 0.1s ease-out'
          : 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
        color: isWord ? '#fff' : color,
        fontSize,
        textShadow: isWord ? '0 1px 2px rgba(0,0,0,0.5)' : shadow,
        fontFamily: '"Nunito", "Baloo 2", system-ui, sans-serif',
        letterSpacing: '0.04em',
        WebkitTextStroke: isMultiplier ? '1.5px rgba(0,0,0,0.3)' : isWord ? '0' : '1px rgba(0,0,0,0.2)',
        padding: isWord ? '4px 14px' : undefined,
        borderRadius: isWord ? '999px' : undefined,
        background: isWord
          ? `radial-gradient(circle at 30% 25%, ${color}, ${color} 60%, rgba(0,0,0,0.2))`
          : undefined,
        border: isWord ? '2px solid rgba(255,255,255,0.45)' : undefined,
        boxShadow: isWord ? `${shadow}, inset 0 -2px 4px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.3)` : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {displayText}
    </div>
  );
}
