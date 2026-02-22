import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, BarChart3, Activity,
  Shield, AlertTriangle, CreditCard, Building2, UserPlus,
  Percent, Eye, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function SuperadminFullDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['sa-full-stats'],
    queryFn: async () => {
      const [orgs, members, donations, purchases, payouts, kyc, reports, profiles, affiliateSales] = await Promise.all([
        db.from('organizations').select('id, name, slug, plan_type, kyc_status, is_active, is_suspended, category, country, created_at'),
        db.from('organization_members').select('id, role, joined_at', { count: 'exact' }),
        db.from('donations').select('amount, status, currency, created_at, organization_id, platform_fee, affiliate_commission, organization_amount').eq('status', 'completed'),
        db.from('product_purchases').select('amount, status, currency, created_at, organization_id, platform_fee, affiliate_commission, organization_amount').eq('status', 'completed'),
        db.from('payout_requests').select('amount, status'),
        db.from('kyc_submissions').select('status, organization_id'),
        db.from('content_reports').select('status'),
        db.from('profiles').select('id, created_at', { count: 'exact' }),
        db.from('affiliate_sales').select('commission_amount, status'),
      ]);

      const allOrgs = orgs.data || [];
      const allDonations = donations.data || [];
      const allPurchases = purchases.data || [];
      const allPayouts = payouts.data || [];
      const allKyc = kyc.data || [];
      const allReports = reports.data || [];
      const allAffSales = affiliateSales.data || [];

      const donationGMV = allDonations.reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const purchaseGMV = allPurchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const platformFees = [...allDonations, ...allPurchases].reduce((s: number, t: any) => s + (t.platform_fee || 0), 0);
      const affiliateCommissions = allAffSales.reduce((s: number, a: any) => s + (a.commission_amount || 0), 0);
      const orgReceived = [...allDonations, ...allPurchases].reduce((s: number, t: any) => s + (t.organization_amount || 0), 0);

      // Org categories
      const catMap: Record<string, number> = {};
      allOrgs.forEach((o: any) => { catMap[o.category || 'other'] = (catMap[o.category || 'other'] || 0) + 1; });
      const categories = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // Revenue by org (top 5)
      const orgRevMap: Record<string, { name: string; revenue: number }> = {};
      [...allDonations, ...allPurchases].forEach((t: any) => {
        if (!orgRevMap[t.organization_id]) {
          const org = allOrgs.find((o: any) => o.id === t.organization_id);
          orgRevMap[t.organization_id] = { name: org?.name || 'Unknown', revenue: 0 };
        }
        orgRevMap[t.organization_id].revenue += t.amount || 0;
      });
      const topOrgs = Object.values(orgRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      // Roles breakdown
      const roleMap: Record<string, number> = {};
      (members.data || []).forEach((m: any) => { roleMap[m.role || 'member'] = (roleMap[m.role || 'member'] || 0) + 1; });

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
        totalTransactions: allDonations.length + allPurchases.length,
        pendingKYC: allKyc.filter((k: any) => k.status === 'pending').length,
        approvedKYC: allKyc.filter((k: any) => k.status === 'approved').length,
        pendingPayouts: allPayouts.filter((p: any) => p.status === 'requested').length,
        pendingPayoutAmount: allPayouts.filter((p: any) => p.status === 'requested').reduce((s: number, p: any) => s + (p.amount || 0), 0),
        pendingReports: allReports.filter((r: any) => r.status === 'pending').length,
        takeRate: (donationGMV + purchaseGMV) > 0 ? ((platformFees / (donationGMV + purchaseGMV)) * 100).toFixed(1) : '0',
        categories,
        topOrgs,
        roleMap,
      };
    },
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['sa-platform-metrics-dash'],
    queryFn: async () => {
      const { data } = await db.from('platform_metrics_daily').select('*')
        .order('metric_date', { ascending: true }).limit(30);
      return data || [];
    },
  });

  const heroCards = [
    { label: 'GMV Total', value: fmt(stats?.gmv || 0), sub: `${stats?.totalTransactions || 0} transactions`, icon: DollarSign, colorClass: 'from-primary/20 to-primary/5 border-primary/20' },
    { label: 'Revenus Plateforme', value: fmt(stats?.platformFees || 0), sub: `Take rate: ${stats?.takeRate || 0}%`, icon: TrendingUp, colorClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20' },
    { label: 'Commissions Affiliés', value: fmt(stats?.affiliateCommissions || 0), sub: 'Total distribué', icon: Percent, colorClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/20' },
    { label: 'Reçu par les Orgs', value: fmt(stats?.orgReceived || 0), sub: 'Après frais', icon: Building2, colorClass: 'from-violet-500/20 to-violet-500/5 border-violet-500/20' },
  ];

  const statCards = [
    { label: 'Organisations', value: stats?.totalOrgs || 0, sub: `${stats?.activeOrgs || 0} actives · ${stats?.suspendedOrgs || 0} suspendues`, icon: Building2, color: 'text-blue-500' },
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, sub: 'Comptes créés', icon: Users, color: 'text-primary' },
    { label: 'Membres Orgs', value: stats?.totalMembers || 0, sub: 'Across all orgs', icon: UserPlus, color: 'text-emerald-500' },
    { label: 'Dons (GMV)', value: fmt(stats?.donationGMV || 0), sub: 'Campagnes de dons', icon: CreditCard, color: 'text-rose-500' },
    { label: 'Ventes (GMV)', value: fmt(stats?.purchaseGMV || 0), sub: 'Produits digitaux', icon: DollarSign, color: 'text-amber-500' },
    { label: 'KYC en attente', value: stats?.pendingKYC || 0, sub: `${stats?.approvedKYC || 0} approuvés`, icon: Shield, color: 'text-amber-500' },
    { label: 'Payouts en attente', value: stats?.pendingPayouts || 0, sub: fmt(stats?.pendingPayoutAmount || 0), icon: Activity, color: 'text-violet-500' },
    { label: 'Signalements', value: stats?.pendingReports || 0, sub: 'À traiter', icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Vue d'ensemble Plateforme</h1>
      </div>

      {/* Hero revenue cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroCards.map(c => (
          <motion.div key={c.label} variants={fadeUp}
            className={cn('rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm', c.colorClass)}>
            <c.icon className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</p>
            <p className="text-xl font-bold mt-1">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Stat grid */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(c => (
          <motion.div key={c.label} variants={fadeUp} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <c.icon className={cn('h-4 w-4 mb-2', c.color)} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* GMV chart */}
        {metrics.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> GMV quotidien</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="gmvGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric_date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvGrad2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Org categories pie */}
        {(stats?.categories || []).length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Organisations par catégorie</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats!.categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {stats!.categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top orgs by revenue */}
      {(stats?.topOrgs || []).length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Top 5 Organisations par revenus</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats!.topOrgs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Roles breakdown */}
      {stats?.roleMap && Object.keys(stats.roleMap).length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Répartition des rôles</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.roleMap).map(([role, count]) => (
              <Badge key={role} variant="secondary" className="text-xs capitalize px-3 py-1">
                {role}: {count as number}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
