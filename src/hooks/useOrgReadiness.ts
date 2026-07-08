import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import type { Organization, SiteviralFeatureKey } from '@/types/database';

export type FeatureReadiness = Partial<Record<SiteviralFeatureKey, boolean>>;

export interface OrgReadinessResult {
  readiness: FeatureReadiness;
  /** Rich counts used by the setup checklist. */
  counts: {
    products: number;
    campaigns: number;
    offerings: number;
    events: number;
    programs: number;
    reviews: number;
    photos: number;
  };
  isLoading: boolean;
}

/**
 * Cheap COUNT queries to determine whether each enabled feature has enough
 * data to be shown publicly. Used both by the public page (to hide empty
 * sections from visitors) and the dashboard setup checklist.
 *
 * All queries are head+count only — no rows fetched, no data mutation.
 */
export function useOrgReadiness(orgOverride?: Organization | null): OrgReadinessResult {
  const { currentOrg } = useOrg();
  const org = orgOverride ?? currentOrg;
  const orgId = org?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['org-readiness', orgId],
    enabled: !!orgId,
    staleTime: 30_000,
    queryFn: async () => {
      const [products, campaigns, offerings, events, programs, reviews, photos] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!).eq('is_published', true),
        db.from('donation_campaigns').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!),
        db.from('offerings').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!),
        db.from('events').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!).eq('is_published', true),
        db.from('programs').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!).eq('is_published', true),
        db.from('product_reviews').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!),
        db.from('org_photos').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!).eq('is_published', true),
      ]);
      return {
        products: products.count ?? 0,
        campaigns: campaigns.count ?? 0,
        offerings: offerings.count ?? 0,
        events: events.count ?? 0,
        programs: programs.count ?? 0,
        reviews: reviews.count ?? 0,
        photos: photos.count ?? 0,
      };
    },
  });

  const counts = data ?? {
    products: 0, campaigns: 0, offerings: 0, events: 0, programs: 0, reviews: 0, photos: 0,
  };

  const orgAny = org as any;
  const readiness: FeatureReadiness = {
    digital_products: counts.products > 0,
    donation_gifts: counts.campaigns > 0 || counts.offerings > 0,
    events: counts.events > 0,
    ai_formation_creation: counts.programs > 0,
    // Reviews are shown even if empty (per PRD: "or an empty review state for owners").
    reviews: true,
    // Location + appointment live on provider tables; without a cheap check,
    // treat as ready when enabled so we don't hide legitimate configured setups.
    location: true,
    appointment: true,
    // Payment is "ready" only when a subaccount/payout method is configured.
    payment: !!(orgAny?.paystack_subaccount_code || orgAny?.payout_method),
    // Affiliation "ready" only when explicitly enabled on the org.
    affiliation: !!orgAny?.affiliation_enabled,
    // Admin-only features — public visibility not gated by readiness.
    ai_book_creation: true,
    product_comments: true,
    kyc: org?.kyc_status === 'level1' || org?.kyc_status === 'level2',
    order_generator: true,
  };

  return { readiness, counts, isLoading };
}
