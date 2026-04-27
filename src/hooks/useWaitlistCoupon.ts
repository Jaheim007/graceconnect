import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WaitlistCoupon {
  code: string;
  discount_percent: number;
  source: string;
  redeemed_at: string | null;
  expires_at: string | null;
}

/**
 * Récupère le coupon waitlist (-20% à vie) si l'utilisateur en a un.
 */
export function useWaitlistCoupon() {
  const { user } = useAuth();
  const [coupon, setCoupon] = useState<WaitlistCoupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('waitlist_coupons')
        .select('code, discount_percent, source, redeemed_at, expires_at')
        .eq('user_id', user.id)
        .is('redeemed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setCoupon(data as WaitlistCoupon | null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  return { coupon, loading };
}
