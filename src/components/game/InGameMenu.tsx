import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Volume2, Music, Home, Map as MapIcon } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSfx } from '@/hooks/useSfx';
import { useTranslation } from '@/hooks/useTranslation';

interface InGameMenuProps {
  open: boolean;
  onClose: () => void;
  /** When provided, shows a "Back to map" button (used in adventure mode). */
  onBackToMap?: () => void;
}

export function InGameMenu({ open, onClose, onBackToMap }: InGameMenuProps) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="rounded-2xl p-6 w-full max-w-xs space-y-5" style={{ background: 'linear-gradient(135deg, hsl(220,40%,18%), hsl(260,35%,22%))' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t.pause}</h2>
          <button onClick={() => { playClick(); onClose(); }} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Music */}
        <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-blue-400' : 'text-white/40'}`} />
              <span className="text-white text-sm font-medium">{t.music}</span>
            </div>
            <Switch checked={settings.musicEnabled} onCheckedChange={(v) => updateSettings({ musicEnabled: v })} />
          </div>
          {settings.musicEnabled && (
            <Slider dir="ltr" value={[settings.musicVolume * 100]} onValueChange={([v]) => updateSettings({ musicVolume: v / 100 })} max={100} step={1} className="w-full" />
          )}
        </div>

        {/* SFX */}
        <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className={`w-5 h-5 ${settings.sfxEnabled ? 'text-green-400' : 'text-white/40'}`} />
              <span className="text-white text-sm font-medium">{t.soundEffects}</span>
            </div>
            <Switch checked={settings.sfxEnabled} onCheckedChange={(v) => updateSettings({ sfxEnabled: v })} />
          </div>
          {settings.sfxEnabled && (
            <Slider dir="ltr" value={[settings.sfxVolume * 100]} onValueChange={([v]) => updateSettings({ sfxVolume: v / 100 })} max={100} step={1} className="w-full" />
          )}
        </div>

        <div className="space-y-2 pt-1">
          <Button onClick={() => { playClick(); onClose(); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
            {t.continuePlay}
          </Button>
          {onBackToMap && (
            <Button onClick={() => { playClick(); onBackToMap(); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              <MapIcon className="w-4 h-4 mr-2" /> {t.adventureBackToMap}
            </Button>
          )}
          <Button onClick={() => { playClick(); navigate('/'); }} className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20">
            <Home className="w-4 h-4 mr-2" /> {t.mainMenu}
          </Button>
        </div>
      </div>
    </div>
  );
}
