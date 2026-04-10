import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Timer, Zap, Star, Trophy, Loader2, X } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { toast } from 'sonner';

type MatchMode = 'classic' | 'surge' | 'fiveplus' | 'oneword';

interface NewMatchFlowProps {
  /** Pre-selected opponent for friend challenges */
  challengeFriend?: { userId: string; name: string } | null;
  onCancel: () => void;
}

const MODES = [
  { id: 'classic' as MatchMode, icon: Timer, label: 'Classic', color: '59,130,246', desc: '2 omgångar, 50 drag var' },
  { id: 'surge' as MatchMode, icon: Zap, label: 'Word Surge', color: '234,179,8', desc: '3 omgångar, bonus för långa ord' },
  { id: 'fiveplus' as MatchMode, icon: Star, label: '5+ Bokstäver', color: '34,211,238', desc: '2 omgångar, min 5 bokstäver' },
  { id: 'oneword' as MatchMode, icon: Trophy, label: 'Längsta Ordet', color: '16,185,129', desc: '2 omgångar, bästa ord räknas' },
];

export function NewMatchFlow({ challengeFriend, onCancel }: NewMatchFlowProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const [selectedMode, setSelectedMode] = useState<MatchMode | null>(null);
  const [searching, setSearching] = useState(false);
  const [queuedMode, setQueuedMode] = useState<string | null>(null);

  // Poll for match when queued
  useEffect(() => {
    if (!searching || !queuedMode || !user) return;

    const interval = setInterval(async () => {
      // Check if we've been matched
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .eq('status', 'active')
        .eq('mode', queuedMode)
        .order('created_at', { ascending: false })
        .limit(1);

      if (matches && matches.length > 0) {
        setSearching(false);
        toast.success('Match hittad!');
        navigate(`/match/${matches[0].id}`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [searching, queuedMode, user, navigate]);

  const startRandomMatch = async (mode: MatchMode) => {
    if (!user) return;
    playClick();
    setSearching(true);
    setQueuedMode(mode);

    try {
      const { data, error } = await supabase.functions.invoke('find-match', {
        body: { mode },
      });

      if (error) throw error;

      if (data.status === 'matched') {
        setSearching(false);
        toast.success('Match hittad!');
        navigate(`/match/${data.match.id}`);
      }
      // If 'queued', polling will pick up the match
    } catch (err: any) {
      toast.error('Kunde inte söka match');
      setSearching(false);
      setQueuedMode(null);
    }
  };

  const cancelSearch = async () => {
    if (!user) return;
    // Remove from queue
    await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('user_id', user.id);
    setSearching(false);
    setQueuedMode(null);
  };

  const challengeFriendWithMode = async (mode: MatchMode) => {
    if (!user || !challengeFriend) return;
    playClick();

    // Create a match directly with friend as player2
    const totalRounds = mode === 'surge' ? 3 : 2;
    
    // Generate grids server-side would be better, but for now create locally
    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        mode,
        player1_id: user.id,
        player2_id: challengeFriend.userId,
        status: 'active',
        current_turn: user.id,
        current_round: 1,
        total_rounds: totalRounds,
        round_grids: [], // Will be generated when first player plays
        shared_used_words: [],
        player1_rounds_data: [],
        player2_rounds_data: [],
      })
      .select()
      .single();

    if (error) {
      toast.error('Kunde inte skapa match');
      return;
    }

    toast.success(`Utmaning skickad till ${challengeFriend.name}!`);
    navigate(`/match/${match.id}`);
  };

  if (searching) {
    return (
      <div className="w-full max-w-md text-center py-8">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-semibold mb-1">Söker motståndare...</p>
        <p className="text-white/40 text-sm mb-4">
          {MODES.find(m => m.id === queuedMode)?.label || queuedMode}
        </p>
        <Button
          onClick={cancelSearch}
          variant="ghost"
          className="text-white/50 hover:text-white hover:bg-white/10 gap-2"
        >
          <X className="w-4 h-4" /> Avbryt
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/70 text-sm font-semibold">
          {challengeFriend ? `Utmana ${challengeFriend.name}` : 'Välj spelläge'}
        </p>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="text-white/40 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => {
              if (challengeFriend) {
                challengeFriendWithMode(mode.id);
              } else {
                startRandomMatch(mode.id);
              }
            }}
            className="w-full rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.98]"
            style={{
              background: `rgba(${mode.color},0.15)`,
              border: `1px solid rgba(${mode.color},0.3)`,
            }}
          >
            <div className="flex items-center gap-3">
              <mode.icon className="w-5 h-5" style={{ color: `rgb(${mode.color})` }} />
              <div>
                <span className="text-white font-semibold">{mode.label}</span>
                <div className="text-white/50 text-xs">{mode.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
