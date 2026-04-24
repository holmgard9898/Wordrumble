import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2, Swords, ShoppingBag, BarChart3, Settings, Map } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';

const MainMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { t } = useTranslation();

  const go = (path: string) => {
    playClick();
    navigate(path);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <div className="flex flex-col items-center gap-2 mb-10">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-400 to-yellow-400 tracking-tight">
          Word Rumble
        </h1>
        <p className="text-white/50 text-sm tracking-widest uppercase">{t.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={() => go('/play')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30">
          <Gamepad2 className="w-5 h-5" /> {t.play}
        </Button>
        <Button onClick={() => go('/challenge')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/30">
          <Swords className="w-5 h-5" /> {t.challenge}
        </Button>
        <Button onClick={() => go('/adventure')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white shadow-lg shadow-yellow-500/30">
          <Map className="w-5 h-5" /> {t.adventureTitle}
        </Button>
        <Button onClick={() => go('/shop')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30">
          <ShoppingBag className="w-5 h-5" /> {t.shop}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => go('/statistics')} size="lg" className="gap-2 text-sm sm:text-base h-11 px-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-md shadow-purple-500/20">
            <BarChart3 className="w-4 h-4 shrink-0" /> <span className="truncate">{t.statistics}</span>
          </Button>
          <Button onClick={() => go('/settings')} size="lg" className="gap-2 text-sm sm:text-base h-11 px-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-md shadow-purple-500/20">
            <Settings className="w-4 h-4 shrink-0" /> <span className="truncate">{t.settingsTitle}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
