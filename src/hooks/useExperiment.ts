import { useMemo } from 'react';

/**
 * Lightweight A/B testing framework.
 * Assigns a user to a variant deterministically based on a hash of
 * experimentId + userId (or a random session id stored in localStorage).
 *
 * Supports URL-based debug forcing: ?exp_hero-cta=a
 */

function getSessionId(): string {
  const KEY = 'sv_experiment_sid';
  let sid = localStorage.getItem(KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(KEY, sid);
  }
  return sid;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Check URL for forced variant: ?exp_<experimentId>=<variant>
 */
function getUrlForcedVariant<T extends string>(experimentId: string, variants: T[]): T | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get(`exp_${experimentId}`);
    if (forced && variants.includes(forced as T)) {
      return forced as T;
    }
  } catch {
    // SSR or no window
  }
  return null;
}

export function useExperiment<T extends string>(
  experimentId: string,
  variants: T[],
  userId?: string,
): T {
  const sid = userId || getSessionId();

  return useMemo(() => {
    // Check URL forcing first (debug/QA mode)
    const forced = getUrlForcedVariant(experimentId, variants);
    if (forced) return forced;

    const hash = simpleHash(`${experimentId}:${sid}`);
    return variants[hash % variants.length];
  }, [experimentId, sid, variants]);
}

/**
 * Track which variant was shown — fires a client_event.
 * Call once when the variant is rendered.
 */
export function trackExperimentExposure(
  experimentId: string,
  variant: string,
  trackFn?: (name: string, data: Record<string, unknown>) => void,
) {
  trackFn?.('experiment_exposure', { experimentId, variant });
}
