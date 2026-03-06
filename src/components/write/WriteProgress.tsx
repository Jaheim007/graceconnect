import { cn } from '@/lib/utils';

interface WriteProgressProps {
  currentStep: number;
  labels: string[];
}

export function WriteProgress({ currentStep, labels }: WriteProgressProps) {
  const progress = ((currentStep) / (labels.length - 1)) * 100;

  return (
    <div className="container max-w-2xl px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Étape {currentStep + 1}/{labels.length}
        </span>
        <span className="text-xs font-bold text-primary">
          {labels[currentStep]}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full bg-primary rounded-full transition-all duration-500')}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
