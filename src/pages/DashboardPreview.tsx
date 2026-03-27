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
import { generateDemoData, type DemoData } from '@/lib/demoDataGenerator';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SEOHead } from '@/components/seo/SEOHead';
import { useState, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSeededRandom, seededPick, seededInt } from '@/lib/seeded-random';

const fmtCurrency = (n: number, currency = 'XOF') => {
  try {
    return new Intl.NumberFormat(currency === 'USD' || currency === 'GBP' || currency === 'CAD' ? 'en-US' : 'fr-FR', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString()} ${currency}`;
  }
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const typeIcon: Record<string, typeof BookOpen> = {
  ebook: BookOpen,
  course: Sparkles,
  coloring_book: Palette,
};

const statusColors: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-600',
  draft: 'bg-amber-500/10 text-amber-600',
  generating: 'bg-blue-500/10 text-blue-600',
};

type Tab = 'dashboard' | 'sales' | 'ai-studio' | 'viral-tools';

// DiceBear avatar URL helper
const avatarUrl = (seed: string, style = 'thumbs') =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<DemoData>(() => generateDemoData());
  const [seed, setSeed] = useState(0);

  const handleRandomize = useCallback(() => {
    setData(generateDemoData());
    setSeed(s => s + 1);
  }, []);

  // Derive user dashboard stats FROM data so everything matches
  const userDemo = useMemo(() => {
    const rng = createSeededRandom(seed + 42);
    const PERSON_NAMES = [
      'Kouadio Amani', 'Adjoua Bintou', 'Yao Konan', 'Awa Traoré', 'Sékou Diallo',
      'Fatoumata Koné', 'Moussa Bakayoko', 'Aminata Coulibaly', 'Lacina Ouattara', 'Djénéba Sangaré',
      'Abou Sidibé', 'Mariam Diabaté', 'Issouf Touré', 'Rokia Bamba', 'Drissa Kouyaté',
      'Nassénéba Fofana', 'Brahima Soro', 'Karidja Dembélé', 'Tiémoko Yéo', 'Salimata Cissé',
      'Koné Vassiriki', 'Aïcha Doumbia', 'Mamadou Kaboré', 'Sita Ouédraogo', 'Bonaventure Kassi',
      'Élise Gnangoran', 'Hervé Koffi', 'Clarisse Ahoussi', 'Stéphane Aké', 'Bérénice Tanoh',
      'Wilfried Eboué', 'Nadège Assi', 'Ghislain Tano', 'Sandrine Koua', 'Arnaud Brou',
      'Chanceline Yapi', 'Parfait Gogué', 'Edwige Tia', 'Modeste Kra', 'Viviane Guéi',
      'Ousmane Ndoye', 'Khady Diop', 'Ibrahima Ndiaye', 'Astou Seck', 'Pape Mbow',
      'Ndeye Fatou Sarr', 'Aliou Bâ', 'Coumba Tall', 'Cheikh Mbaye', 'Rama Gueye',
    ];
    const personName = seededPick(PERSON_NAMES, rng);

    const purchases = seededInt(2, 10, rng);
    const donationsMade = seededInt(0, 5, rng);
    const commCount = seededInt(1, 6, rng);
    const salesCount = data.metrics.totalTransactions;

    // Sales revenue = totalRevenue minus donations
    const salesRevenue = data.metrics.totalRevenue - data.donations.totalReceived;
    const commPercent = seededInt(3, 12, rng);
    const commAmount = Math.round(salesRevenue * commPercent / 100);

    // Donations received comes directly from data.donations
    const donReceived = data.donations.totalReceived;
    const donReceivedCount = data.donations.donationCount;

    // Total revenue = data.metrics.totalRevenue (sales + donations) — matches KPI card exactly
    const totalRevenue = data.metrics.totalRevenue;

    return {
      personName, communityName: data.orgName,
      purchases, donations: donationsMade, commCount, commAmount,
      salesCount, salesAmount: salesRevenue,
      donReceived, donReceivedCount,
      totalRevenue,
    };
  }, [data, seed]);

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
            <div className="flex items-center gap-3">
              <img src={avatarUrl(data.orgName, 'initials')} alt={data.orgName} className="h-8 w-8 rounded-full bg-muted" />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold">{data.orgName}</p>
                <p className="text-[10px] text-muted-foreground">creator@example.com</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRandomize} className="gap-2 ml-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Randomize
              </Button>
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
        {activeTab === 'dashboard' && (
          <>
            {/* User Dashboard Simulation */}
            <motion.div {...fadeUp(0)} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <img src={avatarUrl(data.orgName)} alt={data.orgName} className="h-12 w-12 rounded-full bg-muted" />
                <div>
                  <h2 className="text-lg font-bold">
                    {Math.random() > 0.5 ? 'Bonjour' : 'Good morning'}, {data.orgName} 👋
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {data.orgType === 'church' ? 'Espace communauté' : 'Espace entreprise'} · {userDemo.personName}
                  </p>
                </div>
              </div>

              {/* Row 1: Activity */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { value: userDemo.purchases.toString(), label: 'Achats', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { value: userDemo.donReceivedCount.toString(), label: 'Dons reçus', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { value: fmtCurrency(userDemo.commAmount, data.orgCurrency.code), label: 'Commissions', sub: `${userDemo.commCount} commissions`, color: 'text-violet-600 bg-violet-50 border-violet-200' },
                ].map((s) => (
                  <div key={s.label} className={cn('rounded-xl border p-3 text-center', s.color)}>
                    <p className="text-lg sm:text-xl font-extrabold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    {s.sub && <p className="text-[9px] text-muted-foreground">{s.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Row 2: Revenue */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: fmtCurrency(userDemo.salesAmount, data.orgCurrency.code), label: 'Sales', sub: `${userDemo.salesCount} sales`, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { value: fmtCurrency(userDemo.donReceived, data.orgCurrency.code), label: 'Received', sub: `${userDemo.donReceivedCount} donations`, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  { value: fmtCurrency(userDemo.totalRevenue, data.orgCurrency.code), label: 'Total revenue', sub: `${userDemo.salesCount} sales • ${userDemo.donReceivedCount} donations • ${userDemo.commCount} commissions`, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                ].map((s) => (
                  <div key={s.label} className={cn('rounded-xl border p-3 text-center', s.color)}>
                    <p className="text-lg sm:text-xl font-extrabold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    {s.sub && <p className="text-[9px] text-muted-foreground">{s.sub}</p>}
                  </div>
                ))}
              </div>
            </motion.div>

            <DashboardTab data={data} />
          </>
        )}
        {activeTab === 'sales' && <SalesTab data={data} />}
        {activeTab === 'ai-studio' && <AIStudioTab data={data} />}
        {activeTab === 'viral-tools' && <ViralToolsTab data={data} />}

        <p className="text-[9px] text-muted-foreground/40 text-center pt-4">
          Dashboard Preview · Superadmin only
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════ DASHBOARD TAB ═══════════════════════ */
function DashboardTab({ data }: { data: DemoData }) {
  const { metrics, revenueChart, sales, ambassador, orgCurrency } = data;
  const cur = orgCurrency.code;

  const stats = [
    { label: 'Total Revenue', value: fmtCurrency(metrics.totalRevenue, cur), growth: `+${metrics.revenueGrowth}%`, icon: TrendingUp, color: 'primary' as const },
    { label: 'Transactions', value: metrics.totalTransactions.toLocaleString(), growth: `+${metrics.transactionGrowth}%`, icon: ShoppingBag, color: 'emerald' as const },
    { label: 'Customers', value: metrics.totalCustomers.toLocaleString(), growth: `+${metrics.customerGrowth}%`, icon: Users, color: 'blue' as const },
    { label: 'Products', value: metrics.totalProducts.toString(), growth: '+12%', icon: Package, color: 'amber' as const },
  ];

  const colorMap = {
    primary: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/20', growth: 'text-emerald-600' },
    emerald: { bg: 'bg-emerald-500/8', text: 'text-emerald-500', border: 'border-emerald-500/20', growth: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500/8', text: 'text-blue-500', border: 'border-blue-500/20', growth: 'text-emerald-600' },
    amber: { bg: 'bg-amber-500/8', text: 'text-amber-500', border: 'border-amber-500/20', growth: 'text-emerald-600' },
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const c = colorMap[s.color];
          return (
            <motion.div key={s.label} {...fadeUp(i * 0.08)} className={cn('rounded-2xl border p-4 sm:p-5', c.border)}>
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
                <p className="text-[10px] text-muted-foreground">Last 3 months (Jan–Mar) · {cur}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-[10px] font-bold">+{metrics.growthPercent}%</span>
              </div>
            </div>
          </div>
          <div className="h-[220px] sm:h-[260px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                    return v.toString();
                  }}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }}
                  formatter={(value: number) => [fmtCurrency(value, cur), 'Revenue']}
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
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center gap-3 p-3.5">
                <img src={avatarUrl(sale.buyer)} alt={sale.buyer} className="h-9 w-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{sale.product}</p>
                  <p className="text-[10px] text-muted-foreground">{sale.buyer} · {sale.buyerFlag} {sale.buyerCity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-600">{fmtCurrency(sale.price, cur)}</p>
                  <p className="text-[9px] text-muted-foreground">{new Date(sale.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </PremiumCard>
        </DashboardSection>
      </motion.div>

      {/* Ambassador */}
      <motion.div {...fadeUp(0.5)}>
        <DashboardSection title="Ambassador Program" icon={Share2}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Earned', value: fmtCurrency(ambassador.totalEarned, ambassador.currency), color: 'text-emerald-500' },
              { label: 'Clicks', value: ambassador.totalClicks.toLocaleString(), color: 'text-blue-500' },
              { label: 'Conversions', value: ambassador.totalConversions.toLocaleString(), color: 'text-primary' },
              { label: 'Conv. Rate', value: `${ambassador.conversionRate}%`, color: 'text-amber-500' },
            ].map((s, i) => (
              <motion.div key={s.label} {...fadeUp(0.5 + i * 0.06)} className="text-center p-3 rounded-xl border border-border bg-card">
                <p className={cn('text-lg font-extrabold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <PremiumCard variant="default" noPadding className="mt-3 divide-y divide-border">
            {ambassador.topAmbassadors.slice(0, 3).map((amb, i) => (
              <div key={amb.name + i} className="flex items-center gap-3 p-3.5">
                <img src={avatarUrl(amb.name)} alt={amb.name} className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{amb.name}</p>
                  <p className="text-[10px] text-muted-foreground">{amb.sales} sales</p>
                </div>
                <span className="text-xs font-bold text-emerald-600">{fmtCurrency(amb.earned, ambassador.currency)}</span>
              </div>
            ))}
          </PremiumCard>
        </DashboardSection>
      </motion.div>
    </>
  );
}

/* ═══════════════════════ SALES TAB ═══════════════════════ */
function SalesTab({ data }: { data: DemoData }) {
  const { metrics, sales, orgCurrency } = data;
  const cur = orgCurrency.code;
  const thisMonth = data.revenueChart[data.revenueChart.length - 1]?.revenue ?? 0;
  const avgOrder = metrics.totalTransactions > 0 ? Math.round(metrics.totalRevenue / metrics.totalTransactions) : 0;

  return (
    <>
      <motion.div {...fadeUp(0)} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Sales', value: fmtCurrency(metrics.totalRevenue, cur), sub: `${metrics.totalTransactions} transactions` },
          { label: 'This Month', value: fmtCurrency(thisMonth, cur), sub: `+${metrics.revenueGrowth}% vs last month` },
          { label: 'Avg. Order', value: fmtCurrency(avgOrder, cur), sub: 'per transaction' },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp(i * 0.08)} className="rounded-2xl border border-border p-4 bg-card">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold mt-1 tracking-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div {...fadeUp(0.2)}>
        <DashboardSection title="All Transactions" icon={ShoppingBag}>
          <PremiumCard variant="default" noPadding className="overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="col-span-4">Product</span>
              <span className="col-span-2">Buyer</span>
              <span className="col-span-2">Organization</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-2 text-right">Date</span>
            </div>
            {sales.map((sale) => {
              const Icon = typeIcon[sale.type] || BookOpen;
              return (
                <div key={sale.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{sale.product}</p>
                      <p className="text-[9px] text-muted-foreground capitalize">{sale.typeLabel}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs truncate">{sale.buyer}</p>
                    <p className="text-[9px] text-muted-foreground">{sale.buyerFlag} {sale.buyerCity}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground truncate">{sale.org}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-bold text-emerald-600">{fmtCurrency(sale.price, cur)}</span>
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
function AIStudioTab({ data }: { data: DemoData }) {
  const { aiProjects } = data;
  const published = aiProjects.filter(p => p.status === 'published').length;
  const totalPages = aiProjects.reduce((a, p) => a + p.pages, 0);
  const inProgress = aiProjects.filter(p => p.status !== 'published').length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Projects', value: aiProjects.length.toString(), icon: FileText, color: 'text-primary bg-primary/8' },
          { label: 'Published', value: published.toString(), icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/8' },
          { label: 'Total Pages', value: totalPages.toString(), icon: BookOpen, color: 'text-blue-500 bg-blue-500/8' },
          { label: 'In Progress', value: inProgress.toString(), icon: Clock, color: 'text-amber-500 bg-amber-500/8' },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp(i * 0.06)} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
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

      <motion.div {...fadeUp(0.2)}>
        <DashboardSection title="My Projects" icon={PenLine}>
          <div className="space-y-2">
            {aiProjects.map((proj, i) => {
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
                        {proj.status === 'generating' && proj.progress && (
                          <div className="mt-2">
                            <Progress value={proj.progress} className="h-1.5" />
                            <p className="text-[9px] text-muted-foreground mt-1">Generating... {proj.progress}%</p>
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
function ViralToolsTab({ data }: { data: DemoData }) {
  const { viralTools } = data;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Shares', value: viralTools.totalShares.toLocaleString(), icon: Share2, color: 'primary' },
          { label: 'Referral Links', value: viralTools.referralLinks.toString(), icon: Zap, color: 'emerald' },
          { label: 'Emails Sent', value: viralTools.emailsSent.toLocaleString(), icon: Users, color: 'blue' },
          { label: 'Landing Pages', value: viralTools.landingPages.toString(), icon: FileText, color: 'amber' },
        ].map((s, i) => {
          const colorMap: Record<string, { bg: string; text: string; border: string }> = {
            primary: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/20' },
            emerald: { bg: 'bg-emerald-500/8', text: 'text-emerald-500', border: 'border-emerald-500/20' },
            blue: { bg: 'bg-blue-500/8', text: 'text-blue-500', border: 'border-blue-500/20' },
            amber: { bg: 'bg-amber-500/8', text: 'text-amber-500', border: 'border-amber-500/20' },
          };
          const c = colorMap[s.color];
          return (
            <motion.div key={s.label} {...fadeUp(i * 0.06)} className={cn('rounded-2xl border p-4', c.border)}>
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', c.bg)}>
                <s.icon className={cn('h-4 w-4', c.text)} />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div {...fadeUp(0.2)}>
        <DashboardSection title="Top Performing Links" icon={Zap}>
          <PremiumCard variant="default" noPadding className="divide-y divide-border">
            {viralTools.topLinks.map((link) => (
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
