import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Timer, Zap, Bomb, Hash, Target } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useSettings } from '@/contexts/SettingsContext';

const SingleplayerMenu = () => {
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { settings } = useSettings();
  const isClouds = settings.background === 'clouds';

  const go = (path: string) => {
    playClick();
    navigate(path);
  };

  const modes = [
    {
      path: '/game/classic',
      icon: <Timer className="w-6 h-6 text-blue-400" />,
      name: 'Classic',
      desc: '50 drag. Få så många poäng som möjligt! Bonus för långa ord.',
      bg: 'rgba(59,130,246,0.35)',
      border: 'rgba(59,130,246,0.5)',
    },
    {
      path: '/game/surge',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      name: 'Word Surge',
      desc: '50 drag. Hitta ord med höga poäng eller långa ord för att få extra drag!',
      bg: 'rgba(234,179,8,0.35)',
      border: 'rgba(234,179,8,0.5)',
    },
    {
      path: '/game/fiveplus',
      icon: <Hash className="w-6 h-6 text-cyan-400" />,
      name: '5+ Bokstäver',
      desc: '100 drag. Bara 3 färger men bara ord med 5+ bokstäver räknas!',
      bg: 'rgba(34,211,238,0.35)',
      border: 'rgba(34,211,238,0.5)',
    },
    {
      path: '/game/oneword',
      icon: <Target className="w-6 h-6 text-emerald-400" />,
      name: 'Ett Ord',
      desc: '60 drag. Bilda så många ord du vill men bara ditt bästa ord räknas!',
      bg: 'rgba(16,185,129,0.35)',
      border: 'rgba(16,185,129,0.5)',
    },
    {
      path: '/game/bomb',
      icon: <Bomb className="w-6 h-6 text-red-400" />,
      name: 'Bomb Mode',
      desc: 'Inga dragbegränsningar! Desarmera bomber genom att bilda ord med bombade bokstäver innan tiden rinner ut.',
      bg: 'rgba(239,68,68,0.35)',
      border: 'rgba(239,68,68,0.5)',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      {isClouds && <div className="fixed inset-0 bg-black/30 pointer-events-none" />}
      <div className="relative z-10 flex flex-col items-center w-full">
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Singleplayer</h1>
        <p className="text-white/60 mb-8 drop-shadow">Välj spelläge</p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {modes.map((m) => (
            <button
              key={m.path}
              onClick={() => go(m.path)}
              className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md"
              style={{
                background: isClouds ? m.bg.replace('0.35', '0.55') : m.bg,
                border: `1px solid ${m.border}`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                {m.icon}
                <span className="text-xl font-bold text-white drop-shadow">{m.name}</span>
              </div>
              <p className="text-white/70 text-sm font-medium drop-shadow-sm">{m.desc}</p>
            </button>
          ))}
        </div>

        <Button onClick={() => go('/')} variant="ghost" className="mt-8 gap-2 text-white/80 hover:text-white hover:bg-white/20 bg-white/10 border border-white/20 drop-shadow">
          <ArrowLeft className="w-4 h-4" /> Huvudmeny
        </Button>
      </div>
    </div>
  );
};

export default SingleplayerMenu;
