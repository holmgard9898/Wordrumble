import { BubbleData, BUBBLE_COLOR_STYLES } from '@/data/gameConstants';

interface BubbleProps {
  bubble: BubbleData;
  isSelected: boolean;
  isPopping: boolean;
  onClick: () => void;
}

export function Bubble({ bubble, isSelected, isPopping, onClick }: BubbleProps) {
  const colors = BUBBLE_COLOR_STYLES[bubble.color];

  return (
    <button
      onClick={onClick}
      className={`
        relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center
        cursor-pointer select-none transition-all duration-200
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
        className="absolute top-1 left-2 w-4 h-3 rounded-full opacity-60"
        style={{ background: `radial-gradient(ellipse, rgba(255,255,255,0.8), transparent)` }}
      />
      <span className="text-lg md:text-xl font-bold leading-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        {bubble.letter}
      </span>
      <span
        className="absolute bottom-0.5 right-1.5 text-[9px] font-semibold opacity-80"
        style={{ textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}
      >
        {bubble.value}
      </span>
    </button>
  );
}
