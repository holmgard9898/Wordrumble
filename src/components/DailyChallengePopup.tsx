import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Play, Star, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useSfx } from '@/hooks/useSfx';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { STAR_REWARDS } from '@/data/dailyChallenges';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyChallengePopup({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { playClick } = useSfx();
  const { challenge } = useDailyChallenge();
  const sv = settings.language === 'sv';

  const play = () => {
    playClick();
    onOpenChange(false);
    navigate('/daily');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-3xl border-white/10 p-0 overflow-hidden" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="px-6 pt-6 pb-2 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(236,72,153,0.2))' }}>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] uppercase tracking-wider text-amber-200 font-semibold">{sv ? 'Daglig utmaning' : 'Daily Challenge'}</span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">{sv ? challenge.titleSv : challenge.titleEn}</DialogTitle>
            <DialogDescription className="text-white/80 text-sm pt-2">{sv ? challenge.goalSv : challenge.goalEn}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4">
          <div className="flex justify-around mb-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div className="flex">
                  {Array.from({ length: n }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-yellow-300 font-semibold">
                  <Coins className="w-3 h-3" /> {STAR_REWARDS[n as 1 | 2 | 3]}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={play} className="w-full gap-2" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(236,72,153,0.9))' }}>
              <Play className="w-4 h-4" /> {sv ? 'Spela' : 'Play'}
            </Button>
            <Button onClick={() => { playClick(); onOpenChange(false); }} variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10">
              {sv ? 'Senare' : 'Later'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
