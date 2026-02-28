import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Crown, UserCheck, UserMinus, Gem } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CLVSegment {
  label: string;
  count: number;
  avgSpend: number;
  avgOrders: number;
  icon: React.ReactNode;
  color: string;
}

export function CustomerLifetimeValue() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const currency = currentOrg?.currency || 'XOF';

  const { data } = useQuery({
    queryKey: ['admin-clv', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      // Get all completed purchases grouped by user
      const { data: purchases } = await db.from('product_purchases')
        .select('user_id, amount, created_at')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'completed');

      const { data: donations } = await db.from('donations')
        .select('user_id, amount, created_at')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'completed');

      // Merge all transactions by user
      const userMap: Record<string, { total: number; count: number; firstDate: string; lastDate: string }> = {};

      for (const tx of [...(purchases || []), ...(donations || [])]) {
        if (!tx.user_id) continue;
        if (!userMap[tx.user_id]) {
          userMap[tx.user_id] = { total: 0, count: 0, firstDate: tx.created_at, lastDate: tx.created_at };
        }
        userMap[tx.user_id].total += tx.amount || 0;
        userMap[tx.user_id].count += 1;
        if (tx.created_at < userMap[tx.user_id].firstDate) userMap[tx.user_id].firstDate = tx.created_at;
        if (tx.created_at > userMap[tx.user_id].lastDate) userMap[tx.user_id].lastDate = tx.created_at;
      }

      const users = Object.values(userMap);
      if (users.length === 0) return null;

      const totalCustomers = users.length;
      const avgCLV = users.reduce((s, u) => s + u.total, 0) / totalCustomers;
      const avgOrders = users.reduce((s, u) => s + u.count, 0) / totalCustomers;
      const topSpender = Math.max(...users.map(u => u.total));

      // Segment by spend
      const thresholds = { high: avgCLV * 2, mid: avgCLV * 0.5 };
      const segments: CLVSegment[] = [
        {
          label: isFr ? 'VIP (Top dépensiers)' : 'VIP (Top spenders)',
          count: users.filter(u => u.total >= thresholds.high).length,
          avgSpend: (() => { const s = users.filter(u => u.total >= thresholds.high); return s.length ? s.reduce((a, u) => a + u.total, 0) / s.length : 0; })(),
          avgOrders: (() => { const s = users.filter(u => u.total >= thresholds.high); return s.length ? s.reduce((a, u) => a + u.count, 0) / s.length : 0; })(),
          icon: <Crown className="h-4 w-4 text-amber-500" />,
          color: 'border-amber-500/20 bg-amber-500/5',
        },
        {
          label: isFr ? 'Réguliers' : 'Regular',
          count: users.filter(u => u.total >= thresholds.mid && u.total < thresholds.high).length,
          avgSpend: (() => { const s = users.filter(u => u.total >= thresholds.mid && u.total < thresholds.high); return s.length ? s.reduce((a, u) => a + u.total, 0) / s.length : 0; })(),
          avgOrders: (() => { const s = users.filter(u => u.total >= thresholds.mid && u.total < thresholds.high); return s.length ? s.reduce((a, u) => a + u.count, 0) / s.length : 0; })(),
          icon: <UserCheck className="h-4 w-4 text-emerald-500" />,
          color: 'border-emerald-500/20 bg-emerald-500/5',
        },
        {
          label: isFr ? 'Occasionnels' : 'Occasional',
          count: users.filter(u => u.total < thresholds.mid).length,
          avgSpend: (() => { const s = users.filter(u => u.total < thresholds.mid); return s.length ? s.reduce((a, u) => a + u.total, 0) / s.length : 0; })(),
          avgOrders: (() => { const s = users.filter(u => u.total < thresholds.mid); return s.length ? s.reduce((a, u) => a + u.count, 0) / s.length : 0; })(),
          icon: <UserMinus className="h-4 w-4 text-muted-foreground" />,
          color: 'border-border bg-muted/30',
        },
      ];

      // Repeat buyers
      const repeatBuyers = users.filter(u => u.count >= 2).length;
      const repeatRate = ((repeatBuyers / totalCustomers) * 100).toFixed(1);

      return { avgCLV, avgOrders, topSpender, totalCustomers, segments, repeatRate, repeatBuyers };
    },
    enabled: !!currentOrg?.id,
  });

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gem className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">{isFr ? 'Valeur Vie Client (CLV)' : 'Customer Lifetime Value'}</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">{data.totalCustomers} {isFr ? 'clients' : 'customers'}</Badge>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isFr ? 'CLV moyen' : 'Avg CLV'}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(data.avgCLV, currency)}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isFr ? 'Commandes moy.' : 'Avg Orders'}</p>
          <p className="text-lg font-bold">{data.avgOrders.toFixed(1)}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isFr ? 'Taux récurrence' : 'Repeat Rate'}</p>
          <p className="text-lg font-bold">{data.repeatRate}%</p>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-2">
        {data.segments.map((seg) => (
          <div key={seg.label} className={`flex items-center gap-3 p-3 rounded-xl border ${seg.color}`}>
            {seg.icon}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{seg.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {seg.count} {isFr ? 'clients' : 'customers'} · {isFr ? 'Moy.' : 'Avg.'} {formatCurrency(seg.avgSpend, currency)} · {seg.avgOrders.toFixed(1)} {isFr ? 'commandes' : 'orders'}
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">{data.totalCustomers > 0 ? ((seg.count / data.totalCustomers) * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
