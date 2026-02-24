import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  RadialBarChart, RadialBar
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, BarChart3, Activity,
  Shield, AlertTriangle, CreditCard, Building2, UserPlus,
  Percent, Eye, Globe, Clock, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, FileText, ShoppingBag, Heart,
  Zap, Target, CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, subDays, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

// Circular gauge component
function CircularGauge({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: 'hsl(var(--muted))' }];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-20 h-20 relative">
        <RadialBarChart width={80} height={80} cx={40} cy={40} innerRadius={28} outerRadius={38} barSize={8} data={[data[0]]} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'hsl(var(--muted))' }} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{Math.round(pct)}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

// Widget header
function WidgetHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
    </div>
  );
}

// Panel wrapper
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={cn('bg-card border border-border rounded-2xl p-4 shadow-card', className)}>
      {children}
    </motion.div>
  );
}

export default function SuperadminFullDashboard() {
  // ─── Main stats query ───
  const { data: stats } = useQuery({
    queryKey: ['sa-full-stats-v2'],
    queryFn: async () => {
      const [orgs, members, donations, purchases, payouts, kyc, reports, profiles, affiliateSales, products, campaigns, media, events] = await Promise.all([
        db.from('organizations').select('id, name, slug, plan_type, kyc_status, is_active, is_suspended, category, country, created_at'),
        db.from('organization_members').select('id, role, joined_at', { count: 'exact' }),
        db.from('donations').select('amount, status, currency, created_at, organization_id, platform_fee, affiliate_commission, organization_amount, donor_name'),
        db.from('product_purchases').select('amount, status, currency, created_at, organization_id, platform_fee, affiliate_commission, organization_amount'),
        db.from('payout_requests').select('amount, status, requested_at'),
        db.from('kyc_submissions').select('status, organization_id, submitted_at'),
        db.from('content_reports').select('status, created_at, content_type, reason'),
        db.from('profiles').select('id, created_at, display_name, avatar_url', { count: 'exact' }),
        db.from('affiliate_sales').select('commission_amount, status, created_at'),
        db.from('digital_products').select('id, is_published, sales_count', { count: 'exact' }),
        db.from('donation_campaigns').select('id, is_active, current_amount, goal_amount', { count: 'exact' }),
        db.from('media_content').select('id, media_type, view_count, like_count', { count: 'exact' }),
        db.from('events').select('id, title, event_date, is_published', { count: 'exact' }),
      ]);

      const allOrgs = orgs.data || [];
      const allDonations = donations.data || [];
      const allPurchases = purchases.data || [];
      const completedDonations = allDonations.filter((d: any) => d.status === 'completed');
      const completedPurchases = allPurchases.filter((p: any) => p.status === 'completed');
      const allPayouts = payouts.data || [];
      const allKyc = kyc.data || [];
      const allReports = reports.data || [];
      const allAffSales = affiliateSales.data || [];
      const allProducts = products.data || [];
      const allCampaigns = campaigns.data || [];
      const allMedia = media.data || [];
      const allEvents = events.data || [];
      const allProfiles = profiles.data || [];

      const donationGMV = completedDonations.reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const purchaseGMV = completedPurchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const platformFees = [...completedDonations, ...completedPurchases].reduce((s: number, t: any) => s + (t.platform_fee || 0), 0);
      const affiliateCommissions = allAffSales.reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const orgReceived = [...completedDonations, ...completedPurchases].reduce((s: number, t: any) => s + (t.organization_amount || 0), 0);

      // Org categories
      const catMap: Record<string, number> = {};
      allOrgs.forEach((o: any) => { catMap[o.category || 'other'] = (catMap[o.category || 'other'] || 0) + 1; });
      const categories = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // Org by country
      const countryMap: Record<string, number> = {};
      allOrgs.forEach((o: any) => { countryMap[o.country || 'Unknown'] = (countryMap[o.country || 'Unknown'] || 0) + 1; });
      const countries = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

      // Revenue by org (top 8)
      const orgRevMap: Record<string, { name: string; revenue: number; donations: number; sales: number }> = {};
      completedDonations.forEach((t: any) => {
        if (!orgRevMap[t.organization_id]) {
          const org = allOrgs.find((o: any) => o.id === t.organization_id);
          orgRevMap[t.organization_id] = { name: org?.name || 'Unknown', revenue: 0, donations: 0, sales: 0 };
        }
        orgRevMap[t.organization_id].revenue += t.amount || 0;
        orgRevMap[t.organization_id].donations += t.amount || 0;
      });
      completedPurchases.forEach((t: any) => {
        if (!orgRevMap[t.organization_id]) {
          const org = allOrgs.find((o: any) => o.id === t.organization_id);
          orgRevMap[t.organization_id] = { name: org?.name || 'Unknown', revenue: 0, donations: 0, sales: 0 };
        }
        orgRevMap[t.organization_id].revenue += t.amount || 0;
        orgRevMap[t.organization_id].sales += t.amount || 0;
      });
      const topOrgs = Object.values(orgRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

      // Roles breakdown
      const roleMap: Record<string, number> = {};
      (members.data || []).forEach((m: any) => { roleMap[m.role || 'member'] = (roleMap[m.role || 'member'] || 0) + 1; });

      // Recent activity (last 10 donations)
      const recentDonations = allDonations.slice(0, 10);

      // Plan distribution
      const planMap: Record<string, number> = {};
      allOrgs.forEach((o: any) => { planMap[o.plan_type || 'free'] = (planMap[o.plan_type || 'free'] || 0) + 1; });
      const plans = Object.entries(planMap).map(([name, value]) => ({ name, value }));

      // Last 7 days growth
      const sevenDaysAgo = subDays(new Date(), 7);
      const newOrgs7d = allOrgs.filter((o: any) => isAfter(new Date(o.created_at), sevenDaysAgo)).length;
      const newUsers7d = allProfiles.filter((p: any) => isAfter(new Date(p.created_at), sevenDaysAgo)).length;

      // Total views & likes
      const totalViews = allMedia.reduce((s: number, m: any) => s + (m.view_count || 0), 0);
      const totalLikes = allMedia.reduce((s: number, m: any) => s + (m.like_count || 0), 0);

      // Campaign progress
      const activeCampaigns = allCampaigns.filter((c: any) => c.is_active);
      const totalGoal = activeCampaigns.reduce((s: number, c: any) => s + (c.goal_amount || 0), 0);
      const totalRaised = activeCampaigns.reduce((s: number, c: any) => s + (c.current_amount || 0), 0);

      // Recent users
      const recentUsers = allProfiles.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      // Upcoming events
      const upcomingEvents = allEvents
        .filter((e: any) => e.event_date && isAfter(new Date(e.event_date), new Date()))
        .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .slice(0, 5);

      return {
        totalOrgs: allOrgs.length,
        activeOrgs: allOrgs.filter((o: any) => o.is_active && !o.is_suspended).length,
        suspendedOrgs: allOrgs.filter((o: any) => o.is_suspended).length,
        totalMembers: members.count || 0,
        totalUsers: profiles.count || 0,
        gmv: donationGMV + purchaseGMV,
        donationGMV,
        purchaseGMV,
        platformFees,
        affiliateCommissions,
        orgReceived,
        totalTransactions: completedDonations.length + completedPurchases.length,
        allTransactions: allDonations.length + allPurchases.length,
        pendingKYC: allKyc.filter((k: any) => k.status === 'pending').length,
        approvedKYC: allKyc.filter((k: any) => k.status === 'approved').length,
        pendingPayouts: allPayouts.filter((p: any) => p.status === 'requested').length,
        pendingPayoutAmount: allPayouts.filter((p: any) => p.status === 'requested').reduce((s: number, p: any) => s + (p.amount || 0), 0),
        completedPayouts: allPayouts.filter((p: any) => p.status === 'completed').length,
        pendingReports: allReports.filter((r: any) => r.status === 'pending').length,
        takeRate: (donationGMV + purchaseGMV) > 0 ? ((platformFees / (donationGMV + purchaseGMV)) * 100).toFixed(1) : '0',
        conversionRate: allDonations.length > 0 ? ((completedDonations.length / allDonations.length) * 100).toFixed(0) : '0',
        categories,
        countries,
        topOrgs,
        roleMap,
        plans,
        recentDonations,
        newOrgs7d,
        newUsers7d,
        totalProducts: products.count || 0,
        publishedProducts: allProducts.filter((p: any) => p.is_published).length,
        totalCampaigns: campaigns.count || 0,
        activeCampaigns: activeCampaigns.length,
        totalMedia: media.count || 0,
        totalViews,
        totalLikes,
        totalEvents: events.count || 0,
        upcomingEvents,
        campaignGoal: totalGoal,
        campaignRaised: totalRaised,
        recentUsers,
        recentReports: allReports.slice(0, 5),
      };
    },
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['sa-platform-metrics-dash-v2'],
    queryFn: async () => {
      const { data } = await db.from('platform_metrics_daily').select('*')
        .order('metric_date', { ascending: true }).limit(30);
      return data || [];
    },
  });

  // ─── Top hero cards ───
  const heroCards = [
    { label: 'GMV Total', value: fmt(stats?.gmv || 0), sub: `${fmtNum(stats?.totalTransactions || 0)} transactions`, icon: DollarSign, colorClass: 'from-primary/20 to-primary/5 border-primary/30', trend: '+' },
    { label: 'Revenus Plateforme', value: fmt(stats?.platformFees || 0), sub: `Take rate: ${stats?.takeRate || 0}%`, icon: TrendingUp, colorClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', trend: '+' },
    { label: 'Commissions Affiliés', value: fmt(stats?.affiliateCommissions || 0), sub: 'Total distribué', icon: Percent, colorClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/30', trend: '+' },
    { label: 'Reçu par les Orgs', value: fmt(stats?.orgReceived || 0), sub: 'Net après frais', icon: Building2, colorClass: 'from-violet-500/20 to-violet-500/5 border-violet-500/30', trend: '+' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Tableau de bord</h1>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(), 'dd MMM yyyy HH:mm', { locale: fr })}
        </Badge>
      </div>

      {/* ═══ HERO REVENUE CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroCards.map(c => (
          <motion.div key={c.label} variants={fadeUp}
            className={cn('rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm relative overflow-hidden', c.colorClass)}>
            <div className="flex items-center justify-between mb-1">
              <c.icon className="h-4 w-4 text-muted-foreground" />
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
            <p className="text-xl font-bold mt-0.5 tracking-tight">{c.value}</p>
            <p className="text-[10px] text-muted-foreground">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ SECONDARY STAT GRID ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: 'Organisations', value: stats?.totalOrgs || 0, icon: Building2, sub: `${stats?.activeOrgs || 0} actives`, color: 'text-blue-500' },
          { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: Users, sub: `+${stats?.newUsers7d || 0} / 7j`, color: 'text-primary' },
          { label: 'Membres', value: stats?.totalMembers || 0, icon: UserPlus, sub: 'Total', color: 'text-emerald-500' },
          { label: 'Produits', value: stats?.totalProducts || 0, icon: ShoppingBag, sub: `${stats?.publishedProducts || 0} publiés`, color: 'text-cyan-500' },
          { label: 'Campagnes', value: stats?.totalCampaigns || 0, icon: Heart, sub: `${stats?.activeCampaigns || 0} actives`, color: 'text-rose-500' },
          { label: 'Médias', value: stats?.totalMedia || 0, icon: Eye, sub: `${fmtNum(stats?.totalViews || 0)} vues`, color: 'text-purple-500' },
          { label: 'KYC', value: stats?.pendingKYC || 0, icon: Shield, sub: `${stats?.approvedKYC || 0} OK`, color: 'text-amber-500' },
          { label: 'Signalements', value: stats?.pendingReports || 0, icon: AlertTriangle, sub: 'En attente', color: 'text-red-500' },
        ].map(c => (
          <motion.div key={c.label} variants={fadeUp} className="bg-card border border-border rounded-xl p-3 shadow-card">
            <c.icon className={cn('h-3.5 w-3.5 mb-1', c.color)} />
            <p className="text-lg font-bold leading-none">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.label}</p>
            <p className="text-[9px] text-muted-foreground">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ CHARTS ROW 1: GMV + Platform Fees ═══ */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Panel>
          <WidgetHeader icon={BarChart3} title="GMV Quotidien" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="gmvG3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvG3)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée</p>}
        </Panel>

        <Panel>
          <WidgetHeader icon={TrendingUp} title="Platform Fees" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="platform_fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée</p>}
        </Panel>
      </div>

      {/* ═══ ROW 2: Activity Monitor + Circular Gauges ═══ */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Activity Monitor */}
        <Panel className="lg:col-span-2">
          <WidgetHeader icon={Activity} title="Activité récente" badge={`${stats?.recentDonations?.length || 0} dernières`} />
          <ScrollArea className="h-[200px]">
            <div className="space-y-1.5">
              {(stats?.recentDonations || []).map((d: any, i: number) => (
                <div key={d.id || i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', d.status === 'completed' ? 'bg-emerald-500' : d.status === 'pending' ? 'bg-amber-500' : 'bg-red-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{d.donor_name || 'Anonyme'} — {fmt(d.amount || 0)}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">{d.status}</Badge>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {d.created_at ? format(new Date(d.created_at), 'dd/MM HH:mm') : ''}
                  </span>
                </div>
              ))}
              {(!stats?.recentDonations || stats.recentDonations.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-6">Aucune activité récente</p>
              )}
            </div>
          </ScrollArea>
        </Panel>

        {/* Circular Gauges */}
        <Panel>
          <WidgetHeader icon={Target} title="Indicateurs clés" />
          <div className="grid grid-cols-2 gap-4 py-2">
            <CircularGauge value={Number(stats?.takeRate || 0)} max={100} label="Take Rate" color="hsl(var(--primary))" />
            <CircularGauge value={Number(stats?.conversionRate || 0)} max={100} label="Conversion" color="#10b981" />
            <CircularGauge value={stats?.campaignRaised || 0} max={stats?.campaignGoal || 1} label="Objectif Campagnes" color="#f59e0b" />
            <CircularGauge value={stats?.activeOrgs || 0} max={stats?.totalOrgs || 1} label="Orgs Actives" color="#8b5cf6" />
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 3: Top Orgs + Categories + Countries ═══ */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Top Orgs by Revenue */}
        <Panel className="lg:col-span-1">
          <WidgetHeader icon={TrendingUp} title="Top Organisations" badge="Revenus" />
          {(stats?.topOrgs || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats!.topOrgs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={90} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée</p>}
        </Panel>

        {/* Categories Pie */}
        <Panel>
          <WidgetHeader icon={Globe} title="Catégories" />
          {(stats?.categories || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats!.categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={{ strokeWidth: 1 }}>
                  {stats!.categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée</p>}
        </Panel>

        {/* Countries */}
        <Panel>
          <WidgetHeader icon={Globe} title="Par pays" />
          <div className="space-y-2">
            {(stats?.countries || []).map((c: any, i: number) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="text-xs font-medium w-20 truncate">{c.name}</span>
                <div className="flex-1">
                  <Progress value={(c.value / (stats?.totalOrgs || 1)) * 100} className="h-2" />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{c.value}</span>
              </div>
            ))}
            {(!stats?.countries || stats.countries.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">Aucune donnée</p>
            )}
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 4: Users Growth + Plan Distribution ═══ */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* Users growth chart */}
        <Panel>
          <WidgetHeader icon={Users} title="Croissance Utilisateurs" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="new_users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Nouveaux" />
                <Line type="monotone" dataKey="new_orgs" stroke="#10b981" strokeWidth={2} dot={false} name="Nouvelles Orgs" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée</p>}
        </Panel>

        {/* Plan distribution + Payout stats */}
        <Panel>
          <WidgetHeader icon={CreditCard} title="Payouts & Plans" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Payouts</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs">En attente</span>
                  <Badge variant="outline" className="text-[10px]">{stats?.pendingPayouts || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Montant</span>
                  <span className="text-xs font-semibold">{fmt(stats?.pendingPayoutAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Complétés</span>
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-0">{stats?.completedPayouts || 0}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Plans</p>
              <div className="space-y-1.5">
                {(stats?.plans || []).map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] capitalize">{p.name}</Badge>
                    <span className="text-xs font-semibold">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 5: Recent Users + Upcoming Events + Reports ═══ */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Recent Users */}
        <Panel>
          <WidgetHeader icon={UserPlus} title="Derniers inscrits" badge={`+${stats?.newUsers7d || 0} / 7j`} />
          <div className="space-y-1.5">
            {(stats?.recentUsers || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                  {(u.display_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{u.display_name || 'Sans nom'}</p>
                  <p className="text-[9px] text-muted-foreground">{u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr }) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Upcoming Events */}
        <Panel>
          <WidgetHeader icon={CalendarDays} title="Événements à venir" badge={`${stats?.totalEvents || 0} total`} />
          <div className="space-y-2">
            {(stats?.upcomingEvents || []).map((e: any) => (
              <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/50">
                <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{e.title}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {e.event_date ? format(new Date(e.event_date), 'dd MMM yyyy HH:mm', { locale: fr }) : 'Date TBD'}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun événement</p>
            )}
          </div>
        </Panel>

        {/* Recent Reports */}
        <Panel>
          <WidgetHeader icon={AlertTriangle} title="Signalements récents" badge={`${stats?.pendingReports || 0} en attente`} />
          <div className="space-y-1.5">
            {(stats?.recentReports || []).map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn('w-2 h-2 rounded-full shrink-0', r.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{r.reason || 'No reason'}</p>
                  <p className="text-[9px] text-muted-foreground">{r.content_type} · {r.status}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentReports || stats.recentReports.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun signalement 🎉</p>
            )}
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 6: Roles + Content Stats + User Cohorts ═══ */}
      <div className="grid lg:grid-cols-3 gap-3">
        <Panel>
          <WidgetHeader icon={Eye} title="Répartition des rôles" />
          <div className="flex flex-wrap gap-2">
            {stats?.roleMap && Object.entries(stats.roleMap).map(([role, count]) => (
              <Badge key={role} variant="secondary" className="text-xs capitalize px-3 py-1.5">
                {role}: {count as number}
              </Badge>
            ))}
          </div>
        </Panel>

        <Panel>
          <WidgetHeader icon={Zap} title="Résumé contenu" />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{fmtNum(stats?.totalViews || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Vues total</p>
            </div>
            <div>
              <p className="text-lg font-bold">{fmtNum(stats?.totalLikes || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Likes total</p>
            </div>
            <div>
              <p className="text-lg font-bold">{fmtNum(stats?.totalMedia || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Contenus</p>
            </div>
          </div>
        </Panel>

        {/* User Registration Cohorts */}
        <Panel>
          <WidgetHeader icon={UserPlus} title="Cohortes d'inscription" badge="8 semaines" />
          {(() => {
            const profiles = stats?.recentUsers || [];
            // Build weekly cohort data from all profiles
            const now = new Date();
            const weekData = [];
            for (let i = 7; i >= 0; i--) {
              const start = subDays(now, (i + 1) * 7);
              const end = subDays(now, i * 7);
              const count = (stats?.recentUsers || []).filter((u: any) => {
                const d = new Date(u.created_at);
                return d >= start && d < end;
              }).length;
              weekData.push({ week: format(start, 'dd/MM', { locale: fr }), users: count });
            }
            return weekData.some(w => w.users > 0) ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weekData}>
                  <XAxis dataKey="week" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={20} />
                  <Tooltip />
                  <Bar dataKey="users" name="Inscrits" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée</p>;
          })()}
        </Panel>
      </div>
    </motion.div>
  );
}
