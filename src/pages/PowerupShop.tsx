import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useCoins } from '@/hooks/useCoins';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';
import { usePowerupInventory, POWERUP_COST, type PowerupId } from '@/hooks/usePowerupInventory';
import { BubbleTitle } from '@/components/BubbleTitle';
import { BackButton } from '@/components/MenuButton';
import { toast } from 'sonner';

interface PowerupDef {
  id: PowerupId;
  emoji: string;
  nameSv: string;
  nameEn: string;
  descSv: string;
  descEn: string;
  color: string;
}

const POWERUPS: PowerupDef[] = [
  { id: 'swapletter', emoji: '🔤', nameSv: 'Byt bokstav', nameEn: 'Swap letter', descSv: 'Byt bokstav på en bricka under spelet.', descEn: 'Swap a tile’s letter during play.', color: 'rgba(59,130,246,0.85)' },
  { id: 'swapcolor', emoji: '🎨', nameSv: 'Byt färg', nameEn: 'Swap color', descSv: 'Byt färg på en bricka under spelet.', descEn: 'Swap a tile’s color during play.', color: 'rgba(168,85,247,0.85)' },
  { id: 'rocket', emoji: '🚀', nameSv: 'Raket', nameEn: 'Rocket', descSv: 'Skjut upp en raket och spräck en hel kolumn.', descEn: 'Fire a rocket and pop an entire column.', color: 'rgba(99,102,241,0.85)' },
];

const PowerupShop = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { coins, spendCoins } = useCoins();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { inventory, add } = usePowerupInventory();
  const lang = settings.language;

  const buy = (id: PowerupId) => {
    playClick();
    if (spendCoins(POWERUP_COST)) {
      add(id, 1);
      toast.success(lang === 'sv' ? 'Powerup köpt!' : 'Powerup purchased!');
    } else {
      toast.error(lang === 'sv' ? 'För få mynt' : 'Not enough coins');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 ${bg.className}`} style={bg.style}>
      <div className="mb-2 mt-4"><BubbleTitle text={lang === 'sv' ? 'Powerups' : 'Powerups'} size="md" /></div>
      <div className="flex items-center gap-2 mb-6">
        <Coins className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-400 font-bold">{Math.round(coins * 100) / 100} coins</span>
      </div>

      <p className="text-white/70 text-sm text-center max-w-sm mb-6">
        {lang === 'sv'
          ? 'Köp powerups för att använda i äventyrsläget. Varje powerup kostar 100 mynt och förbrukas vid användning.'
          : 'Buy powerups to use in Adventure mode. Each powerup costs 100 coins and is consumed on use.'}
      </p>

      <div className="w-full max-w-md flex flex-col gap-3">
        {POWERUPS.map(p => {
          const owned = inventory[p.id] ?? 0;
          const canAfford = coins >= POWERUP_COST;
          return (
            <div key={p.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ background: p.color }}>
                {p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{lang === 'sv' ? p.nameSv : p.nameEn}</div>
                <div className="text-white/60 text-xs leading-tight">{lang === 'sv' ? p.descSv : p.descEn}</div>
                <div className="text-white/80 text-xs mt-1">
                  {lang === 'sv' ? 'Du äger:' : 'Owned:'} <span className="font-bold text-white">{owned}</span>
                </div>
              </div>
              <Button
                onClick={() => buy(p.id)}
                disabled={!canAfford}
                className="gap-1 shrink-0"
                style={{ background: canAfford ? 'rgba(139,92,246,0.9)' : 'rgba(100,100,100,0.5)' }}
              >
                <Plus className="w-4 h-4" />
                <Coins className="w-3.5 h-3.5 text-yellow-300" />
                <span className="font-bold">{POWERUP_COST}</span>
              </Button>
            </div>
          );
        })}
      </div>

      <BackButton onClick={() => { playClick(); navigate('/shop'); }} icon={<ArrowLeft className="w-4 h-4" />} label={t.shop} className="mt-8" />
    </div>
  );
};

export default PowerupShop;
