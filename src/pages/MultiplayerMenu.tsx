import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle, Users, Timer, Zap, Star, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useAuth } from '@/hooks/useAuth';

const MultiplayerMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { user, loading } = useAuth();
  const [selectedMode, setSelectedMode] = useState<'classic' | 'surge' | 'fiveplus' | 'oneword' | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  const go = (path: string) => {
    playClick();
    navigate(path);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${bg.className}`} style={bg.style}>
        <div className="text-white/60">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  const modes = [
    { id: 'classic', icon: Timer, label: 'Classic', color: 'blue', desc: '2 omgångar, 25+50+25 drag' },
    { id: 'surge', icon: Zap, label: 'Word Surge', color: 'yellow', desc: '3 omgångar, samma startbräde' },
    { id: 'fiveplus', icon: Star, label: '5+ Bokstäver', color: 'green', desc: '2 omgångar, min 5 bokstäver' },
    { id: 'oneword', icon: Trophy, label: 'Längsta Ordet', color: 'pink', desc: '2 omgångar, bästa ordet vinner' },
  ];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-2">Utmana</h1>
      <p className="text-white/50 mb-8">Välj motståndare och spelläge</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">Motståndare</p>
        {[
          { id: 'random', icon: Shuffle, label: 'Slumpmässig', desc: 'Möt en slumpmässig spelare' },
          { id: 'friend', icon: Users, label: 'Vän', desc: 'Utmana en vän' },
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
            {modes.map((mode) => {
              const colorMap: Record<string, string> = {
                blue: '59,130,246',
                yellow: '234,179,8',
                green: '34,197,94',
                pink: '236,72,153',
              };
              const rgb = colorMap[mode.color] || '59,130,246';
              const textColorMap: Record<string, string> = {
                blue: 'text-blue-400',
                yellow: 'text-yellow-400',
                green: 'text-green-400',
                pink: 'text-pink-400',
              };
              return (
                <button
                  key={mode.id}
                  onClick={() => { playClick(); setSelectedMode(mode.id as any); }}
                  className={`rounded-xl p-3 text-left transition-all ${
                    selectedMode === mode.id ? 'ring-2 ring-white/50 scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                  style={{ background: `rgba(${rgb},0.15)`, border: `1px solid rgba(${rgb},0.25)` }}
                >
                  <div className="flex items-center gap-3">
                    <mode.icon className={`w-5 h-5 ${textColorMap[mode.color]}`} />
                    <div>
                      <span className="text-white font-semibold">{mode.label}</span>
                      <div className="text-white/50 text-xs">{mode.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
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
