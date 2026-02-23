import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Wallet, Clock, CheckCircle, XCircle, ArrowUpRight, AlertTriangle,
  DollarSign, Shield, Download, Info
} from 'lucide-react';
import { downloadCSV } from '@/lib/csvExport';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

const statusConfig: Record<string, { label: string; icon: typeof Clock; colorClass: string }> = {
  requested: { label: 'Demandé', icon: Clock, colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  approved: { label: 'Approuvé', icon: CheckCircle, colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  processing: { label: 'En cours', icon: ArrowUpRight, colorClass: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Envoyé', icon: CheckCircle, colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  rejected: { label: 'Rejeté', icon: XCircle, colorClass: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };

export default function AdminPayouts() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';

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
        db.from('donations').select('amount, organization_amount, platform_fee, affiliate_commission').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('product_purchases').select('amount, organization_amount, platform_fee, affiliate_commission').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('payout_requests').select('amount, status').eq('organization_id', orgId),
      ]);
      const allTxns = [...(donations || []), ...(purchases || [])];
      const totalGMV = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
      const totalOrgReceived = allTxns.reduce((s, t) => s + (t.organization_amount || 0), 0);
      const totalPlatformFees = allTxns.reduce((s, t) => s + (t.platform_fee || 0), 0);
      const totalAffiliateCommissions = allTxns.reduce((s, t) => s + (t.affiliate_commission || 0), 0);
      const completedPayouts = (payoutData || []).filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const pendingPayouts = (payoutData || []).filter((p: any) => ['requested', 'approved', 'processing'].includes(p.status)).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const availableBalance = totalOrgReceived - completedPayouts - pendingPayouts;

      return { totalGMV, totalOrgReceived, totalPlatformFees, totalAffiliateCommissions, completedPayouts, pendingPayouts, availableBalance };
    },
    enabled: !!orgId,
  });

  const exportPayouts = () => {
    if (!payouts.length) return;
    downloadCSV(payouts.map((p: any) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      type: p.payout_type,
      requested_at: p.requested_at,
      processed_at: p.processed_at,
    })), `payouts-${currentOrg?.slug || 'org'}`);
  };

  return (
    <AdminPageShell title="Retraits & Payouts" subtitle="Gestion des fonds et historique des retraits" backRoute="/admin">
      <div className="space-y-5">
        {/* SLA Banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Délai de traitement</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Les demandes de retrait sont traitées sous <strong>72h à 5 jours ouvrés</strong>. 
              Les fonds sont envoyés directement sur le compte bancaire enregistré lors du KYC.
            </p>
          </div>
        </div>

        {/* Fund Separation Cards */}
        {fundSummary && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'GMV Totale', value: fmt(fundSummary.totalGMV, currency), icon: DollarSign, colorClass: 'from-muted to-muted/50 border-border', sub: 'Brut avant frais' },
              { label: 'Part Organisation', value: fmt(fundSummary.totalOrgReceived, currency), icon: Wallet, colorClass: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20', sub: 'Après frais plateforme' },
              { label: 'Frais Plateforme', value: fmt(fundSummary.totalPlatformFees, currency), icon: Shield, colorClass: 'from-primary/15 to-primary/5 border-primary/20', sub: `${currentOrg?.platform_fee_percent ?? 10}% prélevé` },
              { label: 'Commissions Affiliés', value: fmt(fundSummary.totalAffiliateCommissions, currency), icon: ArrowUpRight, colorClass: 'from-amber-500/15 to-amber-500/5 border-amber-500/20', sub: 'Reversé aux affiliés' },
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

        {/* Balance highlight */}
        {fundSummary && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-xs text-muted-foreground">Solde disponible pour retrait</p>
              <p className="text-2xl font-bold text-emerald-500">{fmt(Math.max(0, fundSummary.availableBalance), currency)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Déjà retiré : {fmt(fundSummary.completedPayouts, currency)} · En cours : {fmt(fundSummary.pendingPayouts, currency)}
              </p>
            </div>
            {currentOrg?.kyc_status === 'none' && (
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" /> KYC requis
              </Badge>
            )}
          </div>
        )}

        {/* Export */}
        {payouts.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportPayouts}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        )}

        {/* Payout history */}
        {isLoading ? <SkeletonRow count={3} /> : payouts.length === 0 ? (
          <EmptyState variant="generic" title="Aucun retrait" description="Les demandes de retrait apparaîtront ici une fois effectuées." />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {payouts.map((p: any) => {
              const config = statusConfig[p.status] || statusConfig.requested;
              const StatusIcon = config.icon;
              return (
                <motion.div key={p.id} variants={fadeUp}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
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
                      {p.payout_type === 'affiliate' ? '💰 Commission affilié' : '🏦 Retrait organisation'}
                      {' · '}
                      {format(new Date(p.requested_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                    {p.processed_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Traité le {format(new Date(p.processed_at), 'dd MMM yyyy', { locale: fr })}
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
