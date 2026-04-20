import { useCallback, useRef, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

// Module-level shared context so unlock works across all hook instances
let sharedCtx: AudioContext | null = null;
let unlockBound = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return null;
    sharedCtx = new AC();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

function bindUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const unlock = () => {
    const ctx = ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  };
  ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach((ev) =>
    window.addEventListener(ev, unlock, { passive: true })
  );
}

// Simple synthesized sound effects using Web Audio API
export function useSfx() {
  const { settings } = useSettings();

  useEffect(() => { bindUnlock(); }, []);

  const getCtx = useCallback(() => ensureCtx(), []);

  const playPop = useCallback(() => {
    if (!settings.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(settings.sfxVolume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, [settings.sfxEnabled, settings.sfxVolume, getCtx]);

  const playSwap = useCallback(() => {
    if (!settings.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(settings.sfxVolume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, [settings.sfxEnabled, settings.sfxVolume, getCtx]);

  const playWordFound = useCallback(() => {
    if (!settings.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(settings.sfxVolume * 0.2, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
  }, [settings.sfxEnabled, settings.sfxVolume, getCtx]);

  const playClick = useCallback(() => {
    if (!settings.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(settings.sfxVolume * 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [settings.sfxEnabled, settings.sfxVolume, getCtx]);

  const playGameOver = useCallback(() => {
    if (!settings.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const notes = [523, 440, 349, 262];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
      gain.gain.setValueAtTime(settings.sfxVolume * 0.15, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  }, [settings.sfxEnabled, settings.sfxVolume, getCtx]);

  return { playPop, playSwap, playWordFound, playClick, playGameOver };
}
