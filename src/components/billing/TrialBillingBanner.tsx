import { Link } from '@/lib/router-compat';
import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { usePlatformPlan } from '@/hooks/usePlatformPlan';
import { useAuth } from '@/contexts/AuthContext';

const DISMISS_KEY = 'sv_trial_banner_dismissed_at';
const DISMISS_TTL_MS = 6 * 3600 * 1000; // 6h

/**
 * Global, dismissible banner shown to platform-subscription users when:
 *  - trial ends within ≤7 days, or
 *  - subscription is past_due (payment failed → grace period).
 *
 * Hidden by default for free / founder / grandfather users.
 * Mounted once near the top of the layout (not on auth-less routes).
 */
export function TrialBillingBanner() {
  const { user } = useAuth();
  const { isTrialing, trialEndsAt, subscription, isFounder } = usePlatformPlan();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (at && Date.now() - at < DISMISS_TTL_MS) setDismissed(true);
    } catch {}
  }, []);

  if (!user || isFounder || dismissed) return null;

  const status = (subscription as any)?.status;
  const isPastDue = status === 'past_due';
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;
  const showTrial = isTrialing && trialDaysLeft !== null && trialDaysLeft <= 7;

  if (!isPastDue && !showTrial) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setDismissed(true);
  };

  if (isPastDue) {
    return (
      <BannerShell tone="danger" onClose={dismiss}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Paiement échoué — votre abonnement est en période de grâce.
          {' '}
          <Link to="/billing" className="underline font-medium">Mettre à jour</Link>
        </span>
      </BannerShell>
    );
  }

  return (
    <BannerShell tone="warning" onClose={dismiss}>
      <Clock className="h-4 w-4 shrink-0" />
      <span>
        Essai Pro : <strong>{trialDaysLeft} jour{trialDaysLeft! > 1 ? 's' : ''}</strong> restant{trialDaysLeft! > 1 ? 's' : ''}.
        {' '}
        <Link to="/billing" className="underline font-medium">Choisir mon plan</Link>
      </span>
    </BannerShell>
  );
}

function BannerShell({
  tone,
  children,
  onClose,
}: {
  tone: 'warning' | 'danger';
  children: React.ReactNode;
  onClose: () => void;
}) {
  const cls = tone === 'danger'
    ? 'bg-destructive/10 text-destructive border-destructive/30'
    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
  return (
    <div className={`border-b ${cls}`}>
      <div className="container mx-auto flex items-center gap-2 px-4 py-2 text-sm">
        <div className="flex-1 flex items-center gap-2">{children}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="opacity-70 hover:opacity-100 p-1 -m-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
