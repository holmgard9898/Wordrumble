import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Clock, Swords, ChevronRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MatchRow {
  id: string; mode: string; status: string; current_turn: string | null;
  current_round: number; total_rounds: number; player1_id: string; player2_id: string | null;
  player1_score: number; player2_score: number; winner_id: string | null;
  last_move_at: string; created_at: string;
}

interface Profile { user_id: string; display_name: string; }

export function MatchList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const MODE_LABELS: Record<string, string> = {
    classic: t.modeClassic, surge: t.modeSurge, fiveplus: t.modeFiveplus, oneword: t.longestWord,
  };

  useEffect(() => {
    if (!user) return;
    loadMatches();
    const channel = supabase.channel('match-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadMatches()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;
    const { data } = await supabase.from('matches').select('*').or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`).in('status', ['active', 'waiting']).order('last_move_at', { ascending: false });
    if (data) {
      // Auto-forfeit matches where the player whose turn it is has exceeded 48h
      const FORTY_EIGHT_H = 48 * 60 * 60 * 1000;
      const now = Date.now();
      const expired = (data as any[]).filter(m => m.status === 'active' && m.current_turn && (now - new Date(m.last_move_at).getTime()) > FORTY_EIGHT_H);
      if (expired.length > 0) {
        await Promise.all(expired.map(m => {
          const winnerId = m.current_turn === m.player1_id ? m.player2_id : m.player1_id;
          return supabase.from('matches').update({ status: 'forfeit', winner_id: winnerId }).eq('id', m.id);
        }));
        const expiredIds = new Set(expired.map(m => m.id));
        const remaining = (data as any[]).filter(m => !expiredIds.has(m.id));
        setMatches(remaining as MatchRow[]);
      } else {
        setMatches(data as unknown as MatchRow[]);
      }
      const opponentIds = new Set<string>();
      data.forEach((m: any) => { if (m.player1_id !== user.id) opponentIds.add(m.player1_id); if (m.player2_id && m.player2_id !== user.id) opponentIds.add(m.player2_id); });
      if (opponentIds.size > 0) {
        const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', Array.from(opponentIds));
        const map = new Map<string, string>();
        profs?.forEach((p: Profile) => map.set(p.user_id, p.display_name));
        setProfiles(map);
      }
    }
    setLoading(false);
  };

  const getOpponentName = (match: MatchRow) => {
    const opponentId = match.player1_id === user?.id ? match.player2_id : match.player1_id;
    if (!opponentId) return t.awaitingPlayer;
    return profiles.get(opponentId) || t.player;
  };

  const getMyScore = (match: MatchRow) => match.player1_id === user?.id ? match.player1_score : match.player2_score;
  const getOpponentScore = (match: MatchRow) => match.player1_id === user?.id ? match.player2_score : match.player1_score;
  const isMyTurn = (match: MatchRow) => match.current_turn === user?.id;
  const isIncomingInvitation = (match: MatchRow) => match.status === 'waiting' && match.player2_id === user?.id;
  const isSentInvitation = (match: MatchRow) => match.status === 'waiting' && match.player1_id === user?.id && match.player2_id !== null;

  const acceptMatch = async (matchId: string) => {
    const { error } = await supabase.from('matches').update({ status: 'active' }).eq('id', matchId);
    if (error) { toast.error(t.couldNotAccept); } else { toast.success(t.matchAccepted); navigate(`/match/${matchId}`); }
  };
  const declineMatch = async (matchId: string) => {
    const { error } = await supabase.from('matches').update({ status: 'forfeit' }).eq('id', matchId);
    if (error) { toast.error(t.couldNotDecline); } else { toast.success(t.matchDeclined); loadMatches(); }
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.justNow;
    if (mins < 60) return `${mins} ${t.minAgo}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t.hAgo}`;
    const days = Math.floor(hours / 24);
    return `${days}${t.dAgo}`;
  };

  if (loading) return <div className="w-full max-w-md py-8 text-center"><div className="text-white/40 text-sm">{t.loadingMatches}</div></div>;

  const incoming = matches.filter(m => isIncomingInvitation(m));
  const otherMatches = matches.filter(m => !isIncomingInvitation(m));

  if (matches.length === 0) {
    return (
      <div className="w-full max-w-md py-8 text-center">
        <Swords className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">{t.noActiveMatches}</p>
        <p className="text-white/25 text-xs mt-1">{t.startNewMatch}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-2">
      {incoming.length > 0 && (
        <>
          <p className="text-yellow-400/80 text-xs font-semibold uppercase tracking-wider mb-2">{t.matchInvitations} ({incoming.length})</p>
          {incoming.map((match) => (
            <div key={match.id} className="w-full rounded-xl p-4 backdrop-blur-2xl shadow-lg" style={{ background: 'rgba(60,40,5,0.85)', border: '1px solid rgba(234,179,8,0.5)' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400 uppercase">{t.invitation}</span>
                    <span className="text-white/70 text-[10px]">{MODE_LABELS[match.mode] || match.mode}</span>
                  </div>
                  <span className="text-white font-semibold text-sm">{getOpponentName(match)} {t.challengesYou}</span>
                  <div className="text-white/70 text-xs mt-1">{getTimeSince(match.created_at)}</div>
                </div>
                <div className="flex gap-2 ml-3">
                  <Button onClick={() => acceptMatch(match.id)} size="icon" className="bg-green-600 hover:bg-green-500 w-9 h-9"><Check className="w-4 h-4" /></Button>
                  <Button onClick={() => declineMatch(match.id)} size="icon" className="bg-red-600 hover:bg-red-500 w-9 h-9"><X className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {otherMatches.length > 0 && (
        <>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">{t.activeMatches} ({otherMatches.length})</p>
          {otherMatches.map((match) => {
            const myTurn = isMyTurn(match);
            const sent = isSentInvitation(match);
            return (
              <button key={match.id} onClick={() => navigate(`/match/${match.id}`)} className="w-full rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] backdrop-blur-2xl shadow-lg" style={{ background: myTurn ? 'rgba(15,55,30,0.88)' : sent ? 'rgba(60,40,5,0.85)' : 'rgba(20,18,40,0.88)', border: `1px solid ${myTurn ? 'rgba(34,197,94,0.5)' : sent ? 'rgba(234,179,8,0.45)' : 'rgba(255,255,255,0.18)'}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {myTurn && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 uppercase">{t.yourTurn}</span>}
                      {sent && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> {t.awaitingResponse}</span>}
                      {!myTurn && !sent && match.status === 'active' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/70 uppercase">{t.awaitingOpponent}</span>}
                      <span className="text-white/70 text-[10px]">{MODE_LABELS[match.mode] || match.mode}</span>
                    </div>
                    <div className="flex items-center gap-2"><span className="text-white font-semibold text-sm">vs {getOpponentName(match)}</span></div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/60 text-xs">{getMyScore(match)} - {getOpponentScore(match)}</span>
                      <span className="text-white/70 text-xs">{t.round} {match.current_round}/{match.total_rounds}</span>
                      <span className="text-white/60 text-xs">{getTimeSince(match.last_move_at)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </div>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
