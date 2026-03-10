import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that provides:
 * 1. A function to check if an error is a 402 (insufficient credits)
 * 2. State for showing the InsufficientCreditsDialog
 * 3. A function to refresh the credit balance after any AI action
 */
export function useCreditGuard() {
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditErrorMessage, setCreditErrorMessage] = useState<string | undefined>();
  const qc = useQueryClient();

  /** Call after every successful AI action to keep the badge up to date */
  const refreshCredits = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['credits', 'summary'] });
  }, [qc]);

  /**
   * Check if an error is a credit-related 402.
   * If yes, shows the dialog and returns true.
   * Always call refreshCredits too.
   */
  const handleAiError = useCallback((err: any): boolean => {
    refreshCredits();

    // Check various ways a 402 can surface
    const message = err?.message || err?.error || '';
    const status = err?.status || err?.context?.status;

    const isInsufficientCredits =
      status === 402 ||
      message.includes('insuffisant') ||
      message.includes('insufficient') ||
      message.includes('Crédits insuffisants') ||
      message.includes('402');

    if (isInsufficientCredits) {
      setCreditErrorMessage(message || undefined);
      setShowCreditDialog(true);
      return true;
    }

    return false;
  }, [refreshCredits]);

  return {
    showCreditDialog,
    setShowCreditDialog,
    creditErrorMessage,
    handleAiError,
    refreshCredits,
  };
}
