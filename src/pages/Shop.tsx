import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useSettings, type GameBackground, type TileStyle } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { BUBBLE_COLOR_STYLES, type BubbleColor } from '@/data/gameConstants';
import cloudsBg from '@/assets/bg-clouds.jpg';
import woodBg from '@/assets/bg-wood.jpg';
import spaceBg from '@/assets/bg-space.jpg';
import volcanoBg from '@/assets/bg-volcano.jpg';

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
    preview: <img src={cloudsBg} alt="Blue sky" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  },
  {
    id: 'wood',
    name: 'Valnöt',
    preview: <img src={woodBg} alt="Walnut wood" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  },
  {
    id: 'space',
    name: 'Rymden',
    preview: <img src={spaceBg} alt="Space" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  },
  {
    id: 'volcano',
    name: 'Vulkan',
    preview: <img src={volcanoBg} alt="Volcano" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  },
];

const tileColors: BubbleColor[] = ['red', 'green', 'blue', 'yellow', 'pink'];

const CLIP_PATHS: Record<BubbleColor, string> = {
  red: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  green: 'none',
  blue: 'circle(50% at 50% 50%)',
  yellow: 'polygon(50% 10%, 90% 85%, 10% 85%)',
  pink: 'polygon(50% 5%, 90% 50%, 50% 95%, 10% 50%)',
};

function BubblePreview() {
  return (
    <div className="w-full h-full rounded-xl flex items-center justify-center gap-1 p-2" style={{ background: 'rgba(0,0,0,0.5)' }}>
      {tileColors.map((c) => {
        const s = BUBBLE_COLOR_STYLES[c];
        return (
          <div
            key={c}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: `radial-gradient(circle at 35% 30%, ${s.highlight}, ${s.bg})` }}
          >
            A
          </div>
        );
      })}
    </div>
  );
}

function RubikPreview() {
  return (
    <div className="w-full h-full rounded-xl flex items-center justify-center gap-0 p-2" style={{ background: 'rgba(0,0,0,0.5)' }}>
      {tileColors.map((c) => {
        const s = BUBBLE_COLOR_STYLES[c];
        return (
          <div
            key={c}
            className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: s.bg, border: '1.5px solid rgba(0,0,0,0.7)', borderRadius: '2px' }}
          >
            A
          </div>
        );
      })}
    </div>
  );
}

function ShapesPreview() {
  return (
    <div className="w-full h-full rounded-xl flex items-center justify-center gap-1 p-2" style={{ background: 'rgba(0,0,0,0.5)' }}>
      {tileColors.map((c) => {
        const s = BUBBLE_COLOR_STYLES[c];
        const clip = CLIP_PATHS[c];
        const isSquare = c === 'green';
        return (
          <div key={c} className="w-6 h-6 flex items-center justify-center relative">
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${s.highlight}, ${s.bg})`,
                clipPath: isSquare ? 'none' : clip,
                borderRadius: isSquare ? '2px' : '0',
              }}
            />
            <span className="relative text-[10px] font-bold text-white z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>A</span>
          </div>
        );
      })}
    </div>
  );
}

interface TileOption {
  id: TileStyle;
  name: string;
  preview: React.ReactNode;
}

const tileOptions: TileOption[] = [
  { id: 'bubble', name: 'Bubblor', preview: <BubblePreview /> },
  { id: 'rubik', name: 'Rubik', preview: <RubikPreview /> },
  { id: 'shapes', name: 'Former', preview: <ShapesPreview /> },
];

const Shop = () => {
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const { settings, updateSettings } = useSettings();
  const bg = useGameBackground();

  // Background carousel
  const VISIBLE = 3;
  const [bgStart, setBgStart] = useState(() => {
    const idx = bgOptions.findIndex((o) => o.id === settings.background);
    return Math.max(0, Math.min(idx, bgOptions.length - VISIBLE));
  });
  const canLeft = bgStart > 0;
  const canRight = bgStart + VISIBLE < bgOptions.length;
  const visibleBgs = bgOptions.slice(bgStart, bgStart + VISIBLE);

  const selectBg = (id: GameBackground) => { playClick(); updateSettings({ background: id }); };
  const selectTile = (id: TileStyle) => { playClick(); updateSettings({ tileStyle: id }); };

  const renderCard = (
    opt: { id: string; name: string; preview: React.ReactNode },
    isActive: boolean,
    onSelect: () => void,
  ) => (
    <button
      key={opt.id}
      onClick={onSelect}
      className="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97] flex-1"
      style={{
        border: isActive ? '3px solid rgba(139,92,246,0.8)' : '3px solid rgba(255,255,255,0.1)',
        boxShadow: isActive ? '0 0 20px rgba(139,92,246,0.3)' : 'none',
      }}
    >
      <div className="aspect-[16/10]">{opt.preview}</div>
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

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-2">Butik</h1>
      <div className="flex items-center gap-2 mb-8">
        <Coins className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-400 font-bold">0 coins</span>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Backgrounds with arrows */}
        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">Bakgrunder</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { playClick(); setBgStart((s) => s - 1); }}
              disabled={!canLeft}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-3 gap-3 flex-1">
              {visibleBgs.map((opt) => renderCard(opt, settings.background === opt.id, () => selectBg(opt.id)))}
            </div>
            <button
              onClick={() => { playClick(); setBgStart((s) => s + 1); }}
              disabled={!canRight}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tile styles */}
        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">Spelbrickor</h2>
          <div className="grid grid-cols-3 gap-3">
            {tileOptions.map((opt) => renderCard(opt, settings.tileStyle === opt.id, () => selectTile(opt.id)))}
          </div>
        </div>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> Huvudmeny
      </Button>
    </div>
  );
};

export default Shop;
