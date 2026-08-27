import { useState, useMemo } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, ExternalLink, AlertTriangle, ChevronRight,
  TrendingUp, DollarSign, Percent, Rocket, Download,
  BarChart3, Zap
} from 'lucide-react';
import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { PremiumCard } from '@/components/ui/PremiumCard';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardSection } from '@/components/ui/DashboardSection';

import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { SmartNextAction } from '@/components/admin/SmartNextAction';
import { AdaptiveDashboard } from '@/components/siteviral/AdaptiveDashboard';
import { SetupChecklist } from '@/components/siteviral/SetupChecklist';
import { PlatformEvolvedBanner } from '@/components/dashboard/PlatformEvolvedBanner';
import { VideoImportButton } from '@/components/admin/VideoImportButton';
import { AIAnalyticsInsights } from '@/components/admin/AIAnalyticsInsights';

// Advanced tools — lazy-loaded section
import { WeeklyMissions } from '@/components/admin/WeeklyMissions';
import { WhatsAppShareNudge } from '@/components/admin/WhatsAppShareNudge';
import { AdminRevenueGoals } from '@/components/admin/AdminRevenueGoals';
import { RevenueForecast } from '@/components/admin/RevenueForecast';
import { AbandonedCartRecovery } from '@/components/admin/AbandonedCartRecovery';
import { BundleManager } from '@/components/admin/BundleManager';
import { ContentSuggestionEngine } from '@/components/admin/ContentSuggestionEngine';
import { OrgBenchmark } from '@/components/admin/OrgBenchmark';
import { SmartProductIdeas } from '@/components/admin/SmartProductIdeas';
import { SmartPricingHelper } from '@/components/admin/SmartPricingHelper';
import { RevenueSimulator } from '@/components/admin/RevenueSimulator';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { MonthlyChallenges } from '@/components/admin/MonthlyChallenges';
import { EngagementHeatmap } from '@/components/admin/EngagementHeatmap';
import { CustomerLifetimeValue } from '@/components/admin/CustomerLifetimeValue';
import { RevenueAttribution } from '@/components/admin/RevenueAttribution';
import { SmartReEngagement } from '@/components/admin/SmartReEngagement';
import { SmartCRMInsights } from '@/components/admin/SmartCRMInsights';
import { TimeSinceLastSale } from '@/components/admin/TimeSinceLastSale';
import { AdminGrowthSuggestions } from '@/components/growth/AdminGrowthSuggestions';
import { SmartPromotionSuggestions } from '@/components/admin/SmartPromotionSuggestions';
import { SmartCoach } from '@/components/smart/SmartCoach';

import { FirstSaleCelebration } from '@/components/admin/FirstSaleCelebration';
import { useBehavioralNotifications } from '@/hooks/useBehavioralNotifications';
import { useI18n } from '@/i18n/I18nContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { downloadCSV } from '@/lib/csvExport';
import { downloadDashboardPDF } from '@/lib/pdfExport';

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string) => formatCurrency(n, currency);

export default function AdminDashboard() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const [showAdvanced, setShowAdvanced] = useState(false);
  useBehavioralNotifications();

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
      date: new Date(d.metric_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }),
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
  const orgCurrency = currentOrg?.currency;
  const txCount = allTxns.length;

  const handleExportCSV = () => {
    const rows = allTxns.map((t: any) => ({
      montant: t.amount || 0,
      reçu_org: t.organization_amount || 0,
      commission_ambassadeur: t.affiliate_commission || 0,
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
        commission_ambassadeur: t.affiliate_commission || 0,
        frais_plateforme: t.platform_fee || 0,
      })),
    });
  };

  const contentStats = [
    { label: t('admin.media'), value: media.length, published: media.filter(m => m.is_published).length, icon: Play, to: '/admin/media', color: 'blue' as const },
    { label: t('admin.announcements'), value: announcements.length, published: announcements.filter(a => a.is_published).length, icon: Megaphone, to: '/admin/announcements', color: 'primary' as const },
    { label: t('admin.events'), value: events.length, published: events.filter(e => e.is_published).length, icon: CalendarDays, to: '/admin/events', color: 'emerald' as const },
    { label: t('admin.members'), value: members.length, published: members.length, icon: Users, to: '/admin/members', color: 'blue' as const },
    { label: t('admin.campaigns'), value: campaigns.length, published: campaigns.filter(c => c.is_published).length, icon: Heart, to: '/admin/campaigns', color: 'rose' as const },
    { label: t('admin.products'), value: products.length, published: products.filter(p => p.is_published).length, icon: ShoppingBag, to: '/admin/products', color: 'amber' as const },
  ];

  return (
    <div className="space-y-6">
      <PlatformEvolvedBanner />
      {/* ═══ HEADER — compact, one line ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('admin.overview_of')} <span className="font-medium text-foreground">{currentOrg?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 shrink-0">
            <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 shrink-0">
            <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> PDF
          </Button>
          <VideoImportButton />
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/create')} className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 shrink-0">
            <Rocket className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden xs:inline">{t('admin.quickstart')}</span><span className="xs:hidden">Start</span>
          </Button>
          <Button size="sm" asChild variant="outline" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 shrink-0">
            <a href={`https://siteviral.com/org/${currentOrg?.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">{t('admin.public_page')}</span><span className="sm:hidden">Page</span>
            </a>
          </Button>
        </div>
      </div>

      {/* ═══ ADAPTIVE DASHBOARD — SiteViral type + enabled features ═══ */}
      <AdaptiveDashboard />

      {/* ═══ SETUP CHECKLIST — feature activated → configured → public ═══ */}
      <SetupChecklist />

      {/* ═══ VERIFICATION BANNER — urgent ═══ */}
      {currentOrg?.kyc_status !== 'level1' && currentOrg?.kyc_status !== 'level2' && (
        <PremiumCard variant="default" className="!p-4 border-destructive/30 bg-destructive/5">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t('admin.complete_verification')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('admin.accept_payments')} — {isFr ? 'Les fonds sont retenus jusqu\'à la vérification.' : 'Funds are held until verification.'}
                </p>
              </div>
            </div>
            <Button size="sm" variant="destructive" onClick={() => navigate("/admin/settings?s=verification")} className="h-8 text-xs shrink-0 gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> {t('admin.verify_account')}
            </Button>
          </div>
        </PremiumCard>
      )}

      {/* ═══ FIRST SALE CELEBRATION ═══ */}
      <FirstSaleCelebration
        totalSales={txCount}
        orgName={currentOrg?.slug || undefined}
        topProductTitle={topProducts?.[0]?.title}
      />

      {/* ═══ ZONE 1 — REVENUE KPIs (the most important) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          icon={DollarSign} label={t('admin.total_sales')}
          renderIcon={<CurrencyIcon currency={orgCurrency} className="h-4 w-4 text-primary" />}
          value={fmt(totalRevenue, orgCurrency)}
          sub={`${txCount} ${txCount > 1 ? t('admin.transactions') : t('admin.transaction')}`}
          color="primary" delay={0}
        />
        <StatCard
          icon={TrendingUp} label={t('admin.org_received')}
          value={fmt(totalOrgReceived, orgCurrency)}
          sub={t('admin.after_fees')}
          color="emerald" delay={0.05}
        />
        <StatCard
          icon={Percent} label={t('admin.affiliate_commissions')}
          value={fmt(totalAffiliateCommission, orgCurrency)}
          sub={`${t('admin.rate')} : ${commissionRate}%`}
          color="amber" delay={0.1}
        />
        <StatCard
          icon={DollarSign} label={t('admin.platform_fees')}
          renderIcon={<CurrencyIcon currency={orgCurrency} className="h-4 w-4 text-muted-foreground" />}
          value={fmt(totalPlatformFee, orgCurrency)}
          sub={`${currentOrg?.platform_fee_percent ?? 10}%`}
          color="muted" delay={0.15}
        />
      </div>

      {/* ═══ ZONE 2 — CHART + TOP PRODUCTS (side by side) ═══ */}
      <div className="grid lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Revenue chart — takes 3/5 */}
        <PremiumCard variant="default" delay={0.1} className="lg:col-span-3">
          <h2 className="font-semibold text-sm mb-4">{t('admin.total_sales')} — {isFr ? '30 jours' : '30 days'}</h2>
          {chartData.length > 1 ? (
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
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              {isFr ? 'Les données apparaîtront après vos premières ventes' : 'Data will appear after your first sales'}
            </div>
          )}
        </PremiumCard>

        {/* Top products + conversion — takes 2/5 */}
        <div className="lg:col-span-2 space-y-4">
          <PremiumCard variant="default" delay={0.15}>
            <h2 className="font-semibold text-sm mb-3">{t('admin.top_products')}</h2>
            {topProducts.length > 0 ? (
              <div className="space-y-2.5">
                {topProducts.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-3 text-xs">
                    <span className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{i + 1}</span>
                    <span className="flex-1 truncate font-medium">{p.title}</span>
                    <span className="text-primary font-semibold whitespace-nowrap">{p.sales_count || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {isFr ? 'Aucun produit publié' : 'No published products'}
              </p>
            )}
          </PremiumCard>

          <PremiumCard variant="default" delay={0.2}>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{t('admin.conversion_rate')}</p>
            <p className="text-3xl font-bold text-primary mt-1">{conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t('admin.members_to_buyers')}</p>
          </PremiumCard>
        </div>
      </div>

      {/* ═══ ZONE 3 — SMART ACTIONS + AI INSIGHTS ═══ */}
      <SmartNextAction />
      <AIAnalyticsInsights />
      <TimeSinceLastSale />

      {/* ═══ ZONE 4 — ONBOARDING (collapsible) ═══ */}
      <DashboardSection
        title={isFr ? 'Guide de démarrage' : 'Getting started'}
        icon={Rocket}
        collapsible
        defaultCollapsed={txCount > 0}
      >
        <OnboardingChecklist />
        <SmartCoach />
        <AdminGrowthSuggestions />
      </DashboardSection>

      {/* ═══ ZONE 5 — CONTENT OVERVIEW (collapsible) ═══ */}
      <DashboardSection
        title={isFr ? 'Aperçu du contenu' : 'Content overview'}
        icon={BarChart3}
        collapsible
        defaultCollapsed={false}
        actions={
          <div className="flex gap-1.5">
            {[
              { label: isFr ? 'Nouveau média' : 'New media', to: '/admin/media/new', icon: Play },
              { label: isFr ? 'Nouveau produit' : 'New product', to: '/admin/products/new', icon: ShoppingBag },
            ].map(a => (
              <Button key={a.to} size="sm" variant="ghost" onClick={() => navigate(a.to)} className="h-7 text-xs gap-1 px-2">
                <a.icon className="h-3 w-3" /> {a.label}
              </Button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {contentStats.map((s, i) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              label={s.label}
              value={s.value}
              sub={`${s.published} ${t('admin.published')}${s.published !== 1 ? 's' : ''}`}
              color={s.color}
              onClick={() => navigate(s.to)}
              delay={i * 0.04}
            />
          ))}
        </div>
      </DashboardSection>

      {/* ═══ ZONE 6 — ABANDONED CARTS ═══ */}
      <AbandonedCartRecovery />

      {/* ═══ ZONE 7 — ADVANCED GROWTH TOOLS (collapsible) ═══ */}
      <DashboardSection
        title={isFr ? 'Outils de croissance avancés' : 'Advanced growth tools'}
        subtitle={isFr ? 'Objectifs, simulations, analytics et CRM' : 'Goals, simulations, analytics and CRM'}
        icon={Zap}
        collapsible
        defaultCollapsed={!showAdvanced}
      >
        <div className="space-y-4 pt-2">
          <div className="grid lg:grid-cols-2 gap-3">
            <AdminRevenueGoals />
            <RevenueForecast />
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <WeeklyMissions />
            <WhatsAppShareNudge />
          </div>
          <SmartPromotionSuggestions />
          <BundleManager />
          <div className="grid lg:grid-cols-2 gap-3">
            <RevenueSimulator />
            <ConversionFunnel />
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <SmartProductIdeas />
            <ContentSuggestionEngine />
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <SmartPricingHelper />
            <OrgBenchmark />
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <MonthlyChallenges />
            <EngagementHeatmap />
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <CustomerLifetimeValue />
            <RevenueAttribution />
          </div>
          <SmartReEngagement />
          <SmartCRMInsights />
        </div>
      </DashboardSection>
    </div>
  );
}
