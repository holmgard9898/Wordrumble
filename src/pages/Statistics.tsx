import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Swords } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHighScores } from '@/hooks/useHighScores';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';

interface OnlineStats {
  wins: number; losses: number; draws: number; totalMatches: number;
  totalScore: number; bestScore: number; bestWord: string | null; bestWordScore: number;
}

const Statistics = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { scores } = useHighScores();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState('all');
  const [onlineMode, setOnlineMode] = useState('all');
  const [onlineStats, setOnlineStats] = useState<OnlineStats>({ wins: 0, losses: 0, draws: 0, totalMatches: 0, totalScore: 0, bestScore: 0, bestWord: null, bestWordScore: 0 });
  const [loadingOnline, setLoadingOnline] = useState(true);

  const MODE_OPTIONS = [
    { value: 'all', label: t.allModes },
    { value: 'Classic', label: t.modeClassic },
    { value: 'Word Surge', label: t.modeSurge },
    { value: t.modeFiveplus, label: t.modeFiveplus },
    { value: t.modeOneword, label: t.modeOneword },
    { value: 'Bomb Mode', label: t.modeBomb },
  ];

  const ONLINE_MODE_OPTIONS = [
    { value: 'all', label: t.allModes },
    { value: 'classic', label: t.modeClassic },
    { value: 'surge', label: t.modeSurge },
    { value: 'fiveplus', label: t.modeFiveplus },
    { value: 'oneword', label: t.modeOneword },
  ];

  useEffect(() => { if (user) loadOnlineStats(); }, [user, onlineMode]);

  const loadOnlineStats = async () => {
    if (!user) return;
    setLoadingOnline(true);
    let query = supabase.from('matches').select('*').eq('status', 'completed' as any).or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`);
    if (onlineMode !== 'all') query = query.eq('mode', onlineMode as any);
    const { data: matches } = await query;
    if (!matches) { setLoadingOnline(false); return; }

    let wins = 0, losses = 0, draws = 0, totalScore = 0, bestScore = 0;
    let bestWord: string | null = null, bestWordScore = 0;
    for (const m of matches) {
      const isP1 = m.player1_id === user.id;
      const myScore = isP1 ? m.player1_score : m.player2_score;
      totalScore += myScore;
      if (myScore > bestScore) bestScore = myScore;
      if (!m.winner_id) draws++; else if (m.winner_id === user.id) wins++; else losses++;
      const myRounds = (isP1 ? m.player1_rounds_data : m.player2_rounds_data) as any[];
      if (Array.isArray(myRounds)) {
        for (const rd of myRounds) {
          if (rd.best_word_score && rd.best_word_score > bestWordScore) { bestWordScore = rd.best_word_score; bestWord = rd.best_word || null; }
        }
      }
    }
    setOnlineStats({ wins, losses, draws, totalMatches: matches.length, totalScore, bestScore, bestWord, bestWordScore });
    setLoadingOnline(false);
  };

  const filtered = selectedMode === 'all' ? scores : scores.filter(s => s.mode === selectedMode);
  const winRate = onlineStats.totalMatches > 0 ? Math.round((onlineStats.wins / onlineStats.totalMatches) * 100) : 0;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <h1 className="text-4xl font-bold text-white mb-6">{t.statistics}</h1>

      <div className="w-full max-w-sm">
        <Tabs defaultValue="highscore" className="w-full">
          <TabsList className="w-full bg-white/10">
            <TabsTrigger value="highscore" className="flex-1 gap-2 data-[state=active]:bg-white/20 text-white">
              <Trophy className="w-4 h-4" /> {t.highscore}
            </TabsTrigger>
            <TabsTrigger value="online" className="flex-1 gap-2 data-[state=active]:bg-white/20 text-white">
              <Swords className="w-4 h-4" /> {t.online}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="highscore" className="mt-4">
            <div className="mb-3">
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {filtered.length === 0 ? (
                <p className="text-white/50 text-center py-4">{t.noHighscores}{selectedMode !== 'all' ? ` (${selectedMode})` : ''}. {t.playARound}</p>
              ) : (
                filtered.slice(0, 10).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-lg w-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>#{i + 1}</span>
                      <div>
                        <span className="text-white font-semibold">{s.score} {t.points}</span>
                        <span className="text-white/40 text-xs ml-2">{s.wordsFound} {t.words.toLowerCase()} · {s.mode}</span>
                      </div>
                    </div>
                    <span className="text-white/30 text-xs">{new Date(s.date).toLocaleDateString('sv')}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="online" className="mt-4">
            <div className="mb-3">
              <Select value={onlineMode} onValueChange={setOnlineMode}>
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ONLINE_MODE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {!user ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}><p className="text-white/50">{t.loginForOnline}</p></div>
            ) : loadingOnline ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}><p className="text-white/50">{t.loading}</p></div>
            ) : onlineStats.totalMatches === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <Swords className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
                <p className="text-white/50">{t.noFinishedMatches}{onlineMode !== 'all' ? ` ${t.inThisMode}` : ''}!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <p className="text-green-400 text-xs font-semibold">{t.wins}</p>
                    <p className="text-white text-2xl font-bold">{onlineStats.wins}</p>
                  </div>
                  <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <p className="text-red-400 text-xs font-semibold">{t.losses}</p>
                    <p className="text-white text-2xl font-bold">{onlineStats.losses}</p>
                  </div>
                  <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-white/50 text-xs font-semibold">{t.draws}</p>
                    <p className="text-white text-2xl font-bold">{onlineStats.draws}</p>
                  </div>
                </div>
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="flex justify-between items-center"><span className="text-white/50 text-sm">{t.matchesPlayed}</span><span className="text-white font-semibold">{onlineStats.totalMatches}</span></div>
                  <div className="flex justify-between items-center"><span className="text-white/50 text-sm">{t.winRate}</span><span className="text-white font-semibold">{winRate}%</span></div>
                  <div className="flex justify-between items-center"><span className="text-white/50 text-sm">{t.totalPoints}</span><span className="text-white font-semibold">{onlineStats.totalScore}</span></div>
                  <div className="flex justify-between items-center"><span className="text-white/50 text-sm">{t.bestMatchScore}</span><span className="text-yellow-400 font-semibold">{onlineStats.bestScore}</span></div>
                  {onlineStats.bestWord && (
                    <div className="flex justify-between items-center"><span className="text-white/50 text-sm">{t.bestWord}</span><span className="text-emerald-400 font-semibold">{onlineStats.bestWord} (+{onlineStats.bestWordScore})</span></div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4" /> {t.mainMenu}
      </Button>
    </div>
  );
};

export default Statistics;
