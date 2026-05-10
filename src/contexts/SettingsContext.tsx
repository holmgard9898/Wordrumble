import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AVAILABLE_LANGUAGES, type GameLanguage } from '@/data/languages';

function detectBrowserLanguage(): GameLanguage {
  try {
    const langs = (typeof navigator !== 'undefined' && navigator.languages?.length)
      ? navigator.languages
      : [typeof navigator !== 'undefined' ? navigator.language : 'en'];
    for (const l of langs) {
      const code = l.toLowerCase().split('-')[0] as GameLanguage;
      if (AVAILABLE_LANGUAGES.includes(code)) return code;
    }
  } catch {}
  return 'en';
}

export type GameBackground =
  | 'default' | 'storybook' | 'clouds' | 'wood' | 'space' | 'volcano' | 'beach'
  | 'underwater' | 'shipwreck' | 'cave' | 'city' | 'moon';
export type TileStyle = 'bubble' | 'rubik' | 'shapes' | 'soapbubble' | 'sports';

interface Settings {
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  language: GameLanguage;
  background: GameBackground;
  tileStyle: TileStyle;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  musicEnabled: true,
  sfxEnabled: true,
  language: 'en',
  background: 'storybook',
  tileStyle: 'bubble',
};

function getInitialSettings(): Settings {
  try {
    const saved = localStorage.getItem('wr-settings');
    if (saved) {
      return { ...defaultSettings, language: detectBrowserLanguage(), ...JSON.parse(saved) };
    }
  } catch {}
  return { ...defaultSettings, language: detectBrowserLanguage() };
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(getInitialSettings);

  useEffect(() => {
    localStorage.setItem('wr-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
