import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3, CreditCard, Smartphone, Gift, Users } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(262 83% 58%)', 'hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(0 72% 51%)'];

export function RevenueAttribution() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const currency = currentOrg?.currency || 'XOF';

  const { data } = useQuery({
    queryKey: ['admin-revenue-attr', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      const [{ data: purchases }, { data: donations }] = await Promise.all([
        db.from('product_purchases')
          .select('amount, paystack_reference, affiliate_link_id')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed'),
        db.from('donations')
          .select('amount, paystack_reference, affiliate_link_id')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed'),
      ]);

      const all = [...(purchases || []), ...(donations || [])];

      // By gateway
      const byGateway: Record<string, number> = {};
      for (const tx of all) {
        const ref = tx.paystack_reference || '';
        let gw = 'paystack';
        if (ref.startsWith('free-')) gw = 'free';
        else if (ref.includes('STRIPE')) gw = 'stripe';
        byGateway[gw] = (byGateway[gw] || 0) + (tx.amount || 0);
      }

      // By source (affiliate vs organic)
      let affiliateRevenue = 0;
      let organicRevenue = 0;
      for (const tx of all) {
        if (tx.affiliate_link_id) affiliateRevenue += tx.amount || 0;
        else organicRevenue += tx.amount || 0;
      }

      // By type
      const purchaseRevenue = (purchases || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);
      const donationRevenue = (donations || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);

      const gatewayData = Object.entries(byGateway).map(([name, value]) => ({
        name: name === 'stripe' ? 'Stripe' : name === 'paystack' ? 'Paystack' : isFr ? 'Gratuit' : 'Free',
        value,
      })).filter(d => d.value > 0);

      const sourceData = [
        { name: isFr ? 'Ambassadeurs' : 'Ambassadors', value: affiliateRevenue },
        { name: isFr ? 'Organique' : 'Organic', value: organicRevenue },
      ].filter(d => d.value > 0);

      const typeData = [
        { name: isFr ? 'Ventes produits' : 'Product sales', value: purchaseRevenue },
        { name: isFr ? 'Dons' : 'Donations', value: donationRevenue },
      ].filter(d => d.value > 0);

      const total = all.reduce((s, t) => s + (t.amount || 0), 0);
      const affiliatePct = total > 0 ? ((affiliateRevenue / total) * 100).toFixed(1) : '0';

      return { gatewayData, sourceData, typeData, total, affiliatePct, affiliateRevenue, organicRevenue };
    },
    enabled: !!currentOrg?.id,
  });

  if (!data || data.total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">{isFr ? 'Attribution des revenus' : 'Revenue Attribution'}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* By Gateway */}
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
            {isFr ? 'Par passerelle' : 'By gateway'}
          </p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.gatewayData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                  {data.gatewayData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-1 justify-center">
            {data.gatewayData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Source */}
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
            {isFr ? 'Par source' : 'By source'}
          </p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.sourceData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                  {data.sourceData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-1 justify-center">
            {data.sourceData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: COLORS[(i + 2) % COLORS.length] }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border text-xs">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>{data.affiliatePct}% {isFr ? 'via ambassadeurs' : 'via ambassadors'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{formatCurrency(data.total, currency)} {isFr ? 'total' : 'total'}</span>
        </div>
      </div>
    </motion.div>
  );
}
