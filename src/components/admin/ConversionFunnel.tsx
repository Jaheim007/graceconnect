import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { ContextTip } from '@/components/admin/ContextualTooltips';

export function ConversionFunnel() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: members = [] } = useOrgMembers(currentOrg?.id);

  const { data: stats } = useQuery({
    queryKey: ['conversion-funnel', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const [
        { count: cartCount },
        { count: purchaseCount },
        { data: purchases },
        metricsQ,
        liveViewsQ,
      ] = await Promise.all([
        db.from('abandoned_carts').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrg.id).eq('status', 'completed'),
        db.from('product_purchases').select('user_id').eq('organization_id', currentOrg.id).eq('status', 'completed'),
        db.from('org_daily_metrics').select('page_views').eq('organization_id', currentOrg.id),
        db.from('client_events').select('id', { count: 'exact', head: true }).eq('event_name', 'page_view'),
      ]);

      const aggregatedViews = (metricsQ.data || []).reduce((s: number, m: any) => s + (m.page_views || 0), 0);
      const liveViews = liveViewsQ.count || 0;
      const pageViews = Math.max(aggregatedViews, liveViews);

      // Count unique buyers vs repeat buyers
      const uniqueBuyers = new Set((purchases || []).map((p: any) => p.user_id)).size;
      const totalPurchases = purchaseCount || 0;
      const repeatBuyers = totalPurchases > uniqueBuyers ? totalPurchases - uniqueBuyers : 0;

      return {
        visitors: pageViews,
        carts: cartCount || 0,
        purchases: totalPurchases,
        uniqueBuyers,
        repeatBuyers,
      };
    },
    enabled: !!currentOrg?.id,
  });

  if (!stats || stats.visitors === 0) return null;

  const steps = [
    { label: isFr ? 'Visiteurs' : 'Visitors', value: stats.visitors, color: 'bg-blue-400', icon: '👥' },
    { label: isFr ? 'Paniers ouverts' : 'Open carts', value: stats.carts, color: 'bg-amber-400', icon: '🛒' },
    { label: isFr ? 'Acheteurs' : 'Buyers', value: stats.purchases, color: 'bg-emerald-400', icon: '✅' },
    { label: isFr ? 'Acheteurs uniques' : 'Unique buyers', value: stats.uniqueBuyers, color: 'bg-violet-400', icon: '👤' },
    { label: isFr ? 'Achats récurrents' : 'Repeat purchases', value: stats.repeatBuyers, color: 'bg-pink-400', icon: '🔄' },
  ];

  const maxVal = Math.max(...steps.map(s => s.value), 1);

  // Overall conversion rate
  const convRate = stats.visitors > 0
    ? ((stats.purchases / stats.visitors) * 100).toFixed(1)
    : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Filter className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-sm">
              {isFr ? 'Tunnel de conversion' : 'Conversion Funnel'}
            </h2>
            <ContextTip tipKey="analytics_funnel" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isFr ? 'Du visiteur à l\'acheteur fidèle' : 'From visitor to loyal buyer'}
          </p>
        </div>
        {/* Overall conversion badge */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
          <span className="text-xs font-bold text-emerald-500">{convRate}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const width = Math.max((step.value / maxVal) * 100, 8);
          const dropoff = idx > 0 && idx < 3 && steps[idx - 1].value > 0
            ? Math.round((1 - step.value / steps[idx - 1].value) * 100)
            : null;

          return (
            <div key={step.label}>
              {dropoff !== null && dropoff > 0 && (
                <div className="flex items-center gap-1 mb-1 ml-2">
                  <div className="h-4 border-l border-dashed border-muted-foreground/30 ml-3" />
                  <span className="text-[9px] text-red-400 font-medium">
                    ↓ {dropoff}% {isFr ? 'perdus' : 'lost'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm">{step.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{step.label}</span>
                    <span className="text-xs font-bold">{step.value}</span>
                  </div>
                  <div className="h-5 bg-muted/30 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.15 }}
                      className={`h-full ${step.color} rounded-lg`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
