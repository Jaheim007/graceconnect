import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Wallet, Clock, CheckCircle, XCircle, ArrowUpRight, AlertTriangle,
  DollarSign, Shield, Download, Info, CreditCard, ExternalLink, Loader2
} from 'lucide-react';
import { downloadCSV } from '@/lib/csvExport';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nContext';
import { startStripeConnectOnboarding, checkStripeConnectStatus } from '@/lib/api';
import { toast } from 'sonner';

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };

export default function AdminPayouts() {
  const { currentOrg } = useOrg();
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';
  const dateFnsLocale = locale === 'fr' ? fr : enUS;

  const statusConfig: Record<string, { label: string; icon: typeof Clock; colorClass: string }> = {
    requested: { label: t('payouts.status_requested'), icon: Clock, colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    approved: { label: t('payouts.status_approved'), icon: CheckCircle, colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    processing: { label: t('payouts.status_processing'), icon: ArrowUpRight, colorClass: 'bg-primary/10 text-primary border-primary/20' },
    completed: { label: t('payouts.status_completed'), icon: CheckCircle, colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    rejected: { label: t('payouts.status_rejected'), icon: XCircle, colorClass: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  // All payouts for this org
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['admin-payouts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('payout_requests')
        .select('*')
        .eq('organization_id', orgId)
        .order('requested_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fund summary
  const { data: fundSummary } = useQuery({
    queryKey: ['admin-fund-summary', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [{ data: donations }, { data: purchases }, { data: payoutData }] = await Promise.all([
        db.from('donations').select('amount, organization_amount, platform_fee, affiliate_commission, completed_at').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('product_purchases').select('amount, organization_amount, platform_fee, affiliate_commission, completed_at').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('payout_requests').select('amount, status').eq('organization_id', orgId),
      ]);
      const allTxns = [...(donations || []), ...(purchases || [])];
      const totalGMV = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
      const totalOrgReceived = allTxns.reduce((s, t) => s + (t.organization_amount || 0), 0);
      const totalPlatformFees = allTxns.reduce((s, t) => s + (t.platform_fee || 0), 0);
      const totalAffiliateCommissions = allTxns.reduce((s, t) => s + (t.affiliate_commission || 0), 0);
      const completedPayouts = (payoutData || []).filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const pendingPayouts = (payoutData || []).filter((p: any) => ['requested', 'approved', 'processing'].includes(p.status)).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      // Only count transactions completed more than 72h ago as available
      const holdCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const clearedOrgReceived = allTxns
        .filter((t: any) => t.completed_at && t.completed_at <= holdCutoff)
        .reduce((s, t) => s + (t.organization_amount || 0), 0);
      const pendingClearance = totalOrgReceived - clearedOrgReceived;
      const availableBalance = clearedOrgReceived - completedPayouts - pendingPayouts;

      return { totalGMV, totalOrgReceived, totalPlatformFees, totalAffiliateCommissions, completedPayouts, pendingPayouts, availableBalance, pendingClearance };
    },
    enabled: !!orgId,
  });

  // Stripe Connect status
  const { data: stripeStatus, isLoading: stripeLoading } = useQuery({
    queryKey: ['stripe-connect-status', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      try {
        return await checkStripeConnectStatus(orgId);
      } catch {
        return null;
      }
    },
    enabled: !!orgId,
  });

  const stripeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No org');
      const currentUrl = window.location.origin;
      const returnUrl = `${currentUrl}/admin/payouts?stripe_return=true`;
      return startStripeConnectOnboarding(orgId, returnUrl, returnUrl);
    },
    onSuccess: (data) => {
      if (data?.already_complete) {
        toast.success('Votre compte Stripe Connect est déjà actif !');
        queryClient.invalidateQueries({ queryKey: ['stripe-connect-status', orgId] });
      } else if (data?.onboarding_url) {
        window.location.href = data.onboarding_url;
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur lors de la configuration Stripe');
    },
  });

  // Check if returning from Stripe onboarding
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('stripe_return') === 'true') {
    urlParams.delete('stripe_return');
    const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams}` : '');
    window.history.replaceState({}, '', newUrl);
    queryClient.invalidateQueries({ queryKey: ['stripe-connect-status', orgId] });
  }

  const exportPayouts = () => {
    if (!payouts.length) return;
    downloadCSV(payouts.map((p: any) => ({
      id: p.id, amount: p.amount, currency: p.currency, status: p.status,
      type: p.payout_type, requested_at: p.requested_at, processed_at: p.processed_at,
    })), `payouts-${currentOrg?.slug || 'org'}`);
  };

  return (
    <AdminPageShell title={t('payouts.title')} subtitle={t('payouts.subtitle')} backRoute="/admin">
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">{t('payouts.processing_time')}</p>
            <p className="text-xs text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: t('payouts.processing_desc') }} />
          </div>
        </div>

        {/* Stripe Connect Section */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Stripe Connect — Paiements internationaux</p>
              <p className="text-xs text-muted-foreground">Recevez les paiements par carte bancaire du monde entier</p>
            </div>
          </div>

          {stripeLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Vérification du statut Stripe...
            </div>
          ) : stripeStatus?.onboarding_complete ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Compte Stripe Connect actif</p>
                <p className="text-xs text-muted-foreground">Les paiements par carte sont automatiquement répartis vers votre compte.</p>
              </div>
            </div>
          ) : stripeStatus?.has_account && stripeStatus?.details_submitted ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Vérification en cours par Stripe</p>
                <p className="text-xs text-muted-foreground">Stripe vérifie vos informations. Cela peut prendre quelques minutes.</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto text-xs gap-1" onClick={() => stripeOnboardingMutation.mutate()} disabled={stripeOnboardingMutation.isPending}>
                Rafraîchir
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {stripeStatus?.has_account && !stripeStatus?.details_submitted && (
                <p className="text-xs text-amber-600">⚠️ Vous avez commencé l&apos;inscription mais ne l&apos;avez pas terminée.</p>
              )}
              <Button
                onClick={() => stripeOnboardingMutation.mutate()}
                disabled={stripeOnboardingMutation.isPending}
                className="w-full gap-2"
              >
                {stripeOnboardingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {stripeStatus?.has_account ? "Reprendre l'inscription Stripe" : 'Configurer Stripe Connect'}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Vous serez redirigé vers Stripe pour compléter votre vérification d&apos;identité et vos coordonnées bancaires.
              </p>
            </div>
          )}
        </div>

        {fundSummary && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t('payouts.gmv_total'), value: fmt(fundSummary.totalGMV, currency), icon: DollarSign, colorClass: 'from-muted to-muted/50 border-border', sub: t('payouts.gross_before_fees') },
              { label: t('payouts.org_share'), value: fmt(fundSummary.totalOrgReceived, currency), icon: Wallet, colorClass: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20', sub: t('payouts.after_platform_fees') },
              { label: t('payouts.platform_fees'), value: fmt(fundSummary.totalPlatformFees, currency), icon: Shield, colorClass: 'from-primary/15 to-primary/5 border-primary/20', sub: `${currentOrg?.platform_fee_percent ?? 10}% ${t('payouts.deducted')}` },
              { label: t('payouts.affiliate_commissions'), value: fmt(fundSummary.totalAffiliateCommissions, currency), icon: ArrowUpRight, colorClass: 'from-amber-500/15 to-amber-500/5 border-amber-500/20', sub: t('payouts.paid_to_affiliates') },
            ].map(c => (
              <motion.div key={c.label} variants={fadeUp} className={cn('rounded-2xl border p-4 bg-gradient-to-br', c.colorClass)}>
                <c.icon className="h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{c.label}</p>
                <p className="text-lg font-bold mt-0.5">{c.value}</p>
                <p className="text-[10px] text-muted-foreground">{c.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {fundSummary && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-xs text-muted-foreground">{t('payouts.available_balance')}</p>
              <p className="text-2xl font-bold text-emerald-500">{fmt(Math.max(0, fundSummary.availableBalance), currency)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t('payouts.already_withdrawn')} : {fmt(fundSummary.completedPayouts, currency)} · {t('payouts.in_progress')} : {fmt(fundSummary.pendingPayouts, currency)}
                {fundSummary.pendingClearance > 0 && (
                  <> · En attente (72h) : {fmt(fundSummary.pendingClearance, currency)}</>
                )}
              </p>
            </div>
            {currentOrg?.kyc_status === 'none' && (
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" /> {t('payouts.kyc_required')}
              </Badge>
            )}
          </div>
        )}

        {payouts.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportPayouts}>
              <Download className="h-3.5 w-3.5" /> {t('payouts.export')}
            </Button>
          </div>
        )}

        {isLoading ? <SkeletonRow count={3} /> : payouts.length === 0 ? (
          <EmptyState variant="generic" title={t('payouts.no_payouts')} description={t('payouts.no_payouts_desc')} />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {payouts.map((p: any) => {
              const config = statusConfig[p.status] || statusConfig.requested;
              const StatusIcon = config.icon;
              return (
                <motion.div key={p.id} variants={fadeUp}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border shrink-0', config.colorClass)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{fmt(p.amount, p.currency || currency)}</p>
                      <Badge variant="outline" className={cn('text-[10px] border-0', config.colorClass)}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.payout_type === 'affiliate' ? t('payouts.affiliate_payout') : t('payouts.org_withdrawal')}
                      {' · '}
                      {format(new Date(p.requested_at), 'dd MMM yyyy HH:mm', { locale: dateFnsLocale })}
                    </p>
                    {p.processed_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {t('payouts.processed_on')} {format(new Date(p.processed_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AdminPageShell>
  );
}
