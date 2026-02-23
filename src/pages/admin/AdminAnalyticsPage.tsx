import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Users, ShoppingBag, Heart, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadCSV } from '@/lib/csvExport';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

function AffiliatePerformanceTable({ orgId, currency }: { orgId?: string; currency: string }) {
  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ['admin-affiliate-perf', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: links } = await db.from('affiliate_links')
        .select('id, code, user_id, clicks, conversions, total_earned, is_active, created_at')
        .eq('organization_id', orgId)
        .order('total_earned', { ascending: false });
      if (!links?.length) return [];
      
      const userIds = [...new Set(links.map((l: any) => l.user_id))];
      const { data: profiles } = await db.from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

      const { data: sales } = await db.from('affiliate_sales')
        .select('affiliate_link_id, commission_amount, status')
        .eq('organization_id', orgId);
      const salesByLink: Record<string, { pending: number; payable: number; paid: number }> = {};
      (sales || []).forEach((s: any) => {
        if (!salesByLink[s.affiliate_link_id]) salesByLink[s.affiliate_link_id] = { pending: 0, payable: 0, paid: 0 };
        if (s.status === 'pending') salesByLink[s.affiliate_link_id].pending += s.commission_amount;
        else if (s.status === 'payable') salesByLink[s.affiliate_link_id].payable += s.commission_amount;
        else if (s.status === 'paid') salesByLink[s.affiliate_link_id].paid += s.commission_amount;
      });

      return links.map((l: any) => ({
        ...l,
        profile: profileMap[l.user_id],
        sales: salesByLink[l.id] || { pending: 0, payable: 0, paid: 0 },
        conversionRate: l.clicks > 0 ? ((l.conversions || 0) / l.clicks * 100).toFixed(1) : '0',
      }));
    },
    enabled: !!orgId,
  });

  if (isLoading) return <SkeletonRow count={3} />;
  if (!affiliates.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Performance des affiliés</h2>
        <Badge variant="outline" className="text-[10px]">{affiliates.length} affilié{affiliates.length > 1 ? 's' : ''}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 font-medium">Affilié</th>
              <th className="text-right py-2 font-medium">Clics</th>
              <th className="text-right py-2 font-medium">Conv.</th>
              <th className="text-right py-2 font-medium">Taux</th>
              <th className="text-right py-2 font-medium">En attente</th>
              <th className="text-right py-2 font-medium">Disponible</th>
              <th className="text-right py-2 font-medium">Payé</th>
              <th className="text-right py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((a: any) => (
              <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {a.profile?.avatar_url ? <img src={a.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold">{(a.profile?.display_name || '?')[0]}</span>}
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[120px]">{a.profile?.display_name || 'Utilisateur'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{a.code}</p>
                    </div>
                  </div>
                </td>
                <td className="text-right py-2.5 font-medium">{a.clicks || 0}</td>
                <td className="text-right py-2.5 font-medium">{a.conversions || 0}</td>
                <td className="text-right py-2.5">
                  <Badge variant="outline" className={`text-[9px] border-0 ${parseFloat(a.conversionRate) > 5 ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    {a.conversionRate}%
                  </Badge>
                </td>
                <td className="text-right py-2.5 text-muted-foreground">{fmt(a.sales.pending, currency)}</td>
                <td className="text-right py-2.5 text-green-500 font-medium">{fmt(a.sales.payable, currency)}</td>
                <td className="text-right py-2.5 text-muted-foreground">{fmt(a.sales.paid, currency)}</td>
                <td className="text-right py-2.5 font-bold text-primary">{fmt(a.total_earned || 0, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminAnalyticsPage() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  // Load daily metrics
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['org-daily-metrics', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().slice(0, 10);
      const { data } = await db
        .from('org_daily_metrics')
        .select('*')
        .eq('organization_id', orgId)
        .gte('metric_date', thirtyDaysAgo)
        .order('metric_date', { ascending: true });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fallback: compute from raw data if no aggregated metrics yet
  const { data: rawStats } = useQuery({
    queryKey: ['org-analytics-raw', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [donations, purchases, members, affiliateSales] = await Promise.all([
        db.from('donations').select('amount, currency, created_at')
          .eq('organization_id', orgId).eq('status', 'completed')
          .gte('created_at', thirtyDaysAgo),
        db.from('product_purchases').select('amount, currency, created_at')
          .eq('organization_id', orgId).eq('status', 'completed')
          .gte('created_at', thirtyDaysAgo),
        db.from('organization_members').select('joined_at')
          .eq('organization_id', orgId)
          .gte('joined_at', thirtyDaysAgo),
        db.from('affiliate_sales').select('commission_amount, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', thirtyDaysAgo),
      ]);

      const totalDonations = (donations.data || []).reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const totalPurchases = (purchases.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const totalRevenue = totalDonations + totalPurchases;
      const totalTransactions = (donations.data?.length || 0) + (purchases.data?.length || 0);
      const newMembers = members.data?.length || 0;
      const totalAffiliateCommissions = (affiliateSales.data || []).reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Build daily chart data
      const dailyMap: Record<string, { revenue: number; tx: number; members: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap[d] = { revenue: 0, tx: 0, members: 0 };
      }
      (donations.data || []).forEach((d: any) => {
        const day = d.created_at?.slice(0, 10);
        if (dailyMap[day]) { dailyMap[day].revenue += d.amount || 0; dailyMap[day].tx++; }
      });
      (purchases.data || []).forEach((p: any) => {
        const day = p.created_at?.slice(0, 10);
        if (dailyMap[day]) { dailyMap[day].revenue += p.amount || 0; dailyMap[day].tx++; }
      });
      (members.data || []).forEach((m: any) => {
        const day = m.joined_at?.slice(0, 10);
        if (dailyMap[day]) { dailyMap[day].members++; }
      });

      const chartData = Object.entries(dailyMap).map(([date, v]) => ({
        date: format(new Date(date), 'dd MMM', { locale: fr }),
        revenue: v.revenue,
        transactions: v.tx,
        members: v.members,
      }));

      return { totalRevenue, totalDonations, totalPurchases, totalTransactions, newMembers, totalAffiliateCommissions, avgBasket, chartData };
    },
    enabled: !!orgId,
  });

  // Get top products
  const { data: topProducts = [] } = useQuery({
    queryKey: ['org-top-products', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('digital_products')
        .select('id, title, sales_count, price, currency')
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!orgId,
  });

  const stats = rawStats || { totalRevenue: 0, totalDonations: 0, totalPurchases: 0, totalTransactions: 0, newMembers: 0, totalAffiliateCommissions: 0, avgBasket: 0, chartData: [] };
  const currency = currentOrg?.currency || 'XOF';

  const kpis = [
    { label: 'Revenu total (30j)', value: fmt(stats.totalRevenue, currency), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Transactions', value: stats.totalTransactions, icon: Activity, color: 'text-blue-500' },
    { label: 'Dons reçus', value: fmt(stats.totalDonations, currency), icon: Heart, color: 'text-pink-500' },
    { label: 'Ventes produits', value: fmt(stats.totalPurchases, currency), icon: ShoppingBag, color: 'text-amber-500' },
    { label: 'Nouveaux membres', value: stats.newMembers, icon: Users, color: 'text-violet-500' },
    { label: 'Panier moyen', value: fmt(stats.avgBasket, currency), icon: TrendingUp, color: 'text-cyan-500' },
  ];

  const exportMembers = async () => {
    if (!orgId) return;
    const { data } = await db.from('organization_members').select('user_id, role, joined_at').eq('organization_id', orgId);
    if (data) downloadCSV(data, `membres-${currentOrg?.slug || 'org'}`);
  };

  const exportTransactions = async () => {
    if (!orgId) return;
    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      db.from('donations').select('id, amount, currency, donor_name, donor_email, status, created_at').eq('organization_id', orgId),
      db.from('product_purchases').select('id, amount, currency, status, created_at').eq('organization_id', orgId),
    ]);
    const all = [
      ...(d1 || []).map((r: any) => ({ ...r, type: 'donation' })),
      ...(d2 || []).map((r: any) => ({ ...r, type: 'purchase' })),
    ];
    downloadCSV(all, `transactions-${currentOrg?.slug || 'org'}`);
  };

  const exportAffiliates = async () => {
    if (!orgId) return;
    const { data } = await db.from('affiliate_sales').select('affiliate_user_id, commission_amount, gross_amount, status, created_at').eq('organization_id', orgId);
    if (data) downloadCSV(data, `affilies-${currentOrg?.slug || 'org'}`);
  };

  return (
    <AdminPageShell title="Analytiques avancés" subtitle="Données des 30 derniers jours" backRoute="/admin">
      <div className="space-y-6">
        {/* Export buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportMembers}>
            <Download className="h-3.5 w-3.5" /> Membres CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportTransactions}>
            <Download className="h-3.5 w-3.5" /> Transactions CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportAffiliates}>
            <Download className="h-3.5 w-3.5" /> Affiliés CSV
          </Button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {kpis.map((kpi) => (
            <motion.div key={kpi.label} variants={fadeUp} initial="hidden" animate="visible"
              className="bg-card border border-border rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart */}
        {stats.chartData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-4">Revenu quotidien</h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v: number) => fmt(v, currency)} labelStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Members Growth Chart */}
        {stats.chartData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-4">Croissance des membres</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip labelStyle={{ fontSize: 11 }} />
                <Bar dataKey="members" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">Top Produits</h2>
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.price?.toLocaleString('fr-FR')} {p.currency}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{p.sales_count} ventes</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Affiliate commissions summary */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-2">Commissions affiliés (30j)</h2>
          <p className="text-2xl font-bold text-primary">{fmt(stats.totalAffiliateCommissions, currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total des commissions générées par vos affiliés</p>
        </div>

        {/* Detailed Affiliate Performance Table */}
        <AffiliatePerformanceTable orgId={orgId} currency={currency} />
      </div>
    </AdminPageShell>
  );
}
