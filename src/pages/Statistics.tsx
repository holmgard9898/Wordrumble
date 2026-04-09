import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Swords } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHighScores } from '@/hooks/useHighScores';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';

const MODE_OPTIONS = [
  { value: 'all', label: 'Alla lägen' },
  { value: 'Classic', label: 'Classic' },
  { value: 'Word Surge', label: 'Word Surge' },
  { value: '5+ Bokstäver', label: '5+ Bokstäver' },
  { value: 'Ett Ord', label: 'Ett Ord' },
  { value: 'Bomb Mode', label: 'Bomb Mode' },
];

const Statistics = () => {
  const navigate = useNavigate();
  const { scores } = useHighScores();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const [selectedMode, setSelectedMode] = useState('all');

  const filtered = selectedMode === 'all' ? scores : scores.filter(s => s.mode === selectedMode);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-6">Statistik</h1>

      <div className="w-full max-w-sm">
        <Tabs defaultValue="highscore" className="w-full">
          <TabsList className="w-full bg-white/10">
            <TabsTrigger value="highscore" className="flex-1 gap-2 data-[state=active]:bg-white/20 text-white">
              <Trophy className="w-4 h-4" /> Highscore
            </TabsTrigger>
            <TabsTrigger value="online" className="flex-1 gap-2 data-[state=active]:bg-white/20 text-white">
              <Swords className="w-4 h-4" /> Online
            </TabsTrigger>
          </TabsList>

          {/* Mode filter dropdown */}
          <div className="mt-3">
            <Select value={selectedMode} onValueChange={setSelectedMode}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="highscore" className="mt-4">
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {filtered.length === 0 ? (
                <p className="text-white/50 text-center py-4">Inga highscores ännu{selectedMode !== 'all' ? ` för ${selectedMode}` : ''}. Spela en omgång!</p>
              ) : (
                filtered.slice(0, 20).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-lg w-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>
                        #{i + 1}
                      </span>
                      <div>
                        <span className="text-white font-semibold">{s.score} poäng</span>
                        <span className="text-white/40 text-xs ml-2">{s.wordsFound} ord · {s.mode}</span>
                      </div>
                    </div>
                    <span className="text-white/30 text-xs">{new Date(s.date).toLocaleDateString('sv')}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="online" className="mt-4">
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <Swords className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
              <p className="text-white/50">Online-statistik kommer snart!</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> Huvudmeny
      </Button>
    </div>
  );
};

export default Statistics;
