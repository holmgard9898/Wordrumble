import { BubbleData, BUBBLE_COLOR_STYLES, BubbleColor, SPORTS_BALLS } from '@/data/gameConstants';
import { useSettings, type TileStyle } from '@/contexts/SettingsContext';

interface BubbleProps {
  bubble: BubbleData;
  isSelected: boolean;
  isPopping: boolean;
  onClick?: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

const SHAPE_MAP: Record<BubbleColor, { shape: string; label: string }> = {
  red:    { shape: '★', label: 'star' },
  green:  { shape: '■', label: 'square' },
  blue:   { shape: '●', label: 'circle' },
  yellow: { shape: '▲', label: 'triangle' },
  pink:   { shape: '◆', label: 'diamond' },
};

/** CSS clip-path for each color's unique shape */
const CLIP_PATHS: Record<BubbleColor, string> = {
  red: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  green: 'none',
  blue: 'circle(50% at 50% 50%)',
  yellow: 'polygon(50% 10%, 90% 85%, 10% 85%)',
  pink: 'polygon(50% 5%, 90% 50%, 50% 95%, 10% 50%)',
};

function BombBadge({ bomb }: { bomb: number }) {
  return (
    <span
      className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold animate-pulse z-20"
      style={{
        background: 'linear-gradient(135deg, hsl(40, 100%, 50%), hsl(20, 100%, 45%))',
        color: '#fff',
        border: '1.5px solid hsl(0, 0%, 20%)',
        textShadow: '0 1px 1px rgba(0,0,0,0.5)',
      }}
    >
      💣{bomb}
    </span>
  );
}

function PowerupBadge({ type }: { type: 'x2' | 'x3' | 'free5' }) {
  const cfg = type === 'x2'
    ? { bg: 'linear-gradient(135deg, hsl(280, 80%, 55%), hsl(260, 75%, 40%))', label: '×2' }
    : type === 'x3'
    ? { bg: 'linear-gradient(135deg, hsl(45, 100%, 55%), hsl(30, 95%, 45%))', label: '×3' }
    : { bg: 'linear-gradient(135deg, hsl(140, 75%, 50%), hsl(150, 70%, 35%))', label: '+5' };
  return (
    <span
      className="absolute -top-1 -right-1 px-1.5 h-5 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-extrabold animate-pulse z-20"
      style={{
        background: cfg.bg,
        color: '#fff',
        border: '1.5px solid rgba(0,0,0,0.45)',
        textShadow: '0 1px 1px rgba(0,0,0,0.5)',
        minWidth: '1.25rem',
      }}
    >
      {cfg.label}
    </span>
  );
}

function ValueBadge({ value, color }: { value: number; color: string }) {
  return (
    <span
      className="absolute bottom-0 right-1 text-[8px] md:text-[9px] font-semibold opacity-80 z-20"
      style={{ textShadow: '0 1px 1px rgba(0,0,0,0.4)', color }}
    >
      {value}
    </span>
  );
}

/* ─── Soap Bubble style ─── */
function SoapBubbleInner({ bubble, isSelected, isPopping, onClick, onTouchStart, onTouchEnd }: BubbleProps) {
  const colors = BUBBLE_COLOR_STYLES[bubble.color];
  const hasBomb = bubble.bomb !== undefined;
  const powerup = bubble.powerup;

  return (
    <button
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`
        relative w-full aspect-square rounded-full flex items-center justify-center
        cursor-pointer select-none transition-all duration-200 touch-none
        ${isPopping ? 'animate-pop' : ''}
        ${isSelected ? 'ring-4 ring-white/60 scale-110 z-10' : ''}
      `}
      style={{
        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 35%, rgba(200,220,255,0.08) 60%, rgba(180,200,255,0.15) 100%)`,
        border: '1.5px solid rgba(255,255,255,0.3)',
        boxShadow: isSelected
          ? `0 0 20px rgba(255,255,255,0.3), inset 0 0 15px rgba(255,255,255,0.1)`
          : `inset 0 -4px 8px rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Soap bubble shine */}
      <div
        className="absolute top-1 left-2 w-3 h-2 md:w-4 md:h-2.5 rounded-full opacity-70"
        style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.9), transparent)' }}
      />
      {/* Rainbow iridescence arc */}
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: 'conic-gradient(from 180deg, hsl(0,80%,70%), hsl(60,80%,70%), hsl(120,80%,70%), hsl(200,80%,70%), hsl(280,80%,70%), hsl(340,80%,70%))',
          mask: 'radial-gradient(circle, transparent 55%, black 65%, transparent 80%)',
          WebkitMask: 'radial-gradient(circle, transparent 55%, black 65%, transparent 80%)',
        }}
      />
      {/* Fridge magnet letter */}
      <span
        className="text-base md:text-lg lg:text-xl font-black leading-none z-10"
        style={{
          color: colors.bg,
          textShadow: `0 1px 0 ${colors.highlight}, 0 0 4px rgba(0,0,0,0.2)`,
          fontFamily: '"Arial Rounded MT Bold", "Nunito", sans-serif',
          WebkitTextStroke: '0.5px rgba(0,0,0,0.15)',
        }}
      >
        {bubble.letter}
      </span>
      {hasBomb ? (
        <BombBadge bomb={bubble.bomb!} />
      ) : powerup ? (
        <PowerupBadge type={powerup} />
      ) : (
        <span
          className="absolute bottom-0.5 right-1.5 text-[7px] md:text-[8px] font-bold z-20"
          style={{ color: colors.bg, textShadow: '0 0 3px rgba(255,255,255,0.8)' }}
        >
          {bubble.value}
        </span>
      )}
    </button>
  );
}

/* ─── Sports Balls style ─── */
function SportsBallInner({ bubble, isSelected, isPopping, onClick, onTouchStart, onTouchEnd }: BubbleProps) {
  const ball = SPORTS_BALLS[bubble.color];
  const hasBomb = bubble.bomb !== undefined;
  const powerup = bubble.powerup;

  return (
    <button
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`
        relative w-full aspect-square rounded-full flex items-center justify-center
        cursor-pointer select-none transition-all duration-200 touch-none
        ${isPopping ? 'animate-pop' : ''}
        ${isSelected ? 'ring-4 ring-white scale-110 z-10' : ''}
      `}
      style={{
        background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.15), rgba(0,0,0,0.1) 70%)',
        boxShadow: isSelected
          ? '0 0 16px rgba(255,255,255,0.4)'
          : '0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {/* Ball emoji background */}
      <span className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl lg:text-[2.2rem] opacity-90 select-none">
        {ball.emoji}
      </span>
      {/* Letter overlay */}
      <span
        className="relative text-sm md:text-base lg:text-lg font-black leading-none z-10"
        style={{
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
        }}
      >
        {bubble.letter}
      </span>
      {hasBomb ? (
        <BombBadge bomb={bubble.bomb!} />
      ) : powerup ? (
        <PowerupBadge type={powerup} />
      ) : (
        <span
          className="absolute bottom-0 right-1 text-[8px] md:text-[9px] font-bold z-20"
          style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {bubble.value}
        </span>
      )}
    </button>
  );
}

function AsteroidInner({ onClick }: BubbleProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-square rounded-full flex items-center justify-center select-none cursor-not-allowed touch-none"
      style={{
        background: 'radial-gradient(circle at 35% 30%, hsl(30, 8%, 55%), hsl(25, 10%, 32%) 65%, hsl(20, 12%, 18%))',
        border: '2px solid hsl(20, 15%, 12%)',
        boxShadow: 'inset 0 -3px 6px hsl(20, 15%, 12%), 0 2px 6px rgba(0,0,0,0.55), inset 0 0 8px rgba(0,0,0,0.4)',
      }}
      aria-label="asteroid"
    >
      <span className="text-xl md:text-2xl lg:text-3xl leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
        ☄️
      </span>
      <span
        className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full opacity-40"
        style={{ background: 'hsl(0,0%,15%)' }}
      />
      <span
        className="absolute bottom-2 right-2.5 w-1 h-1 rounded-full opacity-50"
        style={{ background: 'hsl(0,0%,10%)' }}
      />
    </button>
  );
}

export function Bubble(props: BubbleProps) {
  const { bubble, isSelected, isPopping, onClick, onTouchStart, onTouchEnd } = props;
  const colors = BUBBLE_COLOR_STYLES[bubble.color];
  const hasBomb = bubble.bomb !== undefined;
  const powerup = bubble.powerup;
  const { settings } = useSettings();
  const style = settings.tileStyle;

  if (bubble.asteroid) return <AsteroidInner {...props} />;
  if (style === 'soapbubble') return <SoapBubbleInner {...props} />;
  if (style === 'sports') return <SportsBallInner {...props} />;

  if (style === 'rubik') {
    return (
      <button
        onClick={onClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      className={`
        relative w-full aspect-square flex items-center justify-center
        cursor-pointer select-none transition-all duration-200 touch-none
        ${isPopping ? 'animate-pop' : ''}
        ${isSelected ? 'z-10 brightness-125' : ''}
      `}
        style={{
          background: colors.bg,
          border: '2px solid rgba(0,0,0,0.7)',
          boxShadow: isSelected
            ? `0 0 16px ${colors.bg}, inset 0 2px 6px rgba(255,255,255,0.25)`
            : 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.2)',
          color: '#fff',
          borderRadius: '3px',
        }}
      >
        <span className="text-base md:text-lg lg:text-xl font-bold leading-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          {bubble.letter}
        </span>
        {hasBomb ? <BombBadge bomb={bubble.bomb!} /> : powerup ? <PowerupBadge type={powerup} /> : <ValueBadge value={bubble.value} color="#fff" />}
      </button>
    );
  }

  if (style === 'shapes') {
    const clipPath = CLIP_PATHS[bubble.color];
    const isSquare = bubble.color === 'green';

    return (
      <button
        onClick={onClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      className={`
        relative w-full aspect-square flex items-center justify-center
        cursor-pointer select-none transition-all duration-200 touch-none
        ${isPopping ? 'animate-pop' : ''}
        ${isSelected ? 'z-10 scale-110' : ''}
      `}
        style={{ background: 'transparent' }}
      >
        <div
          className="absolute inset-0.5 md:inset-0"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${colors.highlight}, ${colors.bg} 60%, ${colors.border})`,
            clipPath: isSquare ? 'none' : clipPath,
            borderRadius: isSquare ? '3px' : '0',
            boxShadow: isSelected
              ? `0 0 20px ${colors.bg}`
              : `0 2px 4px rgba(0,0,0,0.4)`,
          }}
        />
        {isSelected && (
          <div
            className="absolute inset-0 rounded-lg"
            style={{ boxShadow: `0 0 0 3px white, 0 0 16px ${colors.bg}` }}
          />
        )}
        <span
          className="relative text-base md:text-lg lg:text-xl font-bold leading-none z-10"
          style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
        >
          {bubble.letter}
        </span>
        {hasBomb ? <BombBadge bomb={bubble.bomb!} /> : powerup ? <PowerupBadge type={powerup} /> : <ValueBadge value={bubble.value} color="#fff" />}
      </button>
    );
  }

  // Default bubble style
  return (
    <button
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`
        relative w-full aspect-square rounded-full flex items-center justify-center
        cursor-pointer select-none transition-all duration-200 touch-none
        ${isPopping ? 'animate-pop' : ''}
        ${isSelected ? 'ring-4 ring-white scale-110 z-10' : ''}
      `}
      style={{
        background: `radial-gradient(circle at 35% 30%, ${colors.highlight}, ${colors.bg} 60%, ${colors.border})`,
        boxShadow: isSelected
          ? `0 0 20px ${colors.bg}, inset 0 -3px 6px ${colors.border}`
          : hasBomb
            ? `inset 0 -3px 6px ${colors.border}, 0 2px 8px rgba(255,80,0,0.5), 0 0 12px rgba(255,80,0,0.3)`
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
      {hasBomb ? <BombBadge bomb={bubble.bomb!} /> : powerup ? <PowerupBadge type={powerup} /> : <ValueBadge value={bubble.value} color={colors.text} />}
    </button>
  );
}