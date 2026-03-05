import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useExperiment, trackExperimentExposure } from '@/hooks/useExperiment';
import { useTrackEvent } from '@/hooks/useClientAnalytics';
import { cn } from '@/lib/utils';

interface CTAVariant {
  label: string;
  className?: string;
  icon?: React.ReactNode;
}

interface ExperimentalCTAProps {
  experimentId: string;
  variants: Record<string, CTAVariant>;
  onClick?: (variant: string) => void;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  userId?: string;
}

/**
 * ExperimentalCTA — A/B testable call-to-action button.
 * Automatically assigns user to a variant and tracks exposure + clicks.
 *
 * Usage:
 *   <ExperimentalCTA
 *     experimentId="hero-cta-v2"
 *     variants={{
 *       a: { label: 'Commencer gratuitement', className: 'bg-primary' },
 *       b: { label: 'Essayer maintenant →', className: 'bg-accent' },
 *     }}
 *     onClick={(variant) => navigate('/auth')}
 *   />
 */
export function ExperimentalCTA({
  experimentId,
  variants,
  onClick,
  size = 'lg',
  className,
  userId,
}: ExperimentalCTAProps) {
  const variantKeys = Object.keys(variants) as string[];
  const selectedKey = useExperiment(experimentId, variantKeys, userId);
  const trackEvent = useTrackEvent();
  const variant = variants[selectedKey];

  // Track exposure once
  useEffect(() => {
    trackExperimentExposure(experimentId, selectedKey, trackEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId, selectedKey]);

  const handleClick = () => {
    trackEvent('experiment_click', { experimentId, variant: selectedKey });
    onClick?.(selectedKey);
  };

  if (!variant) return null;

  return (
    <Button
      size={size}
      className={cn(variant.className, className)}
      onClick={handleClick}
    >
      {variant.icon}
      {variant.label}
    </Button>
  );
}
