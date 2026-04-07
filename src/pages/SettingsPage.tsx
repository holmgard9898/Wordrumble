import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, Music } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSfx } from '@/hooks/useSfx';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 game-bg">
      <h1 className="text-4xl font-bold text-white mb-8">Inställningar</h1>

      <div className="w-full max-w-sm space-y-6">
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
