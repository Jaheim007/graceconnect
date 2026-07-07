import { useMemo, useCallback } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import { SITEVIRAL_TYPES } from '@/lib/siteviral/config';

/**
 * Read-only view of the current org's SiteViral type + enabled features.
 * Source of truth = organizations.enabled_features (text[]).
 */
export function useOrgFeatures() {
  const { currentOrg, isLoadingOrgs } = useOrg();

  const features = useMemo(() => {
    const arr = (currentOrg?.enabled_features ?? []) as SiteviralFeatureKey[];
    return new Set<SiteviralFeatureKey>(arr);
  }, [currentOrg?.enabled_features]);

  const has = useCallback(
    (key: SiteviralFeatureKey) => features.has(key),
    [features]
  );

  const type: SiteviralType | null = (currentOrg?.siteviral_type as SiteviralType) ?? null;
  const typeMeta = type ? SITEVIRAL_TYPES[type] : null;

  return {
    isLoading: isLoadingOrgs,
    org: currentOrg,
    type,
    typeMeta,
    features,
    featureList: Array.from(features),
    has,
    needsMigration: !!currentOrg && !currentOrg.features_confirmed_at,
  };
}
