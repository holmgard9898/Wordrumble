import { BubbleData, BUBBLE_COLOR_STYLES } from '@/data/gameConstants';

interface BubbleProps {
  bubble: BubbleData;
  isSelected: boolean;
  isPopping: boolean;
  onClick: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export function Bubble({ bubble, isSelected, isPopping, onClick, onTouchStart, onTouchEnd }: BubbleProps) {
  const colors = BUBBLE_COLOR_STYLES[bubble.color];

  return (
    <button
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`
        relative w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center
        cursor-pointer select-none transition-all duration-200 touch-none
        ${isPopping ? 'animate-pop' : ''}
        ${isSelected ? 'ring-4 ring-white scale-110 z-10' : ''}
      `}
      style={{
        background: `radial-gradient(circle at 35% 30%, ${colors.highlight}, ${colors.bg} 60%, ${colors.border})`,
        boxShadow: isSelected
          ? `0 0 20px ${colors.bg}, inset 0 -3px 6px ${colors.border}`
          : `inset 0 -3px 6px ${colors.border}, 0 2px 4px rgba(0,0,0,0.3)`,
        color: colors.text,
      }}
    >
      <div
        className="absolute top-0.5 left-1.5 w-3 h-2 md:w-4 md:h-3 rounded-full opacity-60"
        style={{ background: `radial-gradient(ellipse, rgba(255,255,255,0.8), transparent)` }}
      />
      <span className="text-base md:text-lg lg:text-xl font-bold leading-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        {bubble.letter}
      </span>
      <span
        className="absolute bottom-0 right-1 text-[8px] md:text-[9px] font-semibold opacity-80"
        style={{ textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}
      >
        {bubble.value}
      </span>
    </button>
  );
}
