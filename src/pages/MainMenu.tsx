import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2, Swords, ShoppingBag, BarChart3, Settings } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';

const MainMenu = () => {
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();

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
        <p className="text-white/50 text-sm tracking-widest uppercase">Bubble Word Game</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={() => go('/play')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30">
          <Gamepad2 className="w-5 h-5" /> Spela
        </Button>
        <Button onClick={() => go('/challenge')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/30">
          <Swords className="w-5 h-5" /> Utmana
        </Button>
        <Button onClick={() => go('/shop')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white shadow-lg shadow-yellow-500/30">
          <ShoppingBag className="w-5 h-5" /> Butik
        </Button>
        <Button onClick={() => go('/statistics')} size="lg" className="gap-3 text-lg h-14 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30">
          <BarChart3 className="w-5 h-5" /> Statistik
        </Button>
        <Button onClick={() => go('/settings')} size="lg" className="gap-3 text-lg h-14 bg-white/10 hover:bg-white/20 text-white border border-white/20">
          <Settings className="w-5 h-5" /> Inställningar
        </Button>
      </div>
    </div>
  );
};

export default MainMenu;
