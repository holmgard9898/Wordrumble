import React, { useId } from 'react';

const ROW_PALETTES: string[][] = [
  ['#3DB8F5', '#22C55E', '#EF4444', '#F59E0B'],            // Word
  ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3DB8F5', '#A855F7'], // Rumble
];

interface BubbleTitleProps {
  /** Either a single string (rendered as one line) or array of lines for multi-line title */
  text?: string;
  lines?: string[];
  size?: 'lg' | 'md' | 'sm';
  className?: string;
}

/**
 * Playful glossy candy title. Renders 1+ rows of chunky letters wrapped in a
 * single gooey blob bubble that hugs the text outline.
 */
export const BubbleTitle: React.FC<BubbleTitleProps> = ({ text, lines, size = 'lg', className = '' }) => {
  const rows = lines ?? (text ? [text] : ['']);
  const filterId = useId().replace(/:/g, '');

  const fontSizeRem =
    size === 'lg' ? { base: 3.25, sm: 4, md: 4.75 }
    : size === 'md' ? { base: 2.5, sm: 3, md: 3.5 }
    : { base: 2, sm: 2.5, md: 2.75 };

  const strokeWidth = size === 'lg' ? 5 : size === 'md' ? 4 : 3;

  return (
    <div className={`relative inline-block ${className}`} style={{ ['--bt-size' as any]: `${fontSizeRem.base}rem` }}>
      <style>{`
        .bt-${filterId} { font-size: ${fontSizeRem.base}rem; }
        @media (min-width: 640px) { .bt-${filterId} { font-size: ${fontSizeRem.sm}rem; } }
        @media (min-width: 768px) { .bt-${filterId} { font-size: ${fontSizeRem.md}rem; } }
      `}</style>

      <div className="relative inline-block px-4 py-2">
        <div className="relative flex flex-col items-center gap-0">
          {rows.map((row, ri) => {
            const palette = ROW_PALETTES[ri] ?? ROW_PALETTES[0];
            let colorIdx = 0;
            return (
              <h1
                key={ri}
                className={`bt-${filterId} relative leading-[1.05] text-center font-normal whitespace-nowrap`}
                style={{
                  fontFamily: '"Bagel Fat One", "Luckiest Guy", "Fredoka One", cursive',
                  letterSpacing: '0.02em',
                  margin: 0,
                }}
              >
                {row.split('').map((ch, i) => {
                  if (ch === ' ') return <span key={i} style={{ display: 'inline-block', width: '0.4em' }} />;
                  const color = palette[colorIdx % palette.length];
                  colorIdx += 1;
                  const rot = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3) * 0.5);
                  const ty = (i % 3) - 1;
                  return (
                    <span
                      key={i}
                      style={{
                        color,
                        display: 'inline-block',
                        WebkitTextStroke: `${strokeWidth}px #ffffff`,
                        paintOrder: 'stroke fill',
                        textShadow: [
                          '0 3px 0 rgba(30,40,90,0.55)',
                          '0 5px 0 rgba(30,40,90,0.35)',
                          '0 10px 16px rgba(0,0,0,0.35)',
                        ].join(', '),
                        transform: `rotate(${rot}deg) translateY(${ty}px)`,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </h1>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BubbleTitle;
