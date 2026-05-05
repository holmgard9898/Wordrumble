import React from 'react';

export type MenuButtonGradient = 'blue' | 'red' | 'amber' | 'green' | 'purple' | 'cyan' | 'pink';

const GRADIENTS: Record<MenuButtonGradient, { from: string; to: string; shadow: string }> = {
  blue:   { from: 'from-blue-400',   to: 'to-blue-600',   shadow: 'shadow-blue-700/50' },
  red:    { from: 'from-red-400',    to: 'to-red-600',    shadow: 'shadow-red-700/50' },
  amber:  { from: 'from-yellow-400', to: 'to-amber-500',  shadow: 'shadow-amber-600/50' },
  green:  { from: 'from-green-400',  to: 'to-green-600',  shadow: 'shadow-green-700/50' },
  purple: { from: 'from-purple-400', to: 'to-purple-600', shadow: 'shadow-purple-700/50' },
  cyan:   { from: 'from-cyan-400',   to: 'to-cyan-600',   shadow: 'shadow-cyan-700/50' },
  pink:   { from: 'from-pink-400',   to: 'to-pink-600',   shadow: 'shadow-pink-700/50' },
};

interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  gradient?: MenuButtonGradient;
  size?: 'lg' | 'md' | 'sm';
  fullWidth?: boolean;
}

/**
 * Pill-shaped, glossy menu button used across the app for visual consistency.
 */
export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ icon, label, gradient = 'blue', size = 'lg', fullWidth = true, className = '', ...rest }, ref) => {
    const g = GRADIENTS[gradient];
    const sizeCls =
      size === 'lg' ? 'h-16 text-xl' :
      size === 'md' ? 'h-12 text-base' :
      'h-10 text-sm';

    return (
      <button
        ref={ref}
        {...rest}
        className={`relative ${fullWidth ? 'w-full' : ''} ${sizeCls} rounded-full bg-gradient-to-b ${g.from} ${g.to} text-white font-extrabold tracking-wide shadow-lg ${g.shadow} ring-2 ring-white/70 ring-inset transition-transform active:scale-[0.97] hover:brightness-110 overflow-hidden ${className}`}
      >
        {/* glossy highlight */}
        <span
          aria-hidden
          className="absolute inset-x-2 top-1 h-1/2 rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))' }}
        />
        <span className="relative flex items-center justify-center gap-2.5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]">
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
}

/**
 * Distinct back/secondary button — clearly outlined translucent pill.
 */
export const BackButton: React.FC<BackButtonProps> = ({ label, icon, className = '', ...rest }) => (
  <button
    {...rest}
    className={`relative inline-flex items-center gap-2 h-11 px-5 rounded-full font-bold text-white/95 bg-white/10 hover:bg-white/20 active:scale-[0.97] transition-all ring-2 ring-white/60 ring-inset shadow-lg shadow-black/30 backdrop-blur-md ${className}`}
    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
  >
    {icon}
    <span>{label}</span>
  </button>
);
