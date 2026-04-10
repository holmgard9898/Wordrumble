import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Check, X, Swords, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface FriendDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChallenge: (friendUserId: string, friendName: string) => void;
}

export function FriendDrawer({ open, onOpenChange, onChallenge }: FriendDrawerProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    loadFriends();
  }, [user, open]);

  const loadFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!data) return;

    const userIds = new Set<string>();
    data.forEach(f => { userIds.add(f.requester_id); userIds.add(f.addressee_id); });
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
    setHasSearched(true);
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

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Word Rumble',
          text: 'Utmana mig i Word Rumble! 🎮',
          url: window.location.origin,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success('Länk kopierad!');
    }
  };

  const pendingReceived = friends.filter(f => f.status === 'pending' && f.addressee_id === user?.id);
  const accepted = friends.filter(f => f.status === 'accepted');

  const getFriendProfile = (f: Friendship) =>
    f.requester_id === user?.id ? f.addressee_profile : f.requester_profile;
  const getFriendUserId = (f: Friendship) =>
    f.requester_id === user?.id ? f.addressee_id : f.requester_id;
  const isFriendOrPending = (userId: string) =>
    friends.some(f => f.requester_id === userId || f.addressee_id === userId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#1a1040] border-purple-500/20 max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-white text-center">Utmana en vän</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2">
          {/* Search */}
          <div className="flex gap-2 mb-3">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Sök spelare..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <Button onClick={handleSearch} disabled={searching} size="icon" className="bg-white/20 hover:bg-white/30 shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-white/50 text-xs font-semibold uppercase">Sökresultat</p>
              {searchResults.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {p.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium text-sm">{p.display_name}</span>
                  </div>
                  <div className="flex gap-2">
                    {!isFriendOrPending(p.user_id) && (
                      <Button onClick={() => sendFriendRequest(p.user_id)} size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 gap-1 h-8 px-2">
                        <UserPlus className="w-3 h-3" /> Lägg till
                      </Button>
                    )}
                    <Button onClick={() => { onOpenChange(false); onChallenge(p.user_id, p.display_name); }} size="sm" className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white gap-1 h-8 px-2">
                      <Swords className="w-3 h-3" /> Utmana
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasSearched && searchResults.length === 0 && !searching && (
            <p className="text-white/40 text-sm text-center py-2 mb-3">Inga spelare hittade</p>
          )}
        </div>

        {/* Scrollable friend list */}
        <ScrollArea className="flex-1 px-4 pb-4" style={{ maxHeight: '45vh' }}>
          {/* Pending requests */}
          {pendingReceived.length > 0 && (
            <div className="mb-3">
              <p className="text-white/50 text-xs font-semibold uppercase mb-2">Vänförfrågningar</p>
              {pendingReceived.map(f => {
                const profile = getFriendProfile(f);
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white font-medium text-sm">{profile?.display_name || 'Okänd'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => respondToRequest(f.id, true)} size="icon" className="bg-green-600 hover:bg-green-500 w-7 h-7">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button onClick={() => respondToRequest(f.id, false)} size="icon" className="bg-red-600 hover:bg-red-500 w-7 h-7">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Friends */}
          {accepted.length > 0 ? (
            <div className="mb-3">
              <p className="text-white/50 text-xs font-semibold uppercase mb-2">Dina vänner ({accepted.length})</p>
              {accepted.map(f => {
                const profile = getFriendProfile(f);
                const friendId = getFriendUserId(f);
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white font-medium text-sm">{profile?.display_name || 'Okänd'}</span>
                    </div>
                    <Button
                      onClick={() => { onOpenChange(false); onChallenge(friendId, profile?.display_name || 'Vän'); }}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white gap-1 h-8"
                    >
                      <Swords className="w-3 h-3" /> Utmana
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-white/40 text-sm">Inga vänner ännu</p>
              <p className="text-white/30 text-xs mt-1">Sök efter spelare ovan eller bjud in vänner</p>
            </div>
          )}
        </ScrollArea>

        {/* Invite button */}
        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          <Button onClick={handleInvite} variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10 gap-2">
            <Share2 className="w-4 h-4" /> Bjud in vänner
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
