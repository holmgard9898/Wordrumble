import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import type { GameMode } from '@/pages/GamePage';

interface GameOverOverlayProps {
  score: number;
  wordsFound: number;
  mode: GameMode;
  onRestart: () => void;
  bestWord?: string | null;
  bestWordScore?: number;
}

export function GameOverOverlay({ score, wordsFound, mode, onRestart, bestWord, bestWordScore }: GameOverOverlayProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const isBomb = mode === 'bomb';
  const isOneWord = mode === 'oneword';
  const [showContent, setShowContent] = useState(false);
  const [explosionPhase, setExplosionPhase] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isBomb) {
      // Explosion phases
      setExplosionPhase(1);
      const t1 = setTimeout(() => setExplosionPhase(2), 400);
      const t2 = setTimeout(() => setExplosionPhase(3), 800);
      const t3 = setTimeout(() => setShowContent(true), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      const t = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(t);
    }
  }, [isBomb]);

  // Play end-screen music
  useEffect(() => {
    if (!showContent || !settings.sfxEnabled) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(settings.sfxVolume * 0.12, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (isBomb) {
      // Somber descending notes
      const notes = [392, 349, 330, 294, 262];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25);
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.25);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.4);
        osc.start(ctx.currentTime + i * 0.25);
        osc.stop(ctx.currentTime + i * 0.25 + 0.4);
      });
    } else {
      // Uplifting major arpeggio
      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.35);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.35);
      });
    }

    return () => { ctx.close(); };
  }, [showContent, isBomb, settings.sfxEnabled, settings.sfxVolume]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />

      {/* Bomb explosion effect */}
      {isBomb && explosionPhase >= 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full"
            style={{
              width: explosionPhase >= 3 ? '200vmax' : explosionPhase >= 2 ? '80vw' : '20vw',
              height: explosionPhase >= 3 ? '200vmax' : explosionPhase >= 2 ? '80vw' : '20vw',
              background: `radial-gradient(circle, 
                rgba(255,200,50,${explosionPhase >= 3 ? 0 : 0.9}) 0%, 
                rgba(255,100,0,${explosionPhase >= 3 ? 0 : 0.7}) 30%, 
                rgba(200,30,0,${explosionPhase >= 3 ? 0 : 0.5}) 60%, 
                transparent 100%)`,
              transition: 'all 0.4s ease-out',
            }}
          />
        </div>
      )}

      {/* Content */}
      {showContent && (
        <div
          className="relative z-10 flex flex-col items-center gap-4 p-8 md:p-12 rounded-3xl animate-scale-in max-w-sm w-full mx-4"
          style={{
            background: isBomb
              ? 'linear-gradient(135deg, rgba(120,20,20,0.95), rgba(60,10,10,0.95))'
              : 'linear-gradient(135deg, rgba(30,60,120,0.95), rgba(20,30,80,0.95))',
            border: `2px solid ${isBomb ? 'rgba(255,100,50,0.4)' : 'rgba(100,180,255,0.3)'}`,
            boxShadow: isBomb
              ? '0 0 60px rgba(255,80,0,0.3), 0 20px 40px rgba(0,0,0,0.5)'
              : '0 0 60px rgba(100,150,255,0.2), 0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          {isBomb ? (
            <div className="text-5xl mb-2">💥</div>
          ) : (
            <div className="text-5xl mb-2">🏆</div>
          )}

          <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
            {isBomb ? 'Game Over!' : isOneWord ? 'Bästa Ord!' : 'Slutresultat'}
          </h2>

          <div className="flex flex-col items-center gap-1">
            <div className="text-5xl md:text-6xl font-bold text-white">{score}</div>
            <div className="text-white/60 text-sm">poäng</div>
          </div>

          {isOneWord && bestWord && (
            <div className="rounded-xl px-4 py-2 text-center" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
              <div className="text-xs text-emerald-300/70 uppercase tracking-wider">Bästa ordet</div>
              <div className="text-xl font-bold text-emerald-300 tracking-widest">{bestWord}</div>
            </div>
          )}

          <div className="text-white/70 text-sm">
            {wordsFound} ord hittade
          </div>

          <div className="flex gap-3 mt-4 w-full">
            <Button
              onClick={onRestart}
              className="flex-1 gap-2"
              variant="outline"
              style={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              <RotateCcw className="w-4 h-4" /> Nytt spel
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="flex-1 gap-2"
              style={{
                background: isBomb
                  ? 'linear-gradient(135deg, hsl(0, 70%, 45%), hsl(0, 60%, 35%))'
                  : 'linear-gradient(135deg, hsl(210, 70%, 50%), hsl(210, 60%, 40%))',
                color: '#fff',
              }}
            >
              <Home className="w-4 h-4" /> Huvudmeny
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
