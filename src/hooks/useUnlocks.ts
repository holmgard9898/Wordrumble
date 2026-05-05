import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const UNLOCKS_KEY = 'wr-unlocks';

const DEFAULT_UNLOCKS = new Set([
  'bg-default',
  'bg-storybook',
  'tile-bubble',
  'tile-shapes',
]);

export function useUnlocks() {
  const syncingRef = useRef(false);

  const [unlocked, setUnlocked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(UNLOCKS_KEY);
      if (saved) {
        const arr: string[] = JSON.parse(saved);
        return new Set([...DEFAULT_UNLOCKS, ...arr]);
      }
    } catch { /* ignore */ }
    return new Set(DEFAULT_UNLOCKS);
  });

  // Load from DB on mount & merge
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('unlocked_items')
        .eq('user_id', session.user.id)
        .single();
      if (profile?.unlocked_items && Array.isArray(profile.unlocked_items)) {
        setUnlocked(prev => new Set([...prev, ...(profile.unlocked_items as string[])]));
      }
    };
    load();
  }, []);

  // Save to localStorage + DB
  useEffect(() => {
    const arr = [...unlocked];
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(arr));

    if (syncingRef.current) return;
    syncingRef.current = true;
    const timeout = setTimeout(async () => {
      syncingRef.current = false;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase
        .from('profiles')
        .update({ unlocked_items: arr } as any)
        .eq('user_id', session.user.id);
    }, 1000);
    return () => { clearTimeout(timeout); syncingRef.current = false; };
  }, [unlocked]);

  const isUnlocked = useCallback((id: string) => unlocked.has(id), [unlocked]);

  const unlock = useCallback((id: string) => {
    setUnlocked((prev) => new Set([...prev, id]));
  }, []);

  return { isUnlocked, unlock };
}
