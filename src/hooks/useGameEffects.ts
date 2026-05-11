import { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useSettings } from '@/contexts/SettingsContext';
import { BUBBLE_COLOR_STYLES, type BubbleColor, type Position } from '@/data/gameConstants';

// Audio files live in /public/audio/voice/ and are served from site root.
const COMBO_VOICES = ['/audio/voice/excellent.mp3', '/audio/voice/amazing.mp3', '/audio/voice/incredible.mp3'];

type WordEvent = {
  id: number;
  word: string;
  length: number;
  color: BubbleColor;
  score: number;
  positions: Position[];
} | null;

export type LightningEvent = {
  id: number;
  positions: Position[];
  color: BubbleColor;
};

type GetCellRect = (row: number, col: number) => DOMRect | null;

export function useGameEffects(opts: {
  lastWordEvent: WordEvent;
  movesUsed: number;
  getCellRect: GetCellRect;
  containerEl: HTMLElement | null;
}) {
  const { lastWordEvent, movesUsed, getCellRect } = opts;
  const { settings } = useSettings();
  const lastIdRef = useRef<number>(0);
  const [lightning, setLightning] = useState<LightningEvent | null>(null);

  const playVoice = useCallback((url: string) => {
    if (!settings.sfxEnabled) return;
    try {
      const a = new Audio(url);
      a.volume = Math.min(1, settings.sfxVolume * 0.9);
      void a.play().catch(() => {});
    } catch {}
  }, [settings.sfxEnabled, settings.sfxVolume]);

  // Reset on game reset
  const prevMovesRef = useRef(movesUsed);
  useEffect(() => {
    if (movesUsed === 0 && prevMovesRef.current !== 0) {
      setLightning(null);
    }
    prevMovesRef.current = movesUsed;
  }, [movesUsed]);

  // Process new word events
  useEffect(() => {
    if (!lastWordEvent) return;
    if (lastWordEvent.id === lastIdRef.current) return;
    lastIdRef.current = lastWordEvent.id;

    const len = lastWordEvent.length;

    // ─── Confetti for 8+ ───
    if (len >= 8) {
      const positions = lastWordEvent.positions;
      const center = positions[Math.floor(positions.length / 2)];
      const rect = getCellRect(center.row, center.col);
      if (rect) {
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        const wordColors = ['#ff3b6b', '#ffd13b', '#3bc7ff', '#3bff7a', '#c63bff', '#ff8a3b'];
        confetti({
          particleCount: 110,
          spread: 80,
          startVelocity: 55,
          origin: { x, y: Math.min(0.95, y + 0.05) },
          colors: wordColors,
          scalar: 1.1,
          ticks: 220,
        });
        window.setTimeout(() => {
          confetti({
            particleCount: 70,
            spread: 120,
            startVelocity: 35,
            gravity: 0.7,
            origin: { x, y: Math.max(0.05, y - 0.05) },
            colors: wordColors,
            scalar: 0.9,
            ticks: 260,
          });
        }, 220);
      }
      playVoice(COMBO_VOICES[Math.floor(Math.random() * COMBO_VOICES.length)]);
    } else if (len === 7) {
      setLightning({
        id: lastWordEvent.id,
        positions: lastWordEvent.positions,
        color: lastWordEvent.color,
      });
      window.setTimeout(() => {
        setLightning((cur) => (cur && cur.id === lastWordEvent.id ? null : cur));
      }, 900);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWordEvent?.id]);

  return { lightning };
}

export function getColorHex(color: BubbleColor): string {
  return BUBBLE_COLOR_STYLES[color].bg;
}
