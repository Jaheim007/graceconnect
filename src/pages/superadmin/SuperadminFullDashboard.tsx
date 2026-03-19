import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Percent, Eye, Globe, ArrowUpRight,
  ShoppingBag, Heart, Zap, Target, CalendarDays,
  BookOpen, Bell, Mail, Link2, GraduationCap,
  FileCheck, Megaphone, ShieldAlert, Wallet, Handshake,
  Settings, Download, Bot, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { PlatformHealthScore } from '@/components/superadmin/PlatformHealthScore';
import { WelcomeBanner } from '@/components/superadmin/dashboard/WelcomeBanner';
import { MetricCard } from '@/components/superadmin/dashboard/MetricCard';
import { CommandModule } from '@/components/superadmin/dashboard/CommandModule';
import { DashboardPanel } from '@/components/superadmin/dashboard/DashboardPanel';

const fmt = (n: number, currency?: string) => formatCurrency(n, currency);
const fmtNum = (n: number) => new Intl.NumberFormat().format(n);

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 };

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

export default function SuperadminFullDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
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

      const totalsRaw = totalsRes.data as any || {};
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

      const cohortData = ((cohorts.data || []) as any[]).map((c: any) => ({
        week: c.week ? format(new Date(c.week), 'dd/MM') : '',
        users: c.users || 0,
      }));

      const t = totalsRaw as any;
      return {
        totalOrgs: t?.total_orgs || 0, activeOrgs: t.active_orgs || 0, suspendedOrgs: t.suspended_orgs || 0,
        totalMembers: t.total_members || 0, totalUsers: t.total_users || 0,
        gmv: t.gmv || 0, donationGMV: t.donation_gmv || 0, purchaseGMV: t.purchase_gmv || 0,
        platformFees: t.platform_fees || 0, affiliateCommissions: t.affiliate_commissions || 0,
        orgReceived: t.org_received || 0, totalTransactions: t.total_transactions || 0,
        allTransactions: t.all_transactions || 0, pendingKYC: t.pending_kyc || 0,
        approvedKYC: t.approved_kyc || 0, pendingPayouts: t.pending_payouts || 0,
        pendingPayoutAmount: t.pending_payout_amount || 0,
        completedPayouts: (payouts.data || []).length,
        pendingReports: t.pending_reports || 0,
        takeRate: String(t.take_rate || 0), conversionRate: String(t.conversion_rate || 0),
        categories: categoriesRes.data || [], countries: countriesRes.data || [],
        topOrgs: topOrgsRes.data || [], roleMap, plans, recentActivity: activityItems,
        newOrgs7d: t.new_orgs_7d || 0, newUsers7d: t.new_users_7d || 0,
        totalProducts: t.total_products || 0, publishedProducts: t.published_products || 0,
        totalCampaigns: t.total_campaigns || 0, activeCampaigns: t.active_campaigns || 0,
        totalMedia: t.total_media || 0, totalViews: t.total_views || 0, totalLikes: t.total_likes || 0,
        totalEvents: t.total_events || 0, upcomingEvents: events.data || [],
        campaignGoal: t.campaign_goal || 0, campaignRaised: t.campaign_raised || 0,
        recentUsers: recentUsers.data || [], recentReports: reports.data || [], cohortData,
        totalEnrollments: t.total_enrollments || 0, activePrograms: t.active_programs || 0,
        totalPushSubs: t.total_push_subs || 0, totalContacts: t.total_contacts || 0,
        totalAffiliateLinks: t.total_affiliate_links || 0, activeAffiliateLinks: t.active_affiliate_links || 0,
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

  const pendingAlerts = (stats?.pendingKYC || 0) + (stats?.pendingReports || 0) + (stats?.pendingPayouts || 0);

  // ─── Command Center modules ───
  const modules = [
    { label: 'User Management', desc: 'View & manage all users', icon: Users, path: '/superadmin/users', color: 'blue' },
    { label: 'Organizations', desc: 'Platforms & creators', icon: Building2, path: '/superadmin/orgs', color: 'violet' },
    { label: 'ID Verification', desc: 'KYC reviews', icon: FileCheck, path: '/superadmin/kyc', color: 'amber', badge: stats?.pendingKYC },
    { label: 'Transactions', desc: 'All financial activity', icon: CreditCard, path: '/superadmin/transactions', color: 'emerald' },
    { label: 'Settlements', desc: 'Payout requests', icon: Wallet, path: '/superadmin/settlements', color: 'emerald', badge: stats?.pendingPayouts },
    { label: 'Reports & Flags', desc: 'Content reports', icon: Megaphone, path: '/superadmin/reports', color: 'rose', badge: stats?.pendingReports },
    { label: 'Moderation', desc: 'Content moderation', icon: ShieldCheck, path: '/superadmin/moderation', color: 'violet' },
    { label: 'Risk & AML', desc: 'Fraud detection', icon: ShieldAlert, path: '/superadmin/risk', color: 'rose' },
    { label: 'Command Center', desc: 'Ops autopilot', icon: Bot, path: '/superadmin/command-center', color: 'primary' },
    { label: 'Partners', desc: 'Partner management', icon: Handshake, path: '/superadmin/partners', color: 'teal' },
    { label: 'Push & Emails', desc: 'Notifications center', icon: Bell, path: '/superadmin/push', color: 'orange' },
    { label: 'Exports & Logs', desc: 'Data exports & audit', icon: Download, path: '/superadmin/exports', color: 'cyan' },
  ];

  return (
    <div className="space-y-6">
      {/* ═══ 1. WELCOME BANNER ═══ */}
      <WelcomeBanner
        firstName={firstName}
        totalUsers={stats?.totalUsers || 0}
        activeOrgs={stats?.activeOrgs || 0}
        pendingAlerts={pendingAlerts}
        platformFees={fmt(stats?.platformFees || 0)}
      />

      {/* ═══ 2. HERO KPI METRICS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="GMV Total" value={fmt(stats?.gmv || 0)} sub={`${fmtNum(stats?.totalTransactions || 0)} transactions`} icon={DollarSign} accentColor="primary" delay={0} />
        <MetricCard label="Platform Revenue" value={fmt(stats?.platformFees || 0)} sub={`Take ${stats?.takeRate || 0}%`} icon={TrendingUp} accentColor="emerald" delay={0.05} />
        <MetricCard label="Affiliate Commissions" value={fmt(stats?.affiliateCommissions || 0)} sub="Total distributed" icon={Percent} accentColor="amber" delay={0.1} />
        <MetricCard label="Org Received" value={fmt(stats?.orgReceived || 0)} sub="Net after fees" icon={Building2} accentColor="violet" delay={0.15} />
      </div>

      {/* ═══ QUICK STATS ROW ═══ */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {[
          { label: 'Orgs', value: stats?.totalOrgs || 0, sub: `${stats?.activeOrgs || 0} active`, icon: Building2 },
          { label: 'Users', value: stats?.totalUsers || 0, sub: `+${stats?.newUsers7d || 0}/7d`, icon: Users },
          { label: 'Products', value: stats?.totalProducts || 0, sub: `${stats?.publishedProducts || 0} pub.`, icon: ShoppingBag },
          { label: 'Campaigns', value: stats?.totalCampaigns || 0, sub: `${stats?.activeCampaigns || 0} active`, icon: Heart },
          { label: 'KYC Pending', value: stats?.pendingKYC || 0, sub: `${stats?.approvedKYC || 0} approved`, icon: Shield },
          { label: 'Reports', value: stats?.pendingReports || 0, sub: 'Pending', icon: AlertTriangle },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, type: 'spring', stiffness: 300, damping: 26 }}
            className="bg-card border border-border/50 rounded-xl p-3.5 text-center hover:border-primary/20 hover:shadow-[var(--shadow-card)] transition-all duration-200"
          >
            <c.icon className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-bold leading-none">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{c.label}</p>
            <p className="text-[9px] text-muted-foreground/70">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ 3. HEALTH SCORE ═══ */}
      <PlatformHealthScore />

      {/* ═══ MAIN ANALYTICS CHARTS ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Large chart */}
        <DashboardPanel title="Daily GMV" icon={BarChart3} badge="30 days" className="lg:col-span-2" delay={0.05}>
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="gmvG3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvG3)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-16">No data yet</p>}
        </DashboardPanel>

        {/* Side gauges */}
        <DashboardPanel title="Key Indicators" icon={Target} delay={0.1}>
          <div className="grid grid-cols-2 gap-5 py-3">
            <CircularGauge value={Number(stats?.takeRate || 0)} max={100} label="Take Rate" color="hsl(var(--primary))" />
            <CircularGauge value={Number(stats?.conversionRate || 0)} max={100} label="Conversion" color="#10b981" />
            <CircularGauge value={stats?.campaignRaised || 0} max={stats?.campaignGoal || 1} label="Campaign Goal" color="#f59e0b" />
            <CircularGauge value={stats?.activeOrgs || 0} max={stats?.totalOrgs || 1} label="Active Orgs" color="#8b5cf6" />
          </div>
        </DashboardPanel>
      </div>

      {/* Platform Fees chart */}
      <DashboardPanel title="Platform Fees" icon={TrendingUp} badge="30 days" delay={0.1}>
        {metrics.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="metric_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
              <Bar dataKey="platform_fees" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-muted-foreground text-center py-16">No data yet</p>}
      </DashboardPanel>

      {/* ═══ 4. COMMAND CENTER MODULES ═══ */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">Command Center</h2>
          <Badge variant="secondary" className="text-[10px]">{modules.length} modules</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {modules.map((m, i) => (
            <CommandModule
              key={m.path}
              label={m.label}
              description={m.desc}
              icon={m.icon}
              onClick={() => navigate(m.path)}
              badge={m.badge}
              accentColor={m.color}
              delay={0.03 * i}
            />
          ))}
        </div>
      </div>

      {/* ═══ 5. ACTIVITY & MONITORING ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <DashboardPanel title="Recent Activity" icon={Activity} badge={`${stats?.recentActivity?.length || 0} latest`} className="lg:col-span-2" delay={0.05}>
          <ScrollArea className="h-[240px]">
            <div className="space-y-0.5">
              {(stats?.recentActivity || []).map((d: any, i: number) => (
                <div key={d.id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', d.status === 'completed' ? 'bg-emerald-500' : d.status === 'pending' ? 'bg-amber-500' : 'bg-destructive')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {d.type === 'donation' ? '🤲 Donation' : '🛒 Purchase'} · {fmt(d.amount || 0, d.currency)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0 capitalize">{d.status}</Badge>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {d.created_at ? format(new Date(d.created_at), 'dd/MM HH:mm') : ''}
                  </span>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          </ScrollArea>
        </DashboardPanel>

        {/* Recent Users */}
        <DashboardPanel title="Latest Users" icon={UserPlus} badge={`+${stats?.newUsers7d || 0}/7d`} delay={0.1}>
          <div className="space-y-0.5">
            {(stats?.recentUsers || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(u.display_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{u.display_name || 'Unnamed'}</p>
                  <p className="text-[10px] text-muted-foreground">{u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      {/* ═══ TOP ORGS + CATEGORIES + COUNTRIES ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <DashboardPanel title="Top Organizations" icon={TrendingUp} badge="Revenue" delay={0.05}>
          {((stats?.topOrgs as any[]) || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats!.topOrgs as any[]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">No data</p>}
        </DashboardPanel>

        <DashboardPanel title="Categories" icon={Globe} delay={0.08}>
          {((stats?.categories as any[]) || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats!.categories as any[]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={38}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={{ strokeWidth: 1 }}>
                  {(stats!.categories as any[]).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">No data</p>}
        </DashboardPanel>

        <DashboardPanel title="By Country" icon={Globe} delay={0.11}>
          <div className="space-y-3">
            {((stats?.countries as any[]) || []).map((c: any) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 truncate">{c.name}</span>
                <div className="flex-1">
                  <Progress value={(c.value / (stats?.totalOrgs || 1)) * 100} className="h-2" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{c.value}</span>
              </div>
            ))}
            {(!stats?.countries || (stats.countries as any[]).length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-8">No data</p>
            )}
          </div>
        </DashboardPanel>
      </div>

      {/* ═══ GROWTH + PAYOUTS ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <DashboardPanel title="User Growth" icon={Users} badge="30 days" delay={0.05}>
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="new_users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="New Users" />
                <Line type="monotone" dataKey="new_orgs" stroke="#10b981" strokeWidth={2} dot={false} name="New Orgs" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-10">No data</p>}
        </DashboardPanel>

        <DashboardPanel title="Payouts & Plans" icon={CreditCard} delay={0.08}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Payouts</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Pending</span><Badge variant="outline" className="text-[10px]">{stats?.pendingPayouts || 0}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Amount</span><span className="text-xs font-bold">{fmt(stats?.pendingPayoutAmount || 0)}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Completed</span><Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-0">{stats?.completedPayouts || 0}</Badge></div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Plans</p>
              <div className="space-y-2.5">
                {(stats?.plans || []).map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] capitalize">{p.name}</Badge>
                    <span className="text-xs font-bold">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardPanel>
      </div>

      {/* ═══ EVENTS + REPORTS ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <DashboardPanel title="Upcoming Events" icon={CalendarDays} badge={`${stats?.totalEvents || 0} total`} delay={0.05}>
          <div className="space-y-2">
            {(stats?.upcomingEvents || []).map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:border-primary/20 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{e.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {e.event_date ? format(new Date(e.event_date), 'dd MMM yyyy HH:mm') : 'Date TBD'}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">No upcoming events</p>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Flagged Reports" icon={AlertTriangle} badge={`${stats?.pendingReports || 0} pending`} delay={0.08}>
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
              <p className="text-xs text-muted-foreground text-center py-6">No reports 🎉</p>
            )}
          </div>
        </DashboardPanel>
      </div>

      {/* ═══ ENGAGEMENT STATS ═══ */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {[
          { label: 'Programs', value: stats?.activePrograms || 0, sub: `${stats?.totalEnrollments || 0} enrolled`, icon: GraduationCap },
          { label: 'Affiliate Links', value: stats?.totalAffiliateLinks || 0, sub: `${stats?.activeAffiliateLinks || 0} active`, icon: Link2 },
          { label: 'Push Subs', value: stats?.totalPushSubs || 0, sub: 'subscribers', icon: Bell },
          { label: 'Contacts', value: stats?.totalContacts || 0, sub: 'email subs', icon: Mail },
          { label: 'Email Campaigns', value: stats?.totalEmailCampaigns || 0, sub: 'sent', icon: Mail },
          { label: 'Media', value: stats?.totalMedia || 0, sub: `${fmtNum(stats?.totalViews || 0)} views`, icon: Eye },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 26 }}
            className="bg-card border border-border/50 rounded-xl p-3.5 text-center hover:border-primary/20 hover:shadow-[var(--shadow-card)] transition-all duration-200"
          >
            <c.icon className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-bold leading-none">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{c.label}</p>
            <p className="text-[9px] text-muted-foreground/70">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ CONTENT + ROLES + COHORTS ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <DashboardPanel title="Role Distribution" icon={Eye} delay={0.05}>
          <div className="flex flex-wrap gap-2">
            {stats?.roleMap && Object.entries(stats.roleMap).map(([role, count]) => (
              <Badge key={role} variant="secondary" className="text-xs capitalize px-3 py-1.5">
                {role}: {count as number}
              </Badge>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Content Summary" icon={Zap} delay={0.08}>
          <div className="grid grid-cols-3 gap-4 text-center py-2">
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalViews || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Views</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalLikes || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Likes</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{fmtNum(stats?.totalMedia || 0)}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Content</p>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Cohorts" icon={UserPlus} badge="8 weeks" delay={0.11}>
          {(stats?.cohortData || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stats!.cohortData}>
                <XAxis dataKey="week" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={20} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="users" name="Registered" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-6">No data</p>}
        </DashboardPanel>
      </div>
    </div>
  );
}
