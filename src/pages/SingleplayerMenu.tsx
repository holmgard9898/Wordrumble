import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Timer, Zap } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';

const SingleplayerMenu = () => {
  const navigate = useNavigate();
  const { playClick } = useSfx();

  const go = (path: string) => {
    playClick();
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 game-bg">
      <h1 className="text-4xl font-bold text-white mb-2">Singleplayer</h1>
      <p className="text-white/50 mb-8">Välj spelläge</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => go('/game/classic')}
          className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Timer className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Classic</span>
          </div>
          <p className="text-white/60 text-sm">50 drag. Få så många poäng som möjligt!</p>
        </button>

        <button
          onClick={() => go('/game/surge')}
          className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.3)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-xl font-bold text-white">Word Surge</span>
          </div>
          <p className="text-white/60 text-sm">
            50 drag. Ord med 25+ poäng eller 8+ bokstäver ger +10 drag.
            Ord med 40+ poäng eller 10 bokstäver ger +25 drag!
          </p>
        </button>
      </div>

      <Button onClick={() => go('/')} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> Huvudmeny
      </Button>
    </div>
  );
};

export default SingleplayerMenu;
