import { AdminPageShell } from './AdminPageShell';
import { ContextualFeedback } from '@/components/feedback/ContextualFeedback';
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
  DollarSign, Shield, Download, Info, Loader2, Send, Lock, TimerReset
} from 'lucide-react';
import { downloadCSV } from '@/lib/csvExport';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { onPayoutRequested } from '@/lib/notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };

export default function AdminPayouts() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';
  const dateFnsLocale = locale === 'fr' ? fr : enUS;
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  const MIN_WITHDRAWAL = 1000; // XOF minimum
  const kycApproved = currentOrg?.kyc_status === 'level1' || currentOrg?.kyc_status === 'level2';

  // Withdrawal request mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!user || !orgId || !fundSummary) throw new Error('Missing data');
      const available = Math.max(0, fundSummary.availableBalance);
      if (available < MIN_WITHDRAWAL) throw new Error(isFr ? `Solde insuffisant (minimum ${MIN_WITHDRAWAL} ${currency})` : `Insufficient balance (minimum ${MIN_WITHDRAWAL} ${currency})`);
      if (!kycApproved) throw new Error(isFr ? 'KYC requis avant tout retrait' : 'KYC required before withdrawal');

      const { error } = await db.from('payout_requests').insert({
        user_id: user.id,
        organization_id: orgId,
        amount: available,
        currency,
        payout_type: 'organization',
        status: 'pending',
      });
      if (error) throw error;

      // Fire notifications (org owner + superadmins)
      onPayoutRequested(orgId, currentOrg?.name || '', available, currency);
    },
    onSuccess: () => {
      toast.success(isFr ? 'Demande de retrait envoyée ! Traitement sous 3-8 jours ouvrés.' : 'Withdrawal request sent! Processing within 3-8 business days.');
      setShowWithdrawDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin-payouts', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-fund-summary', orgId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const statusConfig: Record<string, { label: string; icon: typeof Clock; colorClass: string }> = {
    pending: { label: t('payouts.status_requested'), icon: Clock, colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
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

  // Fund summary (org sales + ambassador commissions earned)
  const { data: fundSummary } = useQuery({
    queryKey: ['admin-fund-summary', orgId],
    queryFn: async () => {
      if (!orgId || !user) return null;
      const [{ data: donations }, { data: purchases }, { data: payoutData }, { data: affiliateSales }] = await Promise.all([
        db.from('donations').select('amount, organization_amount, platform_fee, affiliate_commission, completed_at').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('product_purchases').select('amount, organization_amount, platform_fee, affiliate_commission, completed_at').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('payout_requests').select('amount, status').eq('organization_id', orgId),
        // Ambassador commissions earned by the org owner
        db.from('affiliate_sales').select('commission_amount, status, payable_at, created_at').eq('affiliate_user_id', user.id),
      ]);

      // ── Org sales breakdown ──
      const allTxns = [...(donations || []), ...(purchases || [])];
      const totalGMV = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
      const totalOrgReceived = allTxns.reduce((s, t) => s + (t.organization_amount || 0), 0);
      const totalPlatformFees = allTxns.reduce((s, t) => s + (t.platform_fee || 0), 0);
      const totalAffiliateCommissionsPaid = allTxns.reduce((s, t) => s + (t.affiliate_commission || 0), 0);

      // ── Ambassador commissions earned ──
      const allAffSales = affiliateSales || [];
      const totalAmbassadorEarned = allAffSales.reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const ambassadorPaid = allAffSales.filter((a: any) => a.status === 'paid').reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const now = new Date();
      const ambassadorPayable = allAffSales
        .filter((a: any) => a.status === 'payable' || (a.status === 'pending' && a.payable_at && new Date(a.payable_at) <= now))
        .reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const ambassadorPending = totalAmbassadorEarned - ambassadorPaid - ambassadorPayable;

      // ── Payouts ──
      const completedPayouts = (payoutData || []).filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const pendingPayouts = (payoutData || []).filter((p: any) => ['pending', 'requested', 'approved', 'processing'].includes(p.status)).reduce((s: number, p: any) => s + (p.amount || 0), 0);

      // ── Org sales: 72h hold ──
      const holdCutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const clearedOrgReceived = allTxns
        .filter((t: any) => t.completed_at && t.completed_at <= holdCutoff72h)
        .reduce((s, t) => s + (t.organization_amount || 0), 0);
      const pendingClearanceOrg = totalOrgReceived - clearedOrgReceived;

      // ── Total available = cleared org sales + payable ambassador commissions - payouts ──
      const availableBalance = clearedOrgReceived + ambassadorPayable - completedPayouts - pendingPayouts;
      const totalPendingClearance = pendingClearanceOrg + ambassadorPending;

      return {
        totalGMV, totalOrgReceived, totalPlatformFees, totalAffiliateCommissionsPaid,
        totalAmbassadorEarned, ambassadorPayable, ambassadorPending, ambassadorPaid,
        completedPayouts, pendingPayouts, availableBalance,
        pendingClearance: totalPendingClearance, pendingClearanceOrg,
      };
    },
    enabled: !!orgId,
  });

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
        {/* Processing time info */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">{t('payouts.processing_time')}</p>
            <p className="text-xs text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: t('payouts.processing_desc') }} />
          </div>
        </div>

        {/* ═══ Revenue Breakdown – Sales ═══ */}
        {fundSummary && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{isFr ? 'Revenus des ventes' : 'Sales Revenue'}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: isFr ? "Chiffre d'affaires" : 'Gross Revenue', value: fmt(fundSummary.totalGMV, currency), icon: DollarSign, colorClass: 'from-muted/60 to-muted/30 border-border', sub: isFr ? 'Total brut' : 'Gross total' },
                { label: t('payouts.org_share'), value: fmt(fundSummary.totalOrgReceived, currency), icon: Wallet, colorClass: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20', sub: t('payouts.after_platform_fees') },
                { label: t('payouts.platform_fees'), value: fmt(fundSummary.totalPlatformFees, currency), icon: Shield, colorClass: 'from-primary/15 to-primary/5 border-primary/20', sub: `${currentOrg?.platform_fee_percent ?? 10}% ${t('payouts.deducted')}` },
                { label: t('payouts.affiliate_commissions'), value: fmt(fundSummary.totalAffiliateCommissionsPaid, currency), icon: ArrowUpRight, colorClass: 'from-amber-500/15 to-amber-500/5 border-amber-500/20', sub: t('payouts.paid_to_affiliates') },
              ].map(c => (
                <motion.div key={c.label} variants={fadeUp} className={cn('rounded-2xl border p-4 bg-gradient-to-br', c.colorClass)}>
                  <c.icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{c.label}</p>
                  <p className="text-lg font-bold mt-0.5">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ Revenue Breakdown – Ambassador Earnings ═══ */}
        {fundSummary && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{isFr ? 'Gains Ambassadeur (Earn by Sharing)' : 'Ambassador Earnings (Earn by Sharing)'}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: isFr ? 'Total gagné' : 'Total earned', value: fmt(fundSummary.totalAmbassadorEarned, currency), icon: ArrowUpRight, colorClass: 'from-purple-500/15 to-purple-500/5 border-purple-500/20', sub: isFr ? 'Commissions cumulées' : 'Cumulative commissions' },
                { label: isFr ? 'Disponible' : 'Available', value: fmt(fundSummary.ambassadorPayable, currency), icon: CheckCircle, colorClass: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20', sub: isFr ? 'Après 15 jours' : 'After 15 days' },
                { label: isFr ? 'En attente (15j)' : 'Pending (15d)', value: fmt(fundSummary.ambassadorPending, currency), icon: TimerReset, colorClass: 'from-amber-500/15 to-amber-500/5 border-amber-500/20', sub: isFr ? 'Période de rétention' : 'Holding period' },
                { label: isFr ? 'Déjà versé' : 'Already paid', value: fmt(fundSummary.ambassadorPaid, currency), icon: CheckCircle, colorClass: 'from-muted/60 to-muted/30 border-border', sub: isFr ? 'Retraits effectués' : 'Completed withdrawals' },
              ].map(c => (
                <motion.div key={c.label} variants={fadeUp} className={cn('rounded-2xl border p-4 bg-gradient-to-br', c.colorClass)}>
                  <c.icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{c.label}</p>
                  <p className="text-lg font-bold mt-0.5">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ Combined Total Balance ═══ */}
        {fundSummary && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">{isFr ? 'Balance totale' : 'Total balance'}</p>
            </div>
            <p className="text-3xl font-bold text-primary">
              {fmt(fundSummary.totalOrgReceived + fundSummary.totalAmbassadorEarned - fundSummary.completedPayouts, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr
                ? `Votre part ventes (${fmt(fundSummary.totalOrgReceived, currency)}) + Gains ambassadeur (${fmt(fundSummary.totalAmbassadorEarned, currency)}) − Déjà retiré (${fmt(fundSummary.completedPayouts, currency)})`
                : `Your sales share (${fmt(fundSummary.totalOrgReceived, currency)}) + Ambassador earnings (${fmt(fundSummary.totalAmbassadorEarned, currency)}) − Already withdrawn (${fmt(fundSummary.completedPayouts, currency)})`}
            </p>
          </motion.div>
        )}

        {/* ═══ Balance & Withdrawal Section ═══ */}
        {fundSummary && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Available balance for withdrawal */}
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t('payouts.available_balance')}</p>
                  <p className="text-3xl font-bold text-emerald-500 mt-1">{fmt(Math.max(0, fundSummary.availableBalance), currency)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isFr ? 'Ventes (après 72h) + Commissions ambassadeur (après 15j) − Retraits' : 'Sales (after 72h) + Ambassador commissions (after 15d) − Withdrawals'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!kycApproved ? (
                    <a href="/admin/verification" className="block">
                      <Button variant="destructive" size="default" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {isFr ? 'Vérifier mon identité pour retirer' : 'Verify identity to withdraw'}
                      </Button>
                    </a>
                  ) : fundSummary.availableBalance >= MIN_WITHDRAWAL && fundSummary.pendingPayouts === 0 ? (
                    <Button size="default" className="gap-2" onClick={() => setShowWithdrawDialog(true)}>
                      <Send className="h-4 w-4" />
                      {isFr ? 'Demander un retrait' : 'Request withdrawal'}
                    </Button>
                  ) : fundSummary.pendingPayouts > 0 ? (
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-600 gap-1">
                      <Clock className="h-3 w-3" /> {isFr ? 'Retrait en cours' : 'Withdrawal in progress'}
                    </Badge>
                  ) : fundSummary.availableBalance > 0 && fundSummary.availableBalance < MIN_WITHDRAWAL ? (
                    <p className="text-xs text-muted-foreground text-right">
                      {isFr ? `Minimum ${MIN_WITHDRAWAL.toLocaleString('fr-FR')} ${currency} requis` : `Minimum ${MIN_WITHDRAWAL.toLocaleString('en')} ${currency} required`}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Balance details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> {t('payouts.already_withdrawn')}</p>
                  <p className="text-sm font-semibold">{fmt(fundSummary.completedPayouts, currency)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 text-blue-500" /> {t('payouts.in_progress')}</p>
                  <p className="text-sm font-semibold">{fmt(fundSummary.pendingPayouts, currency)}</p>
                </div>
                {fundSummary.pendingClearanceOrg > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><TimerReset className="h-3 w-3 text-amber-500" /> {isFr ? 'Ventes en attente (72h)' : 'Sales pending (72h)'}</p>
                    <p className="text-sm font-semibold text-amber-600">{fmt(fundSummary.pendingClearanceOrg, currency)}</p>
                  </div>
                )}
                {fundSummary.ambassadorPending > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><TimerReset className="h-3 w-3 text-purple-500" /> {isFr ? 'Commissions en attente (15j)' : 'Commissions pending (15d)'}</p>
                    <p className="text-sm font-semibold text-purple-600">{fmt(fundSummary.ambassadorPending, currency)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* KYC warning banner */}
            {!kycApproved && (
              <div className="bg-destructive/5 border-t border-destructive/20 px-5 py-3 flex items-center gap-3">
                <Lock className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-destructive">{isFr ? "Vérification d'identité requise" : 'Identity verification required'}</p>
                  <p className="text-[10px] text-muted-foreground">{isFr ? "Vous devez vérifier votre identité avant de pouvoir demander un retrait." : 'You must verify your identity before requesting a withdrawal.'}</p>
                </div>
                <a href="/admin/verification">
                  <Button variant="outline" size="sm" className="text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                    <Shield className="h-3 w-3" /> {isFr ? 'Vérifier' : 'Verify'}
                  </Button>
                </a>
              </div>
            )}

            {/* How it works mini-guide */}
            <div className="bg-muted/30 border-t border-border px-5 py-3">
              <p className="text-[10px] text-muted-foreground">
                <strong>{isFr ? 'Comment ça marche :' : 'How it works:'}</strong> {isFr
                  ? 'Ventes disponibles après 72h · Commissions ambassadeur après 15 jours · Demandez un retrait → L\'équipe vérifie et traite sous 3-8 jours.'
                  : 'Sales available after 72h · Ambassador commissions after 15 days · Request a withdrawal → The team verifies and processes within 3-8 days.'}
              </p>
            </div>
          </div>
        )}

        {/* Withdrawal confirmation dialog */}
        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmer le retrait</DialogTitle>
              <DialogDescription>
                L'intégralité de votre solde disponible sera demandée en retrait. Le traitement prend 3 à 8 jours ouvrés.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
              <p className="text-xs text-muted-foreground">Montant du retrait</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {fmt(Math.max(0, fundSummary?.availableBalance || 0), currency)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Le versement sera effectué sur les coordonnées indiquées dans votre vérification KYC.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>Annuler</Button>
              <Button
                onClick={() => withdrawMutation.mutate()}
                disabled={withdrawMutation.isPending}
                className="gap-1.5"
              >
                {withdrawMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ Withdrawal History ═══ */}
        {payouts.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Historique des retraits</p>
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
              const config = statusConfig[p.status] || statusConfig.pending;
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
                    {p.reject_reason && (
                      <p className="text-[10px] text-destructive mt-0.5">Motif : {p.reject_reason}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Post-payout feedback */}
        {payouts?.some((p: any) => p.status === 'completed') && (
          <ContextualFeedback context="post_payout" question="Avez-vous bien reçu vos fonds ?" />
        )}
      </div>
    </AdminPageShell>
  );
}
