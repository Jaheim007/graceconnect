import { useState, useMemo } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, ExternalLink, AlertTriangle, ChevronRight,
  TrendingUp, DollarSign, Percent, ArrowUpRight, Rocket, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OrgActivationChecklist } from '@/components/admin/OrgActivationChecklist';
import { ExpressSetupButton } from '@/components/admin/ExpressSetupButton';
import { YouTubeImportButton } from '@/components/admin/YouTubeImportButton';
import { RevenueSimulator } from '@/components/admin/RevenueSimulator';
import { QuickStartWizard } from '@/components/onboarding/QuickStartWizard';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { OrgProgressScore } from '@/components/admin/OrgProgressScore';
import { SmartNextAction } from '@/components/admin/SmartNextAction';
import { WeeklyMissions } from '@/components/admin/WeeklyMissions';
import { OrgBenchmark } from '@/components/admin/OrgBenchmark';
import { WhatsAppShareNudge } from '@/components/admin/WhatsAppShareNudge';
import { SmartProductIdeas } from '@/components/admin/SmartProductIdeas';
import { MonthlyChallenges } from '@/components/admin/MonthlyChallenges';
import { AdminRevenueGoals } from '@/components/admin/AdminRevenueGoals';
import { ContentSuggestionEngine } from '@/components/admin/ContentSuggestionEngine';
import { SmartPricingHelper } from '@/components/admin/SmartPricingHelper';
import { SmartCRMInsights } from '@/components/admin/SmartCRMInsights';
import { AbandonedCartRecovery } from '@/components/admin/AbandonedCartRecovery';
import { BundleManager } from '@/components/admin/BundleManager';
import { RevenueForecast } from '@/components/admin/RevenueForecast';
import { EngagementHeatmap } from '@/components/admin/EngagementHeatmap';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { CustomerLifetimeValue } from '@/components/admin/CustomerLifetimeValue';
import { RevenueAttribution } from '@/components/admin/RevenueAttribution';
import { AffiliateLeaderboard } from '@/components/admin/AffiliateLeaderboard';
import { SmartReEngagement } from '@/components/admin/SmartReEngagement';
import { useBehavioralNotifications } from '@/hooks/useBehavioralNotifications';
import { useI18n } from '@/i18n/I18nContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { downloadCSV } from '@/lib/csvExport';
import { downloadDashboardPDF } from '@/lib/pdfExport';

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminDashboard() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showQuickStart, setShowQuickStart] = useState(false);
  useBehavioralNotifications(); // Fire behavioral in-app notifications
  const { data: media = [] } = useOrgMedia(currentOrg?.id, false);
  const { data: announcements = [] } = useOrgAnnouncements(currentOrg?.id, false);
  const { data: events = [] } = useOrgEvents(currentOrg?.id, false);
  const { data: campaigns = [] } = useOrgCampaigns(currentOrg?.id, false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: members = [] } = useOrgMembers(currentOrg?.id);

  const { data: donationTxns = [] } = useQuery({
    queryKey: ['admin-donations-rev', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('donations').select('amount, organization_amount, affiliate_commission, platform_fee').eq('organization_id', currentOrg.id).eq('status', 'completed');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const { data: purchaseTxns = [] } = useQuery({
    queryKey: ['admin-purchases-rev', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('product_purchases').select('amount, organization_amount, affiliate_commission, platform_fee').eq('organization_id', currentOrg.id).eq('status', 'completed');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  // Top products
  const { data: topProducts = [] } = useQuery({
    queryKey: ['admin-top-products', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('digital_products').select('id, title, sales_count, price, currency')
        .eq('organization_id', currentOrg.id).eq('is_published', true)
        .order('sales_count', { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  // Daily metrics for chart
  const { data: dailyMetrics = [] } = useQuery({
    queryKey: ['admin-daily-metrics', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('org_daily_metrics')
        .select('metric_date, revenue, transactions_count, new_members, products_sold, donations_count')
        .eq('organization_id', currentOrg.id)
        .order('metric_date', { ascending: true })
        .limit(30);
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const chartData = useMemo(() =>
    dailyMetrics.map((d: any) => ({
      date: new Date(d.metric_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      revenue: d.revenue || 0,
      transactions: d.transactions_count || 0,
      members: d.new_members || 0,
    })),
    [dailyMetrics]
  );

  const allTxns = [...donationTxns, ...purchaseTxns];
  const totalRevenue = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalOrgReceived = allTxns.reduce((s, t) => s + (t.organization_amount || 0), 0);
  const totalAffiliateCommission = allTxns.reduce((s, t) => s + (t.affiliate_commission || 0), 0);
  const totalPlatformFee = allTxns.reduce((s, t) => s + (t.platform_fee || 0), 0);
  const commissionRate = currentOrg?.affiliation_commission_percent ?? 10;
  const conversionRate = allTxns.length > 0 ? ((allTxns.length / Math.max(members.length, 1)) * 100).toFixed(1) : '0';

  const handleExportCSV = () => {
    const rows = allTxns.map((t: any) => ({
      montant: t.amount || 0,
      reçu_org: t.organization_amount || 0,
      commission_affilié: t.affiliate_commission || 0,
      frais_plateforme: t.platform_fee || 0,
    }));
    downloadCSV(rows, `revenus-${currentOrg?.slug || 'org'}`);
  };

  const handleExportPDF = () => {
    downloadDashboardPDF({
      orgName: currentOrg?.name || 'Organisation',
      logoUrl: currentOrg?.logo_url || undefined,
      currency: orgCurrency,
      stats: [
        { label: 'Revenus totaux', value: fmt(totalRevenue, orgCurrency), color: '#3b82f6' },
        { label: 'Reçu org', value: fmt(totalOrgReceived, orgCurrency), color: '#10b981' },
        { label: 'Commissions', value: fmt(totalAffiliateCommission, orgCurrency), color: '#f59e0b' },
        { label: 'Frais plateforme', value: fmt(totalPlatformFee, orgCurrency), color: '#94a3b8' },
      ],
      revenueData: chartData.map((d: any) => ({ label: d.date, value: d.revenue })),
      topProducts: topProducts.map((p: any) => ({ title: p.title, sales: p.sales_count || 0, revenue: (p.sales_count || 0) * (p.price || 0) })),
      transactions: allTxns.map((t: any) => ({
        montant: t.amount || 0,
        reçu_org: t.organization_amount || 0,
        commission_affilié: t.affiliate_commission || 0,
        frais_plateforme: t.platform_fee || 0,
      })),
    });
  };

  const stats = [
    { label: t('admin.media'), value: media.length, published: media.filter(m => m.is_published).length, icon: Play, to: '/admin/media', colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: t('admin.announcements'), value: announcements.length, published: announcements.filter(a => a.is_published).length, icon: Megaphone, to: '/admin/announcements', colorClass: 'text-primary bg-primary/10 border-primary/20' },
    { label: t('admin.events'), value: events.length, published: events.filter(e => e.is_published).length, icon: CalendarDays, to: '/admin/events', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: t('admin.members'), value: members.length, published: members.length, icon: Users, to: '/admin/members', colorClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { label: t('admin.campaigns'), value: campaigns.length, published: campaigns.filter(c => c.is_published).length, icon: Heart, to: '/admin/campaigns', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { label: t('admin.products'), value: products.length, published: products.filter(p => p.is_published).length, icon: ShoppingBag, to: '/admin/products', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ];

  const quickActions = [
    { label: t('admin.new_media'), to: '/admin/media/new', icon: Play },
    { label: t('admin.new_announcement'), to: '/admin/announcements/new', icon: Megaphone },
    { label: t('admin.new_event'), to: '/admin/events/new', icon: CalendarDays },
    { label: t('admin.new_campaign'), to: '/admin/campaigns/new', icon: Heart },
    { label: t('admin.new_product'), to: '/admin/products/new', icon: ShoppingBag },
    { label: t('admin.manage_members'), to: '/admin/members', icon: Users },
  ];

  const orgCurrency = currentOrg?.currency;
  const txCount = allTxns.length;
  const revenueCards = [
    { label: t('admin.total_sales'), value: fmt(totalRevenue, orgCurrency), sub: `${txCount} ${txCount > 1 ? t('admin.transactions') : t('admin.transaction')}`, icon: DollarSign, colorClass: 'from-primary/20 to-primary/5 border-primary/20' },
    { label: t('admin.org_received'), value: fmt(totalOrgReceived, orgCurrency), sub: t('admin.after_fees'), icon: TrendingUp, colorClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20' },
    { label: t('admin.affiliate_commissions'), value: fmt(totalAffiliateCommission, orgCurrency), sub: `${t('admin.rate')} : ${commissionRate}%`, icon: Percent, colorClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/20' },
    { label: t('admin.platform_fees'), value: fmt(totalPlatformFee, orgCurrency), sub: `${currentOrg?.platform_fee_percent ?? 10}%`, icon: DollarSign, colorClass: 'from-muted to-muted/50 border-border' },
  ];

  return (
    <div className="space-y-6">
      <QuickStartWizard open={showQuickStart} onClose={() => setShowQuickStart(false)} />
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('admin.overview_of')} <span className="font-medium text-foreground">{currentOrg?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1.5 text-xs h-8 sm:h-9">
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5 text-xs h-8 sm:h-9">
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> PDF
          </Button>
          <ExpressSetupButton />
          <YouTubeImportButton />
          <Button size="sm" variant="outline" onClick={() => setShowQuickStart(true)} className="gap-1.5 text-xs h-8 sm:h-9">
            <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('admin.quickstart')}
          </Button>
          <Button size="sm" asChild variant="outline" className="gap-1.5 text-xs h-8 sm:h-9">
            <a href={`https://siteviral.com/org/${currentOrg?.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('admin.public_page')}
            </a>
          </Button>
        </div>
      </div>

      {/* KYC Nudge — TOP priority banner */}
      {currentOrg?.kyc_status !== 'level1' && currentOrg?.kyc_status !== 'level2' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/30"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t('admin.complete_verification')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('admin.accept_payments')} — Les fonds sont retenus jusqu'à la vérification KYC.
              </p>
            </div>
          </div>
          <Button size="sm" variant="destructive" onClick={() => navigate('/admin/kyc')} className="h-8 text-xs shrink-0 w-full sm:w-auto gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> {t('admin.verify_account')}
          </Button>
        </motion.div>
      )}

      {/* Onboarding checklist (persistent, data-driven) */}
      <OnboardingChecklist />

      {/* Org Progress Score & Smart Next Action — side by side */}
      <div className="grid lg:grid-cols-2 gap-3">
        <OrgProgressScore />
        <SmartNextAction />
      </div>

      {/* Weekly Missions + WhatsApp Nudge */}
      <div className="grid lg:grid-cols-2 gap-3">
        <WeeklyMissions />
        <WhatsAppShareNudge />
      </div>

      {/* Activation checklist (legacy — will hide when score is 100%) */}
      <OrgActivationChecklist />

      {/* Quick actions — contextual cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">{t('admin.quick_actions')}</h2>
          <span className="text-[10px] text-muted-foreground">{quickActions.length} actions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickActions.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              onClick={() => navigate(a.to)}
              className="gap-2 text-xs h-12 justify-start hover:bg-primary/5 hover:border-primary/30 transition-all hover:-translate-y-0.5 group"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <a.icon className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <span className="truncate">{a.label}</span>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Revenue cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {revenueCards.map((card) => (
          <motion.div key={card.label} variants={fadeUp} className={cn('rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm', card.colorClass)}>
            <div className="flex items-center justify-between mb-3">
              <card.icon className="h-4 w-4 text-muted-foreground" />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
            <p className="text-xl font-bold mt-1">{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue chart */}
      {chartData.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-4">{t('admin.total_sales')} — 30 derniers jours</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Revenue Goals + Forecast */}
      <div className="grid lg:grid-cols-2 gap-3">
        <AdminRevenueGoals />
        <RevenueForecast />
      </div>

      {/* Simulator + Funnel */}
      <div className="grid lg:grid-cols-2 gap-3">
        <RevenueSimulator />
        <ConversionFunnel />
      </div>

      {/* Abandoned Carts + Bundles */}
      <div className="grid lg:grid-cols-2 gap-3">
        <AbandonedCartRecovery />
        <BundleManager />
      </div>

      {/* Content Suggestions + Benchmark */}
      <div className="grid lg:grid-cols-2 gap-3">
        <ContentSuggestionEngine />
        <OrgBenchmark />
      </div>

      {/* Smart Product Ideas + Pricing Helper */}
      <div className="grid lg:grid-cols-2 gap-3">
        <SmartProductIdeas />
        <SmartPricingHelper />
      </div>

      {/* Monthly Challenges + Engagement Heatmap */}
      <div className="grid lg:grid-cols-2 gap-3">
        <MonthlyChallenges />
        <EngagementHeatmap />
      </div>

      {/* CLV + Revenue Attribution */}
      <div className="grid lg:grid-cols-2 gap-3">
        <CustomerLifetimeValue />
        <RevenueAttribution />
      </div>

      {/* Affiliate Leaderboard + Re-engagement */}
      <div className="grid lg:grid-cols-2 gap-3">
        <AffiliateLeaderboard />
        <SmartReEngagement />
      </div>

      {/* CRM Intelligence */}
      <SmartCRMInsights />

      {/* Stats grid */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <motion.button
            key={s.label}
            variants={fadeUp}
            onClick={() => navigate(s.to)}
            className="group bg-card border border-border rounded-2xl p-4 shadow-card text-left hover:shadow-elevated transition-all hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border', s.colorClass)}>
                <s.icon className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-primary font-medium mt-1">{s.published} {t('admin.published')}{s.published !== 1 ? 's' : ''}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Conversion rate + Top products */}
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-2">{t('admin.conversion_rate')}</h2>
          <p className="text-3xl font-bold text-primary">{conversionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">{t('admin.members_to_buyers')}</p>
        </div>
        {topProducts.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">{t('admin.top_products')}</h2>
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
                  <span className="flex-1 truncate font-medium">{p.title}</span>
                  <span className="text-primary font-semibold">{p.sales_count || 0} {t('admin.sales')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
