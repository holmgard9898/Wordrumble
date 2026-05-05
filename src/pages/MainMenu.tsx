import { useNavigate } from 'react-router-dom';
import { Gamepad2, Swords, ShoppingBag, BarChart3, Settings, Map } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';

const TITLE_LETTERS: { ch: string; color: string }[] = [
  { ch: 'W', color: '#3B82F6' },
  { ch: 'o', color: '#22C55E' },
  { ch: 'r', color: '#FACC15' },
  { ch: 'd', color: '#3B82F6' },
  { ch: ' ', color: '' },
  { ch: 'R', color: '#EF4444' },
  { ch: 'u', color: '#F97316' },
  { ch: 'm', color: '#FACC15' },
  { ch: 'b', color: '#22C55E' },
  { ch: 'l', color: '#3B82F6' },
  { ch: 'e', color: '#EF4444' },
];

const titleLetterStyle = (color: string): React.CSSProperties => ({
  color,
  WebkitTextStroke: '6px #ffffff',
  paintOrder: 'stroke fill',
  textShadow: [
    '0 0 0 #ffffff',
    '3px 3px 0 #1e3a8a',
    '4px 5px 0 #1e3a8a',
    '0 8px 0 rgba(30,58,138,0.35)',
  ].join(', '),
  display: 'inline-block',
});

interface MenuButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  gradient: string; // tailwind gradient classes (from-... to-...)
  shadow: string;   // tailwind shadow color class
  size?: 'lg' | 'md';
}

const MenuButton = ({ onClick, icon, label, gradient, shadow, size = 'lg' }: MenuButtonProps) => (
  <button
    onClick={onClick}
    className={`relative w-full ${size === 'lg' ? 'h-16' : 'h-12'} rounded-full bg-gradient-to-b ${gradient} text-white font-extrabold ${size === 'lg' ? 'text-xl' : 'text-base'} tracking-wide shadow-lg ${shadow} ring-2 ring-white/70 ring-inset transition-transform active:scale-[0.97] hover:brightness-110 overflow-hidden`}
  >
    {/* glossy top highlight */}
    <span
      aria-hidden
      className="absolute inset-x-2 top-1 h-1/2 rounded-full pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))' }}
    />
    <span className="relative flex items-center justify-center gap-2.5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]">
      {icon}
      <span>{label}</span>
    </span>
  </button>
);

const MainMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { t } = useTranslation();

  const go = (path: string) => { playClick(); navigate(path); };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      {/* Bubble title */}
      <div className="relative mb-10">
        {/* sparkles */}
        <span aria-hidden className="absolute -top-3 left-2 text-yellow-300 text-2xl drop-shadow">✦</span>
        <span aria-hidden className="absolute -top-1 right-4 text-yellow-300 text-xl drop-shadow">✧</span>
        <span aria-hidden className="absolute bottom-0 -right-2 text-yellow-300 text-lg drop-shadow">✦</span>

        <div
          className="relative px-8 py-4 rounded-[2.5rem] ring-4 ring-white/90 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(186,230,253,0.9) 0%, rgba(125,211,252,0.85) 100%)',
            boxShadow: '0 10px 30px rgba(30,58,138,0.35), inset 0 -6px 12px rgba(30,58,138,0.18)',
          }}
        >
          {/* glossy bubble highlight */}
          <span
            aria-hidden
            className="absolute inset-x-4 top-1.5 h-1/3 rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0))' }}
          />
          <h1
            className="relative text-5xl md:text-6xl text-center leading-none"
            style={{ fontFamily: '"Fredoka One", cursive', letterSpacing: '0.02em' }}
          >
            {TITLE_LETTERS.map((l, i) =>
              l.ch === ' '
                ? <span key={i} style={{ display: 'inline-block', width: '0.35em' }} />
                : <span key={i} style={titleLetterStyle(l.color)}>{l.ch}</span>
            )}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <MenuButton onClick={() => go('/play')} icon={<Gamepad2 className="w-5 h-5" />} label={t.play}
          gradient="from-blue-400 to-blue-600" shadow="shadow-blue-600/40" />
        <MenuButton onClick={() => go('/challenge')} icon={<Swords className="w-5 h-5" />} label={t.challenge}
          gradient="from-red-400 to-red-600" shadow="shadow-red-600/40" />
        <MenuButton onClick={() => go('/adventure')} icon={<Map className="w-5 h-5" />} label={t.adventureTitle}
          gradient="from-yellow-400 to-amber-500" shadow="shadow-amber-500/40" />
        <MenuButton onClick={() => go('/shop')} icon={<ShoppingBag className="w-5 h-5" />} label={t.shop}
          gradient="from-green-400 to-green-600" shadow="shadow-green-600/40" />
        <div className="grid grid-cols-2 gap-3 mt-1">
          <MenuButton onClick={() => go('/statistics')} icon={<BarChart3 className="w-4 h-4" />} label={t.statistics}
            gradient="from-purple-400 to-purple-600" shadow="shadow-purple-600/40" size="md" />
          <MenuButton onClick={() => go('/settings')} icon={<Settings className="w-4 h-4" />} label={t.settingsTitle}
            gradient="from-purple-400 to-purple-600" shadow="shadow-purple-600/40" size="md" />
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
