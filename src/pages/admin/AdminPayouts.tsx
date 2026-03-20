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
  DollarSign, Shield, Download, Loader2, Send, Lock, TimerReset,
  ArrowLeft, ChevronRight, Banknote, TrendingUp, Eye
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
import { useNavigate } from 'react-router-dom';
import { ContextualFeedback } from '@/components/feedback/ContextualFeedback';
import { formatCurrency } from '@/lib/currency';

const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 260, damping: 28 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function AdminPayouts() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';
  const dateFnsLocale = locale === 'fr' ? fr : enUS;
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  const MIN_WITHDRAWAL = 1000;
  const kycApproved = currentOrg?.kyc_status === 'level1' || currentOrg?.kyc_status === 'level2';

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

  const statusConfig: Record<string, { label: string; icon: typeof Clock; colorClass: string; dotColor: string }> = {
    pending: { label: t('payouts.status_requested'), icon: Clock, colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dotColor: 'bg-amber-500' },
    requested: { label: t('payouts.status_requested'), icon: Clock, colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dotColor: 'bg-amber-500' },
    approved: { label: t('payouts.status_approved'), icon: CheckCircle, colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20', dotColor: 'bg-blue-500' },
    processing: { label: t('payouts.status_processing'), icon: ArrowUpRight, colorClass: 'bg-primary/10 text-primary border-primary/20', dotColor: 'bg-primary' },
    completed: { label: t('payouts.status_completed'), icon: CheckCircle, colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dotColor: 'bg-emerald-500' },
    rejected: { label: t('payouts.status_rejected'), icon: XCircle, colorClass: 'bg-destructive/10 text-destructive border-destructive/20', dotColor: 'bg-destructive' },
  };

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

  const { data: fundSummary } = useQuery({
    queryKey: ['admin-fund-summary', orgId],
    queryFn: async () => {
      if (!orgId || !user) return null;
      const [{ data: donations }, { data: purchases }, { data: payoutData }, { data: affiliateSales }] = await Promise.all([
        db.from('donations').select('amount, organization_amount, platform_fee, affiliate_commission, completed_at').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('product_purchases').select('amount, organization_amount, platform_fee, affiliate_commission, completed_at').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('payout_requests').select('amount, status').eq('organization_id', orgId),
        db.from('affiliate_sales').select('commission_amount, status, payable_at, created_at').eq('affiliate_user_id', user.id),
      ]);

      const allTxns = [...(donations || []), ...(purchases || [])];
      const totalGMV = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
      const totalOrgReceived = allTxns.reduce((s, t) => s + (t.organization_amount || 0), 0);
      const totalPlatformFees = allTxns.reduce((s, t) => s + (t.platform_fee || 0), 0);
      const totalAffiliateCommissionsPaid = allTxns.reduce((s, t) => s + (t.affiliate_commission || 0), 0);

      const allAffSales = affiliateSales || [];
      const totalAmbassadorEarned = allAffSales.reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const ambassadorPaid = allAffSales.filter((a: any) => a.status === 'paid').reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const now = new Date();
      const ambassadorPayable = allAffSales
        .filter((a: any) => a.status === 'payable' || (a.status === 'pending' && a.payable_at && new Date(a.payable_at) <= now))
        .reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const ambassadorPending = totalAmbassadorEarned - ambassadorPaid - ambassadorPayable;

      const completedPayouts = (payoutData || []).filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const pendingPayouts = (payoutData || []).filter((p: any) => ['pending', 'requested', 'approved', 'processing'].includes(p.status)).reduce((s: number, p: any) => s + (p.amount || 0), 0);

      const holdCutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const clearedOrgReceived = allTxns
        .filter((t: any) => t.completed_at && t.completed_at <= holdCutoff72h)
        .reduce((s, t) => s + (t.organization_amount || 0), 0);
      const pendingClearanceOrg = totalOrgReceived - clearedOrgReceived;

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

  const availableBalance = Math.max(0, fundSummary?.availableBalance || 0);
  const canWithdraw = kycApproved && availableBalance >= MIN_WITHDRAWAL && (fundSummary?.pendingPayouts || 0) === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
            onClick={() => navigate('/admin/sales')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight">{t('payouts.title')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t('payouts.subtitle')}</p>
          </div>
        </div>
        {payouts.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={exportPayouts}>
            <Download className="h-3.5 w-3.5" /> {t('payouts.export')}
          </Button>
        )}
      </div>

      {/* ═══ Hero Balance Card — Whale Loans inspired ═══ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-2xl bg-foreground text-background overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Left: Available Balance */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-background/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-background/70" />
                </div>
                <span className="text-xs font-medium text-background/60 uppercase tracking-wider">
                  {t('payouts.available_balance')}
                </span>
              </div>
              <p className="text-4xl sm:text-5xl font-black tracking-tight">
                {fmt(availableBalance, currency)}
              </p>
              <p className="text-xs text-background/50 mt-2">
                {isFr ? 'Ventes (après 72h) + Commissions (après 15j) − Retraits' : 'Sales (after 72h) + Commissions (after 15d) − Withdrawals'}
              </p>

              {/* CTA */}
              <div className="pt-4">
                {!kycApproved ? (
                  <Button
                    onClick={() => navigate('/admin/verification')}
                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-foreground font-bold rounded-xl h-11 px-6"
                  >
                    <Shield className="h-4 w-4" />
                    {isFr ? "Vérifier l'identité" : 'Verify identity'}
                  </Button>
                ) : canWithdraw ? (
                  <Button
                    onClick={() => setShowWithdrawDialog(true)}
                    className="gap-2 bg-background text-foreground hover:bg-background/90 font-bold rounded-xl h-11 px-6"
                  >
                    <Send className="h-4 w-4" />
                    {isFr ? 'Demander un retrait' : 'Request withdrawal'}
                  </Button>
                ) : (fundSummary?.pendingPayouts || 0) > 0 ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/10 text-background/70 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {isFr ? 'Retrait en cours de traitement' : 'Withdrawal being processed'}
                  </div>
                ) : availableBalance > 0 && availableBalance < MIN_WITHDRAWAL ? (
                  <p className="text-xs text-background/50">
                    {isFr ? `Minimum ${MIN_WITHDRAWAL.toLocaleString('fr-FR')} ${currency} requis` : `Minimum ${MIN_WITHDRAWAL.toLocaleString('en')} ${currency} required`}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Right: Quick Stats Stack */}
            <div className="flex flex-col gap-3 sm:w-56">
              <div className="rounded-xl bg-background/10 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-background/50 uppercase tracking-wider font-medium">{isFr ? 'Déjà retiré' : 'Withdrawn'}</span>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <p className="text-lg font-bold">{fmt(fundSummary?.completedPayouts || 0, currency)}</p>
              </div>

              <div className="rounded-xl bg-background/10 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-background/50 uppercase tracking-wider font-medium">{isFr ? 'En cours' : 'In progress'}</span>
                  <Loader2 className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <p className="text-lg font-bold">{fmt(fundSummary?.pendingPayouts || 0, currency)}</p>
              </div>

              <div className="rounded-xl bg-background/10 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-background/50 uppercase tracking-wider font-medium">{isFr ? 'En maturation' : 'Maturing'}</span>
                  <TimerReset className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <p className="text-lg font-bold">{fmt(fundSummary?.pendingClearance || 0, currency)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Warning Bar */}
        {!kycApproved && (
          <div className="bg-amber-500/20 border-t border-background/10 px-6 py-3 flex items-center gap-3">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs text-background/70 flex-1">
              {isFr ? "Vérification d'identité requise pour retirer vos fonds." : 'Identity verification required to withdraw funds.'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-amber-400 hover:text-amber-300 hover:bg-background/10 gap-1"
              onClick={() => navigate('/admin/verification')}
            >
              {isFr ? 'Vérifier' : 'Verify'} <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </motion.div>

      {/* ═══ Revenue Breakdown Grid ═══ */}
      {fundSummary && (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
          {/* Sales Revenue */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Revenus des ventes' : 'Sales Revenue'}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: isFr ? "Chiffre d'affaires" : 'Gross Revenue', value: fmt(fundSummary.totalGMV, currency), icon: DollarSign, accent: 'text-foreground', bg: 'bg-muted/50' },
                { label: t('payouts.org_share'), value: fmt(fundSummary.totalOrgReceived, currency), icon: Banknote, accent: 'text-emerald-500', bg: 'bg-emerald-500/8' },
                { label: t('payouts.platform_fees'), value: fmt(fundSummary.totalPlatformFees, currency), icon: Shield, accent: 'text-muted-foreground', bg: 'bg-muted/50' },
                { label: t('payouts.affiliate_commissions'), value: fmt(fundSummary.totalAffiliateCommissionsPaid, currency), icon: ArrowUpRight, accent: 'text-amber-500', bg: 'bg-amber-500/8' },
              ].map(c => (
                <motion.div key={c.label} variants={fadeUp}
                  className={cn('rounded-2xl border border-border p-4 transition-shadow hover:shadow-md', c.bg)}>
                  <div className="flex items-center justify-between mb-3">
                    <c.icon className={cn('h-4 w-4', c.accent)} />
                  </div>
                  <p className="text-xl font-extrabold tracking-tight">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wide">{c.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ambassador Earnings */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Gains Ambassadeur' : 'Ambassador Earnings'}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: isFr ? 'Total gagné' : 'Total earned', value: fmt(fundSummary.totalAmbassadorEarned, currency), icon: TrendingUp, accent: 'text-violet-500', bg: 'bg-violet-500/8' },
                { label: isFr ? 'Disponible' : 'Available', value: fmt(fundSummary.ambassadorPayable, currency), icon: CheckCircle, accent: 'text-emerald-500', bg: 'bg-emerald-500/8' },
                { label: isFr ? 'En attente (15j)' : 'Pending (15d)', value: fmt(fundSummary.ambassadorPending, currency), icon: TimerReset, accent: 'text-amber-500', bg: 'bg-amber-500/8' },
                { label: isFr ? 'Déjà versé' : 'Already paid', value: fmt(fundSummary.ambassadorPaid, currency), icon: CheckCircle, accent: 'text-muted-foreground', bg: 'bg-muted/50' },
              ].map(c => (
                <motion.div key={c.label} variants={fadeUp}
                  className={cn('rounded-2xl border border-border p-4 transition-shadow hover:shadow-md', c.bg)}>
                  <div className="flex items-center justify-between mb-3">
                    <c.icon className={cn('h-4 w-4', c.accent)} />
                  </div>
                  <p className="text-xl font-extrabold tracking-tight">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wide">{c.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ How it works ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-bold text-foreground mb-2">{isFr ? 'Comment ça marche' : 'How it works'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', label: isFr ? 'Ventes confirmées' : 'Sales confirmed', desc: isFr ? 'Disponible après 72h' : 'Available after 72h', icon: DollarSign },
            { step: '02', label: isFr ? 'Commissions maturées' : 'Commissions matured', desc: isFr ? 'Après 15 jours de rétention' : 'After 15-day hold', icon: TimerReset },
            { step: '03', label: isFr ? 'Retrait traité' : 'Withdrawal processed', desc: isFr ? '3-8 jours ouvrés' : '3-8 business days', icon: Send },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-bold">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Withdrawal confirmation dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isFr ? 'Confirmer le retrait' : 'Confirm withdrawal'}</DialogTitle>
            <DialogDescription>
              {isFr
                ? "L'intégralité de votre solde disponible sera demandée en retrait. Le traitement prend 3 à 8 jours ouvrés."
                : 'Your entire available balance will be requested for withdrawal. Processing takes 3 to 8 business days.'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 rounded-xl bg-foreground text-background text-center">
            <p className="text-[10px] text-background/50 uppercase tracking-wider font-medium">{isFr ? 'Montant du retrait' : 'Withdrawal amount'}</p>
            <p className="text-3xl font-black mt-1">
              {fmt(availableBalance, currency)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {isFr
              ? 'Le versement sera effectué sur les coordonnées indiquées dans votre vérification KYC.'
              : 'Payment will be sent to the details provided in your KYC verification.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)} className="rounded-xl">{isFr ? 'Annuler' : 'Cancel'}</Button>
            <Button
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
              className="gap-1.5 rounded-xl"
            >
              {withdrawMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isFr ? 'Confirmer' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Withdrawal History ═══ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Historique des retraits' : 'Withdrawal History'}</p>
        </div>

        {isLoading ? <SkeletonRow count={3} /> : payouts.length === 0 ? (
          <EmptyState variant="generic" title={t('payouts.no_payouts')} description={t('payouts.no_payouts_desc')} />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {payouts.map((p: any) => {
              const config = statusConfig[p.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <motion.div key={p.id} variants={fadeUp}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-all hover:shadow-sm group">
                  {/* Status dot */}
                  <div className="relative shrink-0">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', config.colorClass)}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className={cn('absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card', config.dotColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-extrabold">{fmt(p.amount, p.currency || currency)}</p>
                      <Badge variant="outline" className={cn('text-[10px] border-0 font-semibold', config.colorClass)}>
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
                      <p className="text-[10px] text-destructive mt-0.5">{isFr ? 'Motif' : 'Reason'}: {p.reject_reason}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Post-payout feedback */}
      {payouts?.some((p: any) => p.status === 'completed') && (
        <ContextualFeedback context="post_payout" question="Avez-vous bien reçu vos fonds ?" />
      )}
    </motion.div>
  );
}
