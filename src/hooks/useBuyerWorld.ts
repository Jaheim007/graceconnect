import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeBuyerWorld, type BuyerWorld } from '@/lib/siteviral/buyerWorlds';

/**
 * Reads/writes the current user's chosen buyer world. Persists on
 * profiles.buyer_world when authenticated; falls back to the existing
 * localStorage key `sv_last_vertical` for anonymous / legacy visits.
 */
export function useBuyerWorld() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Local snapshot so the sidebar can render synchronously without waiting
  // for the profile query on first paint.
  const [localWorld, setLocalWorld] = useState<BuyerWorld | null>(() => {
    if (typeof window === 'undefined') return null;
    return normalizeBuyerWorld(window.localStorage.getItem('sv_last_vertical'));
  });

  const { data: profileWorld } = useQuery({
    queryKey: ['profile-buyer-world', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('buyer_world')
        .eq('id', user.id)
        .maybeSingle<{ buyer_world: string | null }>();
      return normalizeBuyerWorld(data?.buyer_world ?? null);
    },
  });

  const world: BuyerWorld | null = profileWorld ?? localWorld;

  const setBuyerWorld = useCallback(async (next: BuyerWorld) => {
    try { window.localStorage.setItem('sv_last_vertical', next); } catch {}
    setLocalWorld(next);
    if (user) {
      await supabase.from('profiles').update({ buyer_world: next }).eq('id', user.id);
      qc.invalidateQueries({ queryKey: ['profile-buyer-world', user.id] });
    }
  }, [user, qc]);

  // If we're authed but profile has nothing yet, opportunistically persist
  // whatever we captured in localStorage so it survives future devices.
  useEffect(() => {
    if (user && !profileWorld && localWorld) {
      supabase.from('profiles').update({ buyer_world: localWorld }).eq('id', user.id).then(() => {
        qc.invalidateQueries({ queryKey: ['profile-buyer-world', user.id] });
      });
    }
  }, [user, profileWorld, localWorld, qc]);

  return { world, setBuyerWorld };
}
