import { useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export function useBackgroundMusic(playing: boolean) {
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio('/music/background.mp3');
      audio.loop = true;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    audio.volume = settings.musicVolume * 0.5;

    if (playing && settings.musicEnabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [playing, settings.musicEnabled]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicVolume * 0.5;
    }
  }, [settings.musicVolume]);
}
