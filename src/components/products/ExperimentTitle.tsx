import { useExperimentContent } from '@/hooks/useExperimentContent';

interface Props {
  defaultTitle: string;
  className?: string;
}

/**
 * Renders the product title, automatically applying any active A/B experiment
 * on the "title" slot. Falls back to default title if no experiment is active.
 */
export function ExperimentTitle({ defaultTitle, className }: Props) {
  const experiment = useExperimentContent('title', defaultTitle);
  return <span className={className}>{experiment.value}</span>;
}
