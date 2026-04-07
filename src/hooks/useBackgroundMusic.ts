import { useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

// Simple background music using Web Audio API oscillators
export function useBackgroundMusic(playing: boolean) {
  const { settings } = useSettings();
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || !settings.musicEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(settings.musicVolume * 0.08, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    const melody = [262, 294, 330, 349, 330, 294, 262, 330, 349, 392, 349, 330];
    let noteIndex = 0;

    const playNote = () => {
      if (ctx.state === 'closed') return;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(melody[noteIndex % melody.length], ctx.currentTime);
      noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      noteIndex++;
    };

    intervalRef.current = window.setInterval(playNote, 500);
    playNote();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctx.close();
    };
  }, [playing, settings.musicEnabled, settings.musicVolume]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(settings.musicVolume * 0.08, gainRef.current.context.currentTime);
    }
  }, [settings.musicVolume]);
}
