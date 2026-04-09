import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, Music, Globe } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { AVAILABLE_LANGUAGES, getLanguageConfig } from '@/data/languages';
import type { GameLanguage } from '@/data/languages';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();
  const bg = useGameBackground();

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-8">Inställningar</h1>

      <div className="w-full max-w-sm space-y-6">
        {/* Language */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">Språk / Language</span>
          </div>
          <div className="flex gap-2">
            {AVAILABLE_LANGUAGES.map((lang) => {
              const config = getLanguageConfig(lang);
              const isActive = settings.language === lang;
              return (
                <button
                  key={lang}
                  onClick={() => {
                    playClick();
                    updateSettings({ language: lang });
                  }}
                  className="flex-1 flex flex-col items-center gap-1 rounded-xl py-3 px-2 transition-all"
                  style={{
                    background: isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                    border: isActive ? '2px solid rgba(139,92,246,0.6)' : '2px solid transparent',
                  }}
                >
                  <span className="text-2xl">{config.flag}</span>
                  <span className={`text-xs font-medium ${isActive ? 'text-purple-300' : 'text-white/60'}`}>
                    {config.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-white/40 text-xs text-center">Ändras inte under pågående spel</p>
        </div>

        {/* Music */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">Musik</span>
            </div>
            <Switch
              checked={settings.musicEnabled}
              onCheckedChange={(v) => updateSettings({ musicEnabled: v })}
            />
          </div>
          {settings.musicEnabled && (
            <Slider
              value={[settings.musicVolume * 100]}
              onValueChange={([v]) => updateSettings({ musicVolume: v / 100 })}
              max={100}
              step={1}
              className="w-full"
            />
          )}
        </div>

        {/* SFX */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">Ljudeffekter</span>
            </div>
            <Switch
              checked={settings.sfxEnabled}
              onCheckedChange={(v) => updateSettings({ sfxEnabled: v })}
            />
          </div>
          {settings.sfxEnabled && (
            <Slider
              value={[settings.sfxVolume * 100]}
              onValueChange={([v]) => updateSettings({ sfxVolume: v / 100 })}
              max={100}
              step={1}
              className="w-full"
            />
          )}
        </div>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> Huvudmeny
      </Button>
    </div>
  );
};

export default SettingsPage;
