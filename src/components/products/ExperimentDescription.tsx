import { useExperimentContent } from '@/hooks/useExperimentContent';
import { FormattedText } from '@/lib/formatText';

interface Props {
  defaultDescription: string;
  className?: string;
}

/**
 * Renders the product description, automatically applying any active A/B experiment
 * on the "description" slot. Falls back to default description if no experiment is active.
 */
export function ExperimentDescription({ defaultDescription, className }: Props) {
  const experiment = useExperimentContent('description', defaultDescription);
  return (
    <FormattedText
      text={experiment.value}
      className={className}
    />
  );
}
