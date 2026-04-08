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
  const hasBomb = bubble.bomb !== undefined;

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
        background: hasBomb
          ? `radial-gradient(circle at 35% 30%, hsl(0, 90%, 70%), hsl(0, 80%, 40%) 60%, hsl(0, 70%, 25%))`
          : `radial-gradient(circle at 35% 30%, ${colors.highlight}, ${colors.bg} 60%, ${colors.border})`,
        boxShadow: isSelected
          ? `0 0 20px ${colors.bg}, inset 0 -3px 6px ${colors.border}`
          : hasBomb
            ? `inset 0 -3px 6px hsl(0, 70%, 25%), 0 2px 8px rgba(255,0,0,0.4)`
            : `inset 0 -3px 6px ${colors.border}, 0 2px 4px rgba(0,0,0,0.3)`,
        color: '#fff',
      }}
    >
      <div
        className="absolute top-0.5 left-1.5 w-3 h-2 md:w-4 md:h-3 rounded-full opacity-60"
        style={{ background: `radial-gradient(ellipse, rgba(255,255,255,0.8), transparent)` }}
      />
      <span className="text-base md:text-lg lg:text-xl font-bold leading-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        {bubble.letter}
      </span>
      {hasBomb ? (
        <span
          className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold"
          style={{
            background: 'linear-gradient(135deg, hsl(40, 100%, 50%), hsl(20, 100%, 45%))',
            color: '#fff',
            border: '1.5px solid hsl(0, 0%, 20%)',
            textShadow: '0 1px 1px rgba(0,0,0,0.5)',
          }}
        >
          💣{bubble.bomb}
        </span>
      ) : (
        <span
          className="absolute bottom-0 right-1 text-[8px] md:text-[9px] font-semibold opacity-80"
          style={{ textShadow: '0 1px 1px rgba(0,0,0,0.4)', color: colors.text }}
        >
          {bubble.value}
        </span>
      )}
    </button>
  );
}
