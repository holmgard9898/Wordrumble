import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle, Users, Bot, Timer, Zap } from 'lucide-react';
import { useState } from 'react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';

const MultiplayerMenu = () => {
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const [selectedMode, setSelectedMode] = useState<'classic' | 'surge' | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);

  const go = (path: string) => {
    playClick();
    navigate(path);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-2">Utmana</h1>
      <p className="text-white/50 mb-8">Välj motståndare och spelläge</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">Motståndare</p>
        {[
          { id: 'random', icon: Shuffle, label: 'Slumpmässig', desc: 'Möt en slumpmässig spelare' },
          { id: 'friend', icon: Users, label: 'Vän', desc: 'Utmana en vän (kommer snart)' },
          { id: 'ai', icon: Bot, label: 'Dator', desc: 'Spela mot AI' },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => { playClick(); setSelectedOpponent(opt.id); }}
            className={`rounded-xl p-4 text-left transition-all ${
              selectedOpponent === opt.id ? 'ring-2 ring-purple-400 scale-[1.02]' : 'hover:scale-[1.01]'
            }`}
            style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.25)' }}
          >
            <div className="flex items-center gap-3">
              <opt.icon className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-semibold">{opt.label}</div>
                <div className="text-white/50 text-xs">{opt.desc}</div>
              </div>
            </div>
          </button>
        ))}

        {selectedOpponent && (
          <>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mt-4">Spelläge</p>
            {[
              { id: 'classic', icon: Timer, label: 'Classic', color: 'blue' },
              { id: 'surge', icon: Zap, label: 'Word Surge', color: 'yellow' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => { playClick(); setSelectedMode(mode.id as 'classic' | 'surge'); }}
                className={`rounded-xl p-3 text-left transition-all ${
                  selectedMode === mode.id ? 'ring-2 ring-white/50 scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                style={{ background: `rgba(${mode.color === 'blue' ? '59,130,246' : '234,179,8'},0.15)`, border: `1px solid rgba(${mode.color === 'blue' ? '59,130,246' : '234,179,8'},0.25)` }}
              >
                <div className="flex items-center gap-3">
                  <mode.icon className={`w-5 h-5 ${mode.color === 'blue' ? 'text-blue-400' : 'text-yellow-400'}`} />
                  <span className="text-white font-semibold">{mode.label}</span>
                </div>
              </button>
            ))}
          </>
        )}

        {selectedOpponent && selectedMode && (
          <Button
            onClick={() => go(`/game/mp-${selectedMode}`)}
            size="lg"
            className="mt-4 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white"
          >
            Starta match!
          </Button>
        )}
      </div>

      <Button onClick={() => go('/')} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> Huvudmeny
      </Button>
    </div>
  );
};

export default MultiplayerMenu;
