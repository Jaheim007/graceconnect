import { useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Auto-enrolls the user as an ambassador for the given org when they share.
 * Returns current affiliate code (may be null initially) and an
 * `ensureAffiliateCode()` async function that auto-enrolls + returns the code.
 */
export function useAutoAffiliateCode(organizationId: string | undefined | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const enrollingRef = useRef(false);

  const { data: affiliateCode } = useQuery({
    queryKey: ['auto-aff-code', user?.id, organizationId],
    queryFn: async () => {
      if (!user || !organizationId) return null;
      const { data } = await db
        .from('affiliate_links')
        .select('code')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();
      return data?.code || null;
    },
    enabled: !!user && !!organizationId,
    staleTime: 60_000,
  });

  /**
   * Call before sharing — returns the affiliate code, auto-enrolling if needed.
   * Safe to call multiple times (debounced).
   */
  const ensureAffiliateCode = useCallback(async (): Promise<string | null> => {
    if (!user || !organizationId) return null;

    // Already have a code
    if (affiliateCode) return affiliateCode;

    // Prevent double-enrollment
    if (enrollingRef.current) {
      // Wait a bit and re-check
      await new Promise(r => setTimeout(r, 1500));
      const { data } = await db
        .from('affiliate_links')
        .select('code')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();
      return data?.code || null;
    }

    try {
      enrollingRef.current = true;
      const { error } = await db.rpc('self_enroll_affiliate', { _org_id: organizationId });
      if (error) {
        console.warn('[useAutoAffiliateCode] enroll failed:', error.message);
        return null;
      }

      // Fetch the newly created code
      const { data } = await db
        .from('affiliate_links')
        .select('code')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();

      const code = data?.code || null;

      // Update cache
      if (code) {
        qc.setQueryData(['auto-aff-code', user.id, organizationId], code);
        qc.invalidateQueries({ queryKey: ['my-aff-code'] });
        qc.invalidateQueries({ queryKey: ['my-aff-link'] });
        qc.invalidateQueries({ queryKey: ['my-affiliate-code'] });
      }

      return code;
    } finally {
      enrollingRef.current = false;
    }
  }, [user, organizationId, affiliateCode, qc]);

  return { affiliateCode, ensureAffiliateCode };
}
