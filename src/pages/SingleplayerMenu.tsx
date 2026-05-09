import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Timer, Zap, Bomb, Hash, Target, HelpCircle, Lock } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useSettings } from '@/contexts/SettingsContext';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useTranslation } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BubbleTitle } from '@/components/BubbleTitle';
import { BackButton } from '@/components/MenuButton';

interface ModeData {
  path: string;
  mode: string;
  icon: React.ReactNode;
  name: string;
  desc: string;
  bg: string;
  border: string;
  infoKey: 'infoClassic' | 'infoSurge' | 'infoFiveplus' | 'infoOneword' | 'infoBomb';
}

const LockOverlay = () => (
  <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
    <div className="bg-gradient-to-b from-gray-400 to-gray-600 rounded-md p-1.5 shadow-lg border border-gray-500/50">
      <Lock className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
    </div>
  </div>
);

const SingleplayerMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { settings } = useSettings();
  const { t, ta } = useTranslation();
  const isClouds = settings.background === 'clouds';
  const isCosmic = settings.background === 'default';
  const [expandedMode, setExpandedMode] = useState<string | null>(null);
  const [lockedDialog, setLockedDialog] = useState<string | null>(null);
  const { isModeUnlocked, getUnlockHint } = useGameProgress();

  const go = (path: string, mode: string) => {
    if (!isModeUnlocked(mode)) { playClick(); setLockedDialog(mode); return; }
    playClick(); navigate(path);
  };

  // Solid candy palette per mode (top → base → bottom + border)
  const TONE = {
    blue:   { top: '#5BA8FF', base: '#2F7FE6', bottom: '#1E5BB8', border: '#164785' },
    amber:  { top: '#F8C24A', base: '#E8A322', bottom: '#B57A10', border: '#8A5C0A' },
    cyan:   { top: '#4FD3E0', base: '#1FAFC0', bottom: '#137985', border: '#0D5A63' },
    green:  { top: '#5FCB6B', base: '#34A745', bottom: '#247A30', border: '#1A5A23' },
    red:    { top: '#F46B6B', base: '#DB3B3B', bottom: '#A52424', border: '#7A1A1A' },
  } as const;
  const styleFor = (k: keyof typeof TONE) => {
    const t = TONE[k];
    const bg = isCosmic
      ? `linear-gradient(180deg, ${t.top}cc 0%, ${t.base}cc 55%, ${t.bottom}cc 100%)`
      : `linear-gradient(180deg, ${t.top} 0%, ${t.base} 55%, ${t.bottom} 100%)`;
    return {
      background: bg,
      border: `2px solid ${t.border}`,
      boxShadow: `inset 0 -4px 0 ${t.bottom}, inset 0 2px 0 rgba(255,255,255,0.30), 0 4px 0 ${t.border}, 0 8px 14px rgba(0,0,0,0.30)`,
      backdropFilter: isCosmic ? 'blur(6px)' as const : undefined,
    };
  };

  const modes: (ModeData & { tone: keyof typeof TONE })[] = [
    { path: '/game/classic', mode: 'classic', icon: <Timer className="w-6 h-6 text-white drop-shadow" />, name: t.modeClassic, desc: t.descClassic, bg: '', border: '', infoKey: 'infoClassic', tone: 'blue' },
    { path: '/game/surge', mode: 'surge', icon: <Zap className="w-6 h-6 text-white drop-shadow" />, name: t.modeSurge, desc: t.descSurge, bg: '', border: '', infoKey: 'infoSurge', tone: 'amber' },
    { path: '/game/fiveplus', mode: 'fiveplus', icon: <Hash className="w-6 h-6 text-white drop-shadow" />, name: t.modeFiveplus, desc: t.descFiveplus, bg: '', border: '', infoKey: 'infoFiveplus', tone: 'cyan' },
    { path: '/game/oneword', mode: 'oneword', icon: <Target className="w-6 h-6 text-white drop-shadow" />, name: t.modeOneword, desc: t.descOneword, bg: '', border: '', infoKey: 'infoOneword', tone: 'green' },
    { path: '/game/bomb', mode: 'bomb', icon: <Bomb className="w-6 h-6 text-white drop-shadow" />, name: t.modeBomb, desc: t.descBomb, bg: '', border: '', infoKey: 'infoBomb', tone: 'red' },
  ];

  const expanded = modes.find((m) => m.path === expandedMode);
  const lockedMode = modes.find((m) => m.mode === lockedDialog);

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-start pt-3 pb-20 px-4 ${bg.className}`} style={bg.style}>
      {isClouds && <div className="fixed inset-0 bg-black/30 pointer-events-none" />}
      <div className="relative z-10 flex flex-col items-center w-full pb-12">
        <div className="transition-all duration-300" style={{ maxHeight: expanded ? 0 : 160, opacity: expanded ? 0 : 1, marginBottom: expanded ? 0 : undefined }}>
          <div className="mb-1"><BubbleTitle text={t.singleplayer} size="md" /></div>
          <p className="text-white/90 mb-2 mt-0 drop-shadow text-center font-medium">{t.chooseMode}</p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          {modes.map((m) => {
            const isExpanded = expandedMode === m.path;
            const isHidden = expanded && !isExpanded;
            const locked = !isModeUnlocked(m.mode);

            return (
              <div key={m.path} className="transition-all duration-300 overflow-hidden" style={{ maxHeight: isHidden ? 0 : 600, opacity: isHidden ? 0 : 1, marginBottom: isHidden ? -16 : undefined, transform: isHidden ? 'scale(0.95)' : 'scale(1)' }}>
                {!isExpanded ? (
                  <button onClick={() => go(m.path, m.mode)} className={`rounded-3xl p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] w-full relative overflow-hidden ${locked ? 'grayscale-[40%]' : ''}`} style={styleFor(m.tone)}>
                    {locked && <LockOverlay />}
                    <div className={`flex items-center gap-3 mb-2 ${locked ? 'opacity-60' : ''}`}>
                      {m.icon}
                      <span className="text-xl font-bold text-white" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.35)' }}>{m.name}</span>
                    </div>
                    <p className={`text-white/95 text-sm font-medium pr-8 ${locked ? 'opacity-50' : ''}`} style={{ textShadow: '0 1px 0 rgba(0,0,0,0.30)' }}>{m.desc}</p>
                    {!locked && (
                      <div onClick={(e) => { e.stopPropagation(); playClick(); setExpandedMode(m.path); }} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/25 hover:bg-white/40 transition-colors cursor-pointer z-30 ring-1 ring-white/40">
                        <HelpCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="rounded-3xl p-5 w-full animate-in fade-in zoom-in-95 duration-300" style={styleFor(m.tone)}>
                    <div className="flex items-center gap-3 mb-4">
                      {m.icon}
                      <span className="text-xl font-bold text-white drop-shadow">{m.name}</span>
                    </div>
                    <div className="space-y-2 mb-5">
                      {ta(m.infoKey).map((line, i) => (
                        <p key={i} className={`text-sm text-white/85 drop-shadow-sm ${line.startsWith('•') ? 'pl-3 text-white/70' : 'font-medium'}`}>{line}</p>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => { playClick(); setExpandedMode(null); }} variant="ghost" className="flex-1 gap-2 text-white/80 hover:text-white hover:bg-white/20 bg-white/10 border border-white/20">
                        <ArrowLeft className="w-4 h-4" /> {t.back}
                      </Button>
                      <Button onClick={() => go(m.path, m.mode)} className="flex-1 gap-2 text-white font-bold bg-white/20 hover:bg-white/30 border border-white/30">
                        {t.play}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="transition-all duration-300 overflow-hidden" style={{ maxHeight: expanded ? 0 : 60, opacity: expanded ? 0 : 1 }}>
          <BackButton onClick={() => go('/', 'classic')} icon={<ArrowLeft className="w-4 h-4" />} label={t.mainMenu} className="mt-3" />
        </div>
      </div>

      <Dialog open={!!lockedDialog} onOpenChange={(open) => !open && setLockedDialog(null)}>
        <DialogContent className="bg-gray-900/95 border-gray-700 backdrop-blur-xl max-w-xs rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              {lockedMode?.name ?? t.locked}
            </DialogTitle>
            <DialogDescription className="text-white/70">{t.modeLocked}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center gap-3 mb-4">
              {lockedMode?.icon}
              <span className="text-lg font-semibold text-white">{lockedMode?.name}</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{lockedDialog ? getUnlockHint(lockedDialog) : ''}</p>
          </div>
          <Button onClick={() => { playClick(); setLockedDialog(null); }} variant="ghost" className="w-full gap-2 text-white/80 hover:text-white hover:bg-white/20 bg-white/10 border border-white/20">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SingleplayerMenu;
