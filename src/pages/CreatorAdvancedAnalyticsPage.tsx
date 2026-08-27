import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp, Users, AlertTriangle, Crown, BarChart3, Zap, ShoppingBag, Activity, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RouteContentSkeleton } from '@/components/layout/RouteFallback';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  useBuyerCohorts, useChurnMetrics, useTopCustomers, useRevenueBreakdown,
} from '@/hooks/useAdvancedAnalytics';

type Period = 7 | 30 | 90 | 180 | 365;

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
  'hsl(142 71% 45%)',
  'hsl(38 92% 50%)',
  'hsl(346 87% 60%)',
  'hsl(173 80% 40%)',
  'hsl(280 65% 60%)',
];

export default function CreatorAdvancedAnalyticsPage() {
  const navigate = useNavigate();
  const { currentOrg, userOrgs, canManage, setCurrentOrg, isLoadingOrgs } = useOrg();
  const { locale } = useI18n();
  const { fmt } = useDisplayCurrency();
  const isFr = locale === 'fr';
  const [period, setPeriod] = useState<Period>(90);

  const manageableOrgs = useMemo(
    () => userOrgs.filter((o) => canManage(o.id)),
    [userOrgs, canManage],
  );

  // Root hydration normally resolves this before render; keep a defensive
  // repair path for direct analytics loads without showing a chooser.
  useEffect(() => {
    if (!currentOrg && !isLoadingOrgs && manageableOrgs.length > 0) {
      setCurrentOrg(manageableOrgs[0]);
    }
  }, [currentOrg, isLoadingOrgs, manageableOrgs, setCurrentOrg]);

  const { data: cohorts, isLoading: loadingCohorts } = useBuyerCohorts(currentOrg?.id);
  const { data: churn, isLoading: loadingChurn } = useChurnMetrics(currentOrg?.id);
  const { data: topCustomers, isLoading: loadingTop } = useTopCustomers(currentOrg?.id, 10);
  const { data: revenue, isLoading: loadingRevenue } = useRevenueBreakdown(currentOrg?.id, period);

  const periodOptions: { v: Period; label: string }[] = [
    { v: 7, label: isFr ? '7 j' : '7 D' },
    { v: 30, label: isFr ? '30 j' : '30 D' },
    { v: 90, label: isFr ? '3 mois' : '3 M' },
    { v: 180, label: isFr ? '6 mois' : '6 M' },
    { v: 365, label: isFr ? '12 mois' : '12 M' },
  ];

  // Aggregate revenue chart data
  const revenueChartData = useMemo(() => {
    if (!revenue) return [];
    return revenue
      .filter(r => r.revenue > 0)
      .slice(0, 8)
      .map(r => ({
        name: r.product_title.length > 14 ? r.product_title.slice(0, 14) + '…' : r.product_title,
        revenue: Number(r.revenue),
        units: r.units_sold,
        buyers: r.unique_buyers,
      }));
  }, [revenue]);

  const totalRevenue = useMemo(
    () => (revenue || []).reduce((s, r) => s + Number(r.revenue || 0), 0),
    [revenue]
  );
  const totalUnits = useMemo(
    () => (revenue || []).reduce((s, r) => s + Number(r.units_sold || 0), 0),
    [revenue]
  );

  // Cohort line chart (M+1 / M+3 / M+6 retention over time)
  const cohortLineData = useMemo(() => {
    if (!cohorts) return [];
    return [...cohorts].reverse().map(c => {
      const pct = (n: number) => (c.buyers_count > 0 ? Math.round((n / c.buyers_count) * 100) : 0);
      return {
        month: new Date(c.cohort_month).toLocaleDateString(locale, { month: 'short' }),
        'M+1': pct(c.m1_retained),
        'M+3': pct(c.m3_retained),
        'M+6': pct(c.m6_retained),
      };
    });
  }, [cohorts, locale]);

  // Buyer status donut
  const buyerStatusData = useMemo(() => {
    if (!churn) return [];
    return [
      { name: isFr ? 'Actifs' : 'Active', value: churn.active_buyers, color: 'hsl(142 71% 45%)' },
      { name: isFr ? 'À risque' : 'At risk', value: churn.at_risk_buyers, color: 'hsl(38 92% 50%)' },
      { name: isFr ? 'Perdus' : 'Churned', value: churn.churned_buyers, color: 'hsl(346 87% 60%)' },
    ].filter(d => d.value > 0);
  }, [churn, isFr]);

  if (!currentOrg) {
    if (isLoadingOrgs) {
      return <RouteContentSkeleton />;
    }
    if (manageableOrgs.length > 0) {
      return <RouteContentSkeleton />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="font-semibold">{isFr ? 'Analytics nécessite un espace' : 'Analytics requires a workspace'}</p>
            <p className="text-sm text-muted-foreground">
              {isFr ? 'Créez un espace pour suivre vos ventes et cohortes.' : 'Create a workspace to track sales and cohorts.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>{isFr ? 'Retour' : 'Back'}</Button>
              <Button onClick={() => navigate('/create-org')}>{isFr ? 'Créer un espace' : 'Create workspace'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = currentOrg.currency || 'XOF';
  const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
    return String(Math.round(n));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <SEOHead
        title={isFr ? 'Analytics avancé créateur' : 'Advanced creator analytics'}
        description={isFr ? 'Cohortes, churn et top clients de votre organisation.' : 'Cohorts, churn and top customers for your organization.'}
      />

      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {isFr ? 'Analyses avancées' : 'Advanced analytics'}
              </h1>
              <p className="text-sm text-muted-foreground">{currentOrg.name}</p>
            </div>
          </div>

          {/* Period filter pills */}
          <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1">
            {periodOptions.map(opt => (
              <button
                key={opt.v}
                onClick={() => setPeriod(opt.v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  period === opt.v
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI gradient cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GradientKpiCard
            icon={<ShoppingBag className="w-5 h-5" />}
            label={isFr ? 'Revenus' : 'Revenue'}
            value={loadingRevenue ? '…' : fmt(totalRevenue, currency)}
            sub={`${totalUnits} ${isFr ? 'ventes' : 'sales'}`}
            gradient="from-primary/20 via-primary/5 to-transparent"
            accent="text-primary"
          />
          <GradientKpiCard
            icon={<Users className="w-5 h-5" />}
            label={isFr ? 'Acheteurs totaux' : 'Total buyers'}
            value={loadingChurn ? '…' : String(churn?.total_buyers ?? 0)}
            sub={isFr ? 'Tous temps' : 'All time'}
            gradient="from-blue-500/20 via-blue-500/5 to-transparent"
            accent="text-blue-500"
          />
          <GradientKpiCard
            icon={<Activity className="w-5 h-5" />}
            label={isFr ? 'Actifs (30 j)' : 'Active (30d)'}
            value={loadingChurn ? '…' : String(churn?.active_buyers ?? 0)}
            sub={churn ? `${Math.round(((churn.active_buyers || 0) / Math.max(churn.total_buyers || 1, 1)) * 100)}%` : ''}
            gradient="from-emerald-500/20 via-emerald-500/5 to-transparent"
            accent="text-emerald-500"
          />
          <GradientKpiCard
            icon={<TrendingDown className="w-5 h-5" />}
            label={isFr ? 'Taux de churn' : 'Churn rate'}
            value={loadingChurn ? '…' : `${(churn?.churn_rate ?? 0).toFixed(1)}%`}
            sub={`${churn?.at_risk_buyers ?? 0} ${isFr ? 'à risque' : 'at risk'}`}
            gradient="from-rose-500/20 via-rose-500/5 to-transparent"
            accent="text-rose-500"
          />
        </div>

        {/* Top row: Revenue bar chart + Buyer status donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">{isFr ? 'Top produits par revenus' : 'Top products by revenue'}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isFr ? `Sur ${period} jours` : `Over ${period} days`}
                </p>
              </div>
              <Badge variant="secondary" className="gap-1">
                
                {fmt(totalRevenue, currency)}
              </Badge>
            </CardHeader>
            <CardContent>
              {loadingRevenue ? (
                <Skeleton className="h-[280px] w-full" />
              ) : revenueChartData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  {isFr ? 'Aucune vente sur la période.' : 'No sales in period.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [fmt(v, currency), isFr ? 'Revenus' : 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isFr ? 'État des acheteurs' : 'Buyer status'}</CardTitle>
              <p className="text-xs text-muted-foreground">{isFr ? 'Répartition actifs vs perdus' : 'Active vs churned'}</p>
            </CardHeader>
            <CardContent>
              {loadingChurn ? (
                <Skeleton className="h-[260px] w-full" />
              ) : buyerStatusData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                  {isFr ? 'Pas encore d\'acheteurs.' : 'No buyers yet.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={buyerStatusData}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      paddingAngle={3} dataKey="value"
                    >
                      {buyerStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cohort retention line chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{isFr ? 'Rétention des cohortes' : 'Cohort retention'}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isFr ? 'Pourcentage d\'acheteurs qui rachètent à M+1, M+3, M+6' : 'Repurchase rate at M+1, M+3, M+6'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCohorts ? (
              <Skeleton className="h-[260px] w-full" />
            ) : cohortLineData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                {isFr ? 'Pas encore de données de cohorte.' : 'No cohort data yet.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cohortLineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  <Area type="monotone" dataKey="M+1" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
                  <Area type="monotone" dataKey="M+3" stroke="hsl(199 89% 48%)" strokeWidth={2} fill="url(#g2)" />
                  <Area type="monotone" dataKey="M+6" stroke="hsl(262 83% 58%)" strokeWidth={2} fill="url(#g3)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bottom row: Top customers + Revenue list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                {isFr ? 'Top 10 clients (LTV)' : 'Top 10 customers (LTV)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTop ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !topCustomers || topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{isFr ? 'Aucun client.' : 'No customers.'}</p>
              ) : (
                <ul className="space-y-1">
                  {topCustomers.map((c, idx) => {
                    const max = Number(topCustomers[0]?.total_spent || 1);
                    const pct = (Number(c.total_spent) / max) * 100;
                    const initials = (c.buyer_name || c.buyer_email || 'U').slice(0, 2).toUpperCase();
                    return (
                      <li key={c.user_id || idx} className="relative rounded-lg p-3 hover:bg-muted/50 transition-colors group">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent transition-all"
                          style={{ width: `${pct}%` }}
                          aria-hidden
                        />
                        <div className="relative flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{c.buyer_name || c.buyer_email || `Client #${idx + 1}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.purchase_count} {isFr ? 'achats' : 'purchases'}
                            </p>
                          </div>
                          <p className="font-semibold text-sm tabular-nums">{fmt(Number(c.total_spent), currency)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isFr ? 'Détail produits' : 'Product details'}</CardTitle>
              <p className="text-xs text-muted-foreground">{isFr ? `Sur ${period} jours` : `Over ${period} days`}</p>
            </CardHeader>
            <CardContent>
              {loadingRevenue ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !revenue || revenue.filter(r => r.revenue > 0).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{isFr ? 'Aucune vente.' : 'No sales.'}</p>
              ) : (
                <ul className="divide-y">
                  {revenue.filter(r => r.revenue > 0).slice(0, 8).map((r, i) => (
                    <li key={r.product_id} className="py-3 flex items-center gap-3">
                      <div
                        className="w-1.5 h-10 rounded-full shrink-0"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{r.product_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.units_sold} {isFr ? 'ventes' : 'sales'} · {r.unique_buyers} {isFr ? 'acheteurs' : 'buyers'}
                        </p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums">{fmt(Number(r.revenue), currency)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GradientKpiCard({
  icon, label, value, sub, gradient, accent,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; gradient: string; accent: string }) {
  return (
    <Card className="relative overflow-hidden border-border/60">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} aria-hidden />
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center ${accent} shadow-xs`}>
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-medium">{label}</p>
        <p className="text-2xl font-bold tracking-tight mt-1">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
