import { useQuery } from '@tanstack/react-query';
import { Link } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { Zap, TrendingDown, ArrowRight, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { usePlatformPlan } from '@/hooks/usePlatformPlan';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Commission savings card for the creator dashboard.
 *
 * Behaviour:
 *  - Free user with sales → shows commissions paid (this month + lifetime)
 *    and CTA to upgrade to Pro (frames upgrade as ROI).
 *  - Pro / Org / Founder → shows commissions saved this month (positive frame).
 *  - No sales yet → renders nothing (avoids noise on empty dashboards).
 */
export function CommissionSavingsCard() {
  const { currentOrg } = useOrg();
  const { tier, isFounder } = usePlatformPlan();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const currency = currentOrg?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const { data } = useQuery({
    queryKey: ['commission-savings', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return { monthFee: 0, totalFee: 0, monthGross: 0 };
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const since = startOfMonth.toISOString();

      const [monthRes, totalRes] = await Promise.all([
        db.from('product_purchases')
          .select('amount, platform_fee')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed')
          .gte('created_at', since),
        db.from('product_purchases')
          .select('platform_fee')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed'),
      ]);

      const monthRows = (monthRes.data || []) as Array<{ amount: number; platform_fee: number | null }>;
      const totalRows = (totalRes.data || []) as Array<{ platform_fee: number | null }>;

      const monthFee = monthRows.reduce((s, r) => s + Number(r.platform_fee || 0), 0);
      const monthGross = monthRows.reduce((s, r) => s + Number(r.amount || 0), 0);
      const totalFee = totalRows.reduce((s, r) => s + Number(r.platform_fee || 0), 0);

      return { monthFee, totalFee, monthGross };
    },
    enabled: !!currentOrg?.id,
    staleTime: 60_000,
  });

  if (!currentOrg) return null;
  const monthFee = data?.monthFee || 0;
  const totalFee = data?.totalFee || 0;
  const monthGross = data?.monthGross || 0;

  // Pro/Org/Founder → savings frame (only if they had Free history → totalFee > 0
  // OR if they're billing today and would have paid 10% on month gross).
  const isPaid = tier === 'pro' || tier === 'org' || isFounder;
  if (isPaid) {
    const wouldHavePaid = monthGross * 0.1;
    if (wouldHavePaid <= 0 && totalFee <= 0) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">
                {isFr ? 'Vous gardez 100 % de vos revenus' : 'You keep 100% of your revenue'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isFr
                  ? `Économie ce mois-ci : `
                  : `Saved this month: `}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(wouldHavePaid)}</span>
                {totalFee > 0 && (
                  <>
                    {' · '}
                    {isFr ? 'avant Pro' : 'before Pro'}: <span className="font-medium">{fmt(totalFee)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Free user: only show if they actually paid commissions
  if (monthFee <= 0 && totalFee <= 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">
              {isFr ? 'Arrêtez de payer 10 % sur chaque vente' : 'Stop paying 10% on every sale'}
            </h3>
            <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
              <p>
                {isFr ? 'Commissions ce mois-ci : ' : 'Commissions this month: '}
                <span className="text-foreground font-semibold">{fmt(monthFee)}</span>
              </p>
              {totalFee > monthFee && (
                <p className="text-xs">
                  {isFr ? 'Total cumulé : ' : 'Lifetime: '}
                  <span className="font-medium">{fmt(totalFee)}</span>
                </p>
              )}
            </div>
            <Button asChild size="sm" className="mt-3">
              <Link to="/pricing">
                {isFr ? 'Passer Pro et garder 100 %' : 'Upgrade to Pro & keep 100%'}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
