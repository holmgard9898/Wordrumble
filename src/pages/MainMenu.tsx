import { useNavigate } from 'react-router-dom';
import { Gamepad2, Swords, ShoppingBag, BarChart3, Settings, Map } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';
import { MenuButton } from '@/components/MenuButton';
import logoUrl from '@/assets/word-rumble-logo.png';

const MainMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { t } = useTranslation();

  const go = (path: string) => { playClick(); navigate(path); };

  return (
    <div
      className={`h-[100dvh] overflow-hidden flex flex-col items-center justify-end pt-[6vh] pb-[14vh] px-4 ${bg.className}`}
      style={{ ...bg.style, backgroundPosition: 'center 55%', backgroundSize: 'cover' }}
    >
      {/* Här har jag ändrat mt-[22vh] till mt-[30vh] för att sänka loggan */}
      <div className="w-full max-w-[16rem] sm:max-w-[18rem] flex justify-center mt-[40vh] mb-[10vh]">
        <img
          src={logoUrl}
          alt="Word Rumble"
          className="w-full h-auto select-none pointer-events-none drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
          draggable={false}
        />
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <MenuButton onClick={() => go('/play')} icon={<Gamepad2 className="w-5 h-5" />} label={t.play} gradient="blue" />
        <MenuButton onClick={() => go('/challenge')} icon={<Swords className="w-5 h-5" />} label={t.challenge} gradient="red" />
        <MenuButton onClick={() => go('/adventure')} icon={<Map className="w-5 h-5" />} label={t.adventureTitle} gradient="amber" />
        <MenuButton onClick={() => go('/shop')} icon={<ShoppingBag className="w-5 h-5" />} label={t.shop} gradient="green" />
        <div className="grid grid-cols-2 gap-3 mt-1">
          <MenuButton onClick={() => go('/statistics')} icon={<BarChart3 className="w-4 h-4" />} label={t.statistics} gradient="purple" size="md" />
          <MenuButton onClick={() => go('/settings')} icon={<Settings className="w-4 h-4" />} label={t.settingsTitle} gradient="purple" size="md" />
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
