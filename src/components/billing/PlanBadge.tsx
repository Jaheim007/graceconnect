import { Link } from '@/lib/router-compat';
import { Crown, Zap, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePlatformPlan } from '@/hooks/usePlatformPlan';

/**
 * Compact plan chip for the user dropdown / sidebar.
 * Shows current tier (Free/Pro/Org/Founder) and links to /billing.
 * Trial users get a special "Essai" badge with days remaining.
 */
export function PlanBadge({ compact = false }: { compact?: boolean }) {
  const { tier, isFounder, isTrialing, trialEndsAt, founderSlot } = usePlatformPlan();

  const trialDays = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;

  let label = 'Free';
  let icon = null;
  let cls = 'bg-muted text-muted-foreground';

  if (isFounder) {
    label = compact ? 'Founder' : `Founder #${founderSlot ?? ''}`.trim();
    icon = <Crown className="h-3 w-3" />;
    cls = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
  } else if (isTrialing) {
    label = compact ? 'Essai' : `Essai · ${trialDays}j`;
    icon = <Clock className="h-3 w-3" />;
    cls = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
  } else if (tier === 'org') {
    label = 'Org';
    icon = <Users className="h-3 w-3" />;
    cls = 'bg-primary/15 text-primary border border-primary/30';
  } else if (tier === 'pro') {
    label = 'Pro';
    icon = <Crown className="h-3 w-3" />;
    cls = 'bg-primary/15 text-primary border border-primary/30';
  }

  return (
    <Link
      to="/billing"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none ${cls} hover:opacity-80 transition`}
      aria-label="Gérer mon abonnement"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
