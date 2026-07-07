import { ReactNode } from 'react';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import type { SiteviralFeatureKey } from '@/types/database';

interface FeatureGateProps {
  feature: SiteviralFeatureKey;
  /** Show children only when the org has the feature enabled. */
  children: ReactNode;
  /** Optional fallback when disabled (e.g. an upsell). Defaults to null. */
  fallback?: ReactNode;
  /** If true, render children while org state is loading (avoids empty flash). */
  showWhileLoading?: boolean;
}

/**
 * Gates UI behind a SiteViral feature flag on the current org.
 * Renders nothing when the feature is off — no flicker.
 */
export function FeatureGate({ feature, children, fallback = null, showWhileLoading = false }: FeatureGateProps) {
  const { has, isLoading, org } = useOrgFeatures();

  if (isLoading || !org) return showWhileLoading ? <>{children}</> : null;
  return has(feature) ? <>{children}</> : <>{fallback}</>;
}
