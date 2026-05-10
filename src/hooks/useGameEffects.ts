import { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useSettings } from '@/contexts/SettingsContext';
import { BUBBLE_COLOR_STYLES, type BubbleColor, type Position } from '@/data/gameConstants';

// Audio files live in /public/audio/voice/ and are served from site root.
const FIRE_VOICES = ['/audio/voice/on_fire.mp3', '/audio/voice/word_god.mp3', '/audio/voice/fantastic.mp3'];
const COMBO_VOICES = ['/audio/voice/excellent.mp3', '/audio/voice/amazing.mp3', '/audio/voice/incredible.mp3'];

const FIRE_WINDOW_MOVES = 7;
const FIRE_MIN_WORDS = 3;
const FIRE_MIN_SCORE = 26; // > 25
const FIRE_DURATION_MS = 10_000;

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
  const { lastWordEvent, movesUsed, getCellRect, containerEl } = opts;
  const { settings } = useSettings();
  const lastIdRef = useRef<number>(0);
  const movesRef = useRef<number>(movesUsed);
  movesRef.current = movesUsed;

  // Sliding window of word events (per move)
  const windowRef = useRef<{ move: number; score: number }[]>([]);
  const [fireMode, setFireMode] = useState(false);
  const fireTimerRef = useRef<number | null>(null);
  const [lightning, setLightning] = useState<LightningEvent | null>(null);

  const playVoice = useCallback((url: string) => {
    if (!settings.sfxEnabled) return;
    try {
      const a = new Audio(url);
      a.volume = Math.min(1, settings.sfxVolume * 0.9);
      void a.play().catch(() => {});
    } catch {}
  }, [settings.sfxEnabled, settings.sfxVolume]);

  const triggerFire = useCallback(() => {
    setFireMode(true);
    playVoice(FIRE_VOICES[Math.floor(Math.random() * FIRE_VOICES.length)]);
    if (fireTimerRef.current != null) window.clearTimeout(fireTimerRef.current);
    fireTimerRef.current = window.setTimeout(() => setFireMode(false), FIRE_DURATION_MS);
  }, [playVoice]);

  // Reset on game reset (movesUsed reset to 0 from non-zero)
  const prevMovesRef = useRef(movesUsed);
  useEffect(() => {
    if (movesUsed === 0 && prevMovesRef.current !== 0) {
      windowRef.current = [];
      setFireMode(false);
      setLightning(null);
      if (fireTimerRef.current != null) window.clearTimeout(fireTimerRef.current);
    }
    prevMovesRef.current = movesUsed;
  }, [movesUsed]);

  // Process new word events
  useEffect(() => {
    if (!lastWordEvent) return;
    if (lastWordEvent.id === lastIdRef.current) return;
    lastIdRef.current = lastWordEvent.id;

    const move = movesRef.current;
    // Add to sliding window, prune
    windowRef.current.push({ move, score: lastWordEvent.score });
    windowRef.current = windowRef.current.filter(
      (e) => move - e.move < FIRE_WINDOW_MOVES,
    );

    const len = lastWordEvent.length;

    // ─── Confetti for 8+ ───
    if (len >= 8 && containerEl) {
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
        // Secondary burst
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
      // Combo voice
      playVoice(COMBO_VOICES[Math.floor(Math.random() * COMBO_VOICES.length)]);
    } else if (len === 7) {
      // ─── Lightning for 7 ───
      setLightning({
        id: lastWordEvent.id,
        positions: lastWordEvent.positions,
        color: lastWordEvent.color,
      });
      window.setTimeout(() => {
        setLightning((cur) => (cur && cur.id === lastWordEvent.id ? null : cur));
      }, 900);
    }

    // ─── Fire mode check ───
    if (!fireMode) {
      const sum = windowRef.current.reduce((a, b) => a + b.score, 0);
      if (windowRef.current.length >= FIRE_MIN_WORDS && sum > FIRE_MIN_SCORE - 1) {
        triggerFire();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWordEvent?.id]);

  return { fireMode, lightning };
}

export function getColorHex(color: BubbleColor): string {
  return BUBBLE_COLOR_STYLES[color].bg;
}
