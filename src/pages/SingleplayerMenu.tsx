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
  const [expandedMode, setExpandedMode] = useState<string | null>(null);
  const [lockedDialog, setLockedDialog] = useState<string | null>(null);
  const { isModeUnlocked, getUnlockHint } = useGameProgress();

  const go = (path: string, mode: string) => {
    if (!isModeUnlocked(mode)) { playClick(); setLockedDialog(mode); return; }
    playClick(); navigate(path);
  };

  const modes: ModeData[] = [
    { path: '/game/classic', mode: 'classic', icon: <Timer className="w-6 h-6 text-blue-400" />, name: t.modeClassic, desc: t.descClassic, bg: 'rgba(59,130,246,0.35)', border: 'rgba(59,130,246,0.5)', infoKey: 'infoClassic' },
    { path: '/game/surge', mode: 'surge', icon: <Zap className="w-6 h-6 text-yellow-400" />, name: t.modeSurge, desc: t.descSurge, bg: 'rgba(234,179,8,0.35)', border: 'rgba(234,179,8,0.5)', infoKey: 'infoSurge' },
    { path: '/game/fiveplus', mode: 'fiveplus', icon: <Hash className="w-6 h-6 text-cyan-400" />, name: t.modeFiveplus, desc: t.descFiveplus, bg: 'rgba(34,211,238,0.35)', border: 'rgba(34,211,238,0.5)', infoKey: 'infoFiveplus' },
    { path: '/game/oneword', mode: 'oneword', icon: <Target className="w-6 h-6 text-emerald-400" />, name: t.modeOneword, desc: t.descOneword, bg: 'rgba(16,185,129,0.35)', border: 'rgba(16,185,129,0.5)', infoKey: 'infoOneword' },
    { path: '/game/bomb', mode: 'bomb', icon: <Bomb className="w-6 h-6 text-red-400" />, name: t.modeBomb, desc: t.descBomb, bg: 'rgba(239,68,68,0.35)', border: 'rgba(239,68,68,0.5)', infoKey: 'infoBomb' },
  ];

  const expanded = modes.find((m) => m.path === expandedMode);
  const lockedMode = modes.find((m) => m.mode === lockedDialog);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      {isClouds && <div className="fixed inset-0 bg-black/30 pointer-events-none" />}
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="transition-all duration-300 overflow-hidden" style={{ maxHeight: expanded ? 0 : 80, opacity: expanded ? 0 : 1, marginBottom: expanded ? 0 : undefined }}>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{t.singleplayer}</h1>
          <p className="text-white/60 mb-8 drop-shadow">{t.chooseMode}</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {modes.map((m) => {
            const isExpanded = expandedMode === m.path;
            const isHidden = expanded && !isExpanded;
            const locked = !isModeUnlocked(m.mode);

            return (
              <div key={m.path} className="transition-all duration-300 overflow-hidden" style={{ maxHeight: isHidden ? 0 : 600, opacity: isHidden ? 0 : 1, marginBottom: isHidden ? -16 : undefined, transform: isHidden ? 'scale(0.95)' : 'scale(1)' }}>
                {!isExpanded ? (
                  <button onClick={() => go(m.path, m.mode)} className={`rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md w-full relative overflow-hidden ${locked ? 'grayscale-[40%]' : ''}`} style={{ background: isClouds ? m.bg.replace('0.35', '0.55') : m.bg, border: `1px solid ${m.border}` }}>
                    {locked && <LockOverlay />}
                    <div className={`flex items-center gap-3 mb-2 ${locked ? 'opacity-60' : ''}`}>
                      {m.icon}
                      <span className="text-xl font-bold text-white drop-shadow">{m.name}</span>
                    </div>
                    <p className={`text-white/70 text-sm font-medium drop-shadow-sm pr-8 ${locked ? 'opacity-50' : ''}`}>{m.desc}</p>
                    {!locked && (
                      <div onClick={(e) => { e.stopPropagation(); playClick(); setExpandedMode(m.path); }} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/30 transition-colors cursor-pointer z-30">
                        <HelpCircle className="w-4 h-4 text-white/80" />
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="rounded-2xl p-5 backdrop-blur-md w-full animate-in fade-in zoom-in-95 duration-300" style={{ background: isClouds ? m.bg.replace('0.35', '0.55') : m.bg, border: `1px solid ${m.border}` }}>
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
          <Button onClick={() => go('/', 'classic')} variant="ghost" className="mt-8 gap-2 text-white/80 hover:text-white hover:bg-white/20 bg-white/10 border border-white/20 drop-shadow">
            <ArrowLeft className="w-4 h-4" /> {t.mainMenu}
          </Button>
        </div>
      </div>

      <Dialog open={!!lockedDialog} onOpenChange={(open) => !open && setLockedDialog(null)}>
        <DialogContent className="bg-gray-900/95 border-gray-700 backdrop-blur-xl max-w-xs rounded-2xl">
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
