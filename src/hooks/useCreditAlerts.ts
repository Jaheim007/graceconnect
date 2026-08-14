import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditsBalance } from '@/hooks/useCredits';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

// Daily grant is 20 credits, so "low" must be well below that.
const LOW_THRESHOLD = 5;

/** UTC day key — matches CURRENT_DATE used by grant_daily_credits. */
const utcDayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Watches the signed-in user's credit balance and:
 * - silently claims the daily grant when a new day starts (so a session that
 *   crosses midnight never sees a false "out of credits" state)
 * - opens the "buy credits" dialog when the balance hits zero
 * - shows a low-balance toast
 * - asks the backend to send the low / empty credits notification + email
 *   (the backend de-dupes: max one alert per type per day)
 */
export function useCreditAlerts() {
  const { user } = useAuth();
  const { data: summary } = useCreditsBalance();
  const { locale } = useI18n();
  const qc = useQueryClient();
  const isFr = locale === 'fr';

  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const notified = useRef<Set<string>>(new Set());
  const notifiedDay = useRef<string>(utcDayKey());
  const claiming = useRef<string | null>(null);

  const balance = summary?.balance;
  const lastGrant = summary?.last_daily_grant ? String(summary.last_daily_grant).slice(0, 10) : null;
  const today = utcDayKey();
  const grantPending = !!user && lastGrant !== today;

  // ── Auto-claim today's daily credits (idempotent server-side) ──
  useEffect(() => {
    if (!user || !summary) return;
    if (!grantPending) return;
    if (claiming.current === today) return;
    claiming.current = today;

    (async () => {
      try {
        await supabase.rpc('grant_daily_credits', { _user_id: user.id });
        try {
          await supabase.rpc('grant_monthly_platform_credits', { _user_id: user.id });
        } catch { /* optional */ }
      } catch (err) {
        console.warn('[credit-alerts] daily grant failed', err);
      } finally {
        qc.invalidateQueries({ queryKey: ['credits', 'summary'] });
      }
    })();
  }, [user, summary, grantPending, today, qc]);

  // ── Low / empty balance alerts ──
  useEffect(() => {
    if (!user || typeof balance !== 'number') return;

    // New day → allow alerting again
    if (notifiedDay.current !== today) {
      notifiedDay.current = today;
      notified.current.clear();
    }

    // Today's grant hasn't landed yet — the balance we see is stale/expired.
    if (grantPending) return;

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
  }, [user, balance, isFr, locale, grantPending, today]);

  return { showCreditDialog, setShowCreditDialog, balance };
}
