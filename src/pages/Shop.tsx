import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Coins } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';

const Shop = () => {
  const navigate = useNavigate();
  const { playClick } = useSfx();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 game-bg">
      <h1 className="text-4xl font-bold text-white mb-2">Butik</h1>
      <div className="flex items-center gap-2 mb-8">
        <Coins className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-400 font-bold">0 coins</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 text-lg mb-2">Butiken öppnar snart!</p>
        <p className="text-white/30 text-sm">Här kommer du kunna köpa bakgrunder, teman och mer med coins.</p>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> Huvudmeny
      </Button>
    </div>
  );
};

export default Shop;
