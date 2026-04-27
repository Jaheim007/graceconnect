import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';

export type PlatformPlanTier = 'free' | 'pro' | 'org';

/**
 * Returns the active platform plan tier for the current user.
 *
 * Source of truth (in order):
 * 1. founders_lifetime (Pro à vie pour les 50 premiers convertis)
 * 2. platform_subscriptions actif (trialing|active) — billing live via Stripe / Paystack
 * 3. Grandfather: utilisateurs créés avant 2026-04-27 → Pro gratuit pendant 60 jours
 * 4. free
 *
 * Calls the `get_user_platform_tier` Postgres function via RPC for canonical
 * resolution. Falls back to a local row read if the RPC is unavailable.
 *
 * Also exposes:
 *  - subscription row (status, period dates, cancel_at_period_end)
 *  - founder_slot (1-50) si l'utilisateur est un founder
 *  - waitlist tracking (kept for UX during the rollout)
 */
export function usePlatformPlan() {
  const { user } = useAuth();

  const { data: tierData, refetch: refetchTier } = useQuery({
    queryKey: ['platform-tier', user?.id],
    queryFn: async () => {
      if (!user?.id) return { tier: 'free' as PlatformPlanTier, subscription: null, founder_slot: null };

      // RPC for tier
      const { data: tier } = await (supabase as any).rpc('get_user_platform_tier', { _user_id: user.id });

      // Subscription row
      const { data: sub } = await db
        .from('platform_subscriptions' as any)
        .select('plan, status, current_period_end, trial_end, cancel_at_period_end, provider, billing_interval')
        .eq('user_id', user.id)
        .maybeSingle();

      // Founder slot
      const { data: founder } = await db
        .from('founders_lifetime' as any)
        .select('slot_number')
        .eq('user_id', user.id)
        .maybeSingle();

      return {
        tier: (tier || 'free') as PlatformPlanTier,
        subscription: sub || null,
        founder_slot: (founder as any)?.slot_number || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const { data: waitlist } = useQuery({
    queryKey: ['platform-plan-waitlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db
        .from('platform_plan_waitlist')
        .select('plan')
        .eq('user_id', user.id);
      return (data || []).map((r: any) => r.plan as PlatformPlanTier);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  const tier = tierData?.tier || 'free';
  const sub = tierData?.subscription as any;
  const onWaitlist = {
    pro: (waitlist || []).includes('pro'),
    org: (waitlist || []).includes('org'),
  };

  // Grandfather detection (heuristic for UI; canonical decision in DB)
  const grandfatherCutoff = new Date('2026-04-27T00:00:00Z');
  const grandfatherEnd = new Date(grandfatherCutoff.getTime() + 60 * 86400000);
  const userCreated = user?.created_at ? new Date(user.created_at) : null;
  const isGrandfather = !!userCreated
    && userCreated < grandfatherCutoff
    && new Date() < grandfatherEnd
    && tier === 'pro'
    && !sub
    && !tierData?.founder_slot;

  return {
    tier,
    isFree: tier === 'free',
    isPro: tier === 'pro',
    isOrg: tier === 'org',
    subscription: sub,
    founderSlot: tierData?.founder_slot || null,
    isFounder: !!tierData?.founder_slot,
    isGrandfather,
    grandfatherEndsAt: isGrandfather ? grandfatherEnd : null,
    isTrialing: sub?.status === 'trialing',
    trialEndsAt: sub?.trial_end ? new Date(sub.trial_end) : null,
    isCanceled: sub?.cancel_at_period_end === true,
    periodEndsAt: sub?.current_period_end ? new Date(sub.current_period_end) : null,
    provider: sub?.provider as 'stripe' | 'paystack' | 'founder' | null,
    onWaitlist,
    canUse: (_feature: string) => true,
    refetch: refetchTier,
  };
}
