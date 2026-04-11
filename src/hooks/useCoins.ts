import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const COINS_KEY = 'wr-coins';

export function useCoins() {
  const syncingRef = useRef(false);

  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(COINS_KEY);
      return saved ? Number(JSON.parse(saved)) : 0;
    } catch {
      return 0;
    }
  });

  // Load from DB on mount & merge (keep highest)
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('user_id', session.user.id)
        .single();
      if (profile && typeof profile.coins === 'number') {
        setCoins(prev => Math.max(prev, profile.coins));
      }
    };
    load();
  }, []);

  // Save to localStorage + DB
  useEffect(() => {
    localStorage.setItem(COINS_KEY, JSON.stringify(coins));

    if (syncingRef.current) return;
    syncingRef.current = true;
    const timeout = setTimeout(async () => {
      syncingRef.current = false;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase
        .from('profiles')
        .update({ coins } as any)
        .eq('user_id', session.user.id);
    }, 1000);
    return () => { clearTimeout(timeout); syncingRef.current = false; };
  }, [coins]);

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => prev + amount);
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setCoins((prev) => {
      if (prev >= amount) {
        success = true;
        return prev - amount;
      }
      return prev;
    });
    return success;
  }, []);

  return { coins, addCoins, spendCoins };
}
