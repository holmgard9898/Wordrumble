import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export type MenuButtonGradient = 'blue' | 'red' | 'amber' | 'green' | 'purple' | 'cyan' | 'pink';

// Solid candy palette — base, lighter top, darker bottom/border.
const TONES: Record<MenuButtonGradient, { top: string; base: string; bottom: string; border: string }> = {
  blue:   { top: '#5BA8FF', base: '#2F7FE6', bottom: '#1E5BB8', border: '#164785' },
  red:    { top: '#F46B6B', base: '#DB3B3B', bottom: '#A52424', border: '#7A1A1A' },
  amber:  { top: '#F8C24A', base: '#E8A322', bottom: '#B57A10', border: '#8A5C0A' },
  green:  { top: '#5FCB6B', base: '#34A745', bottom: '#247A30', border: '#1A5A23' },
  purple: { top: '#A06DEA', base: '#7C3AED', bottom: '#5A1FB8', border: '#43178A' },
  cyan:   { top: '#4FD3E0', base: '#1FAFC0', bottom: '#137985', border: '#0D5A63' },
  pink:   { top: '#F176B0', base: '#DB4595', bottom: '#A52A6E', border: '#7A1F52' },
};

function useTransparentMode() {
  // Cosmic Night = 'default' background. Allow translucency only there.
  const { settings } = useSettings();
  return settings.background === 'default';
}

interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  gradient?: MenuButtonGradient;
  size?: 'lg' | 'md' | 'sm';
  fullWidth?: boolean;
}

/**
 * Pill-shaped solid candy button. Colored rim, glossy top, dark bottom lip.
 */
export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ icon, label, gradient = 'blue', size = 'lg', fullWidth = true, className = '', style, ...rest }, ref) => {
    const t = TONES[gradient];
    const transparent = useTransparentMode();
    const sizeCls =
      size === 'lg' ? 'h-16 text-xl' :
      size === 'md' ? 'h-12 text-base' :
      'h-10 text-sm';

    const bg = transparent
      ? `linear-gradient(180deg, ${t.top}cc 0%, ${t.base}cc 55%, ${t.bottom}cc 100%)`
      : `linear-gradient(180deg, ${t.top} 0%, ${t.base} 55%, ${t.bottom} 100%)`;

    return (
      <button
        ref={ref}
        {...rest}
        className={`relative ${fullWidth ? 'w-full' : ''} ${sizeCls} rounded-full text-white font-extrabold tracking-wide transition-transform active:translate-y-[2px] hover:brightness-110 overflow-hidden ${className}`}
        style={{
          background: bg,
          border: `2px solid ${t.border}`,
          boxShadow: `inset 0 -5px 0 ${t.bottom}, inset 0 2px 0 rgba(255,255,255,0.35), 0 6px 0 ${t.border}, 0 10px 18px rgba(0,0,0,0.30)`,
          backdropFilter: transparent ? 'blur(6px)' : undefined,
          ...style,
        }}
      >
        {/* glossy top highlight */}
        <span
          aria-hidden
          className="absolute inset-x-3 top-1 h-[42%] rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))' }}
        />
        <span
          className="relative flex items-center justify-center gap-2.5"
          style={{ textShadow: '0 2px 0 rgba(0,0,0,0.30), 0 1px 0 rgba(0,0,0,0.25)' }}
        >
          {icon}
          <span>{label}</span>
        </span>
      </button>
    );
  }
);
MenuButton.displayName = 'MenuButton';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  tone?: MenuButtonGradient;
}

/**
 * Solid candy back button with colored contour for visibility on any background.
 */
export const BackButton: React.FC<BackButtonProps> = ({ label, icon, tone = 'purple', className = '', style, ...rest }) => {
  const t = TONES[tone];
  const transparent = useTransparentMode();
  const bg = transparent
    ? `linear-gradient(180deg, ${t.top}cc 0%, ${t.base}cc 55%, ${t.bottom}cc 100%)`
    : `linear-gradient(180deg, ${t.top} 0%, ${t.base} 55%, ${t.bottom} 100%)`;

  return (
    <button
      {...rest}
      className={`relative inline-flex items-center gap-2 h-12 px-5 rounded-full font-bold text-white transition-transform active:translate-y-[2px] hover:brightness-110 overflow-hidden ${className}`}
      style={{
        background: bg,
        border: `2px solid ${t.border}`,
        boxShadow: `inset 0 -4px 0 ${t.bottom}, inset 0 2px 0 rgba(255,255,255,0.35), 0 5px 0 ${t.border}, 0 8px 14px rgba(0,0,0,0.30)`,
        textShadow: '0 2px 0 rgba(0,0,0,0.30)',
        backdropFilter: transparent ? 'blur(6px)' : undefined,
        ...style,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-2 top-1 h-[42%] rounded-full pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0))' }}
      />
      <span className="relative flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
};
