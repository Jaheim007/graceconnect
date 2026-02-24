import { useMemo } from 'react';

/**
 * Lightweight A/B testing framework.
 * Assigns a user to a variant deterministically based on a hash of
 * experimentId + userId (or a random session id stored in localStorage).
 *
 * Usage:
 *   const variant = useExperiment('cta-color', ['blue', 'green']);
 *   // variant is consistently 'blue' or 'green' for this user
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

export function useExperiment<T extends string>(
  experimentId: string,
  variants: T[],
  userId?: string,
): T {
  const sid = userId || getSessionId();

  return useMemo(() => {
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
