import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DollarSign, TrendingUp, Users, Building2, Percent, Target,
  ArrowUpRight, BarChart3, Shield, Zap, Globe, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { downloadCSV } from '@/lib/csvExport';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

export default function SuperadminInvestorSnapshot() {
  const { data: snapshot } = useQuery({
    queryKey: ['investor-snapshot'],
    queryFn: async () => {
      const [totalsRes, categoriesRes, countriesRes, metrics] = await Promise.all([
        db.rpc('get_platform_totals'),
        db.rpc('get_org_category_breakdown'),
        db.rpc('get_org_country_breakdown', { _limit: 5 }),
        db.from('platform_metrics_daily').select('*').order('metric_date', { ascending: true }).limit(90),
      ]);

      const t = (totalsRes.data || {}) as any;

      // Monthly GMV for growth calc via RPC
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

      const [last30Res, prev30Res] = await Promise.all([
        db.rpc('get_transaction_stats', { _from: thirtyDaysAgo.toISOString(), _to: now.toISOString() }),
        db.rpc('get_transaction_stats', { _from: sixtyDaysAgo.toISOString(), _to: thirtyDaysAgo.toISOString() }),
      ]);

      const gmvLast30 = (last30Res.data as any)?.gmv || 0;
      const gmvPrev30 = (prev30Res.data as any)?.gmv || 0;
      const momGrowth = gmvPrev30 > 0 ? ((gmvLast30 - gmvPrev30) / gmvPrev30 * 100).toFixed(0) : 'N/A';

      const takeRate = t.gmv > 0 ? ((t.platform_fees / t.gmv) * 100).toFixed(1) : '0';

      return {
        gmv: t.gmv || 0,
        platformFees: t.platform_fees || 0,
        affiliateCommissions: t.affiliate_commissions || 0,
        takeRate,
        momGrowth,
        totalOrgs: t.total_orgs || 0,
        activeOrgs: t.active_orgs || 0,
        totalUsers: t.total_users || 0,
        newUsers30d: 0, // simplified - use 7d from totals
        newOrgs30d: 0,
        txCount30d: (last30Res.data as any)?.total_count || 0,
        gmvLast30,
        metrics: metrics.data || [],
        categories: categoriesRes.data || [],
        countries: countriesRes.data || [],
      };
    },
  });

  const s = snapshot;

  const heroMetrics = [
    { label: 'GMV Total', value: fmt(s?.gmv || 0), sub: `+${s?.momGrowth || 0}% MoM`, icon: DollarSign, color: 'from-primary/20 to-primary/5 border-primary/30' },
    { label: 'Platform Revenue', value: fmt(s?.platformFees || 0), sub: `Take rate: ${s?.takeRate || 0}%`, icon: TrendingUp, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30' },
    { label: 'Total Users', value: fmtNum(s?.totalUsers || 0), sub: `+${s?.newUsers30d || 0} (30j)`, icon: Users, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30' },
    { label: 'Organizations', value: fmtNum(s?.totalOrgs || 0), sub: `${s?.activeOrgs || 0} active`, icon: Building2, color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30' },
  ];

  const unitEconomics = [
    { label: 'GMV (30j)', value: fmt(s?.gmvLast30 || 0) },
    { label: 'Revenue (30j)', value: fmt((s?.gmvLast30 || 0) * parseFloat(s?.takeRate || '0') / 100) },
    { label: 'Take Rate', value: `${s?.takeRate || 0}%` },
    { label: 'Transactions (30j)', value: fmtNum(s?.txCount30d || 0) },
    { label: 'Affilié payé', value: fmt(s?.affiliateCommissions || 0) },
    { label: 'Croissance MoM', value: `${s?.momGrowth || 'N/A'}%` },
  ];

  const exportSnapshot = () => {
    if (!s) return;
    const rows = [
      { metric: 'GMV Total', value: s.gmv },
      { metric: 'Platform Revenue', value: s.platformFees },
      { metric: 'Take Rate', value: s.takeRate + '%' },
      { metric: 'Total Users', value: s.totalUsers },
      { metric: 'Total Orgs', value: s.totalOrgs },
      { metric: 'Active Orgs', value: s.activeOrgs },
      { metric: 'MoM Growth', value: s.momGrowth + '%' },
      { metric: 'Affiliate Commissions', value: s.affiliateCommissions },
    ];
    downloadCSV(rows, `investor-snapshot-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Investor Snapshot
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vue consolidée pour investisseurs · {format(new Date(), 'dd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportSnapshot}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroMetrics.map(c => (
          <motion.div key={c.label} variants={fadeUp}
            className={cn('rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm', c.color)}>
            <c.icon className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
            <p className="text-xl font-bold mt-0.5">{c.value}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              {c.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Unit Economics */}
      <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Unit Economics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {unitEconomics.map(u => (
            <div key={u.label} className="text-center p-3 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-lg font-bold">{u.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{u.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* GMV Trend */}
      <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> GMV Trend (90 jours)
        </h2>
        {(s?.metrics?.length || 0) > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={s!.metrics}>
              <defs>
                <linearGradient id="invGmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="metric_date" tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#invGmv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée métrique disponible</p>
        )}
      </motion.div>

      {/* Segments */}
      <div className="grid lg:grid-cols-2 gap-3">
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Org Categories
          </h2>
          {((s?.categories as any[])?.length || 0) > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={120} height={120}>
                <Pie data={s!.categories as any[]} cx={60} cy={60} innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                  {(s!.categories as any[]).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-1 flex-1">
                {(s!.categories as any[]).map((c: any, i: number) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{c.name}</span>
                    </div>
                    <span className="font-semibold">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-4">—</p>}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Géographie
          </h2>
          <div className="space-y-2">
            {((s?.countries as any[]) || []).map((c: any, i: number) => (
              <div key={c.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium">{c.name}</span>
                <Badge variant="secondary" className="text-[10px]">{c.value} orgs</Badge>
              </div>
            ))}
            {(!s?.countries?.length) && <p className="text-xs text-muted-foreground text-center py-4">—</p>}
          </div>
        </motion.div>
      </div>

      {/* Legal disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center">
        Ce snapshot est généré automatiquement. Les données présentées sont en temps réel et ne constituent pas un audit financier.
        Siteviral™ est opéré par HACKTUALIZ Inc., Delaware, USA.
      </p>
    </motion.div>
  );
}
