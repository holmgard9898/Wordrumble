import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Check, X, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  requester_profile?: Profile;
  addressee_profile?: Profile;
}

interface FriendSearchProps {
  onChallenge: (friendUserId: string, friendName: string) => void;
}

export function FriendSearch({ onChallenge }: FriendSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'friends' | 'search'>('friends');

  // Load friends
  useEffect(() => {
    if (!user) return;
    loadFriends();

    const channel = supabase
      .channel('friendships-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
      }, () => loadFriends())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!data) return;

    // Load profiles for all friends
    const userIds = new Set<string>();
    data.forEach(f => {
      userIds.add(f.requester_id);
      userIds.add(f.addressee_id);
    });
    userIds.delete(user.id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const enriched = data.map(f => ({
      ...f,
      requester_profile: profileMap.get(f.requester_id),
      addressee_profile: profileMap.get(f.addressee_id),
    }));

    setFriends(enriched as Friendship[]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('display_name', `%${searchQuery.trim()}%`)
      .neq('user_id', user.id)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: targetUserId,
    });
    if (error) {
      if (error.code === '23505') toast.error('Vänförfrågan redan skickad');
      else toast.error('Kunde inte skicka förfrågan');
    } else {
      toast.success('Vänförfrågan skickad!');
      loadFriends();
    }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    if (accept) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
      toast.success('Vän tillagd!');
    } else {
      await supabase.from('friendships').delete().eq('id', friendshipId);
    }
    loadFriends();
  };

  const pendingReceived = friends.filter(
    f => f.status === 'pending' && f.addressee_id === user?.id
  );
  const accepted = friends.filter(f => f.status === 'accepted');
  const pendingSent = friends.filter(
    f => f.status === 'pending' && f.requester_id === user?.id
  );

  const getFriendProfile = (f: Friendship) => {
    if (f.requester_id === user?.id) return f.addressee_profile;
    return f.requester_profile;
  };

  const getFriendUserId = (f: Friendship) => {
    return f.requester_id === user?.id ? f.addressee_id : f.requester_id;
  };

  // Check if user is already a friend or has pending request
  const isFriendOrPending = (userId: string) => {
    return friends.some(
      f => (f.requester_id === userId || f.addressee_id === userId)
    );
  };

  return (
    <div className="w-full max-w-md">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('friends')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'friends' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
          }`}
        >
          Vänner ({accepted.length})
        </button>
        <button
          onClick={() => setTab('search')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'search' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
          }`}
        >
          Sök spelare
        </button>
      </div>

      {tab === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Sök på namn..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              size="icon"
              className="bg-white/20 hover:bg-white/30"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {searchResults.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {p.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">{p.display_name}</span>
              </div>
              {isFriendOrPending(p.user_id) ? (
                <span className="text-white/40 text-xs">Redan tillagd</span>
              ) : (
                <Button
                  onClick={() => sendFriendRequest(p.user_id)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white gap-1"
                >
                  <UserPlus className="w-3 h-3" /> Lägg till
                </Button>
              )}
            </div>
          ))}

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-white/40 text-sm text-center py-4">Inga spelare hittade</p>
          )}
        </div>
      )}

      {tab === 'friends' && (
        <div className="space-y-3">
          {/* Pending requests */}
          {pendingReceived.length > 0 && (
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase mb-2">Vänförfrågningar</p>
              {pendingReceived.map((f) => {
                const profile = getFriendProfile(f);
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-xl mb-2"
                    style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white font-medium">{profile?.display_name || 'Okänd'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => respondToRequest(f.id, true)}
                        size="icon"
                        className="bg-green-600 hover:bg-green-500 w-8 h-8"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => respondToRequest(f.id, false)}
                        size="icon"
                        className="bg-red-600 hover:bg-red-500 w-8 h-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Accepted friends */}
          {accepted.length > 0 ? (
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase mb-2">Dina vänner</p>
              {accepted.map((f) => {
                const profile = getFriendProfile(f);
                const friendId = getFriendUserId(f);
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-xl mb-2"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white font-medium">{profile?.display_name || 'Okänd'}</span>
                    </div>
                    <Button
                      onClick={() => onChallenge(friendId, profile?.display_name || 'Vän')}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white gap-1"
                    >
                      <Swords className="w-3 h-3" /> Utmana
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : pendingReceived.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">Inga vänner ännu</p>
              <p className="text-white/30 text-xs mt-1">Sök efter spelare för att lägga till vänner</p>
            </div>
          ) : null}

          {/* Pending sent */}
          {pendingSent.length > 0 && (
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase mb-2">Skickade förfrågningar</p>
              {pendingSent.map((f) => {
                const profile = getFriendProfile(f);
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-xl mb-2"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 font-bold text-sm">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white/60 text-sm">{profile?.display_name || 'Okänd'}</span>
                    </div>
                    <span className="text-white/30 text-xs">Väntar...</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
