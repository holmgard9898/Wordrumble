import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins, Check } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useSettings, type GameBackground } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import cloudsBg from '@/assets/bg-clouds.jpg';

interface BgOption {
  id: GameBackground;
  name: string;
  preview: React.ReactNode;
}

const bgOptions: BgOption[] = [
  {
    id: 'default',
    name: 'Cosmic Night',
    preview: (
      <div
        className="w-full h-full rounded-xl"
        style={{ background: 'linear-gradient(135deg, hsl(220, 60%, 12%) 0%, hsl(260, 50%, 18%) 50%, hsl(200, 55%, 15%) 100%)' }}
      />
    ),
  },
  {
    id: 'clouds',
    name: 'Blue Sky',
    preview: (
      <img src={cloudsBg} alt="Blue sky with clouds" className="w-full h-full object-cover rounded-xl" />
    ),
  },
];

const Shop = () => {
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const { settings, updateSettings } = useSettings();
  const bg = useGameBackground();

  const selectBg = (id: GameBackground) => {
    playClick();
    updateSettings({ background: id });
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-2">Butik</h1>
      <div className="flex items-center gap-2 mb-8">
        <Coins className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-400 font-bold">0 coins</span>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold text-white/80 text-center">Bakgrunder</h2>
        <div className="grid grid-cols-2 gap-3">
          {bgOptions.map((opt) => {
            const isActive = settings.background === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => selectBg(opt.id)}
                className="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  border: isActive ? '3px solid rgba(139,92,246,0.8)' : '3px solid rgba(255,255,255,0.1)',
                  boxShadow: isActive ? '0 0 20px rgba(139,92,246,0.3)' : 'none',
                }}
              >
                <div className="aspect-[16/10]">
                  {opt.preview}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-2 text-center" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                  <span className="text-white text-sm font-medium">{opt.name}</span>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.9)' }}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> Huvudmeny
      </Button>
    </div>
  );
};

export default Shop;
