import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';

export type PlatformPlanTier = 'free' | 'pro' | 'org';

/**
 * Returns the platform plan tier for the current user.
 *
 * V1 (rollout): everyone is on `free` — Pro/Org are waitlist-only.
 * Once billing is wired, this hook will read from a `platform_subscriptions`
 * table and return the active tier without changing any consumer code.
 *
 * The hook also exposes whether the user has joined the Pro/Org waitlist,
 * so we can replace "Upgrade" CTAs with "You're on the waitlist" badges.
 */
export function usePlatformPlan() {
  const { user } = useAuth();

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

  const tier: PlatformPlanTier = 'free'; // billing not yet active
  const onWaitlist = {
    pro: (waitlist || []).includes('pro'),
    org: (waitlist || []).includes('org'),
  };

  return {
    tier,
    isFree: tier === 'free',
    isPro: false,
    isOrg: false,
    onWaitlist,
    /** During rollout no feature is hard-blocked — soft prompts only. */
    canUse: (_feature: string) => true,
  };
}
