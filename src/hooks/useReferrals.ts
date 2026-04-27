import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReferralStats {
  code: string | null;
  total: number;
  active: number;
  rewarded: number;
  pendingToNextReward: number;
  rewards: Array<{ id: string; reward_type: string; reward_value: string | null; granted_at: string }>;
}

export function useReferrals() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [{ data: profile }, { data: refs }, { data: rewards }] = await Promise.all([
          supabase.from("profiles").select("referral_code").eq("id", user.id).maybeSingle(),
          supabase.from("user_referrals").select("status").eq("referrer_id", user.id),
          supabase.from("referral_rewards").select("id, reward_type, reward_value, granted_at").eq("user_id", user.id).order("granted_at", { ascending: false }),
        ]);

        const total = refs?.length ?? 0;
        const active = refs?.filter((r: any) => r.status === "active" || r.status === "rewarded").length ?? 0;
        const rewarded = refs?.filter((r: any) => r.status === "rewarded").length ?? 0;
        const pendingToNextReward = 3 - (active % 3 === 0 && active > 0 ? 0 : active % 3);

        setStats({
          code: (profile as any)?.referral_code ?? null,
          total,
          active,
          rewarded,
          pendingToNextReward: pendingToNextReward === 3 ? 3 : pendingToNextReward,
          rewards: (rewards as any) ?? [],
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  return { stats, loading };
}
