import type { Organization, SiteviralFeatureKey } from '@/types/database';

/**
 * Public page gating helper.
 *
 * Rules (per PRD, current phase):
 *  - Legacy safety: if the org has NOT confirmed its features yet
 *    (`features_confirmed_at` is null) OR has no `enabled_features` array,
 *    show every section (do NOT hide anything).
 *  - Otherwise (new users, or existing users who confirmed via the migration
 *    modal — both "Garder ma config" and "Personnaliser" MERGE features, never
 *    remove), gate strictly by `enabled_features`.
 *
 * The following sections are ALWAYS visible (base public page):
 *  page name, description, logo/cover, contact/CTA, basic profile info,
 *  photos and generic "content" (media). They are considered part of the
 *  base profile, not a feature.
 */
export function isFeatureEnabledForPublic(
  org: Pick<Organization, 'enabled_features' | 'features_confirmed_at'> | null | undefined,
  feature: SiteviralFeatureKey,
): boolean {
  if (!org) return true;
  // Legacy: never gate before explicit confirmation.
  if (!org.features_confirmed_at) return true;
  const list = org.enabled_features;
  if (!list || list.length === 0) return true;
  return list.includes(feature);
}

/** Maps public-page section keys to the SiteViral feature that gates them. */
export const SECTION_FEATURE_MAP: Partial<Record<string, SiteviralFeatureKey>> = {
  products: 'digital_products',
  store: 'digital_products',
  campaigns: 'donation_gifts',
  donate: 'donation_gifts',
  offerings: 'donation_gifts',
  programs: 'ai_formation_creation',
  events: 'events',
  // Always visible (base profile): content, photos, home
};

/**
 * Given the current sectionOrder + explicit hiddenSections from page_settings,
 * returns an augmented Set of hidden section keys that also excludes any
 * section whose gating feature is not enabled for the public page.
 *
 * When a `readiness` map is provided, sections whose feature is enabled but
 * NOT ready (no content configured) are ALSO hidden — visitors never see
 * empty sections. Admins should bypass this by not passing a readiness map
 * (or by using `previewAsVisitor` explicitly).
 */
export function computeHiddenSections(
  org: Pick<Organization, 'enabled_features' | 'features_confirmed_at'> | null | undefined,
  hiddenSections: Set<string>,
  readiness?: Partial<Record<SiteviralFeatureKey, boolean>>,
): Set<string> {
  const result = new Set(hiddenSections);
  for (const [section, feature] of Object.entries(SECTION_FEATURE_MAP)) {
    if (!feature) continue;
    if (!isFeatureEnabledForPublic(org, feature)) {
      result.add(section);
      continue;
    }
    if (readiness && readiness[feature] === false) {
      result.add(section);
    }
  }
  return result;
}

