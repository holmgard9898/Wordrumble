import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, Home, Music, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useSfx } from '@/hooks/useSfx';

interface InGameMenuProps {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
  returnLabel?: string;
  onForfeit?: () => void;
  hideHomeButton?: boolean;
}

export function InGameMenu({
  open,
  onClose,
  returnPath,
  returnLabel = 'Tillbaka',
  onForfeit,
  hideHomeButton = false,
}: InGameMenuProps) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xs space-y-4 rounded-2xl border border-white/10 bg-card/95 p-6 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-card-foreground">Paus</h2>
          <button onClick={() => { playClick(); onClose(); }} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { playClick(); updateSettings({ sfxEnabled: !settings.sfxEnabled }); }}
            className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:bg-accent"
          >
            {settings.sfxEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-destructive" />}
            <span className="text-foreground">Ljud: {settings.sfxEnabled ? 'På' : 'Av'}</span>
          </button>

          <button
            onClick={() => { playClick(); updateSettings({ musicEnabled: !settings.musicEnabled }); }}
            className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:bg-accent"
          >
            <Music className={`h-5 w-5 ${settings.musicEnabled ? 'text-primary' : 'text-destructive'}`} />
            <span className="text-foreground">Musik: {settings.musicEnabled ? 'På' : 'Av'}</span>
          </button>
        </div>

        <div className="space-y-2 pt-3">
          <Button onClick={() => { playClick(); onClose(); }} className="w-full">
            Fortsätt spela
          </Button>

          {returnPath ? (
            <Button
              onClick={() => {
                playClick();
                onClose();
                navigate(returnPath);
              }}
              variant="outline"
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> {returnLabel}
            </Button>
          ) : null}

          {onForfeit ? (
            <Button
              onClick={() => {
                playClick();
                onClose();
                onForfeit();
              }}
              variant="outline"
              className="w-full gap-2 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <Flag className="h-4 w-4" /> Ge upp matchen
            </Button>
          ) : null}

          {!hideHomeButton ? (
            <Button onClick={() => { playClick(); navigate('/'); }} variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" /> Huvudmeny
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
