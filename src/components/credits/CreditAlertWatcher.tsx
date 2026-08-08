import { useCreditAlerts } from '@/hooks/useCreditAlerts';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';

/**
 * Global, invisible watcher: shows the credits top-up dialog when the
 * signed-in user runs out of credits, and triggers the low/empty
 * notification + email pipeline.
 */
export function CreditAlertWatcher() {
  const { showCreditDialog, setShowCreditDialog } = useCreditAlerts();

  return (
    <InsufficientCreditsDialog
      open={showCreditDialog}
      onOpenChange={setShowCreditDialog}
    />
  );
}
