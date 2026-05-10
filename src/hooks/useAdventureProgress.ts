import { useState, useEffect, useCallback, useRef } from 'react';
import { adventureLevels } from '@/data/adventureLevels';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'wr-adventure-progress';

interface ProgressState {
  completed: string[];
}

function loadLocal(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: [] };
}

function mergeCompleted(a: string[], b: string[]): string[] {
  return Array.from(new Set([...(a ?? []), ...(b ?? [])]));
}

export function useAdventureProgress() {
  const [state, setState] = useState<ProgressState>(loadLocal);
  const hydratedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from cloud on mount + when auth state changes
  useEffect(() => {
    let cancelled = false;

    const pullFromCloud = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('game_progress')
        .eq('user_id', session.user.id)
        .single();
      const remote = (profile?.game_progress as any)?.adventureCompleted as string[] | undefined;
      if (!remote || cancelled) {
        hydratedRef.current = true;
        return;
      }
      setState(prev => ({ completed: mergeCompleted(prev.completed, remote) }));
      hydratedRef.current = true;
    };

    pullFromCloud();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      // re-pull whenever the user logs in/out so progress follows the account
      hydratedRef.current = false;
      pullFromCloud();
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // Persist locally + push to cloud (debounced) whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      // Read existing game_progress so we don't clobber other keys
      const { data: profile } = await supabase
        .from('profiles')
        .select('game_progress')
        .eq('user_id', session.user.id)
        .single();
      const existing = (profile?.game_progress as Record<string, unknown> | null) ?? {};
      const merged = {
        ...existing,
        adventureCompleted: mergeCompleted(
          (existing as any).adventureCompleted ?? [],
          state.completed,
        ),
      };
      await supabase
        .from('profiles')
        .update({ game_progress: merged as any })
        .eq('user_id', session.user.id);
    }, 800);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state]);

  const isCompleted = useCallback((id: string) => state.completed.includes(id), [state.completed]);

  const isUnlocked = useCallback((id: string): boolean => {
    const idx = adventureLevels.findIndex(l => l.id === id);
    if (idx <= 0) return true;
    const prev = adventureLevels[idx - 1];
    return state.completed.includes(prev.id);
  }, [state.completed]);

  const markCompleted = useCallback((id: string) => {
    setState(prev => prev.completed.includes(id) ? prev : { completed: [...prev.completed, id] });
  }, []);

  return { isCompleted, isUnlocked, markCompleted, completedCount: state.completed.length };
}
