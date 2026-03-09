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
  ShoppingBag, Heart, Zap, Target, CalendarDays,
  BookOpen, Bell, Mail, Link2, GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { PlatformHealthScore } from '@/components/superadmin/PlatformHealthScore';

const fmt = (n: number, currency?: string) => formatCurrency(n, currency);
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};
const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

// ─── Circular gauge ───
function CircularGauge({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: 'hsl(var(--muted))' }];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-20 h-20 relative">
        <RadialBarChart width={80} height={80} cx={40} cy={40} innerRadius={26} outerRadius={36} barSize={8} data={[data[0]]} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={5} background={{ fill: 'hsl(var(--muted))' }} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{Math.round(pct)}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight font-medium">{label}</span>
    </div>
  );
}

// ─── Premium Panel ───
function Panel({ children, className, glow }: { children: React.ReactNode; className?: string; glow?: string }) {
  return (
    <motion.div variants={fadeUp} className={cn(
      'relative bg-card border border-border/60 rounded-2xl p-5 overflow-hidden',
      'hover:border-border transition-all duration-300',
      className
    )}>
      {glow && <div className={cn('absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none', glow)} />}
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

const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 };

export default function SuperadminFullDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.display_name?.split(' ')[0] || 'Admin';

  const { data: stats } = useQuery({
    queryKey: ['sa-full-stats-v4'],
    queryFn: async () => {
      const [totalsRes, topOrgsRes, categoriesRes, countriesRes, recentDonations, recentPurchases, recentUsers, members, payouts, reports, events, orgs, cohorts] = await Promise.all([
        db.rpc('get_platform_totals'),
        db.rpc('get_top_orgs_by_revenue', { _limit: 8 }),
        db.rpc('get_org_category_breakdown'),
        db.rpc('get_org_country_breakdown', { _limit: 6 }),
        db.from('donations').select('id, amount, status, donor_name, created_at, currency').order('created_at', { ascending: false }).limit(15),
        db.from('product_purchases').select('id, amount, status, buyer_name, created_at, currency').order('created_at', { ascending: false }).limit(15),
        db.from('profiles').select('id, display_name, created_at').order('created_at', { ascending: false }).limit(10),
        db.from('organization_members').select('role'),
        db.from('payout_requests').select('amount, status').eq('status', 'completed'),
        db.from('content_reports').select('status, content_type, reason').order('created_at', { ascending: false }).limit(5),
        db.from('events').select('id, title, event_date, is_published').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(5),
        db.from('organizations').select('plan_type'),
        db.rpc('get_weekly_user_cohorts', { _weeks: 8 }),
      ]);

      const t = totalsRes.data || {};

      // Merge donations + purchases into a single activity feed
      const activityItems = [
        ...(recentDonations.data || []).map((d: any) => ({
          id: `don-${d.id}`, name: d.donor_name || 'Anonyme', amount: d.amount || 0,
          status: d.status, created_at: d.created_at, type: 'donation' as const, currency: d.currency,
        })),
        ...(recentPurchases.data || []).map((p: any) => ({
          id: `pur-${p.id}`, name: p.buyer_name || 'Acheteur', amount: p.amount || 0,
          status: p.status, created_at: p.created_at, type: 'purchase' as const, currency: p.currency,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);

      const roleMap: Record<string, number> = {};
      (members.data || []).forEach((m: any) => { roleMap[m.role || 'member'] = (roleMap[m.role || 'member'] || 0) + 1; });

      const planMap: Record<string, number> = {};
      (orgs.data || []).forEach((o: any) => { planMap[o.plan_type || 'free'] = (planMap[o.plan_type || 'free'] || 0) + 1; });
      const plans = Object.entries(planMap).map(([name, value]) => ({ name, value }));

      // Format cohort data
      const cohortData = ((cohorts.data || []) as any[]).map((c: any) => ({
        week: c.week ? format(new Date(c.week), 'dd/MM', { locale: fr }) : '',
        users: c.users || 0,
      }));

      return {
        totalOrgs: t.total_orgs || 0,
        activeOrgs: t.active_orgs || 0,
        suspendedOrgs: t.suspended_orgs || 0,
        totalMembers: t.total_members || 0,
        totalUsers: t.total_users || 0,
        gmv: t.gmv || 0,
        donationGMV: t.donation_gmv || 0,
        purchaseGMV: t.purchase_gmv || 0,
        platformFees: t.platform_fees || 0,
        affiliateCommissions: t.affiliate_commissions || 0,
        orgReceived: t.org_received || 0,
        totalTransactions: t.total_transactions || 0,
        allTransactions: t.all_transactions || 0,
        pendingKYC: t.pending_kyc || 0,
        approvedKYC: t.approved_kyc || 0,
        pendingPayouts: t.pending_payouts || 0,
        pendingPayoutAmount: t.pending_payout_amount || 0,
        completedPayouts: (payouts.data || []).length,
        pendingReports: t.pending_reports || 0,
        takeRate: String(t.take_rate || 0),
        conversionRate: String(t.conversion_rate || 0),
        categories: categoriesRes.data || [],
        countries: countriesRes.data || [],
        topOrgs: topOrgsRes.data || [],
        roleMap,
        plans,
        recentActivity: activityItems,
        newOrgs7d: t.new_orgs_7d || 0,
        newUsers7d: t.new_users_7d || 0,
        totalProducts: t.total_products || 0,
        publishedProducts: t.published_products || 0,
        totalCampaigns: t.total_campaigns || 0,
        activeCampaigns: t.active_campaigns || 0,
        totalMedia: t.total_media || 0,
        totalViews: t.total_views || 0,
        totalLikes: t.total_likes || 0,
        totalEvents: t.total_events || 0,
        upcomingEvents: events.data || [],
        campaignGoal: t.campaign_goal || 0,
        campaignRaised: t.campaign_raised || 0,
        recentUsers: recentUsers.data || [],
        recentReports: reports.data || [],
        cohortData,
        // New stats
        totalEnrollments: t.total_enrollments || 0,
        activePrograms: t.active_programs || 0,
        totalPushSubs: t.total_push_subs || 0,
        totalContacts: t.total_contacts || 0,
        totalAffiliateLinks: t.total_affiliate_links || 0,
        activeAffiliateLinks: t.active_affiliate_links || 0,
        totalEmailCampaigns: t.total_email_campaigns || 0,
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
    { label: 'GMV Total', value: fmt(stats?.gmv || 0), sub: `${fmtNum(stats?.totalTransactions || 0)} tx`, icon: DollarSign, glow: 'bg-primary' },
    { label: 'Revenus Plateforme', value: fmt(stats?.platformFees || 0), sub: `Take ${stats?.takeRate || 0}%`, icon: TrendingUp, glow: 'bg-emerald-500' },
    { label: 'Commissions Affiliés', value: fmt(stats?.affiliateCommissions || 0), sub: 'Total distribué', icon: Percent, glow: 'bg-amber-500' },
    { label: 'Reçu par les Orgs', value: fmt(stats?.orgReceived || 0), sub: 'Net après frais', icon: Building2, glow: 'bg-violet-500' },
  ];

  const quickStats = [
    { label: 'Orgs', value: stats?.totalOrgs || 0, sub: `${stats?.activeOrgs || 0} actives`, icon: Building2 },
    { label: 'Users', value: stats?.totalUsers || 0, sub: `+${stats?.newUsers7d || 0}/7j`, icon: Users },
    { label: 'Produits', value: stats?.totalProducts || 0, sub: `${stats?.publishedProducts || 0} pub.`, icon: ShoppingBag },
    { label: 'Campagnes', value: stats?.totalCampaigns || 0, sub: `${stats?.activeCampaigns || 0} act.`, icon: Heart },
    { label: 'KYC', value: stats?.pendingKYC || 0, sub: `${stats?.approvedKYC || 0} OK`, icon: Shield },
    { label: 'Signalements', value: stats?.pendingReports || 0, sub: 'En attente', icon: AlertTriangle },
  ];

  const engagementStats = [
    { label: 'Programmes', value: stats?.activePrograms || 0, sub: `${stats?.totalEnrollments || 0} inscrits`, icon: GraduationCap },
    { label: 'Liens Affil.', value: stats?.totalAffiliateLinks || 0, sub: `${stats?.activeAffiliateLinks || 0} actifs`, icon: Link2 },
    { label: 'Push Subs', value: stats?.totalPushSubs || 0, sub: 'abonnés notifs', icon: Bell },
    { label: 'Contacts', value: stats?.totalContacts || 0, sub: 'abonnés email', icon: Mail },
    { label: 'Campagnes Email', value: stats?.totalEmailCampaigns || 0, sub: 'envoyées', icon: Mail },
    { label: 'Médias', value: stats?.totalMedia || 0, sub: `${fmtNum(stats?.totalViews || 0)} vues`, icon: Eye },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Bonjour, {firstName} <span className="inline-block animate-[wave_2s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici ce qui se passe sur <span className="font-semibold text-primary">SiteViral</span> aujourd'hui.
          </p>
        </div>
        <Badge variant="outline" className="text-[11px] gap-1.5 px-3 py-1.5 self-start sm:self-auto border-border/60">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(), 'dd MMM yyyy · HH:mm', { locale: fr })}
        </Badge>
      </motion.div>

      {/* ═══ HERO KPIs ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroCards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}
            className="relative bg-card border border-border/60 rounded-2xl p-5 overflow-hidden group hover:border-border hover:scale-[1.01] transition-all duration-300">
            <div className={cn('absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity', c.glow)} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center border border-border/40">
                <c.icon className="h-5 w-5 text-foreground/70" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest relative z-10">{c.label}</p>
            <p className="text-2xl font-extrabold mt-1 tracking-tight relative z-10">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 relative z-10">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ QUICK STATS ═══ */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {quickStats.map(c => (
          <motion.div key={c.label} variants={fadeUp} className="bg-card border border-border/50 rounded-xl p-3 text-center hover:border-primary/20 transition-colors">
            <c.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-lg font-bold leading-none">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{c.label}</p>
            <p className="text-[9px] text-muted-foreground/70">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ HEALTH SCORE ═══ */}
      <PlatformHealthScore />

      {/* ═══ CHARTS ROW ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel glow="bg-primary">
          <SectionTitle icon={BarChart3} title="GMV Quotidien" badge="30 jours" />
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
                <XAxis dataKey="metric_date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvG3)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>

        <Panel glow="bg-emerald-500">
          <SectionTitle icon={TrendingUp} title="Platform Fees" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="platform_fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>
      </div>

      {/* ═══ ACTIVITY + GAUGES ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <SectionTitle icon={Activity} title="Activité récente" badge={`${stats?.recentActivity?.length || 0} dernières`} />
          <ScrollArea className="h-[200px]">
            <div className="space-y-0.5">
              {(stats?.recentActivity || []).map((d: any, i: number) => (
                <div key={d.id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', d.status === 'completed' ? 'bg-emerald-500' : d.status === 'pending' ? 'bg-amber-500' : 'bg-red-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {d.type === 'donation' ? '🤲 Don' : '🛒 Achat'} · {fmt(d.amount || 0, d.currency)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0 capitalize">{d.status}</Badge>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {d.created_at ? format(new Date(d.created_at), 'dd/MM HH:mm') : ''}
                  </span>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-8">Aucune activité récente</p>
              )}
            </div>
          </ScrollArea>
        </Panel>

        <Panel>
          <SectionTitle icon={Target} title="Indicateurs clés" />
          <div className="grid grid-cols-2 gap-4 py-2">
            <CircularGauge value={Number(stats?.takeRate || 0)} max={100} label="Take Rate" color="hsl(var(--primary))" />
            <CircularGauge value={Number(stats?.conversionRate || 0)} max={100} label="Conversion" color="#10b981" />
            <CircularGauge value={stats?.campaignRaised || 0} max={stats?.campaignGoal || 1} label="Obj. Campagnes" color="#f59e0b" />
            <CircularGauge value={stats?.activeOrgs || 0} max={stats?.totalOrgs || 1} label="Orgs Actives" color="#8b5cf6" />
          </div>
        </Panel>
      </div>

      {/* ═══ TOP ORGS + CATEGORIES + COUNTRIES ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel>
          <SectionTitle icon={TrendingUp} title="Top Organisations" badge="Revenus" />
          {(stats?.topOrgs || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats!.topOrgs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">Aucune donnée</p>}
        </Panel>

        <Panel>
          <SectionTitle icon={Globe} title="Catégories" />
          {(stats?.categories || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats!.categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={38}
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
                  <Progress value={(c.value / (stats?.totalOrgs || 1)) * 100} className="h-2" />
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

      {/* ═══ GROWTH + PAYOUTS ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel glow="bg-primary">
          <SectionTitle icon={Users} title="Croissance Utilisateurs" badge="30 jours" />
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="new_users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Nouveaux" />
                <Line type="monotone" dataKey="new_orgs" stroke="#10b981" strokeWidth={2} dot={false} name="Nouvelles Orgs" />
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
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">En attente</span><Badge variant="outline" className="text-[10px]">{stats?.pendingPayouts || 0}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Montant</span><span className="text-xs font-bold">{fmt(stats?.pendingPayoutAmount || 0)}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Complétés</span><Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-0">{stats?.completedPayouts || 0}</Badge></div>
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

      {/* ═══ RECENT USERS + EVENTS + REPORTS ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel>
          <SectionTitle icon={UserPlus} title="Derniers inscrits" badge={`+${stats?.newUsers7d || 0}/7j`} />
          <div className="space-y-0.5">
            {(stats?.recentUsers || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">
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
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:border-primary/20 transition-colors">
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
          <div className="space-y-0.5">
            {(stats?.recentReports || []).map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                <div className={cn('w-2 h-2 rounded-full shrink-0', r.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500')} />
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

      {/* ═══ ENGAGEMENT STATS ═══ */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {engagementStats.map(c => (
          <motion.div key={c.label} variants={fadeUp} className="bg-card border border-border/50 rounded-xl p-3 text-center hover:border-primary/20 transition-colors">
            <c.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-lg font-bold leading-none">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{c.label}</p>
            <p className="text-[9px] text-muted-foreground/70">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ CONTENT + ROLES + COHORTS ═══ */}
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
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Vues</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalLikes || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Likes</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalMedia || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Contenus</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon={UserPlus} title="Cohortes" badge="8 semaines" />
          {(stats?.cohortData || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stats!.cohortData}>
                <XAxis dataKey="week" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={20} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="users" name="Inscrits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-6">Aucune donnée</p>}
        </Panel>
      </div>
    </motion.div>
  );
}
