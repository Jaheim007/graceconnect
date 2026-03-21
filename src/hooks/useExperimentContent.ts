import { useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { trackEvent, useTrackEvent } from '@/hooks/useClientAnalytics';

/**
 * Session-sticky variant assignment.
 * Uses sessionStorage so the same visitor always sees the same variant.
 */
function getSessionSeed(): string {
  const KEY = 'sv_exp_seed';
  let seed = sessionStorage.getItem(KEY);
  if (!seed) {
    seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(KEY, seed);
  }
  return seed;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ExperimentResult {
  value: string;
  variant: 'a' | 'b' | null;
  experimentId: string | null;
  isExperiment: boolean;
}

/**
 * Dynamic A/B content resolver.
 *
 * Reads active experiments from the DB by slot_key,
 * assigns the visitor to a variant, tracks exposure,
 * and returns the correct content string.
 *
 * @param slotKey - The experiment slot (e.g. "product-cta", "product-title")
 * @param defaultValue - Fallback content if no active experiment
 * @param orgId - Optional organization scope
 */
export function useExperimentContent(
  slotKey: string,
  defaultValue: string,
  orgId?: string,
): ExperimentResult {
  const seed = getSessionSeed();
  const exposureTracked = useRef(false);
  const trackEventFn = useTrackEvent();

  // Check URL override: ?exp_<slotKey>=a or =b
  const urlForced = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(`exp_${slotKey}`) as 'a' | 'b' | null;
    } catch { return null; }
  }, [slotKey]);

  // Fetch active experiment for this slot
  const { data: experiment } = useQuery({
    queryKey: ['experiment-slot', slotKey, orgId],
    queryFn: async () => {
      let q = db
        .from('experiments')
        .select('*')
        .eq('slot_key', slotKey)
        .eq('is_active', true)
        .is('winner_variant', null)
        .limit(1)
        .single();

      // Note: org filtering would be added server-side via RLS in production
      const { data } = await q;
      return data;
    },
    staleTime: 60_000, // Cache for 1 minute
    retry: false,
  });

  const result = useMemo<ExperimentResult>(() => {
    if (!experiment) {
      return { value: defaultValue, variant: null, experimentId: null, isExperiment: false };
    }

    const variants = experiment.variants as Record<string, any>;
    const keys = Object.keys(variants);
    if (keys.length < 2) {
      return { value: defaultValue, variant: null, experimentId: experiment.id, isExperiment: false };
    }

    // URL forcing for QA
    if (urlForced && keys.includes(urlForced)) {
      const content = variants[urlForced]?.content || variants[urlForced]?.label || defaultValue;
      return { value: content, variant: urlForced as 'a' | 'b', experimentId: experiment.id, isExperiment: true };
    }

    // Traffic split: should this user be in the experiment at all?
    const trafficPercent = experiment.traffic_percent || 100;
    const trafficHash = simpleHash(`traffic:${experiment.id}:${seed}`) % 100;
    if (trafficHash >= trafficPercent) {
      // User is outside experiment → show default (Version A content)
      return { value: variants[keys[0]]?.content || defaultValue, variant: null, experimentId: experiment.id, isExperiment: false };
    }

    // Variant assignment (deterministic per session + experiment)
    const variantHash = simpleHash(`variant:${experiment.id}:${seed}`);
    const chosenKey = keys[variantHash % keys.length] as 'a' | 'b';
    const content = variants[chosenKey]?.content || variants[chosenKey]?.label || defaultValue;

    return { value: content, variant: chosenKey, experimentId: experiment.id, isExperiment: true };
  }, [experiment, defaultValue, seed, urlForced]);

  // Track exposure once per experiment per session
  useEffect(() => {
    if (!result.isExperiment || !result.variant || !result.experimentId || exposureTracked.current) return;
    exposureTracked.current = true;
    trackEventFn('experiment_exposure', {
      experimentId: experiment?.name || result.experimentId,
      variant: result.variant,
      slotKey,
    });
  }, [result.isExperiment, result.variant, result.experimentId]);

  return result;
}

/**
 * Track an experiment click event.
 * Call this from onClick handlers on elements controlled by experiments.
 */
export function useExperimentClick() {
  const trackEventFn = useTrackEvent();
  return (experimentResult: ExperimentResult) => {
    if (!experimentResult.isExperiment || !experimentResult.variant) return;
    trackEventFn('experiment_click', {
      experimentId: experimentResult.experimentId,
      variant: experimentResult.variant,
    });
  };
}

/**
 * Track an experiment conversion (purchase, signup, etc.)
 */
export function trackExperimentConversion(
  experimentName: string,
  variant: string,
  userId?: string,
) {
  trackEvent('experiment_conversion', { experimentId: experimentName, variant }, userId);
}
