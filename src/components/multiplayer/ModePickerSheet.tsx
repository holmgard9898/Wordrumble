import { Timer, Zap, Star, Trophy, Lock, Shuffle } from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { useTranslation } from '@/hooks/useTranslation';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useSfx } from '@/hooks/useSfx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export type MatchMode = 'classic' | 'surge' | 'fiveplus' | 'oneword' | 'random';

interface ModePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: MatchMode) => void;
  title?: string;
}

export function ModePickerSheet({ open, onOpenChange, onSelect, title }: ModePickerSheetProps) {
  const { t } = useTranslation();
  const { isModeUnlocked, getUnlockHint } = useGameProgress();
  const { playClick } = useSfx();
  const [lockedMode, setLockedMode] = useState<MatchMode | null>(null);

  const MODES = [
    { id: 'random' as MatchMode, icon: Shuffle, label: t.randomMode, color: '168,85,247', desc: t.randomModeDesc, alwaysUnlocked: true },
    { id: 'classic' as MatchMode, icon: Timer, label: t.modeClassic, color: '59,130,246', desc: t.mpClassicDesc },
    { id: 'surge' as MatchMode, icon: Zap, label: t.modeSurge, color: '234,179,8', desc: t.mpSurgeDesc },
    { id: 'fiveplus' as MatchMode, icon: Star, label: t.modeFiveplus, color: '34,211,238', desc: t.mpFiveplusDesc },
    { id: 'oneword' as MatchMode, icon: Trophy, label: t.longestWord, color: '16,185,129', desc: t.mpOnewordDesc },
  ];

  const lockedModeData = MODES.find(m => m.id === lockedMode);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-[#1a1040] border-purple-500/20">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-white text-center">{title ?? t.chooseGameMode}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3">
            {MODES.map(mode => {
              const locked = !mode.alwaysUnlocked && !isModeUnlocked(mode.id);
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    playClick();
                    if (locked) {
                      setLockedMode(mode.id);
                      return;
                    }
                    onSelect(mode.id);
                    onOpenChange(false);
                  }}
                  className={`w-full rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.98] relative overflow-hidden ${locked ? 'grayscale-[40%]' : ''}`}
                  style={{ background: `rgba(${mode.color},0.15)`, border: `1px solid rgba(${mode.color},0.3)` }}
                >
                  {locked && (
                    <div className="absolute inset-0 z-10 flex items-center justify-end pr-4">
                      <div className="bg-gradient-to-b from-gray-400 to-gray-600 rounded-md p-1.5 shadow-lg border border-gray-500/50">
                        <Lock className="w-4 h-4 text-gray-800" strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                  <div className={`flex items-center gap-3 ${locked ? 'opacity-50' : ''}`}>
                    <mode.icon className="w-5 h-5" style={{ color: `rgb(${mode.color})` }} />
                    <div>
                      <span className="text-white font-semibold">{mode.label}</span>
                      <div className="text-white/50 text-xs">{mode.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={!!lockedMode} onOpenChange={(open) => !open && setLockedMode(null)}>
        <DialogContent className="bg-gray-900/95 border-gray-700 backdrop-blur-xl max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              {lockedModeData?.label ?? t.locked}
            </DialogTitle>
            <DialogDescription className="text-white/70">{t.modeLocked}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {lockedModeData && (
              <div className="flex items-center gap-3 mb-4">
                <lockedModeData.icon className="w-6 h-6" style={{ color: `rgb(${lockedModeData.color})` }} />
                <span className="text-lg font-semibold text-white">{lockedModeData.label}</span>
              </div>
            )}
            <p className="text-white/80 text-sm leading-relaxed">{lockedMode ? getUnlockHint(lockedMode) : ''}</p>
          </div>
          <Button onClick={() => { playClick(); setLockedMode(null); }} variant="ghost" className="w-full gap-2 text-white/80 hover:text-white hover:bg-white/20 bg-white/10 border border-white/20">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
