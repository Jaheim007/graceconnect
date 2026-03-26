/**
 * Returns the correct verified label based on org category.
 * "leader" category → individual creator; anything else → organization.
 */
export function getVerifiedLabel(category?: string | null, locale: string = 'fr'): string {
  const isFr = locale === 'fr';
  if (category === 'leader') return isFr ? 'Créateur vérifié' : 'Verified creator';
  return isFr ? 'Organisation vérifiée' : 'Verified organization';
}

/**
 * Check if an org should show the verified badge.
 */
export function isOrgVerifiedOrKyc(
  isVerified?: boolean | null,
  kycStatus?: string | null,
): boolean {
  return !!(isVerified || kycStatus === 'level1' || kycStatus === 'level2');
}
