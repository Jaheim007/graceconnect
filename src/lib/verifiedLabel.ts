/**
 * Returns the correct verified label based on org category.
 * "leader" category → individual creator; anything else → organization.
 */
export function getVerifiedLabel(category?: string | null): string {
  if (category === 'leader') return 'Créateur vérifié';
  return 'Organisation vérifiée';
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
