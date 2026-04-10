import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Clock, Trophy, Swords, ChevronRight } from 'lucide-react';

interface MatchRow {
  id: string;
  mode: string;
  status: string;
  current_turn: string | null;
  current_round: number;
  total_rounds: number;
  player1_id: string;
  player2_id: string | null;
  player1_score: number;
  player2_score: number;
  winner_id: string | null;
  last_move_at: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string;
}

const MODE_LABELS: Record<string, string> = {
  classic: 'Classic',
  surge: 'Word Surge',
  fiveplus: '5+ Bokstäver',
  oneword: 'Längsta Ordet',
};

export function MatchList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadMatches();

    const channel = supabase
      .channel('match-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
      }, () => loadMatches())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .in('status', ['active', 'waiting'])
      .order('last_move_at', { ascending: false });

    if (data) {
      setMatches(data as unknown as MatchRow[]);

      // Load opponent profiles
      const opponentIds = new Set<string>();
      data.forEach((m: any) => {
        if (m.player1_id !== user.id) opponentIds.add(m.player1_id);
        if (m.player2_id && m.player2_id !== user.id) opponentIds.add(m.player2_id);
      });

      if (opponentIds.size > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', Array.from(opponentIds));

        const map = new Map<string, string>();
        profs?.forEach((p: Profile) => map.set(p.user_id, p.display_name));
        setProfiles(map);
      }
    }
    setLoading(false);
  };

  const getOpponentName = (match: MatchRow) => {
    const opponentId = match.player1_id === user?.id ? match.player2_id : match.player1_id;
    if (!opponentId) return 'Inväntar spelare...';
    return profiles.get(opponentId) || 'Spelare';
  };

  const getMyScore = (match: MatchRow) => {
    return match.player1_id === user?.id ? match.player1_score : match.player2_score;
  };

  const getOpponentScore = (match: MatchRow) => {
    return match.player1_id === user?.id ? match.player2_score : match.player1_score;
  };

  const isMyTurn = (match: MatchRow) => {
    return match.current_turn === user?.id;
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just nu';
    if (mins < 60) return `${mins} min sedan`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h sedan`;
    const days = Math.floor(hours / 24);
    return `${days}d sedan`;
  };

  if (loading) {
    return (
      <div className="w-full max-w-md py-8 text-center">
        <div className="text-white/40 text-sm">Laddar matcher...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="w-full max-w-md py-8 text-center">
        <Swords className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">Inga pågående matcher</p>
        <p className="text-white/25 text-xs mt-1">Starta en ny match nedan!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-2">
      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
        Pågående matcher ({matches.length})
      </p>
      {matches.map((match) => {
        const myTurn = isMyTurn(match);
        const waiting = match.status === 'waiting';

        return (
          <button
            key={match.id}
            onClick={() => navigate(`/match/${match.id}`)}
            className="w-full rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: myTurn
                ? 'rgba(34,197,94,0.15)'
                : waiting
                ? 'rgba(234,179,8,0.1)'
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${
                myTurn
                  ? 'rgba(34,197,94,0.3)'
                  : waiting
                  ? 'rgba(234,179,8,0.2)'
                  : 'rgba(255,255,255,0.1)'
              }`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {myTurn && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 uppercase">
                      Din tur
                    </span>
                  )}
                  {waiting && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Inväntar
                    </span>
                  )}
                  {!myTurn && !waiting && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/40 uppercase">
                      Inväntar motståndare
                    </span>
                  )}
                  <span className="text-white/30 text-[10px]">
                    {MODE_LABELS[match.mode] || match.mode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">
                    vs {getOpponentName(match)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/60 text-xs">
                    {getMyScore(match)} - {getOpponentScore(match)}
                  </span>
                  <span className="text-white/30 text-xs">
                    Omgång {match.current_round}/{match.total_rounds}
                  </span>
                  <span className="text-white/20 text-xs">
                    {getTimeSince(match.last_move_at)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
