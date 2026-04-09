import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins, Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useSettings, type GameBackground, type TileStyle } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { BUBBLE_COLOR_STYLES, SPORTS_BALLS, type BubbleColor } from '@/data/gameConstants';
import cloudsBg from '@/assets/bg-clouds.jpg';
import woodBg from '@/assets/bg-wood.jpg';
import spaceBg from '@/assets/bg-space.jpg';
import volcanoBg from '@/assets/bg-volcano.jpg';

/* ─── Background options ─── */

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

/* ─── Tile preview helpers ─── */

const tileColors: BubbleColor[] = ['red', 'green', 'blue', 'yellow', 'pink'];

const CLIP_PATHS: Record<BubbleColor, string> = {
  red: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  green: 'none',
  blue: 'circle(50% at 50% 50%)',
  yellow: 'polygon(50% 10%, 90% 85%, 10% 85%)',
  pink: 'polygon(50% 5%, 90% 50%, 50% 95%, 10% 50%)',
};

function TilePreviewRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full rounded-xl flex items-center justify-center gap-1 p-2" style={{ background: 'rgba(0,0,0,0.5)' }}>
      {children}
    </div>
  );
}

function BubblePreview() {
  return (
    <TilePreviewRow>
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
    </TilePreviewRow>
  );
}

function RubikPreview() {
  return (
    <TilePreviewRow>
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
    </TilePreviewRow>
  );
}

function ShapesPreview() {
  return (
    <TilePreviewRow>
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
    </TilePreviewRow>
  );
}

function SoapBubblePreview() {
  return (
    <TilePreviewRow>
      {tileColors.map((c) => {
        const s = BUBBLE_COLOR_STYLES[c];
        return (
          <div
            key={c}
            className="w-6 h-6 rounded-full flex items-center justify-center relative"
            style={{
              background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), rgba(255,255,255,0.12) 35%, rgba(200,220,255,0.08) 60%, rgba(180,200,255,0.15))',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <span className="text-[10px] font-black" style={{ color: s.bg, textShadow: `0 1px 0 ${s.highlight}` }}>
              A
            </span>
          </div>
        );
      })}
    </TilePreviewRow>
  );
}

function SportsPreview() {
  const balls = ['⚽', '🏑', '🏒', '🎾', '🏀'];
  return (
    <TilePreviewRow>
      {balls.map((emoji, i) => (
        <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center relative">
          <span className="text-sm">{emoji}</span>
          <span
            className="absolute text-[8px] font-black text-white z-10"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
          >
            A
          </span>
        </div>
      ))}
    </TilePreviewRow>
  );
}

/* ─── Tile options ─── */

interface TileOption {
  id: TileStyle;
  name: string;
  preview: React.ReactNode;
}

const tileOptions: TileOption[] = [
  { id: 'bubble', name: 'Bubblor', preview: <BubblePreview /> },
  { id: 'rubik', name: 'Rubik', preview: <RubikPreview /> },
  { id: 'shapes', name: 'Former', preview: <ShapesPreview /> },
  { id: 'soapbubble', name: 'Såpbubblor', preview: <SoapBubblePreview /> },
  { id: 'sports', name: 'Sport', preview: <SportsPreview /> },
];

/* ─── Misc items ─── */

interface MiscItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  owned: boolean;
}

const miscItems: MiscItem[] = [
  { id: 'double-coins', name: 'Dubbla mynt', description: 'x2 mynt i 1h', icon: '💰', owned: false },
  { id: 'undo-move', name: 'Ångra drag', description: 'Ångra senaste draget', icon: '↩️', owned: false },
  { id: 'hint', name: 'Ledtråd', description: 'Visa bästa ordet', icon: '💡', owned: false },
];

/* ─── Shop component ─── */

const Shop = () => {
  useMenuMusic();
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

  // Tile carousel
  const TILE_VISIBLE = 3;
  const [tileStart, setTileStart] = useState(() => {
    const idx = tileOptions.findIndex((o) => o.id === settings.tileStyle);
    return Math.max(0, Math.min(idx, tileOptions.length - TILE_VISIBLE));
  });
  const canTileLeft = tileStart > 0;
  const canTileRight = tileStart + TILE_VISIBLE < tileOptions.length;
  const visibleTiles = tileOptions.slice(tileStart, tileStart + TILE_VISIBLE);

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

  const ArrowBtn = ({ direction, disabled, onClick: onArrowClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) => (
    <button
      onClick={() => { playClick(); onArrowClick(); }}
      disabled={disabled}
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-opacity"
      style={{ background: 'rgba(255,255,255,0.1)' }}
    >
      {direction === 'left' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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
        {/* Backgrounds */}
        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">Bakgrunder</h2>
          <div className="flex items-center gap-2">
            <ArrowBtn direction="left" disabled={!canLeft} onClick={() => setBgStart((s) => s - 1)} />
            <div className="grid grid-cols-3 gap-3 flex-1">
              {visibleBgs.map((opt) => renderCard(opt, settings.background === opt.id, () => selectBg(opt.id)))}
            </div>
            <ArrowBtn direction="right" disabled={!canRight} onClick={() => setBgStart((s) => s + 1)} />
          </div>
        </div>

        {/* Tile styles */}
        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">Spelbrickor</h2>
          <div className="flex items-center gap-2">
            <ArrowBtn direction="left" disabled={!canTileLeft} onClick={() => setTileStart((s) => s - 1)} />
            <div className="grid grid-cols-3 gap-3 flex-1">
              {visibleTiles.map((opt) => renderCard(opt, settings.tileStyle === opt.id, () => selectTile(opt.id)))}
            </div>
            <ArrowBtn direction="right" disabled={!canTileRight} onClick={() => setTileStart((s) => s + 1)} />
          </div>
        </div>

        {/* Misc / Övrigt */}
        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">Övrigt</h2>
          <div className="grid grid-cols-3 gap-3">
            {miscItems.map((item) => (
              <button
                key={item.id}
                onClick={() => playClick()}
                className="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  border: '3px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.4)',
                }}
              >
                <div className="aspect-square flex flex-col items-center justify-center gap-1 p-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-white text-xs font-semibold">{item.name}</span>
                  <span className="text-white/50 text-[10px] leading-tight text-center">{item.description}</span>
                </div>
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <Lock className="w-3 h-3 text-white/50" />
                </div>
              </button>
            ))}
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
