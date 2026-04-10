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
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const SettingsPage = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { t } = useTranslation();

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-8">{t.settingsTitle}</h1>

      <div className="w-full max-w-sm space-y-6">
        {/* Language */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">{t.languageLabel}</span>
          </div>
          <Select
            value={settings.language}
            onValueChange={(val) => { playClick(); updateSettings({ language: val as GameLanguage }); }}
          >
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
              <SelectValue>
                {(() => {
                  const config = getLanguageConfig(settings.language);
                  return <span className="flex items-center gap-2"><span>{config.flag}</span><span>{config.name}</span></span>;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_LANGUAGES.map((lang) => {
                const config = getLanguageConfig(lang);
                return (
                  <SelectItem key={lang} value={lang}>
                    <span className="flex items-center gap-2"><span>{config.flag}</span><span>{config.name}</span></span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-white/40 text-xs text-center">{t.langChangeNote}</p>
        </div>

        {/* Music */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">{t.music}</span>
            </div>
            <Switch checked={settings.musicEnabled} onCheckedChange={(v) => updateSettings({ musicEnabled: v })} />
          </div>
          {settings.musicEnabled && (
            <Slider dir="ltr" value={[settings.musicVolume * 100]} onValueChange={([v]) => updateSettings({ musicVolume: v / 100 })} max={100} step={1} className="w-full" />
          )}
        </div>

        {/* SFX */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">{t.soundEffects}</span>
            </div>
            <Switch checked={settings.sfxEnabled} onCheckedChange={(v) => updateSettings({ sfxEnabled: v })} />
          </div>
          {settings.sfxEnabled && (
            <Slider dir="ltr" value={[settings.sfxVolume * 100]} onValueChange={([v]) => updateSettings({ sfxVolume: v / 100 })} max={100} step={1} className="w-full" />
          )}
        </div>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> {t.mainMenu}
      </Button>
    </div>
  );
};

export default SettingsPage;
