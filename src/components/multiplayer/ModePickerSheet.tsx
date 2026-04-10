import { Timer, Zap, Star, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export type MatchMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

const MODES = [
  { id: 'classic' as MatchMode, icon: Timer, label: 'Classic', color: '59,130,246', desc: '2 omgångar, 50 drag var' },
  { id: 'surge' as MatchMode, icon: Zap, label: 'Word Surge', color: '234,179,8', desc: '3 omgångar, bonus för långa ord' },
  { id: 'fiveplus' as MatchMode, icon: Star, label: '5+ Bokstäver', color: '34,211,238', desc: '2 omgångar, min 5 bokstäver' },
  { id: 'oneword' as MatchMode, icon: Trophy, label: 'Längsta Ordet', color: '16,185,129', desc: '2 omgångar, bästa ord räknas' },
];

interface ModePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: MatchMode) => void;
  title?: string;
}

export function ModePickerSheet({ open, onOpenChange, onSelect, title = 'Välj spelläge' }: ModePickerSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#1a1040] border-purple-500/20">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-white text-center">{title}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-3">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => { onSelect(mode.id); onOpenChange(false); }}
              className="w-full rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.98]"
              style={{ background: `rgba(${mode.color},0.15)`, border: `1px solid rgba(${mode.color},0.3)` }}
            >
              <div className="flex items-center gap-3">
                <mode.icon className="w-5 h-5" style={{ color: `rgb(${mode.color})` }} />
                <div>
                  <span className="text-white font-semibold">{mode.label}</span>
                  <div className="text-white/50 text-xs">{mode.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
