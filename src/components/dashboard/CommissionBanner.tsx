import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@/lib/router-compat';
import { TrendingUp, ArrowRight, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';
import { PlatformPlanWaitlistDialog } from '@/components/pricing/PlatformPlanWaitlistDialog';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { cn } from '@/lib/utils';

const PRO_PRICE_XOF = 19000;
const COMMISSION_RATE = 0.10;

/**
 * Shows the creator how much commission they paid in the last 30 days
 * and the ROI of upgrading to Pro (which removes the commission).
 *
 * Pure UI: only reads from product_purchases. No business logic changes.
 */
export function CommissionBanner() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('commission_banner_dismissed_v1') === '1';
  });
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';

  const { data: stats } = useQuery({
    queryKey: ['commission-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await db
        .from('product_purchases')
        .select('amount, currency, status, created_at')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte('created_at', since)
        .limit(1000);
      const items = data || [];
      const grossSales = items.reduce((s, p: any) => s + Number(p.amount || 0), 0);
      const commissionPaid = grossSales * COMMISSION_RATE;
      return { grossSales, commissionPaid, count: items.length };
    },
    enabled: !!orgId && !!user,
    staleTime: 60_000,
  });

  const verdict = useMemo(() => {
    if (!stats) return null;
    const breakeven = PRO_PRICE_XOF / COMMISSION_RATE; // ~190 000 XOF/mo
    const isProfitable = stats.commissionPaid >= PRO_PRICE_XOF;
    const monthlySavings = Math.max(0, stats.commissionPaid - PRO_PRICE_XOF);
    return { breakeven, isProfitable, monthlySavings };
  }, [stats]);

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('commission_banner_dismissed_v1', '1');
    }
  };

  const openWaitlist = () => {
    trackEvent('pricing_cta_click', { plan: 'pro', source: 'dashboard_banner' }, user?.id);
    setWaitlistOpen(true);
  };

  // Don't render if dismissed, no org, no sales yet, or no data
  if (dismissed || !orgId || !stats || stats.count === 0) return null;

  const fmt = (n: number) => formatCurrency(n, currency, locale);

  return (
    <>
      <div
        className={cn(
          'relative rounded-2xl border p-4 sm:p-5 mb-4',
          verdict?.isProfitable
            ? 'border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent'
            : 'border-border bg-card'
        )}
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
              verdict?.isProfitable ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <TrendingUp className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {isFr ? 'Commission payée — 30 derniers jours' : 'Commission paid — last 30 days'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold leading-tight">
              {fmt(stats.commissionPaid)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr
                ? `Sur ${fmt(stats.grossSales)} de ventes (${stats.count} transactions)`
                : `On ${fmt(stats.grossSales)} in sales (${stats.count} transactions)`}
            </p>

            {verdict?.isProfitable ? (
              <div className="mt-3 p-3 rounded-lg bg-background/60 border border-primary/20">
                <p className="text-sm font-semibold text-foreground">
                  {isFr ? '💎 Pro est rentable pour toi.' : '💎 Pro pays for itself.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isFr
                    ? `Avec Pro (~${formatCurrency(PRO_PRICE_XOF, 'XOF', locale)}/mois), tu économises ~${fmt(verdict.monthlySavings)}/mois.`
                    : `With Pro (~${formatCurrency(PRO_PRICE_XOF, 'XOF', locale)}/mo), you'd save ~${fmt(verdict.monthlySavings)}/mo.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                {isFr
                  ? `Pro devient rentable dès ${formatCurrency(verdict?.breakeven || 0, 'XOF', locale)} de ventes/mois.`
                  : `Pro becomes profitable above ${formatCurrency(verdict?.breakeven || 0, 'XOF', locale)} in monthly sales.`}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                onClick={openWaitlist}
                className="gap-1.5 shadow-xs"
              >
                <Crown className="h-3.5 w-3.5" />
                {isFr ? 'Rejoindre la liste Pro' : 'Join Pro waitlist'}
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/pricing')}
                className="text-xs"
              >
                {isFr ? 'Voir tous les plans' : 'See all plans'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PlatformPlanWaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        plan="pro"
        source="dashboard_banner"
      />
    </>
  );
}
