import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle, Users, Loader2, X, Bot, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { MatchList } from '@/components/multiplayer/MatchList';
import { FriendDrawer } from '@/components/multiplayer/FriendDrawer';
import { ModePickerSheet, type MatchMode } from '@/components/multiplayer/ModePickerSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BubbleTitle } from '@/components/BubbleTitle';
import { BackButton } from '@/components/MenuButton';

const MultiplayerMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [friendDrawerOpen, setFriendDrawerOpen] = useState(false);
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [modePickerContext, setModePickerContext] = useState<'random' | { userId: string; name: string }>('random');
  const [searching, setSearching] = useState(false);
  const [queuedMode, setQueuedMode] = useState<string | null>(null);
  const [searchStartedAt, setSearchStartedAt] = useState<string | null>(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadPendingCount = async () => {
      const { count } = await supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('addressee_id', user.id).eq('status', 'pending');
      setPendingRequestCount(count || 0);
    };
    loadPendingCount();
    const channel = supabase.channel('friend-requests').on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => loadPendingCount()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [loading, user, navigate]);

  useEffect(() => {
    if (!searching || !queuedMode || !user || !searchStartedAt) return;
    const interval = setInterval(async () => {
      const { data: matches } = await supabase.from('matches').select('id').or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`).eq('status', 'active').eq('mode', queuedMode as MatchMode).gte('created_at', searchStartedAt).order('created_at', { ascending: false }).limit(1);
      if (matches && matches.length > 0) { setSearching(false); toast.success(t.matchFound); navigate(`/match/${matches[0].id}`); }
    }, 2000);
    return () => clearInterval(interval);
  }, [searching, queuedMode, user, navigate, t.matchFound, searchStartedAt]);

  if (loading) {
    return <div className={`min-h-screen flex flex-col items-center justify-center ${bg.className}`} style={bg.style}><div className="text-white/60">{t.loading}</div></div>;
  }
  if (!user) return null;

  const handleRandomClick = () => { playClick(); setModePickerContext('random'); setModePickerOpen(true); };
  const handleFriendChallenge = (friendUserId: string, friendName: string) => { playClick(); setModePickerContext({ userId: friendUserId, name: friendName }); setModePickerOpen(true); };

  const handleModeSelected = async (mode: MatchMode) => {
    if (modePickerContext === 'random') await startRandomMatch(mode);
    else await challengeFriendWithMode(mode, modePickerContext);
  };

  const startRandomMatch = async (mode: MatchMode) => {
    setSearching(true); setQueuedMode(mode); setSearchStartedAt(new Date().toISOString());
    try {
      const { data, error } = await supabase.functions.invoke('find-match', { body: { mode } });
      if (error) throw error;
      if (data.status === 'matched') { setSearching(false); toast.success(t.matchFound); navigate(`/match/${data.match.id}`); }
    } catch { toast.error(t.couldNotSearch); setSearching(false); setQueuedMode(null); setSearchStartedAt(null); }
  };

  const challengeFriendWithMode = async (mode: MatchMode, friend: { userId: string; name: string }) => {
    const totalRounds = mode === 'surge' ? 3 : 2;
    const { data: match, error } = await supabase.from('matches').insert({
      mode, player1_id: user.id, player2_id: friend.userId, status: 'waiting', current_turn: user.id,
      current_round: 1, total_rounds: totalRounds, round_grids: [], shared_used_words: [],
      player1_rounds_data: [], player2_rounds_data: [],
    }).select().single();
    if (error) { toast.error(t.couldNotCreate); return; }
    toast.success(t.challengeSent.replace('{name}', friend.name));
    navigate(`/match/${match.id}`);
  };

  const cancelSearch = async () => { await supabase.from('matchmaking_queue').delete().eq('user_id', user.id); setSearching(false); setQueuedMode(null); setSearchStartedAt(null); };

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 pt-8 pb-20 ${bg.className}`} style={bg.style}>
      <div className="mb-1"><BubbleTitle text={t.challenge} size="md" /></div>
      <p className="text-white/60 text-sm mb-6 mt-2">{t.chooseOpponent}</p>

      {searching ? (
        <div className="w-full max-w-md text-center py-8">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold mb-1">{t.searchingOpponent}</p>
          <p className="text-white/40 text-sm mb-4">{queuedMode}</p>
          <Button onClick={cancelSearch} variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10 gap-2">
            <X className="w-4 h-4" /> {t.cancel}
          </Button>
        </div>
      ) : (
        <>
          <div className="w-full max-w-md space-y-3 mb-6">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{t.challenge}</p>
            <button onClick={handleRandomClick} className="w-full rounded-3xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.98] backdrop-blur-2xl shadow-lg" style={{ background: 'rgba(30,18,60,0.85)', border: '1px solid rgba(168,85,247,0.45)' }}>
              <Shuffle className="w-6 h-6 text-purple-300" />
              <div className="text-left"><div className="text-white font-bold text-base">{t.randomOpponent}</div><div className="text-white/70 text-xs">{t.meetRandomPlayer}</div></div>
            </button>
            <button onClick={() => { playClick(); setFriendDrawerOpen(true); }} className="w-full rounded-3xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.98] relative backdrop-blur-2xl shadow-lg" style={{ background: 'rgba(30,18,60,0.85)', border: '1px solid rgba(168,85,247,0.45)' }}>
              <Users className="w-6 h-6 text-purple-300" />
              <div className="text-left flex-1"><div className="text-white font-bold text-base">{t.friend}</div><div className="text-white/70 text-xs">{t.challengeFriend}</div></div>
              {pendingRequestCount > 0 && <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse"><Bell className="w-3 h-3" /> {pendingRequestCount}</span>}
            </button>
            <button onClick={() => { playClick(); toast.info(t.comingSoon + '!'); }} className="w-full rounded-3xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.98] opacity-70 backdrop-blur-2xl shadow-lg" style={{ background: 'rgba(30,18,60,0.85)', border: '1px solid rgba(168,85,247,0.45)' }}>
              <Bot className="w-6 h-6 text-purple-300" />
              <div className="text-left"><div className="text-white font-bold text-base">{t.computer}</div><div className="text-white/70 text-xs">{t.playVsAI}</div></div>
            </button>
          </div>
          <MatchList />
          <BackButton onClick={() => { playClick(); navigate('/'); }} icon={<ArrowLeft className="w-4 h-4" />} label={t.mainMenu} className="mt-8" />
        </>
      )}

      <FriendDrawer open={friendDrawerOpen} onOpenChange={setFriendDrawerOpen} onChallenge={handleFriendChallenge} />
      <ModePickerSheet open={modePickerOpen} onOpenChange={setModePickerOpen} onSelect={handleModeSelected} title={modePickerContext === 'random' ? t.chooseGameMode : `${t.challenge} ${(modePickerContext as any).name}`} />
    </div>
  );
};

export default MultiplayerMenu;
