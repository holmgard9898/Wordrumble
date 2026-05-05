import React from 'react';

const PALETTE = ['#3B82F6', '#22C55E', '#FACC15', '#EF4444', '#F97316', '#A855F7'];

interface BubbleTitleProps {
  text: string;
  size?: 'lg' | 'md' | 'sm';
  className?: string;
}

/**
 * Playful "fridge magnet" title. Chunky outlined letters in mixed colors,
 * sitting inside a translucent pill-shaped bubble that hugs the text.
 */
export const BubbleTitle: React.FC<BubbleTitleProps> = ({ text, size = 'lg', className = '' }) => {
  const sizeCls =
    size === 'lg' ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl px-7 sm:px-10 py-3 sm:py-4'
    : size === 'md' ? 'text-3xl sm:text-4xl md:text-5xl px-6 py-2.5'
    : 'text-2xl sm:text-3xl px-5 py-2';

  const strokeWidth = size === 'lg' ? '5px' : size === 'md' ? '4px' : '3px';

  // Skip whitespace from color cycling so palette stays consistent visually.
  let colorIdx = 0;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Translucent pill bubble */}
      <div
        className={`relative ${sizeCls} rounded-full whitespace-nowrap`}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0.18) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -4px 10px rgba(0,0,0,0.18), 0 0 0 3px rgba(255,255,255,0.55)',
        }}
      >
        {/* Glossy top highlight */}
        <span
          aria-hidden
          className="absolute inset-x-4 top-1.5 h-[35%] rounded-full pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))',
          }}
        />
        <h1
          className="relative leading-none text-center font-black"
          style={{
            fontFamily: '"Luckiest Guy", "Fredoka One", cursive',
            letterSpacing: '0.04em',
          }}
        >
          {text.split('').map((ch, i) => {
            if (ch === ' ') {
              return <span key={i} style={{ display: 'inline-block', width: '0.4em' }} />;
            }
            const color = PALETTE[colorIdx % PALETTE.length];
            colorIdx += 1;
            return (
              <span
                key={i}
                style={{
                  color,
                  display: 'inline-block',
                  WebkitTextStroke: `${strokeWidth} #ffffff`,
                  paintOrder: 'stroke fill',
                  textShadow: [
                    '0 0 0 #ffffff',
                    '2px 3px 0 #1e3a8a',
                    '3px 5px 0 rgba(30,58,138,0.85)',
                    '0 8px 12px rgba(0,0,0,0.35)',
                  ].join(', '),
                  transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 2}deg)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </h1>
      </div>
    </div>
  );
};

export default BubbleTitle;
