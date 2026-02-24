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
  Percent, Eye, Globe, Clock, ArrowUpRight,
  ShoppingBag, Heart, Zap, Target, CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, subDays, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

// ─── Circular gauge ───
function CircularGauge({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: 'hsl(var(--muted))' }];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-24 h-24 relative">
        <RadialBarChart width={96} height={96} cx={48} cy={48} innerRadius={32} outerRadius={44} barSize={10} data={[data[0]]} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={5} background={{ fill: 'hsl(var(--muted))' }} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{Math.round(pct)}%</span>
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground text-center leading-tight font-medium">{label}</span>
    </div>
  );
}

// ─── Panel wrapper ───
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={cn(
      'bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-shadow duration-300',
      className
    )}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, badge }: { icon: any; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        {title}
      </h3>
      {badge && <Badge variant="secondary" className="text-[10px] font-medium">{badge}</Badge>}
    </div>
  );
}

export default function SuperadminFullDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.display_name?.split(' ')[0] || 'Admin';

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

      const catMap: Record<string, number> = {};
      allOrgs.forEach((o: any) => { catMap[o.category || 'other'] = (catMap[o.category || 'other'] || 0) + 1; });
      const categories = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      const countryMap: Record<string, number> = {};
      allOrgs.forEach((o: any) => { countryMap[o.country || 'Unknown'] = (countryMap[o.country || 'Unknown'] || 0) + 1; });
      const countries = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

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

      const roleMap: Record<string, number> = {};
      (members.data || []).forEach((m: any) => { roleMap[m.role || 'member'] = (roleMap[m.role || 'member'] || 0) + 1; });

      const recentDonations = allDonations.slice(0, 10);

      const planMap: Record<string, number> = {};
      allOrgs.forEach((o: any) => { planMap[o.plan_type || 'free'] = (planMap[o.plan_type || 'free'] || 0) + 1; });
      const plans = Object.entries(planMap).map(([name, value]) => ({ name, value }));

      const sevenDaysAgo = subDays(new Date(), 7);
      const newOrgs7d = allOrgs.filter((o: any) => isAfter(new Date(o.created_at), sevenDaysAgo)).length;
      const newUsers7d = allProfiles.filter((p: any) => isAfter(new Date(p.created_at), sevenDaysAgo)).length;

      const totalViews = allMedia.reduce((s: number, m: any) => s + (m.view_count || 0), 0);
      const totalLikes = allMedia.reduce((s: number, m: any) => s + (m.like_count || 0), 0);

      const activeCampaignsArr = allCampaigns.filter((c: any) => c.is_active);
      const totalGoal = activeCampaignsArr.reduce((s: number, c: any) => s + (c.goal_amount || 0), 0);
      const totalRaised = activeCampaignsArr.reduce((s: number, c: any) => s + (c.current_amount || 0), 0);

      const recentUsers = allProfiles.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

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
        donationGMV, purchaseGMV, platformFees, affiliateCommissions, orgReceived,
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
        categories, countries, topOrgs, roleMap, plans, recentDonations,
        newOrgs7d, newUsers7d,
        totalProducts: products.count || 0,
        publishedProducts: allProducts.filter((p: any) => p.is_published).length,
        totalCampaigns: campaigns.count || 0,
        activeCampaigns: activeCampaignsArr.length,
        totalMedia: media.count || 0,
        totalViews, totalLikes,
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

  const heroCards = [
    { label: 'GMV TOTAL', value: fmt(stats?.gmv || 0), sub: `${fmtNum(stats?.totalTransactions || 0)} transactions`, icon: DollarSign, gradient: 'from-primary/25 via-primary/10 to-transparent border-primary/30' },
    { label: 'REVENUS PLATEFORME', value: fmt(stats?.platformFees || 0), sub: `Take rate: ${stats?.takeRate || 0}%`, icon: TrendingUp, gradient: 'from-emerald-500/25 via-emerald-500/10 to-transparent border-emerald-500/30' },
    { label: 'COMMISSIONS AFFILIÉS', value: fmt(stats?.affiliateCommissions || 0), sub: 'Total distribué', icon: Percent, gradient: 'from-amber-500/25 via-amber-500/10 to-transparent border-amber-500/30' },
    { label: 'REÇU PAR LES ORGS', value: fmt(stats?.orgReceived || 0), sub: 'Net après frais', icon: Building2, gradient: 'from-violet-500/25 via-violet-500/10 to-transparent border-violet-500/30' },
  ];

  const secondaryStats = [
    { label: 'Organisations', value: stats?.totalOrgs || 0, icon: Building2, sub: `${stats?.activeOrgs || 0} actives`, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: Users, sub: `+${stats?.newUsers7d || 0} / 7j`, color: 'text-primary bg-primary/10' },
    { label: 'Membres', value: stats?.totalMembers || 0, icon: UserPlus, sub: 'Total', color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Produits', value: stats?.totalProducts || 0, icon: ShoppingBag, sub: `${stats?.publishedProducts || 0} publiés`, color: 'text-cyan-400 bg-cyan-500/10' },
    { label: 'Campagnes', value: stats?.totalCampaigns || 0, icon: Heart, sub: `${stats?.activeCampaigns || 0} actives`, color: 'text-rose-400 bg-rose-500/10' },
    { label: 'Médias', value: stats?.totalMedia || 0, icon: Eye, sub: `${fmtNum(stats?.totalViews || 0)} vues`, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'KYC', value: stats?.pendingKYC || 0, icon: Shield, sub: `${stats?.approvedKYC || 0} OK`, color: 'text-amber-400 bg-amber-500/10' },
    { label: 'Signalements', value: stats?.pendingReports || 0, icon: AlertTriangle, sub: 'En attente', color: 'text-red-400 bg-red-500/10' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ WELCOME HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici ce qui se passe sur <span className="font-semibold text-primary">SiteViral</span> aujourd'hui.
          </p>
        </div>
        <Badge variant="outline" className="text-[11px] gap-1.5 px-3 py-1.5 self-start sm:self-auto">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(), 'dd MMM yyyy · HH:mm', { locale: fr })}
        </Badge>
      </motion.div>

      {/* ═══ HERO REVENUE CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroCards.map(c => (
          <motion.div key={c.label} variants={fadeUp}
            className={cn('rounded-2xl border p-5 bg-gradient-to-br relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200', c.gradient)}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center border border-border/50">
                <c.icon className="h-5 w-5 text-foreground/70" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.12em]">{c.label}</p>
            <p className="text-2xl font-extrabold mt-1 tracking-tight">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ SECONDARY STAT GRID ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {secondaryStats.map(c => (
          <motion.div key={c.label} variants={fadeUp} className="bg-card border border-border rounded-xl p-3.5 hover:border-primary/20 transition-colors">
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-2', c.color)}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold leading-none">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{c.label}</p>
            <p className="text-[9px] text-muted-foreground/70">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ CHARTS ROW 1: GMV + Platform Fees ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel>
          <SectionTitle icon={BarChart3} title="GMV Quotidien" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="gmvG3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvG3)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>

        <Panel>
          <SectionTitle icon={TrendingUp} title="Platform Fees" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="platform_fees" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>
      </div>

      {/* ═══ ROW 2: Activity Monitor + Circular Gauges ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <SectionTitle icon={Activity} title="Activité récente" badge={`${stats?.recentDonations?.length || 0} dernières`} />
          <ScrollArea className="h-[220px]">
            <div className="space-y-1">
              {(stats?.recentDonations || []).map((d: any, i: number) => (
                <div key={d.id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', d.status === 'completed' ? 'bg-emerald-500' : d.status === 'pending' ? 'bg-amber-500' : 'bg-red-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{d.donor_name || 'Anonyme'}</p>
                    <p className="text-[10px] text-muted-foreground">{fmt(d.amount || 0)}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0 capitalize">{d.status}</Badge>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {d.created_at ? format(new Date(d.created_at), 'dd/MM HH:mm') : ''}
                  </span>
                </div>
              ))}
              {(!stats?.recentDonations || stats.recentDonations.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-8">Aucune activité récente</p>
              )}
            </div>
          </ScrollArea>
        </Panel>

        <Panel>
          <SectionTitle icon={Target} title="Indicateurs clés" />
          <div className="grid grid-cols-2 gap-5 py-2">
            <CircularGauge value={Number(stats?.takeRate || 0)} max={100} label="Take Rate" color="hsl(var(--primary))" />
            <CircularGauge value={Number(stats?.conversionRate || 0)} max={100} label="Conversion" color="#10b981" />
            <CircularGauge value={stats?.campaignRaised || 0} max={stats?.campaignGoal || 1} label="Obj. Campagnes" color="#f59e0b" />
            <CircularGauge value={stats?.activeOrgs || 0} max={stats?.totalOrgs || 1} label="Orgs Actives" color="#8b5cf6" />
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 3: Top Orgs + Categories + Countries ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel>
          <SectionTitle icon={TrendingUp} title="Top Organisations" badge="Revenus" />
          {(stats?.topOrgs || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats!.topOrgs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={90} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>

        <Panel>
          <SectionTitle icon={Globe} title="Catégories" />
          {(stats?.categories || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats!.categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={{ strokeWidth: 1 }}>
                  {stats!.categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>

        <Panel>
          <SectionTitle icon={Globe} title="Par pays" />
          <div className="space-y-3">
            {(stats?.countries || []).map((c: any) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 truncate">{c.name}</span>
                <div className="flex-1">
                  <Progress value={(c.value / (stats?.totalOrgs || 1)) * 100} className="h-2.5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{c.value}</span>
              </div>
            ))}
            {(!stats?.countries || stats.countries.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée</p>
            )}
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 4: Users Growth + Payouts & Plans ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel>
          <SectionTitle icon={Users} title="Croissance Utilisateurs" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="new_users" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Nouveaux" />
                <Line type="monotone" dataKey="new_orgs" stroke="#10b981" strokeWidth={2.5} dot={false} name="Nouvelles Orgs" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>

        <Panel>
          <SectionTitle icon={CreditCard} title="Payouts & Plans" />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Payouts</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">En attente</span>
                  <Badge variant="outline" className="text-[10px]">{stats?.pendingPayouts || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Montant</span>
                  <span className="text-xs font-bold">{fmt(stats?.pendingPayoutAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Complétés</span>
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-0">{stats?.completedPayouts || 0}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Plans</p>
              <div className="space-y-2">
                {(stats?.plans || []).map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] capitalize">{p.name}</Badge>
                    <span className="text-xs font-bold">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 5: Recent Users + Events + Reports ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel>
          <SectionTitle icon={UserPlus} title="Derniers inscrits" badge={`+${stats?.newUsers7d || 0} / 7j`} />
          <div className="space-y-1">
            {(stats?.recentUsers || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(u.display_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{u.display_name || 'Sans nom'}</p>
                  <p className="text-[10px] text-muted-foreground">{u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr }) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon={CalendarDays} title="Événements à venir" badge={`${stats?.totalEvents || 0} total`} />
          <div className="space-y-2">
            {(stats?.upcomingEvents || []).map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{e.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {e.event_date ? format(new Date(e.event_date), 'dd MMM yyyy HH:mm', { locale: fr }) : 'Date TBD'}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">Aucun événement</p>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon={AlertTriangle} title="Signalements" badge={`${stats?.pendingReports || 0} en attente`} />
          <div className="space-y-1">
            {(stats?.recentReports || []).map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', r.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.reason || 'No reason'}</p>
                  <p className="text-[10px] text-muted-foreground">{r.content_type} · {r.status}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentReports || stats.recentReports.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">Aucun signalement 🎉</p>
            )}
          </div>
        </Panel>
      </div>

      {/* ═══ ROW 6: Roles + Content Stats + Cohorts ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel>
          <SectionTitle icon={Eye} title="Répartition des rôles" />
          <div className="flex flex-wrap gap-2">
            {stats?.roleMap && Object.entries(stats.roleMap).map(([role, count]) => (
              <Badge key={role} variant="secondary" className="text-xs capitalize px-3 py-1.5">
                {role}: {count as number}
              </Badge>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon={Zap} title="Résumé contenu" />
          <div className="grid grid-cols-3 gap-4 text-center py-2">
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalViews || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Vues total</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalLikes || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Likes total</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalMedia || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Contenus</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon={UserPlus} title="Cohortes d'inscription" badge="8 semaines" />
          {(() => {
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
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={weekData}>
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={20} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="users" name="Inscrits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground text-center py-6">Aucune donnée</p>;
          })()}
        </Panel>
      </div>
    </motion.div>
  );
}
