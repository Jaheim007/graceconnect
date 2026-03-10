import { useState } from 'react';
import ManualPayoutsDashboard from '@/components/superadmin/ManualPayoutsDashboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { releaseSettlement, migrateSubaccounts } from '@/lib/api';
import {
  Clock, CheckCircle, AlertTriangle, Loader2, Building2,
  ArrowUpRight, Shield, Snowflake, RefreshCw, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const fmt = (n: number, c?: string) => formatCurrency(n, c);
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function SuperadminSettlements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [releasing, setReleasing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateLog, setMigrateLog] = useState<any>(null);

  // Settlement overview: held vs released transactions
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

  const cards = settlementStats ? [
    { label: 'Held (72h)', value: fmt(settlementStats.held), count: settlementStats.heldCount, icon: Clock, color: 'from-amber-500/15 to-amber-500/5 border-amber-500/20 text-amber-600' },
    { label: 'Released', value: fmt(settlementStats.released), count: settlementStats.releasedCount, icon: CheckCircle, color: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-600' },
    { label: 'Frozen', value: fmt(settlementStats.frozen), count: settlementStats.frozenCount, icon: Snowflake, color: 'from-blue-500/15 to-blue-500/5 border-blue-500/20 text-blue-600' },
    { label: 'Disputed', value: fmt(settlementStats.disputed), count: settlementStats.disputedCount, icon: AlertTriangle, color: 'from-destructive/15 to-destructive/5 border-destructive/20 text-destructive' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Settlements & Migration
        </h1>
        <Button onClick={handleRelease} disabled={releasing} size="sm" className="gap-1.5">
          {releasing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Release eligible
        </Button>
      </div>

      {/* Settlement stats */}
      {isLoading ? <SkeletonRow count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(c => (
            <motion.div key={c.label} variants={fadeUp} initial="hidden" animate="visible"
              className={cn('rounded-2xl border p-4 bg-gradient-to-br', c.color)}>
              <c.icon className="h-4 w-4 mb-1" />
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{c.label}</p>
              <p className="text-lg font-bold mt-0.5">{c.value}</p>
              <p className="text-[10px] opacity-60">{c.count} transactions</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Migration section */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Subaccount Migration
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {orgsWithout.length} active org(s) without a Paystack subaccount
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleMigrate(true)} disabled={migrating || !orgsWithout.length}>
              {migrating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
              Dry Run
            </Button>
            <Button size="sm" onClick={() => handleMigrate(false)} disabled={migrating || !orgsWithout.length}
              className="bg-primary text-primary-foreground">
              {migrating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
              Migrate (batch 10)
            </Button>
          </div>
        </div>

        {orgsWithout.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {orgsWithout.slice(0, 20).map((o: any) => (
              <div key={o.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{o.name}</span>
                <span className="text-muted-foreground">({o.slug})</span>
                {o.monetization_enabled && (
                  <Badge variant="outline" className="text-[9px] ml-auto">Monetized</Badge>
                )}
              </div>
            ))}
            {orgsWithout.length > 20 && (
              <p className="text-[10px] text-muted-foreground text-center">... and {orgsWithout.length - 20} more</p>
            )}
          </div>
        )}

        {migrateLog && (
          <div className="rounded-xl bg-muted/50 p-3 space-y-1.5 text-xs">
            <p className="font-semibold">Migration Result:</p>
            <p>Migrated: {migrateLog.migrated} · Skipped: {migrateLog.skipped} · Failed: {migrateLog.failed}</p>
            {migrateLog.details?.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-[9px]',
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
    </div>
  );
}
