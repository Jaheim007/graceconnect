import { useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid,
} from 'recharts';
import { TrendingUp, DollarSign, Users, ShoppingBag, Heart, Activity, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadCSV } from '@/lib/csvExport';
import { subDays, format, differenceInDays } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

const PERIODS = [
  { key: '7d', label: '7j', days: 7 },
  { key: '30d', label: '30j', days: 30 },
  { key: '90d', label: '90j', days: 90 },
] as const;

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(262 83% 58%)'];

function GrowthBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous > 0 ? ((current - previous) / previous * 100) : current > 0 ? 100 : 0;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function AffiliatePerformanceTable({ orgId, currency }: { orgId?: string; currency: string }) {
  const { t } = useI18n();
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
      const { data: profiles } = await db.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      const { data: sales } = await db.from('affiliate_sales').select('affiliate_link_id, commission_amount, status').eq('organization_id', orgId);
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
        <h2 className="font-semibold text-sm">{t('analytics.affiliate_performance')}</h2>
        <Badge variant="outline" className="text-[10px]">{affiliates.length} {affiliates.length > 1 ? t('analytics.affiliates_count_plural') : t('analytics.affiliates_count')}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 font-medium">{t('analytics.affiliate_col')}</th>
              <th className="text-right py-2 font-medium">{t('analytics.clicks')}</th>
              <th className="text-right py-2 font-medium">{t('analytics.conv')}</th>
              <th className="text-right py-2 font-medium">{t('analytics.rate')}</th>
              <th className="text-right py-2 font-medium">{t('analytics.pending')}</th>
              <th className="text-right py-2 font-medium">{t('analytics.available')}</th>
              <th className="text-right py-2 font-medium">{t('analytics.paid')}</th>
              <th className="text-right py-2 font-medium">{t('analytics.total')}</th>
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
                      <p className="font-medium truncate max-w-[120px]">{a.profile?.display_name || t('analytics.user')}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{a.code}</p>
                    </div>
                  </div>
                </td>
                <td className="text-right py-2.5 font-medium">{a.clicks || 0}</td>
                <td className="text-right py-2.5 font-medium">{a.conversions || 0}</td>
                <td className="text-right py-2.5">
                  <Badge variant="outline" className={`text-[9px] border-0 ${parseFloat(a.conversionRate) > 5 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    {a.conversionRate}%
                  </Badge>
                </td>
                <td className="text-right py-2.5 text-muted-foreground">{fmt(a.sales.pending, currency)}</td>
                <td className="text-right py-2.5 text-emerald-500 font-medium">{fmt(a.sales.payable, currency)}</td>
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

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminAnalyticsPage() {
  const { currentOrg } = useOrg();
  const { t, locale } = useI18n();
  const orgId = currentOrg?.id;
  const dateFnsLocale = locale === 'fr' ? fr : enUS;
  const [period, setPeriod] = useState<string>('30d');
  const days = PERIODS.find(p => p.key === period)?.days || 30;

  // Load raw analytics data for selected period
  const { data: rawStats } = useQuery({
    queryKey: ['org-analytics-raw', orgId, days],
    queryFn: async () => {
      if (!orgId) return null;
      const cutoff = subDays(new Date(), days).toISOString();
      const prevCutoff = subDays(new Date(), days * 2).toISOString();

      const [donations, purchases, members, affiliateSales, prevDonations, prevPurchases, prevMembers] = await Promise.all([
        db.from('donations').select('amount, currency, created_at').eq('organization_id', orgId).eq('status', 'completed').gte('created_at', cutoff),
        db.from('product_purchases').select('amount, currency, created_at').eq('organization_id', orgId).eq('status', 'completed').gte('created_at', cutoff),
        db.from('organization_members').select('joined_at').eq('organization_id', orgId).gte('joined_at', cutoff),
        db.from('affiliate_sales').select('commission_amount, created_at').eq('organization_id', orgId).gte('created_at', cutoff),
        // Previous period for comparison
        db.from('donations').select('amount').eq('organization_id', orgId).eq('status', 'completed').gte('created_at', prevCutoff).lt('created_at', cutoff),
        db.from('product_purchases').select('amount').eq('organization_id', orgId).eq('status', 'completed').gte('created_at', prevCutoff).lt('created_at', cutoff),
        db.from('organization_members').select('joined_at').eq('organization_id', orgId).gte('joined_at', prevCutoff).lt('joined_at', cutoff),
      ]);

      const totalDonations = (donations.data || []).reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const totalPurchases = (purchases.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const totalRevenue = totalDonations + totalPurchases;
      const totalTransactions = (donations.data?.length || 0) + (purchases.data?.length || 0);
      const newMembers = members.data?.length || 0;
      const totalAffiliateCommissions = (affiliateSales.data || []).reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Previous period totals
      const prevRevenue = (prevDonations.data || []).reduce((s: number, d: any) => s + (d.amount || 0), 0)
        + (prevPurchases.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const prevTx = (prevDonations.data?.length || 0) + (prevPurchases.data?.length || 0);
      const prevMem = prevMembers.data?.length || 0;

      // Build daily chart data
      const dailyMap: Record<string, { revenue: number; donations: number; purchases: number; tx: number; members: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap[d] = { revenue: 0, donations: 0, purchases: 0, tx: 0, members: 0 };
      }
      (donations.data || []).forEach((d: any) => {
        const day = d.created_at?.slice(0, 10);
        if (dailyMap[day]) { dailyMap[day].revenue += d.amount || 0; dailyMap[day].donations += d.amount || 0; dailyMap[day].tx++; }
      });
      (purchases.data || []).forEach((p: any) => {
        const day = p.created_at?.slice(0, 10);
        if (dailyMap[day]) { dailyMap[day].revenue += p.amount || 0; dailyMap[day].purchases += p.amount || 0; dailyMap[day].tx++; }
      });
      (members.data || []).forEach((m: any) => {
        const day = m.joined_at?.slice(0, 10);
        if (dailyMap[day]) { dailyMap[day].members++; }
      });

      const chartData = Object.entries(dailyMap).map(([date, v]) => ({
        date: format(new Date(date), days <= 7 ? 'EEE' : 'dd MMM', { locale: dateFnsLocale }),
        revenue: v.revenue,
        donations: v.donations,
        purchases: v.purchases,
        transactions: v.tx,
        members: v.members,
      }));

      // Revenue breakdown for pie chart
      const revenueBreakdown = [
        { name: t('analytics.donations_received'), value: totalDonations },
        { name: t('analytics.product_sales'), value: totalPurchases },
      ].filter(e => e.value > 0);

      return {
        totalRevenue, totalDonations, totalPurchases, totalTransactions,
        newMembers, totalAffiliateCommissions, avgBasket, chartData,
        revenueBreakdown,
        prev: { revenue: prevRevenue, tx: prevTx, members: prevMem },
      };
    },
    enabled: !!orgId,
  });

  // Top products
  const { data: topProducts = [] } = useQuery({
    queryKey: ['org-top-products', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('digital_products')
        .select('id, title, sales_count, price, currency')
        .eq('organization_id', orgId).eq('is_published', true)
        .order('sales_count', { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Conversion funnel
  const { data: funnelData } = useQuery({
    queryKey: ['org-conversion-funnel', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [visitors, carts, purchasesQ] = await Promise.all([
        db.from('org_daily_metrics').select('page_views').eq('organization_id', orgId),
        db.from('abandoned_carts').select('id, converted').eq('organization_id', orgId),
        db.from('product_purchases').select('id').eq('organization_id', orgId).eq('status', 'completed'),
      ]);
      const totalViews = (visitors.data || []).reduce((s: number, m: any) => s + (m.page_views || 0), 0);
      const totalCarts = carts.data?.length || 0;
      const convertedCarts = (carts.data || []).filter((c: any) => c.converted).length;
      const totalPurchases = purchasesQ.data?.length || 0;
      const cartConversion = totalCarts > 0 ? ((convertedCarts / totalCarts) * 100).toFixed(1) : '0';
      return { totalViews, totalCarts, convertedCarts, totalPurchases, cartConversion };
    },
    enabled: !!orgId,
  });

  // Subscriber count
  const { data: subscriberCount = 0 } = useQuery({
    queryKey: ['org-subscriber-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { data } = await db.from('user_subscriptions').select('id').eq('organization_id', orgId).eq('status', 'active');
      return data?.length || 0;
    },
    enabled: !!orgId,
  });

  const stats = rawStats || { totalRevenue: 0, totalDonations: 0, totalPurchases: 0, totalTransactions: 0, newMembers: 0, totalAffiliateCommissions: 0, avgBasket: 0, chartData: [], revenueBreakdown: [], prev: { revenue: 0, tx: 0, members: 0 } };
  const currency = currentOrg?.currency || 'XOF';

  const kpis = [
    { label: t('analytics.total_revenue'), value: fmt(stats.totalRevenue, currency), icon: DollarSign, color: 'text-emerald-500', growth: <GrowthBadge current={stats.totalRevenue} previous={stats.prev.revenue} /> },
    { label: t('analytics.transactions'), value: stats.totalTransactions, icon: Activity, color: 'text-blue-500', growth: <GrowthBadge current={stats.totalTransactions} previous={stats.prev.tx} /> },
    { label: t('analytics.donations_received'), value: fmt(stats.totalDonations, currency), icon: Heart, color: 'text-pink-500', growth: null },
    { label: t('analytics.product_sales'), value: fmt(stats.totalPurchases, currency), icon: ShoppingBag, color: 'text-amber-500', growth: null },
    { label: t('analytics.new_members'), value: stats.newMembers, icon: Users, color: 'text-violet-500', growth: <GrowthBadge current={stats.newMembers} previous={stats.prev.members} /> },
    { label: t('analytics.avg_basket'), value: fmt(stats.avgBasket, currency), icon: TrendingUp, color: 'text-cyan-500', growth: null },
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
    const all = [...(d1 || []).map((r: any) => ({ ...r, type: 'donation' })), ...(d2 || []).map((r: any) => ({ ...r, type: 'purchase' }))];
    downloadCSV(all, `transactions-${currentOrg?.slug || 'org'}`);
  };
  const exportAffiliates = async () => {
    if (!orgId) return;
    const { data } = await db.from('affiliate_sales').select('affiliate_user_id, commission_amount, gross_amount, status, created_at').eq('organization_id', orgId);
    if (data) downloadCSV(data, `affilies-${currentOrg?.slug || 'org'}`);
  };

  return (
    <AdminPageShell title={t('analytics.title')} subtitle={t('analytics.subtitle')} backRoute="/admin">
      <div className="space-y-6">
        {/* Period selector + exports */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-8">
              {PERIODS.map(p => (
                <TabsTrigger key={p.key} value={p.key} className="text-xs px-3 h-7">
                  <Calendar className="h-3 w-3 mr-1" />{p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={exportMembers}>
              <Download className="h-3.5 w-3.5" /> {t('analytics.export_members')}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={exportTransactions}>
              <Download className="h-3.5 w-3.5" /> {t('analytics.export_transactions')}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={exportAffiliates}>
              <Download className="h-3.5 w-3.5" /> {t('analytics.export_affiliates')}
            </Button>
          </div>
        </div>

        {/* KPI Cards with growth */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <motion.div key={kpi.label} variants={fadeUp} initial="hidden" animate="visible"
              className="bg-card border border-border rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-xl font-bold">{kpi.value}</p>
                {kpi.growth}
              </div>
            </motion.div>
          ))}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Abonnés actifs' : 'Active subscribers'}</p>
            </div>
            <p className="text-xl font-bold">{subscriberCount}</p>
          </motion.div>
        </div>

        {/* Revenue chart with donations vs purchases breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {stats.chartData.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
              <h2 className="font-semibold text-sm mb-4">{t('analytics.daily_revenue')}</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorDon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPurch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(v: number) => fmt(v, currency)} labelStyle={{ fontSize: 11 }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="donations" name={t('analytics.donations_received')} stroke="hsl(var(--primary))" fill="url(#colorDon)" strokeWidth={2} />
                  <Area type="monotone" dataKey="purchases" name={t('analytics.product_sales')} stroke="hsl(var(--accent))" fill="url(#colorPurch)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue pie chart */}
          {stats.revenueBreakdown.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-4">{locale === 'fr' ? 'Répartition revenus' : 'Revenue breakdown'}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.revenueBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {stats.revenueBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v, currency)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        {funnelData && (funnelData.totalViews > 0 || funnelData.totalCarts > 0) && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> {locale === 'fr' ? 'Entonnoir de conversion' : 'Conversion Funnel'}
            </h2>
            <div className="space-y-3">
              {[
                { label: locale === 'fr' ? 'Vues de page' : 'Page views', value: funnelData.totalViews, pct: 100 },
                { label: locale === 'fr' ? 'Paniers ouverts' : 'Carts opened', value: funnelData.totalCarts, pct: funnelData.totalViews > 0 ? (funnelData.totalCarts / funnelData.totalViews * 100) : 0 },
                { label: locale === 'fr' ? 'Achats complétés' : 'Purchases completed', value: funnelData.totalPurchases, pct: funnelData.totalCarts > 0 ? (funnelData.totalPurchases / funnelData.totalCarts * 100) : 0 },
              ].map((step, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{step.label}</span>
                    <span className="text-muted-foreground">{step.value.toLocaleString()} ({step.pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, step.pct)}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">
                {locale === 'fr' ? 'Taux de conversion panier' : 'Cart conversion rate'}: <span className="font-bold text-primary">{funnelData.cartConversion}%</span>
              </p>
            </div>
          </div>
        )}

        {/* Member growth bar chart */}
        {stats.chartData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-4">{t('analytics.member_growth')}</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip labelStyle={{ fontSize: 11 }} />
                <Bar dataKey="members" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Products + Affiliate Commissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topProducts.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-3">{t('analytics.top_products')}</h2>
              <div className="space-y-2">
                {topProducts.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{fmt(p.price || 0, p.currency)}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary">{p.sales_count} {t('analytics.sales')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-2">{t('analytics.affiliate_commissions')}</h2>
            <p className="text-2xl font-bold text-primary">{fmt(stats.totalAffiliateCommissions, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('analytics.affiliate_commissions_desc')}</p>
          </div>
        </div>

        <AffiliatePerformanceTable orgId={orgId} currency={currency} />
      </div>
    </AdminPageShell>
  );
}
