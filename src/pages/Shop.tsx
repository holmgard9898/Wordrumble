import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins, Check, ChevronLeft, ChevronRight, Lock, Video, HelpCircle } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useSettings, type GameBackground, type TileStyle } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useCoins } from '@/hooks/useCoins';
import { useUnlocks } from '@/hooks/useUnlocks';
import { useTranslation } from '@/hooks/useTranslation';
import { bgShopItems, tileShopItems, miscShopItems, type UnlockMethod } from '@/data/shopData';
import { BUBBLE_COLOR_STYLES, type BubbleColor } from '@/data/gameConstants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import cloudsBg from '@/assets/bg-clouds.jpg';
import woodBg from '@/assets/bg-wood.jpg';
import spaceBg from '@/assets/bg-space.jpg';
import volcanoBg from '@/assets/bg-volcano.jpg';
import beachBg from '@/assets/bg-beach.jpg';
import underwaterBg from '@/assets/bg-underwater.jpg';
import shipwreckBg from '@/assets/bg-shipwreck.jpg';
import caveBg from '@/assets/bg-cave.jpg';
import cityBg from '@/assets/bg-city.jpg';
import storybookBg from '@/assets/bg-storybook.jpg';

const bgPreviews: Record<GameBackground, React.ReactNode> = {
  default: <div className="w-full h-full rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(220, 60%, 12%) 0%, hsl(260, 50%, 18%) 50%, hsl(200, 55%, 15%) 100%)' }} />,
  storybook: <img src={storybookBg} alt="Storybook" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  clouds: <img src={cloudsBg} alt="Blue sky" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  wood: <img src={woodBg} alt="Walnut wood" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  space: <img src={spaceBg} alt="Space" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  volcano: <img src={volcanoBg} alt="Volcano" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  beach: <img src={beachBg} alt="Beach" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  underwater: <img src={underwaterBg} alt="Underwater" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  shipwreck: <img src={shipwreckBg} alt="Shipwreck" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  cave: <img src={caveBg} alt="Cave" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
  city: <img src={cityBg} alt="City" className="w-full h-full object-cover rounded-xl" loading="lazy" />,
};

const tileColors: BubbleColor[] = ['red', 'green', 'blue', 'yellow', 'pink'];
const CLIP_PATHS: Record<BubbleColor, string> = {
  red: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  green: 'none', blue: 'circle(50% at 50% 50%)', yellow: 'polygon(50% 10%, 90% 85%, 10% 85%)', pink: 'polygon(50% 5%, 90% 50%, 50% 95%, 10% 50%)',
};

function TilePreviewRow({ children }: { children: React.ReactNode }) {
  return <div className="w-full h-full rounded-xl flex items-center justify-center gap-1 p-2" style={{ background: 'rgba(0,0,0,0.5)' }}>{children}</div>;
}
function BubblePreview() { return <TilePreviewRow>{tileColors.map(c => { const s = BUBBLE_COLOR_STYLES[c]; return <div key={c} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: `radial-gradient(circle at 35% 30%, ${s.highlight}, ${s.bg})` }}>A</div>; })}</TilePreviewRow>; }
function RubikPreview() { return <TilePreviewRow>{tileColors.map(c => { const s = BUBBLE_COLOR_STYLES[c]; return <div key={c} className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: s.bg, border: '1.5px solid rgba(0,0,0,0.7)', borderRadius: '2px' }}>A</div>; })}</TilePreviewRow>; }
function ShapesPreview() { return <TilePreviewRow>{tileColors.map(c => { const s = BUBBLE_COLOR_STYLES[c]; const clip = CLIP_PATHS[c]; const isSquare = c === 'green'; return <div key={c} className="w-6 h-6 flex items-center justify-center relative"><div className="absolute inset-0" style={{ background: `radial-gradient(circle at 35% 30%, ${s.highlight}, ${s.bg})`, clipPath: isSquare ? 'none' : clip, borderRadius: isSquare ? '2px' : '0' }} /><span className="relative text-[10px] font-bold text-white z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>A</span></div>; })}</TilePreviewRow>; }
function SoapBubblePreview() { return <TilePreviewRow>{tileColors.map(c => { const s = BUBBLE_COLOR_STYLES[c]; return <div key={c} className="w-6 h-6 rounded-full flex items-center justify-center relative" style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), rgba(255,255,255,0.12) 35%, rgba(200,220,255,0.08) 60%, rgba(180,200,255,0.15))', border: '1px solid rgba(255,255,255,0.3)' }}><span className="text-[10px] font-black" style={{ color: s.bg, textShadow: `0 1px 0 ${s.highlight}` }}>A</span></div>; })}</TilePreviewRow>; }
function SportsPreview() { const balls = ['⚽', '🏑', '🏒', '🎾', '🏀']; return <TilePreviewRow>{balls.map((emoji, i) => <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center relative"><span className="text-sm">{emoji}</span><span className="absolute text-[8px] font-black text-white z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>A</span></div>)}</TilePreviewRow>; }

const tilePreviews: Record<TileStyle, React.ReactNode> = { bubble: <BubblePreview />, rubik: <RubikPreview />, shapes: <ShapesPreview />, soapbubble: <SoapBubblePreview />, sports: <SportsPreview /> };

function UnlockMethodIcon({ method }: { method: UnlockMethod }) {
  if (method === 'coins') return <Coins className="w-3 h-3 text-yellow-400" />;
  if (method === 'ad') return <Video className="w-3 h-3 text-blue-400" />;
  if (method === 'achievement') return <HelpCircle className="w-3 h-3 text-purple-400" />;
  return null;
}

const Shop = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const { settings, updateSettings } = useSettings();
  const bg = useGameBackground();
  const { coins, addCoins, spendCoins } = useCoins();
  const { isUnlocked, unlock } = useUnlocks();
  const { t } = useTranslation();
  const [infoItem, setInfoItem] = useState<{ name: string; description: string; method: UnlockMethod; cost?: number; itemId: string } | null>(null);

  const VISIBLE = 3;
  const [bgStart, setBgStart] = useState(() => { const idx = bgShopItems.findIndex(o => o.bgId === settings.background); return Math.max(0, Math.min(idx, bgShopItems.length - VISIBLE)); });
  const canLeft = bgStart > 0; const canRight = bgStart + VISIBLE < bgShopItems.length;
  const visibleBgs = bgShopItems.slice(bgStart, bgStart + VISIBLE);

  const TILE_VISIBLE = 3;
  const [tileStart, setTileStart] = useState(() => { const idx = tileShopItems.findIndex(o => o.tileId === settings.tileStyle); return Math.max(0, Math.min(idx, tileShopItems.length - TILE_VISIBLE)); });
  const canTileLeft = tileStart > 0; const canTileRight = tileStart + TILE_VISIBLE < tileShopItems.length;
  const visibleTiles = tileShopItems.slice(tileStart, tileStart + TILE_VISIBLE);

  // Translated shop item names
  const itemNames: Record<string, string> = {
    'bg-default': t.shopCosmicNight, 'bg-clouds': t.shopBlueSky, 'bg-wood': t.shopWalnut, 'bg-space': t.shopSpace,
    'bg-volcano': t.shopVolcano, 'bg-beach': t.shopBeach,
    'bg-shipwreck': t.shopShipwreck, 'bg-city': t.shopCity, 'bg-underwater': t.shopUnderwater, 'bg-cave': t.shopCave,
    'tile-bubble': t.shopBubbles, 'tile-rubik': 'Rubik', 'tile-shapes': t.shopShapes, 'tile-soapbubble': t.shopSoapBubbles, 'tile-sports': t.shopSport,
  };

  const handleBgClick = (item: typeof bgShopItems[0]) => {
    playClick();
    if (isUnlocked(item.id)) updateSettings({ background: item.bgId });
    else setInfoItem({ name: itemNames[item.id] || item.name, description: item.unlockDescription, method: item.unlockMethod, cost: item.cost, itemId: item.id });
  };

  const handleTileClick = (item: typeof tileShopItems[0]) => {
    playClick();
    if (isUnlocked(item.id)) updateSettings({ tileStyle: item.tileId });
    else setInfoItem({ name: itemNames[item.id] || item.name, description: item.unlockDescription, method: item.unlockMethod, cost: item.cost, itemId: item.id });
  };

  const handleUnlock = () => {
    if (!infoItem) return;
    if (infoItem.method === 'coins' && infoItem.cost) { if (spendCoins(infoItem.cost)) { unlock(infoItem.itemId); setInfoItem(null); } }
    else if (infoItem.method === 'ad') { unlock(infoItem.itemId); setInfoItem(null); }
  };

  const handleWatchAd = () => { playClick(); addCoins(10); };

  const renderCard = (opt: { id: string; name: string; preview: React.ReactNode }, isActive: boolean, locked: boolean, unlockMethod: UnlockMethod, onSelect: () => void) => (
    <button key={opt.id} onClick={onSelect} className="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97] flex-1" style={{ border: isActive ? '3px solid rgba(139,92,246,0.8)' : '3px solid rgba(255,255,255,0.1)', boxShadow: isActive ? '0 0 20px rgba(139,92,246,0.3)' : 'none' }}>
      <div className="aspect-[16/10] relative">{opt.preview}{locked && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center" />}</div>
      <div className="absolute inset-x-0 bottom-0 p-2 text-center" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}><span className="text-white text-sm font-medium">{itemNames[opt.id] || opt.name}</span></div>
      {isActive && !locked && <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.9)' }}><Check className="w-4 h-4 text-white" /></div>}
      {locked && <div className="absolute top-2 right-2 flex items-center gap-1"><div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}><Lock className="w-3 h-3 text-white/60" /></div><div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}><UnlockMethodIcon method={unlockMethod} /></div></div>}
    </button>
  );

  const ArrowBtn = ({ direction, disabled, onClick: onArrowClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) => (
    <button onClick={() => { playClick(); onArrowClick(); }} disabled={disabled} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-opacity" style={{ background: 'rgba(255,255,255,0.1)' }}>
      {direction === 'left' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
    </button>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-2">{t.shop}</h1>
      <div className="flex items-center gap-2 mb-8"><Coins className="w-5 h-5 text-yellow-400" /><span className="text-yellow-400 font-bold">{coins} coins</span></div>

      <div className="w-full max-w-md space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">{t.backgrounds}</h2>
          <div className="flex items-center gap-2">
            <ArrowBtn direction="left" disabled={!canLeft} onClick={() => setBgStart(s => s - 1)} />
            <div className="grid grid-cols-3 gap-3 flex-1">{visibleBgs.map(item => { const locked = !isUnlocked(item.id); const active = !locked && settings.background === item.bgId; return renderCard({ id: item.id, name: item.name, preview: bgPreviews[item.bgId] }, active, locked, item.unlockMethod, () => handleBgClick(item)); })}</div>
            <ArrowBtn direction="right" disabled={!canRight} onClick={() => setBgStart(s => s + 1)} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">{t.tiles}</h2>
          <div className="flex items-center gap-2">
            <ArrowBtn direction="left" disabled={!canTileLeft} onClick={() => setTileStart(s => s - 1)} />
            <div className="grid grid-cols-3 gap-3 flex-1">{visibleTiles.map(item => { const locked = !isUnlocked(item.id); const active = !locked && settings.tileStyle === item.tileId; return renderCard({ id: item.id, name: item.name, preview: tilePreviews[item.tileId] }, active, locked, item.unlockMethod, () => handleTileClick(item)); })}</div>
            <ArrowBtn direction="right" disabled={!canTileRight} onClick={() => setTileStart(s => s + 1)} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white/80 text-center mb-3">{t.other}</h2>
          <div className="grid grid-cols-2 gap-3">
            {miscShopItems.map(item => (
              <button key={item.id} onClick={() => {
                if (item.type === 'action') handleWatchAd();
                else if (item.type === 'navigate' && item.navigateTo) { playClick(); navigate(item.navigateTo); }
              }} className="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97]" style={{ border: '3px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>
                <div className="aspect-[4/3] flex flex-col items-center justify-center gap-1 p-3">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-white text-sm font-semibold">{item.id === 'watch-ad' ? t.shopWatchAd : item.id === 'adventure-mode' ? t.shopAdventure : item.name}</span>
                  <span className="text-white/50 text-[11px] leading-tight text-center">{item.id === 'watch-ad' ? t.shopWatchAdDesc : item.id === 'adventure-mode' ? t.shopAdventureDesc : item.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> {t.mainMenu}
      </Button>

      <Dialog open={!!infoItem} onOpenChange={(open) => !open && setInfoItem(null)}>
        <DialogContent className="max-w-xs rounded-2xl border-white/10" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)' }}>
          <DialogHeader>
            <DialogTitle className="text-white text-center text-lg">{infoItem?.name}</DialogTitle>
            <DialogDescription className="text-white/70 text-center text-sm pt-2">{infoItem?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {infoItem?.method === 'coins' && (
              <Button onClick={handleUnlock} disabled={coins < (infoItem.cost ?? 0)} className="w-full gap-2" style={{ background: coins >= (infoItem.cost ?? 0) ? 'rgba(139,92,246,0.8)' : 'rgba(100,100,100,0.5)' }}>
                <Coins className="w-4 h-4 text-yellow-400" /> {t.buyFor} {infoItem.cost} coins
              </Button>
            )}
            {infoItem?.method === 'ad' && <Button onClick={handleUnlock} className="w-full gap-2" style={{ background: 'rgba(59,130,246,0.8)' }}><Video className="w-4 h-4" /> {t.watchAdUnlock}</Button>}
            {infoItem?.method === 'achievement' && <div className="text-center text-white/50 text-sm py-2"><HelpCircle className="w-5 h-5 mx-auto mb-1 text-purple-400" />{t.achievementUnlock}</div>}
            <Button onClick={() => setInfoItem(null)} variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10">{t.close}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shop;
