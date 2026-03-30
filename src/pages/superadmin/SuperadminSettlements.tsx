import { useState } from 'react';
import ManualPayoutsDashboard from '@/components/superadmin/ManualPayoutsDashboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { releaseSettlement, migrateSubaccounts, callFn } from '@/lib/api';
import {
  Clock, CheckCircle, AlertTriangle, Loader2, Building2,
  ArrowUpRight, Snowflake, RefreshCw, Zap, Search,
  TrendingUp, Flame, ArrowDown, ArrowUp, Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fmt = (n: number, c?: string) => formatCurrency(n, c);

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
};

export default function SuperadminSettlements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [releasing, setReleasing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateLog, setMigrateLog] = useState<any>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileLog, setReconcileLog] = useState<any>(null);

  // Settlement overview
  const { data: settlementStats, isLoading } = useQuery({
    queryKey: ['sa-settlement-stats'],
    queryFn: async () => {
      const [{ data: heldDonations }, { data: releasedDonations }, { data: frozenDonations },
             { data: heldPurchases }, { data: releasedPurchases }, { data: frozenPurchases },
             { data: disputedDonations }, { data: disputedPurchases }] = await Promise.all([
        db.from('donations').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'held'),
        db.from('donations').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'released'),
        db.from('donations').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'frozen'),
        db.from('product_purchases').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'held'),
        db.from('product_purchases').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'released'),
        db.from('product_purchases').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'frozen'),
        db.from('donations').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'disputed'),
        db.from('product_purchases').select('organization_amount').eq('status', 'completed').eq('settlement_status', 'disputed'),
      ]);

      const sum = (arr: any[] | null) => (arr || []).reduce((s, t) => s + (t.organization_amount || 0), 0);
      return {
        held: sum(heldDonations) + sum(heldPurchases),
        heldCount: (heldDonations?.length || 0) + (heldPurchases?.length || 0),
        released: sum(releasedDonations) + sum(releasedPurchases),
        releasedCount: (releasedDonations?.length || 0) + (releasedPurchases?.length || 0),
        frozen: sum(frozenDonations) + sum(frozenPurchases),
        frozenCount: (frozenDonations?.length || 0) + (frozenPurchases?.length || 0),
        disputed: sum(disputedDonations) + sum(disputedPurchases),
        disputedCount: (disputedDonations?.length || 0) + (disputedPurchases?.length || 0),
      };
    },
  });

  // Pending payout requests count
  const { data: pendingPayoutCount = 0 } = useQuery({
    queryKey: ['sa-pending-payout-count'],
    queryFn: async () => {
      const { count } = await db
        .from('payout_requests')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'requested']);
      return count || 0;
    },
  });

  // Orgs without subaccounts
  const { data: orgsWithout = [] } = useQuery({
    queryKey: ['sa-orgs-no-subaccount'],
    queryFn: async () => {
      const { data } = await db.from('organizations')
        .select('id, name, slug, is_active, monetization_enabled, paystack_subaccount_code')
        .is('paystack_subaccount_code', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const result = await releaseSettlement();
      toast({ title: `✅ Settlements released`, description: `${result.released} released, ${result.frozen} frozen` });
      queryClient.invalidateQueries({ queryKey: ['sa-settlement-stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setReleasing(false);
    }
  };

  const handleMigrate = async (dryRun: boolean) => {
    setMigrating(true);
    setMigrateLog(null);
    try {
      const result = await migrateSubaccounts(10, dryRun);
      setMigrateLog(result);
      toast({ title: dryRun ? '🔍 Dry run complete' : '✅ Migration complete', description: `${result.migrated || 0} migrated, ${result.skipped || 0} skipped` });
      if (!dryRun) queryClient.invalidateQueries({ queryKey: ['sa-orgs-no-subaccount'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setMigrating(false);
    }
  };

  const handleReconcile = async (days: number) => {
    setReconciling(true);
    setReconcileLog(null);
    try {
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const result = await callFn('reconcile-payments', { pages: 10, from }, true);
      setReconcileLog(result);
      const count = result?.reconciled?.length || 0;
      toast({
        title: count > 0 ? `✅ ${count} transaction(s) réconciliée(s)` : '✅ Aucune transaction manquante',
        description: `${result?.total_scanned || 0} scannées, ${result?.errors?.length || 0} erreur(s)`,
      });
      if (count > 0) queryClient.invalidateQueries({ queryKey: ['sa-settlement-stats'] });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setReconciling(false);
    }
  };

  const totalVolume = settlementStats ? settlementStats.held + settlementStats.released + settlementStats.frozen + settlementStats.disputed : 0;

  const cards = settlementStats ? [
    {
      label: 'HELD',
      sublabel: '72h retention',
      value: fmt(settlementStats.held),
      count: settlementStats.heldCount,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10',
      iconBg: 'bg-amber-500/20',
      textColor: 'text-amber-400',
      pct: totalVolume > 0 ? Math.round((settlementStats.held / totalVolume) * 100) : 0,
    },
    {
      label: 'RELEASED',
      sublabel: 'Available to orgs',
      value: fmt(settlementStats.released),
      count: settlementStats.releasedCount,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-green-600',
      bgGlow: 'bg-emerald-500/10',
      iconBg: 'bg-emerald-500/20',
      textColor: 'text-emerald-400',
      pct: totalVolume > 0 ? Math.round((settlementStats.released / totalVolume) * 100) : 0,
    },
    {
      label: 'FROZEN',
      sublabel: 'Under review',
      value: fmt(settlementStats.frozen),
      count: settlementStats.frozenCount,
      icon: Snowflake,
      gradient: 'from-blue-500 to-cyan-600',
      bgGlow: 'bg-blue-500/10',
      iconBg: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      pct: totalVolume > 0 ? Math.round((settlementStats.frozen / totalVolume) * 100) : 0,
    },
    {
      label: 'DISPUTED',
      sublabel: 'Requires action',
      value: fmt(settlementStats.disputed),
      count: settlementStats.disputedCount,
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-600',
      bgGlow: 'bg-rose-500/10',
      iconBg: 'bg-rose-500/20',
      textColor: 'text-rose-400',
      pct: totalVolume > 0 ? Math.round((settlementStats.disputed / totalVolume) * 100) : 0,
    },
  ] : [];

  return (
    <div className="space-y-8">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 border border-white/5">
        {/* Decorative glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  Settlements & Finance
                </h1>
                <p className="text-xs text-white/50 mt-0.5">
                  Financial operations center
                </p>
              </div>
            </div>
            {settlementStats && (
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">{fmt(totalVolume)}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Total Volume</span>
                </div>
                {pendingPayoutCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/20 rounded-full px-3 py-1">
                    <Wallet className="h-3 w-3 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{pendingPayoutCount}</span>
                    <span className="text-[10px] text-amber-400/70">payout{pendingPayoutCount > 1 ? 's' : ''} pending</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <Button
              onClick={handleRelease}
              disabled={releasing}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/25 gap-2"
            >
              {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Release 72h-held funds
            </Button>
            <p className="text-[10px] text-white/60">Ne traite pas les demandes manuelles de payout</p>
          </div>
        </div>
      </div>

      {/* ── Settlement KPI Cards ── */}
      {isLoading ? <SkeletonRow count={4} /> : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {cards.map(c => (
            <motion.div
              key={c.label}
              variants={fadeUp}
              className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-border transition-all duration-300"
            >
              {/* Top gradient bar */}
              <div className={cn('h-1 w-full bg-gradient-to-r', c.gradient)} />

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', c.iconBg)}>
                    <c.icon className={cn('h-4 w-4', c.textColor)} />
                  </div>
                  {c.pct > 0 && (
                    <Badge variant="outline" className="text-[9px] font-mono border-border/50">
                      {c.pct}%
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  <p className="text-lg font-extrabold tracking-tight mt-0.5">{c.value}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground">{c.sublabel}</span>
                  <span className={cn('text-[10px] font-bold tabular-nums', c.textColor)}>
                    {c.count} tx
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Operations Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Migration Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card overflow-hidden"
        >
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-sm">Subaccount Migration</h2>
                  <p className="text-[10px] text-muted-foreground">
                    {orgsWithout.length} org{orgsWithout.length !== 1 ? 's' : ''} without Paystack subaccount
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMigrate(true)} disabled={migrating || !orgsWithout.length} className="flex-1 gap-1.5 text-xs">
                {migrating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                Dry Run
              </Button>
              <Button size="sm" onClick={() => handleMigrate(false)} disabled={migrating || !orgsWithout.length} className="flex-1 gap-1.5 text-xs bg-primary text-primary-foreground">
                {migrating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpRight className="h-3 w-3" />}
                Migrate (10)
              </Button>
            </div>

            {orgsWithout.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl bg-muted/30 p-2">
                {orgsWithout.slice(0, 15).map((o: any) => (
                  <div key={o.id} className="flex items-center gap-2 text-[11px] p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{o.name}</span>
                    <span className="text-muted-foreground text-[10px]">({o.slug})</span>
                    {o.monetization_enabled && (
                      <Badge variant="outline" className="text-[8px] ml-auto h-4 px-1.5 border-emerald-500/30 text-emerald-600">Monetized</Badge>
                    )}
                  </div>
                ))}
                {orgsWithout.length > 15 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1">+{orgsWithout.length - 15} more</p>
                )}
              </div>
            )}

            {migrateLog && (
              <div className="rounded-xl bg-muted/50 p-3 space-y-1.5 text-xs border border-border/30">
                <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Migration Result</p>
                <div className="flex gap-3">
                  <span className="text-emerald-600 font-medium">✓ {migrateLog.migrated}</span>
                  <span className="text-amber-600 font-medium">⊘ {migrateLog.skipped}</span>
                  <span className="text-destructive font-medium">✕ {migrateLog.failed}</span>
                </div>
                {migrateLog.details?.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <Badge variant="outline" className={cn('text-[8px] h-4',
                      d.status === 'migrated' ? 'border-emerald-500/30 text-emerald-600' :
                      d.status === 'skipped' ? 'border-amber-500/30 text-amber-600' :
                      d.status === 'dry_run_ok' ? 'border-blue-500/30 text-blue-600' :
                      'border-destructive/30 text-destructive'
                    )}>{d.status}</Badge>
                    <span className="truncate">{d.name}</span>
                    {d.error && <span className="text-destructive truncate">— {d.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Reconciliation Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-card overflow-hidden"
        >
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Search className="h-4.5 w-4.5 text-violet-500" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Payment Reconciliation</h2>
                <p className="text-[10px] text-muted-foreground">
                  Scan Paystack & recover missing transactions
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleReconcile(7)} disabled={reconciling} className="flex-1 gap-1.5 text-xs">
                {reconciling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                Last 7 days
              </Button>
              <Button size="sm" onClick={() => handleReconcile(30)} disabled={reconciling} className="flex-1 gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white border-0">
                {reconciling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                Last 30 days
              </Button>
            </div>

            {reconcileLog && (
              <div className="rounded-xl bg-muted/50 p-3 space-y-2 text-xs border border-border/30">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Scanned:</span>
                    <span className="font-bold">{reconcileLog.total_scanned}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-muted-foreground">Recovered:</span>
                    <span className="font-bold text-emerald-600">{reconcileLog.reconciled?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-muted-foreground">Errors:</span>
                    <span className="font-bold text-destructive">{reconcileLog.errors?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Existed:</span>
                    <span className="font-bold">{reconcileLog.already_existed || 0}</span>
                  </div>
                </div>
                {reconcileLog.reconciled?.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Recovered Transactions</p>
                    {reconcileLog.reconciled.map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/10">
                        <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="font-mono text-[10px]">{r.reference}</span>
                        <span className="ml-auto font-bold text-[10px]">{formatCurrency(r.amount)} XOF</span>
                      </div>
                    ))}
                  </div>
                )}
                {reconcileLog.errors?.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-destructive">Errors</p>
                    {reconcileLog.errors.map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-destructive/10">
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                        <span className="font-mono text-[10px]">{r.reference}</span>
                        <span className="ml-auto text-destructive truncate max-w-36 text-[10px]">{r.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Manual Payouts ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-border/50 bg-card overflow-hidden"
      >
        <div className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent px-5 py-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">Manual Payouts</span>
            {pendingPayoutCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">
                {pendingPayoutCount} pending
              </Badge>
            )}
          </div>
        </div>
        <div className="p-5">
          <ManualPayoutsDashboard />
        </div>
      </motion.div>
    </div>
  );
}
