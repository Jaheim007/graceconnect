import type { Capability } from '@/hooks/useUserCapabilities';

/**
 * The welcome intent is a *sorting hint only* — it never locks a user into a
 * role. Capabilities stay cumulative (learn / earn / create); the intent simply
 * decides which block opens first on the unified home when the user has no
 * activity signal yet.
 */
export type OnboardingIntent = 'purchases' | 'create' | 'upload' | 'earn';

const KEY = 'sv_onboarding_intent';

export function setOnboardingIntent(intent: OnboardingIntent) {
  try {
    localStorage.setItem(KEY, intent);
  } catch {
    /* storage unavailable — sorting hint is optional */
  }
}

export function getOnboardingIntent(): OnboardingIntent | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'purchases' || v === 'create' || v === 'upload' || v === 'earn') return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Maps a stored intent to the capability block it should surface first. */
export function intentToCapability(intent: OnboardingIntent | null): Capability | null {
  switch (intent) {
    case 'purchases':
      return 'learn';
    case 'earn':
      return 'earn';
    case 'create':
    case 'upload':
      return 'create';
    default:
      return null;
  }
}
