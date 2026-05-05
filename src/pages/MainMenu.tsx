import { useNavigate } from 'react-router-dom';
import { Gamepad2, Swords, ShoppingBag, BarChart3, Settings, Map } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';
import { BubbleTitle } from '@/components/BubbleTitle';
import { MenuButton } from '@/components/MenuButton';

const MainMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { t } = useTranslation();

  const go = (path: string) => { playClick(); navigate(path); };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      {/* Bubble title — single line, hugs text */}
      <div className="relative mb-10">
        <span aria-hidden className="absolute -top-3 left-2 text-yellow-300 text-2xl drop-shadow">✦</span>
        <span aria-hidden className="absolute -top-1 right-4 text-yellow-300 text-xl drop-shadow">✧</span>
        <span aria-hidden className="absolute bottom-0 -right-2 text-yellow-300 text-lg drop-shadow">✦</span>
        <BubbleTitle text="Word Rumble" size="lg" />
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
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
