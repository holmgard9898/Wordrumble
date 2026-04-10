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

  return (
    <div
      className="absolute pointer-events-none z-30 font-black"
      style={{
        left: `${(popup.col / 8) * 100 + 6}%`,
        top: `${(popup.row / 10) * 100}%`,
        transform: phase === 'enter'
          ? 'scale(0.3) translateY(0px)'
          : phase === 'float'
            ? 'scale(1) translateY(-70px)'
            : 'scale(0.8) translateY(-100px)',
        opacity: phase === 'gone' ? 0 : phase === 'enter' ? 0.5 : 1,
        transition: phase === 'enter'
          ? 'all 0.1s ease-out'
          : 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        color,
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        textShadow: shadow,
        fontFamily: '"Nunito", "Baloo 2", system-ui, sans-serif',
        letterSpacing: '0.02em',
        WebkitTextStroke: '1px rgba(0,0,0,0.2)',
      }}
    >
      +{popup.amount}
    </div>
  );
}
