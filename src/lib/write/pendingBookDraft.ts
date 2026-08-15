/**
 * Detects whether the user has a book in progress in the Write wizard.
 * Used to send people back to their book (title + description / publish step)
 * instead of dropping them on the dashboard when they skip onboarding.
 */
const STORAGE_KEY = 'write_wizard_drafts_v2';

export function hasPendingBookDraft(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const store = JSON.parse(raw) as { drafts?: Record<string, unknown> };
    return !!store?.drafts && Object.keys(store.drafts).length > 0;
  } catch {
    return false;
  }
}

/** Where to land after platform creation, preserving the exact target workspace. */
export function postPlatformCreationRoute(orgId?: string): string {
  if (!hasPendingBookDraft()) return '/admin';
  return orgId ? `/ecrire?org=${encodeURIComponent(orgId)}` : '/ecrire';
}
