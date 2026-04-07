import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Volume2, VolumeX, Music, Home } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSfx } from '@/hooks/useSfx';

interface InGameMenuProps {
  open: boolean;
  onClose: () => void;
}

export function InGameMenu({ open, onClose }: InGameMenuProps) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl p-6 w-full max-w-xs space-y-4" style={{ background: 'linear-gradient(135deg, hsl(220,40%,18%), hsl(260,35%,22%))' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">Paus</h2>
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
            <span className="text-white">Ljud: {settings.sfxEnabled ? 'På' : 'Av'}</span>
          </button>

          <button
            onClick={() => { playClick(); updateSettings({ musicEnabled: !settings.musicEnabled }); }}
            className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition-colors"
          >
            <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-blue-400' : 'text-red-400'}`} />
            <span className="text-white">Musik: {settings.musicEnabled ? 'På' : 'Av'}</span>
          </button>
        </div>

        <div className="pt-3 space-y-2">
          <Button onClick={() => { playClick(); onClose(); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
            Fortsätt spela
          </Button>
          <Button onClick={() => { playClick(); navigate('/'); }} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            <Home className="w-4 h-4 mr-2" /> Huvudmeny
          </Button>
        </div>
      </div>
    </div>
  );
}
