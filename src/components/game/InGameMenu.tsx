import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Volume2, VolumeX, Music, Home } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSfx } from '@/hooks/useSfx';
import { useTranslation } from '@/hooks/useTranslation';

interface InGameMenuProps {
  open: boolean;
  onClose: () => void;
}

export function InGameMenu({ open, onClose }: InGameMenuProps) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl p-6 w-full max-w-xs space-y-4" style={{ background: 'linear-gradient(135deg, hsl(220,40%,18%), hsl(260,35%,22%))' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">{t.pause}</h2>
          <button onClick={() => { playClick(); onClose(); }} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { playClick(); updateSettings({ sfxEnabled: !settings.sfxEnabled }); }}
            className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition-colors"
          >
            {settings.sfxEnabled ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
            <span className="text-white">{t.sound}: {settings.sfxEnabled ? t.on : t.off}</span>
          </button>

          <button
            onClick={() => { playClick(); updateSettings({ musicEnabled: !settings.musicEnabled }); }}
            className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition-colors"
          >
            <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-blue-400' : 'text-red-400'}`} />
            <span className="text-white">{t.music}: {settings.musicEnabled ? t.on : t.off}</span>
          </button>
        </div>

        <div className="pt-3 space-y-2">
          <Button onClick={() => { playClick(); onClose(); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
            {t.continuePlay}
          </Button>
          <Button onClick={() => { playClick(); navigate('/'); }} className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20">
            <Home className="w-4 h-4 mr-2" /> {t.mainMenu}
          </Button>
        </div>
      </div>
    </div>
  );
}
