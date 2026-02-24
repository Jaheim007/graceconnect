import { ReactNode } from 'react';
import { useExperiment } from '@/hooks/useExperiment';

interface ExperimentVariantProps {
  experimentId: string;
  variants: Record<string, ReactNode>;
  userId?: string;
}

/**
 * Declarative A/B test wrapper.
 *
 * Usage:
 * <ExperimentVariant
 *   experimentId="hero-cta"
 *   variants={{
 *     a: <Button>Get Started Free</Button>,
 *     b: <Button>Try It Now</Button>,
 *   }}
 * />
 */
export function ExperimentVariant({ experimentId, variants, userId }: ExperimentVariantProps) {
  const keys = Object.keys(variants);
  const chosen = useExperiment(experimentId, keys, userId);
  return <>{variants[chosen]}</>;
}
