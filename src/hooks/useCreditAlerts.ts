import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditsBalance } from '@/hooks/useCredits';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

// Daily grant is 20 credits, so "low" must be well below that.
const LOW_THRESHOLD = 5;

/**
 * Watches the signed-in user's credit balance and:
 * - opens the "buy credits" dialog when the balance hits zero
 * - shows a low-balance toast
 * - asks the backend to send the low / empty credits notification + email
 *   (the backend de-dupes: max one alert per type per day)
 */
export function useCreditAlerts() {
  const { user } = useAuth();
  const { data: summary } = useCreditsBalance();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const notified = useRef<Set<string>>(new Set());

  const balance = summary?.balance;

  useEffect(() => {
    if (!user || typeof balance !== 'number') return;

    const level = balance <= 0.5 ? 'credits_empty' : balance <= LOW_THRESHOLD ? 'credits_low' : null;
    if (!level) return;
    if (notified.current.has(level)) return;
    notified.current.add(level);

    if (level === 'credits_empty') {
      setShowCreditDialog(true);
    } else {
      toast.warning(
        isFr ? `Il te reste ${balance.toFixed(1)} crédits` : `${balance.toFixed(1)} credits left`,
        {
          description: isFr
            ? 'Recharge pour éviter une interruption de tes générations IA.'
            : 'Top up to avoid interrupting your AI generations.',
        },
      );
    }

    // Fire-and-forget: in-app notification + email (server-side de-duped)
    supabase.functions
      .invoke('credits-alert', { body: { locale } })
      .catch((err) => console.warn('[credit-alerts] alert failed', err));
  }, [user, balance, isFr, locale]);

  return { showCreditDialog, setShowCreditDialog, balance };
}
