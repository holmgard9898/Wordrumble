import { useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Tropical / under-the-sea menu background music built with Web Audio API.
 * Uses a pentatonic scale with arpeggiated chords, a soft pad, and a gentle
 * bass line to create a happy, relaxed island-aquatic vibe.
 */
export function useMenuMusic() {
  const { settings } = useSettings();
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const stoppedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!settings.musicEnabled) return;

    stoppedRef.current = false;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(settings.musicVolume * 0.10, ctx.currentTime);
    master.connect(ctx.destination);
    gainRef.current = master;

    // --- Reverb-like effect using delay ---
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.25;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.2;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.3;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(master);

    // Bus for dry + wet
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    bus.connect(delay);

    // --- Musical constants ---
    // C major pentatonic in multiple octaves for a bright tropical feel
    const MELODY_NOTES = [
      523.25, 587.33, 659.25, 783.99, 880.00, // C5 D5 E5 G5 A5
      1046.50, 880.00, 783.99, 659.25, 587.33, // C6 A5 G5 E5 D5
      523.25, 659.25, 783.99, 880.00, 783.99,  // C5 E5 G5 A5 G5
      659.25, 587.33, 523.25, 440.00, 523.25,  // E5 D5 C5 A4 C5
    ];

    const BASS_NOTES = [
      130.81, 130.81, 174.61, 174.61, // C3 C3 F3 F3
      146.83, 146.83, 196.00, 196.00, // D3 D3 G3 G3
      130.81, 130.81, 164.81, 164.81, // C3 C3 E3 E3
      174.61, 196.00, 164.81, 130.81, // F3 G3 E3 C3
    ];

    const PAD_CHORDS = [
      [261.63, 329.63, 392.00], // C E G
      [349.23, 440.00, 523.25], // F A C
      [293.66, 369.99, 440.00], // D F# A
      [196.00, 246.94, 293.66], // G B D
    ];

    let melodyIdx = 0;
    let bassIdx = 0;
    let chordIdx = 0;
    let beat = 0;

    // Play a single tone with envelope
    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      volume: number,
      type: OscillatorType = 'sine',
      target: AudioNode = bus
    ) => {
      if (ctx.state === 'closed' || stoppedRef.current) return;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      env.gain.setValueAtTime(0.001, startTime);
      env.gain.exponentialRampToValueAtTime(volume, startTime + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.02);
      osc.connect(env);
      env.connect(target);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const TEMPO = 320; // ms per beat — relaxed tempo

    const tick = () => {
      if (ctx.state === 'closed' || stoppedRef.current) return;
      const t = ctx.currentTime;

      // Melody — every beat, high sparkling notes
      playTone(MELODY_NOTES[melodyIdx % MELODY_NOTES.length], t, 0.28, 0.18, 'sine');
      melodyIdx++;

      // Sub-melody — octave below, softer, triangle wave for underwater feel
      if (beat % 2 === 0) {
        const subFreq = MELODY_NOTES[(melodyIdx + 3) % MELODY_NOTES.length] / 2;
        playTone(subFreq, t + 0.08, 0.35, 0.08, 'triangle');
      }

      // Bass — every 2 beats
      if (beat % 2 === 0) {
        playTone(BASS_NOTES[bassIdx % BASS_NOTES.length], t, 0.55, 0.15, 'sine');
        bassIdx++;
      }

      // Pad chord — every 8 beats, sustained
      if (beat % 8 === 0) {
        const chord = PAD_CHORDS[chordIdx % PAD_CHORDS.length];
        chord.forEach((freq) => {
          playTone(freq, t, 2.2, 0.04, 'triangle');
        });
        chordIdx++;
      }

      // "Bubble" blip — random high pitched blips for underwater feel
      if (Math.random() < 0.15) {
        const blipFreq = 1200 + Math.random() * 1800;
        playTone(blipFreq, t + 0.1, 0.08, 0.04, 'sine');
      }

      beat++;
      const id = window.setTimeout(tick, TEMPO);
      timeoutsRef.current.push(id);
    };

    tick();

    return () => {
      stoppedRef.current = true;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      ctx.close();
    };
  }, [settings.musicEnabled]);

  // Update volume in real time
  useEffect(() => {
    if (gainRef.current && gainRef.current.context.state !== 'closed') {
      gainRef.current.gain.setValueAtTime(
        settings.musicVolume * 0.10,
        gainRef.current.context.currentTime
      );
    }
  }, [settings.musicVolume]);
}
