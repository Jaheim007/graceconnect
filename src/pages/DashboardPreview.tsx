import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, Users, Package, ArrowUpRight,
  Sparkles, BookOpen, Palette, Share2, BarChart3, Zap,
  CheckCircle2, Clock, FileText, PenLine
} from 'lucide-react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardSection } from '@/components/ui/DashboardSection';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  DEMO_METRICS, DEMO_REVENUE_CHART, DEMO_SALES,
  DEMO_AI_PROJECTS, DEMO_AMBASSADOR, DEMO_VIRAL_TOOLS
} from '@/lib/demoData';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SEOHead } from '@/components/seo/SEOHead';
import { useState } from 'react';

const fmt = (n: number, currency = 'XOF') => {
  if (currency === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const typeIcon: Record<string, typeof BookOpen> = {
  ebook: BookOpen,
  course: Sparkles,
  template: FileText,
  coloring_book: Palette,
};

const statusColors: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-600',
  draft: 'bg-amber-500/10 text-amber-600',
  generating: 'bg-blue-500/10 text-blue-600',
};

type Tab = 'dashboard' | 'sales' | 'ai-studio' | 'viral-tools';

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'sales', label: 'My Sales', icon: ShoppingBag },
    { key: 'ai-studio', label: 'AI Studio', icon: Sparkles },
    { key: 'viral-tools', label: 'Viral Tools', icon: Zap },
  ];

  return (
    <div className="bg-background min-h-screen">
      <SEOHead title="Dashboard Preview — SiteViral" noindex />

      {/* Top nav bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container max-w-6xl px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <img src="/logo-s.png" alt="SiteViral" className="h-8 w-8" />
              <span className="font-bold text-sm">SiteViral</span>
              <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Creator Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">GA</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold">Growth Academy</p>
                <p className="text-[10px] text-muted-foreground">creator@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container max-w-6xl px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-6xl px-4 py-6 space-y-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'sales' && <SalesTab />}
        {activeTab === 'ai-studio' && <AIStudioTab />}
        {activeTab === 'viral-tools' && <ViralToolsTab />}

        {/* Discreet disclaimer */}
        <p className="text-[9px] text-muted-foreground/40 text-center pt-4">
          Demo data for illustration purposes
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════ DASHBOARD TAB ═══════════════════════ */
function DashboardTab() {
  const stats = [
    { label: 'Total Revenue', value: fmt(DEMO_METRICS.totalRevenue), growth: `+${DEMO_METRICS.revenueGrowth}%`, icon: TrendingUp, color: 'primary' as const },
    { label: 'Transactions', value: DEMO_METRICS.totalTransactions.toLocaleString(), growth: `+${DEMO_METRICS.transactionGrowth}%`, icon: ShoppingBag, color: 'emerald' as const },
    { label: 'Customers', value: DEMO_METRICS.totalCustomers.toLocaleString(), growth: `+${DEMO_METRICS.customerGrowth}%`, icon: Users, color: 'blue' as const },
    { label: 'Products', value: DEMO_METRICS.totalProducts.toString(), growth: '+12%', icon: Package, color: 'amber' as const },
  ];

  const colorMap = {
    primary: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/20', growth: 'text-emerald-600' },
    emerald: { bg: 'bg-emerald-500/8', text: 'text-emerald-500', border: 'border-emerald-500/20', growth: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500/8', text: 'text-blue-500', border: 'border-blue-500/20', growth: 'text-emerald-600' },
    amber: { bg: 'bg-amber-500/8', text: 'text-amber-500', border: 'border-amber-500/20', growth: 'text-emerald-600' },
  };

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const c = colorMap[s.color];
          return (
            <motion.div key={s.label} {...fadeUp(i * 0.08)}
              className={cn('rounded-2xl border p-4 sm:p-5', c.border)}
            >
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', c.bg)}>
                <s.icon className={cn('h-4 w-4', c.text)} />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold mt-0.5 tracking-tight">{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                <span className={cn('text-[10px] font-semibold', c.growth)}>{s.growth}</span>
                <span className="text-[10px] text-muted-foreground">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <motion.div {...fadeUp(0.3)}>
        <PremiumCard variant="default" className="p-0 overflow-hidden">
          <div className="p-5 pb-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-bold">Revenue Overview</h3>
                <p className="text-[10px] text-muted-foreground">Last 12 months performance</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-[10px] font-bold">+{DEMO_METRICS.growthPercent}%</span>
              </div>
            </div>
          </div>
          <div className="h-[220px] sm:h-[260px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEMO_REVENUE_CHART} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }}
                  formatter={(value: number) => [fmt(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>
      </motion.div>

      {/* Recent Sales */}
      <motion.div {...fadeUp(0.4)}>
        <DashboardSection title="Recent Sales" icon={ShoppingBag}>
          <PremiumCard variant="default" noPadding className="divide-y divide-border">
            {DEMO_SALES.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center gap-3 p-3.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{sale.product}</p>
                  <p className="text-[10px] text-muted-foreground">{sale.buyer} · {sale.org}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-600">{fmt(sale.price, sale.currency)}</p>
                  <p className="text-[9px] text-muted-foreground">{new Date(sale.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </PremiumCard>
        </DashboardSection>
      </motion.div>

      {/* Ambassador Stats */}
      <motion.div {...fadeUp(0.5)}>
        <DashboardSection title="Ambassador Program" icon={Share2}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Earned', value: fmt(DEMO_AMBASSADOR.totalEarned), color: 'text-emerald-500' },
              { label: 'Clicks', value: DEMO_AMBASSADOR.totalClicks.toLocaleString(), color: 'text-blue-500' },
              { label: 'Conversions', value: DEMO_AMBASSADOR.totalConversions.toLocaleString(), color: 'text-primary' },
              { label: 'Conv. Rate', value: `${DEMO_AMBASSADOR.conversionRate}%`, color: 'text-amber-500' },
            ].map((s, i) => (
              <motion.div key={s.label} {...fadeUp(0.5 + i * 0.06)}
                className="text-center p-3 rounded-xl border border-border bg-card"
              >
                <p className={cn('text-lg font-extrabold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <PremiumCard variant="default" noPadding className="mt-3 divide-y divide-border">
            {DEMO_AMBASSADOR.topAmbassadors.slice(0, 3).map((amb, i) => (
              <div key={amb.name} className="flex items-center gap-3 p-3.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{amb.name}</p>
                  <p className="text-[10px] text-muted-foreground">{amb.sales} sales</p>
                </div>
                <span className="text-xs font-bold text-emerald-600">{fmt(amb.earned)}</span>
              </div>
            ))}
          </PremiumCard>
        </DashboardSection>
      </motion.div>
    </>
  );
}

/* ═══════════════════════ SALES TAB ═══════════════════════ */
function SalesTab() {
  return (
    <>
      {/* Summary bar */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Sales', value: fmt(DEMO_METRICS.totalRevenue), sub: `${DEMO_METRICS.totalTransactions} transactions` },
          { label: 'This Month', value: fmt(2_130_000), sub: '+32% vs last month' },
          { label: 'Avg. Order', value: fmt(6_950), sub: 'per transaction' },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp(i * 0.08)}
            className="rounded-2xl border border-border p-4 bg-card"
          >
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold mt-1 tracking-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Transaction list */}
      <motion.div {...fadeUp(0.2)}>
        <DashboardSection title="All Transactions" icon={ShoppingBag}>
          <PremiumCard variant="default" noPadding className="overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="col-span-4">Product</span>
              <span className="col-span-2">Buyer</span>
              <span className="col-span-2">Organization</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-2 text-right">Date</span>
            </div>
            {DEMO_SALES.map((sale) => {
              const Icon = typeIcon[sale.type] || BookOpen;
              return (
                <div key={sale.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{sale.product}</p>
                      <p className="text-[9px] text-muted-foreground capitalize">{sale.type}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs truncate">{sale.buyer}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground truncate">{sale.org}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-bold text-emerald-600">{fmt(sale.price, sale.currency)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] text-muted-foreground">{new Date(sale.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </PremiumCard>
        </DashboardSection>
      </motion.div>
    </>
  );
}

/* ═══════════════════════ AI STUDIO TAB ═══════════════════════ */
function AIStudioTab() {
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Projects', value: DEMO_AI_PROJECTS.length.toString(), icon: FileText, color: 'text-primary bg-primary/8' },
          { label: 'Published', value: DEMO_AI_PROJECTS.filter(p => p.status === 'published').length.toString(), icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/8' },
          { label: 'Total Pages', value: DEMO_AI_PROJECTS.reduce((a, p) => a + p.pages, 0).toString(), icon: BookOpen, color: 'text-blue-500 bg-blue-500/8' },
          { label: 'In Progress', value: DEMO_AI_PROJECTS.filter(p => p.status !== 'published').length.toString(), icon: Clock, color: 'text-amber-500 bg-amber-500/8' },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp(i * 0.06)}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card"
          >
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', s.color.split(' ')[1])}>
              <s.icon className={cn('h-5 w-5', s.color.split(' ')[0])} />
            </div>
            <div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Project list */}
      <motion.div {...fadeUp(0.2)}>
        <DashboardSection title="My Projects" icon={PenLine}>
          <div className="space-y-2">
            {DEMO_AI_PROJECTS.map((proj, i) => {
              const Icon = typeIcon[proj.type] || BookOpen;
              return (
                <motion.div key={proj.id} {...fadeUp(0.2 + i * 0.06)}>
                  <PremiumCard variant="default" noPadding className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">{proj.title}</p>
                          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full capitalize', statusColors[proj.status])}>
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {proj.pages > 0 ? `${proj.pages} pages · ` : ''}{proj.type.replace('_', ' ')} · Created {new Date(proj.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        {proj.status === 'generating' && (
                          <div className="mt-2">
                            <Progress value={63} className="h-1.5" />
                            <p className="text-[9px] text-muted-foreground mt-1">Generating... 63%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              );
            })}
          </div>
        </DashboardSection>
      </motion.div>
    </>
  );
}

/* ═══════════════════════ VIRAL TOOLS TAB ═══════════════════════ */
function ViralToolsTab() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Shares', value: DEMO_VIRAL_TOOLS.totalShares.toLocaleString(), icon: Share2, color: 'primary' },
          { label: 'Referral Links', value: DEMO_VIRAL_TOOLS.referralLinks.toString(), icon: Zap, color: 'emerald' },
          { label: 'Emails Sent', value: DEMO_VIRAL_TOOLS.emailsSent.toLocaleString(), icon: Users, color: 'blue' },
          { label: 'Landing Pages', value: DEMO_VIRAL_TOOLS.landingPages.toString(), icon: FileText, color: 'amber' },
        ].map((s, i) => {
          const colorMap: Record<string, { bg: string; text: string; border: string }> = {
            primary: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/20' },
            emerald: { bg: 'bg-emerald-500/8', text: 'text-emerald-500', border: 'border-emerald-500/20' },
            blue: { bg: 'bg-blue-500/8', text: 'text-blue-500', border: 'border-blue-500/20' },
            amber: { bg: 'bg-amber-500/8', text: 'text-amber-500', border: 'border-amber-500/20' },
          };
          const c = colorMap[s.color];
          return (
            <motion.div key={s.label} {...fadeUp(i * 0.06)}
              className={cn('rounded-2xl border p-4', c.border)}
            >
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', c.bg)}>
                <s.icon className={cn('h-4 w-4', c.text)} />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Top performing links */}
      <motion.div {...fadeUp(0.2)}>
        <DashboardSection title="Top Performing Links" icon={Zap}>
          <PremiumCard variant="default" noPadding className="divide-y divide-border">
            {[
              { name: 'Les 7 Clés du Succès Digital', clicks: 3_240, conversions: 187, rate: '5.8%' },
              { name: 'Masterclass Marketing', clicks: 1_890, conversions: 98, rate: '5.2%' },
              { name: 'Template Business Plan', clicks: 1_450, conversions: 62, rate: '4.3%' },
              { name: 'Guide Entrepreneuriat', clicks: 980, conversions: 34, rate: '3.5%' },
            ].map((link) => (
              <div key={link.name} className="flex items-center gap-3 p-3.5">
                <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{link.name}</p>
                  <p className="text-[10px] text-muted-foreground">{link.clicks.toLocaleString()} clicks · {link.conversions} conversions</p>
                </div>
                <span className="text-xs font-bold text-emerald-600">{link.rate}</span>
              </div>
            ))}
          </PremiumCard>
        </DashboardSection>
      </motion.div>
    </>
  );
}
