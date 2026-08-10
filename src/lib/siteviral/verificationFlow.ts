/**
 * Deterministic routing between the two verification flows.
 *
 *  KYC (individual) — verifies a *person*. Used for Creator and Community
 *  platforms: ultimately one person acting on their own behalf, so a
 *  government ID + selfie/liveness check is sufficient.
 *
 *  KYB (organization) — verifies that a *legal entity exists* and who is
 *  authorized to represent it. Used for Church and NGO platforms: legal
 *  registration document + bylaws/statutes + the representative's personal ID.
 *
 * The platform's category (set at creation time) decides the flow — the user
 * is never asked to pick between KYC and KYB.
 */
export type VerificationFlow = 'kyc' | 'kyb';

/** Categories that claim to represent a registered legal entity. */
const KYB_CATEGORIES = new Set(['church', 'ministry', 'ngo']);

export function resolveVerificationFlow(category?: string | null): VerificationFlow {
  return KYB_CATEGORIES.has((category || '').toLowerCase()) ? 'kyb' : 'kyc';
}

/** The wizard's internal naming for the same concept. */
export function verificationTypeFor(category?: string | null): 'individual' | 'organization' {
  return resolveVerificationFlow(category) === 'kyb' ? 'organization' : 'individual';
}
