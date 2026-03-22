import { useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { trackEvent, useTrackEvent } from '@/hooks/useClientAnalytics';
import { pushDebugEntry, pushLiveEvent } from '@/components/experiments/ExperimentDebugOverlay';

/**
 * Session-sticky variant assignment.
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
  experimentName: string | null;
  isExperiment: boolean;
}

export function useExperimentContent(
  slotKey: string,
  defaultValue: string,
  orgId?: string,
): ExperimentResult {
  const seed = getSessionSeed();
  const exposureTracked = useRef(false);
  const trackEventFn = useTrackEvent();

  const urlForced = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(`exp_${slotKey}`) as 'a' | 'b' | null;
    } catch { return null; }
  }, [slotKey]);

  const { data: experiment } = useQuery({
    queryKey: ['experiment-slot', slotKey, orgId],
    queryFn: async () => {
      const { data, error } = await db
        .from('experiments')
        .select('*')
        .eq('slot_key', slotKey)
        .eq('is_active', true)
        .is('winner_variant', null)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn(`[A/B] Query error for slot "${slotKey}":`, error.message);
        return null;
      }
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });

  const result = useMemo<ExperimentResult>(() => {
    if (!experiment) {
      return { value: defaultValue, variant: null, experimentId: null, experimentName: null, isExperiment: false };
    }

    const expName = experiment.name;
    const variants = experiment.variants as Record<string, any>;
    const keys = Object.keys(variants);
    if (keys.length < 2) {
      return { value: defaultValue, variant: null, experimentId: experiment.id, experimentName: expName, isExperiment: false };
    }

    if (urlForced && keys.includes(urlForced)) {
      const content = variants[urlForced]?.content || variants[urlForced]?.label || defaultValue;
      return { value: content, variant: urlForced as 'a' | 'b', experimentId: experiment.id, experimentName: expName, isExperiment: true };
    }

    const trafficPercent = experiment.traffic_percent || 100;
    const trafficHash = simpleHash(`traffic:${experiment.id}:${seed}`) % 100;
    if (trafficHash >= trafficPercent) {
      return { value: variants[keys[0]]?.content || defaultValue, variant: null, experimentId: experiment.id, experimentName: expName, isExperiment: false };
    }

    const variantHash = simpleHash(`variant:${experiment.id}:${seed}`);
    const chosenKey = keys[variantHash % keys.length] as 'a' | 'b';
    const content = variants[chosenKey]?.content || variants[chosenKey]?.label || defaultValue;

    return { value: content, variant: chosenKey, experimentId: experiment.id, experimentName: expName, isExperiment: true };
  }, [experiment, defaultValue, seed, urlForced]);

  // Push debug entry for superadmin overlay
  useEffect(() => {
    const trafficPercent = experiment?.traffic_percent || 100;
    const trafficHash = simpleHash(`traffic:${experiment?.id || 'none'}:${seed}`) % 100;
    pushDebugEntry({
      slotKey,
      experimentFound: !!experiment,
      experimentName: experiment?.name,
      assignedVariant: result.variant || 'default',
      trafficEligible: experiment ? trafficHash < trafficPercent : false,
      renderedContent: result.value,
      sessionSeed: seed,
      urlOverride: urlForced,
      timestamp: Date.now(),
    });
  }, [slotKey, experiment?.id, result.variant, result.value]);

  // Track exposure once + push live event
  useEffect(() => {
    if (!result.isExperiment || !result.variant || !result.experimentId || exposureTracked.current) return;
    exposureTracked.current = true;
    trackEventFn('experiment_exposure', {
      experimentId: experiment?.name || result.experimentId,
      variant: result.variant,
      slotKey,
    });
    pushLiveEvent({
      type: 'exposure',
      variant: result.variant,
      slotKey,
      timestamp: Date.now(),
    });
  }, [result.isExperiment, result.variant, result.experimentId]);

  return result;
}

/**
 * Track an experiment click event.
 */
export function useExperimentClick() {
  const trackEventFn = useTrackEvent();
  return (experimentResult: ExperimentResult & { experimentName?: string }) => {
    if (!experimentResult.isExperiment || !experimentResult.variant) return;
    trackEventFn('experiment_click', {
      experimentId: experimentResult.experimentName || experimentResult.experimentId,
      variant: experimentResult.variant,
    });
    pushLiveEvent({
      type: 'click',
      variant: experimentResult.variant,
      slotKey: '',
      timestamp: Date.now(),
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
  pushLiveEvent({
    type: 'conversion',
    variant,
    slotKey: experimentName,
    timestamp: Date.now(),
  });
}
