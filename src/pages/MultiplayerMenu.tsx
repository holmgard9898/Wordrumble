import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle, Users, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useAuth } from '@/hooks/useAuth';
import { MatchList } from '@/components/multiplayer/MatchList';
import { FriendSearch } from '@/components/multiplayer/FriendSearch';
import { NewMatchFlow } from '@/components/multiplayer/NewMatchFlow';

type View = 'hub' | 'new-random' | 'new-friend' | 'friends';

const MultiplayerMenu = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('hub');
  const [challengeFriend, setChallengeFriend] = useState<{ userId: string; name: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${bg.className}`} style={bg.style}>
        <div className="text-white/60">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleChallengeFriend = (friendUserId: string, friendName: string) => {
    playClick();
    setChallengeFriend({ userId: friendUserId, name: friendName });
    setView('new-friend');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 pt-8 pb-20 ${bg.className}`} style={bg.style}>
      <h1 className="text-3xl font-bold text-white mb-1">Utmana</h1>

      {view === 'hub' && (
        <>
          {/* Action buttons */}
          <div className="flex gap-3 w-full max-w-md mt-4 mb-6">
            <button
              onClick={() => { playClick(); setView('new-random'); }}
              className="flex-1 rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(147,51,234,0.2)', border: '1px solid rgba(147,51,234,0.3)' }}
            >
              <Shuffle className="w-5 h-5 text-purple-400 mb-1" />
              <div className="text-white font-semibold text-sm">Slumpmässig</div>
              <div className="text-white/40 text-[10px]">Möt en spelare</div>
            </button>
            <button
              onClick={() => { playClick(); setView('friends'); }}
              className="flex-1 rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <Users className="w-5 h-5 text-blue-400 mb-1" />
              <div className="text-white font-semibold text-sm">Vänner</div>
              <div className="text-white/40 text-[10px]">Utmana en vän</div>
            </button>
          </div>

          {/* Match list */}
          <MatchList />
        </>
      )}

      {view === 'new-random' && (
        <div className="mt-6 w-full flex flex-col items-center">
          <NewMatchFlow onCancel={() => setView('hub')} />
        </div>
      )}

      {view === 'new-friend' && (
        <div className="mt-6 w-full flex flex-col items-center">
          <NewMatchFlow
            challengeFriend={challengeFriend}
            onCancel={() => { setChallengeFriend(null); setView('friends'); }}
          />
        </div>
      )}

      {view === 'friends' && (
        <div className="mt-6 w-full flex flex-col items-center">
          <FriendSearch onChallenge={handleChallengeFriend} />
          <Button
            onClick={() => { playClick(); setView('hub'); }}
            variant="ghost"
            className="mt-6 gap-2 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Tillbaka
          </Button>
        </div>
      )}

      {view === 'hub' && (
        <Button
          onClick={() => { playClick(); navigate('/'); }}
          variant="ghost"
          className="mt-8 gap-2 text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Huvudmeny
        </Button>
      )}
    </div>
  );
};

export default MultiplayerMenu;
