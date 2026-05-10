import { ReactNode } from 'react';

interface Props {
  active: boolean;
  children: ReactNode;
}

/** Wraps the gameplay column with an animated burning-red border when fire-mode is on. */
export function FireModeFrame({ active, children }: Props) {
  return (
    <div className="relative w-full">
      {active && (
        <>
          <div
            className="pointer-events-none absolute -inset-2 rounded-2xl z-0"
            style={{
              boxShadow:
                '0 0 0 3px hsl(15, 100%, 55%), 0 0 24px 6px hsl(20, 100%, 55%), inset 0 0 24px 4px hsla(15, 100%, 55%, 0.45)',
              animation: 'fire-pulse 1.2s ease-in-out infinite',
            }}
          />
          {/* Flickering flame tongues along edges */}
          <div
            className="pointer-events-none absolute -inset-3 rounded-3xl z-0 opacity-80"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, hsla(20,100%,55%,0.55), transparent 55%),' +
                'radial-gradient(ellipse at 50% 100%, hsla(20,100%,55%,0.55), transparent 55%),' +
                'radial-gradient(ellipse at 0% 50%, hsla(20,100%,55%,0.45), transparent 55%),' +
                'radial-gradient(ellipse at 100% 50%, hsla(20,100%,55%,0.45), transparent 55%)',
              filter: 'blur(6px)',
              animation: 'fire-flicker 0.45s ease-in-out infinite alternate',
            }}
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
