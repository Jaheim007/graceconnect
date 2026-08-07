import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Package, Store, Share2, ArrowRight, BookOpen, Rocket, Zap, GraduationCap, Heart, Shield, Building2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardSection } from '@/components/ui/DashboardSection';

import PartnerPendingPopup from '@/components/partner/PartnerPendingPopup';
import { QuickStartPaths } from '@/components/growth/QuickStartPaths';
import { SmartNudge } from '@/components/growth/SmartNudge';
import { CommissionBanner } from '@/components/dashboard/CommissionBanner';
import { FirstSaleChecklist } from '@/components/dashboard/FirstSaleChecklist';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdaptiveLabels } from '@/hooks/useAdaptiveLabels';




export default function UserDashboard() {
  const { user, profile, isSuperadmin } = useAuth();
  const { userOrgs, currentOrg } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const hasOrgs = userOrgs.length > 0;
  const isFr = locale === 'fr';
  const { profile: userProfile } = useUserProfile();
  const labels = useAdaptiveLabels();
  const isBuyer = userProfile === 'buyer';
  const isAmbassador = userProfile === 'ambassador';
  const isCreatorOrOrg = userProfile === 'creator' || userProfile === 'org-religious';

  const activeOrgId = currentOrg?.id ?? null;
  const primaryCurrency = currentOrg?.currency || userOrgs[0]?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency || primaryCurrency, locale);

  // Quick actions — the shortcuts that aren't already surfaced at the top.
  const offeringsEnabled = !!((currentOrg?.settings as any)?.offerings_enabled);
  const quickActions = [
    { to: '/admin/settings?s=profile', icon: Palette,
      labelFr: 'Personnaliser ma plateforme', labelEn: 'Customize my platform',
      descFr: 'Nom, logo, bannière, lien public', descEn: 'Name, logo, banner, public link' },
    { to: '/admin/products', icon: Package,
      labelFr: 'Ajouter un produit', labelEn: 'Add a product',
      descFr: 'Ebooks, templates et plus', descEn: 'Ebooks, templates & more' },
    { to: '/admin/promo-codes', icon: Percent,
      labelFr: 'Ajouter un code promo', labelEn: 'Add a promo code',
      descFr: 'Réductions pour tes produits', descEn: 'Discounts for your products' },
    { to: '/admin/events', icon: CalendarCheck2,
      labelFr: 'Créer un événement', labelEn: 'Create an event',
      descFr: 'En ligne ou en personne', descEn: 'Online or in person' },
    { to: '/admin/popups', icon: LayoutPanelTop,
      labelFr: 'Créer un pop-up', labelEn: 'Create a pop-up',
      descFr: 'Messages ciblés sur ta page', descEn: 'Targeted messages on your page' },
    ...(offeringsEnabled
      ? [{ to: '/admin/offerings', icon: Gift,
          labelFr: 'Créer une offrande', labelEn: 'Create an offering',
          descFr: 'Dons, dîmes et contributions', descEn: 'Donations, tithes & contributions' }]
      : []),
  ];


  // ── Purchases ──
  const { data: purchases = [] } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('product_purchases')
        .select('*, digital_products(title, cover_image_url, product_type, slug, organization_id)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!user,
  });

  // ── Donations ──
  const { data: donations = [] } = useQuery({
    queryKey: ['user-donations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('donations')
        .select('id, amount, currency, created_at, completed_at, status, donor_name, campaign_id, donation_campaigns(title, image_url), organizations(name)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // ── Active org sales (seller side) ──
  const { data: salesStats } = useQuery({
    queryKey: ['user-sales-stats', activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return { count: 0, revenue: 0 };
      const { data } = await db.from('product_purchases')
        .select('amount')
        .eq('organization_id', activeOrgId)
        .eq('status', 'completed');
      const rows = data || [];
      return {
        count: rows.length,
        revenue: rows.reduce((s: number, r: any) => s + (r.amount || 0), 0),
      };
    },
    enabled: !!activeOrgId,
  });

  // ── Ambassador commissions (all orgs — commissions are personal earnings) ──
  const { data: commissionStats = { amount: 0, count: 0 } } = useQuery({
    queryKey: ['user-commissions', user?.id],
    queryFn: async () => {
      if (!user) return { amount: 0, count: 0 };
      const { data } = await db.from('affiliate_sales')
        .select('id, commission_amount')
        .eq('affiliate_user_id', user.id);

      const rows = data || [];
      return {
        amount: rows.reduce((s: number, r: any) => s + (r.commission_amount || 0), 0),
        count: rows.length,
      };
    },
    enabled: !!user,
  });

  // ── Donations received by active org ──
  const { data: donationsReceivedStats = { amount: 0, count: 0 } } = useQuery({
    queryKey: ['user-donations-received', activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return { amount: 0, count: 0 };
      const { data } = await db.from('donations')
        .select('id, amount')
        .eq('organization_id', activeOrgId)
        .eq('status', 'completed');

      const rows = data || [];
      return {
        amount: rows.reduce((s: number, r: any) => s + (r.amount || 0), 0),
        count: rows.length,
      };
    },
    enabled: !!activeOrgId,
  });

  const totalRevenue = (salesStats?.revenue || 0) + donationsReceivedStats.amount + commissionStats.amount;

  // ── Program progress ──
  const { data: programProgress = [] } = useQuery({
    queryKey: ['user-program-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: enrollments } = await db.from('program_enrollments')
        .select('*, programs(title, organization_id)')
        .eq('user_id', user.id)
        .limit(4);
      if (!enrollments || enrollments.length === 0) return [];

      const results = await Promise.all(enrollments.map(async (enrollment: any) => {
        const { count: totalLessons } = await db.from('program_lessons')
          .select('id', { count: 'exact', head: true })
          .eq('module_id', enrollment.program_id);
        const { count: completedLessons } = await db.from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('completed', true);
        return { ...enrollment, totalLessons: totalLessons || 0, completedLessons: completedLessons || 0 };
      }));
      return results;
    },
    enabled: !!user,
  });

  // ── Greeting ──
  const hour = new Date().getHours();
  const greeting = isFr
    ? (hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir')
    : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  const displayName = profile?.display_name?.split(' ')[0] || (isFr ? 'là' : 'there');

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-2xl px-4 py-5 sm:py-6 space-y-5">
        <SEOHead title="Mon espace — Siteviral" noindex />

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight">{greeting}, {displayName} 👋</h1>
            <p className="text-xs text-muted-foreground">{isFr ? 'Voici ton espace personnel' : 'Your personal space'}</p>
          </div>
        </motion.div>

        {/* ═══ FIRST SALE CHECKLIST (auto-hides once first sale completed) ═══ */}
        {isCreatorOrOrg && <FirstSaleChecklist />}

        {/* ═══ COMMISSION ROI BANNER (creators/orgs with sales) ═══ */}
        {isCreatorOrOrg && <CommissionBanner />}

        {/* ═══ CONVERSATIONAL SUMMARY ═══ */}
        {!isBuyer && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
          <PremiumCard variant="glass" delay={0.02} className="space-y-3">
            {/* Natural language summary */}
            <div className="space-y-1.5">
              {isCreatorOrOrg && totalRevenue > 0 ? (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {isFr
                      ? `Tu as généré ${fmt(totalRevenue)} au total.`
                      : `You've generated ${fmt(totalRevenue)} in total.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isFr
                      ? `${salesStats?.count || 0} vente${(salesStats?.count || 0) !== 1 ? 's' : ''} · ${donationsReceivedStats.count} don${donationsReceivedStats.count !== 1 ? 's' : ''} reçu${donationsReceivedStats.count !== 1 ? 's' : ''} · ${commissionStats.count} commission${commissionStats.count !== 1 ? 's' : ''}`
                      : `${salesStats?.count || 0} sale${(salesStats?.count || 0) !== 1 ? 's' : ''} · ${donationsReceivedStats.count} donation${donationsReceivedStats.count !== 1 ? 's' : ''} · ${commissionStats.count} commission${commissionStats.count !== 1 ? 's' : ''}`}
                  </p>
                </>
              ) : isCreatorOrOrg ? (
                <p className="text-sm text-muted-foreground">
                  {isFr
                    ? "Tu n'as pas encore de revenus. Crée ton premier produit pour commencer !"
                    : "No revenue yet. Create your first product to get started!"}
                </p>
              ) : commissionStats.amount > 0 ? (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {isFr
                      ? `Tu as gagné ${fmt(commissionStats.amount)} en commissions.`
                      : `You've earned ${fmt(commissionStats.amount)} in commissions.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {commissionStats.count} {isFr ? 'vente' : 'sale'}{commissionStats.count !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isFr
                    ? 'Partage des produits pour gagner des commissions.'
                    : 'Share products to earn commissions.'}
                </p>
              )}
            </div>

            {/* Contextual action */}
            {isCreatorOrOrg && (salesStats?.count || 0) > 0 && (
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => navigate('/admin/sales')}>
                {isFr ? 'Voir le détail' : 'View details'} <ArrowRight className="h-3 w-3" />
              </Button>
            )}
            {isAmbassador && (
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => navigate('/gagner')}>
                {isFr ? 'Voir mes commissions' : 'View commissions'} <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </PremiumCard>
        </motion.div>
        )}

        {/* ═══ QUICK START PATHS — sellers/creators only ═══ */}
        {!isBuyer && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <QuickStartPaths />
          </motion.div>
        )}

        {/* ═══ SMART NUDGE ═══ */}
        {!isBuyer && <SmartNudge />}

        {/* ═══ MY PURCHASES ═══ */}
        <DashboardSection
          title={isFr ? 'Mes achats' : 'My purchases'}
          icon={Package}
          actions={purchases.length > 0 || programProgress.length > 0 ? (
            <button onClick={() => navigate('/resources')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              {isFr ? 'Tout voir' : 'View all'} <ArrowRight className="h-3 w-3" />
            </button>
          ) : undefined}
        >
          <PremiumCard variant="default" delay={0.05} noPadding className="p-4">
            {purchases.length === 0 && programProgress.length === 0 ? (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{isFr ? "Tu n'as pas encore d'achat" : 'No purchases yet'}</p>
                <Button size="sm" className="gap-2" onClick={() => navigate('/discover')}>
                  <Store className="h-3.5 w-3.5" /> {isFr ? 'Découvrir des produits' : 'Discover products'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Digital products */}
                {purchases.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {purchases.slice(0, 3).map((purchase: any) => {
                      const product = purchase.digital_products;
                      return (
                        <button key={purchase.id} onClick={() => navigate('/resources')} className="group text-left">
                          <div className="aspect-[3/4] rounded-xl bg-muted overflow-hidden mb-1.5 ring-1 ring-border">
                            {product?.cover_image_url ? (
                              <img src={product.cover_image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] font-medium truncate">{product?.title || 'Produit'}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Enrolled courses */}
                {programProgress.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" /> {isFr ? 'Mes formations' : 'My courses'}
                    </p>
                    {programProgress.slice(0, 2).map((prog: any) => {
                      const pct = prog.totalLessons > 0 ? Math.round((prog.completedLessons / prog.totalLessons) * 100) : 0;
                      return (
                        <button key={prog.id} onClick={() => navigate(`/programs/${prog.program_id}`)} className="w-full text-left p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium truncate flex-1 mr-2">{prog.programs?.title}</p>
                            <span className={cn('text-[10px] font-bold', pct === 100 ? 'text-emerald-600' : 'text-primary')}>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                          <p className="text-[10px] text-muted-foreground mt-1">{prog.completedLessons}/{prog.totalLessons} {isFr ? 'leçons' : 'lessons'}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </PremiumCard>
        </DashboardSection>


        {/* ═══ MY DONATIONS ═══ */}
        {donations.length > 0 && (
          <DashboardSection
            title={isFr ? 'Mes dons' : 'My donations'}
            icon={Heart}
            collapsible
            defaultCollapsed={false}
            actions={
              <button onClick={() => navigate('/my-donations')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                {isFr ? 'Tout voir' : 'View all'} <ArrowRight className="h-3 w-3" />
              </button>
            }
          >
            <div className="space-y-2">
              {donations.slice(0, 3).map((don: any) => (
                <PremiumCard key={don.id} variant="default" noPadding className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                      <Heart className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {don.donation_campaigns?.title || don.organizations?.name || 'Don'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(don.completed_at || don.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-rose-500">{fmt(don.amount, don.currency)}</span>
                  </div>
                </PremiumCard>
              ))}
            </div>
          </DashboardSection>
        )}

        {/* ═══ CREATE PLATFORM CTA (no-org users) ═══ */}
        {!hasOrgs && (
          <PremiumCard variant="glass" delay={0.1} className="space-y-3 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{isFr ? 'Crée ta boutique' : 'Create your store'}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isFr ? 'Vends tes produits, reçois des paiements Mobile Money' : 'Sell your products, receive Mobile Money payments'}</p>
              </div>
            </div>
            <Button className="w-full gap-2" size="sm" onClick={() => navigate('/create-org')}>
              <Store className="h-3.5 w-3.5" /> {isFr ? 'Commencer' : 'Get started'}
            </Button>
          </PremiumCard>
        )}

        {/* ═══ DISCOVER & CONTEXTUAL ACTIONS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PremiumCard variant="glass" delay={0.12} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Compass className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{isFr ? 'Découvrir' : 'Discover'}</h3>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'eBooks, formations, templates' : 'eBooks, courses, templates'}</p>
              </div>
            </div>
            <Button className="w-full gap-2" variant="outline" size="sm" onClick={() => navigate('/discover')}>
              <Store className="h-3.5 w-3.5" /> {isFr ? 'Explorer' : 'Browse'}
            </Button>
          </PremiumCard>

          {/* Buyer: gentle upsell to ambassador */}
          {isBuyer && (
            <PremiumCard variant="glass" delay={0.15} className="space-y-3 border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{isFr ? 'Partage et gagne' : 'Share & earn'}</h3>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Partage tes produits préférés, gagne des commissions' : 'Share your favorite products, earn commissions'}</p>
                </div>
              </div>
              <Button className="w-full gap-2" size="sm" onClick={() => navigate('/gagner')}>
                <Rocket className="h-3.5 w-3.5" /> {isFr ? 'Commencer' : 'Start'}
              </Button>
            </PremiumCard>
          )}

          {/* Non-buyer: standard earn CTA */}
          {!isBuyer && (
            <PremiumCard variant="glass" delay={0.15} className="space-y-3 border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{labels.earnings}</h3>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Partage et gagne des commissions' : 'Share & earn commissions'}</p>
                </div>
              </div>
              <Button className="w-full gap-2" size="sm" onClick={() => navigate('/gagner')}>
                <Rocket className="h-3.5 w-3.5" /> {isFr ? 'Commencer' : 'Start'}
              </Button>
            </PremiumCard>
          )}
        </div>

        {/* ═══ QUICK ACCESS ═══ */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold px-1">{isFr ? 'Accès rapide' : 'Quick access'}</p>

          {hasOrgs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <PremiumCard key={a.to} variant="default" noPadding animate={false} className="p-0">
                  <button
                    onClick={() => navigate(a.to)}
                    className="w-full flex items-center gap-3 p-3.5 text-left group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <a.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{isFr ? a.labelFr : a.labelEn}</p>
                      <p className="text-[10px] text-muted-foreground">{isFr ? a.descFr : a.descEn}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                </PremiumCard>
              ))}
            </div>
          )}


          {!hasOrgs && !isBuyer && (
            <PremiumCard variant="default" noPadding animate={false} className="p-0">
              <button
                onClick={() => navigate('/ecrire')}
                className="w-full flex items-center gap-3 p-3.5 text-left group"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{isFr ? 'Écrire mon premier livre' : 'Write my first book'}</p>
                  <p className="text-[10px] text-muted-foreground">{isFr ? "L'IA écrit, tu publies, tu gagnes" : 'AI writes, you publish, you earn'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </PremiumCard>
          )}

          {isSuperadmin && (
            <PremiumCard variant="default" noPadding animate={false} className="p-0">
              <button
                onClick={() => navigate('/superadmin')}
                className="w-full flex items-center gap-3 p-3.5 text-left group"
              >
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Super admin</p>
                  <p className="text-[10px] text-muted-foreground">{isFr ? "Panneau d'administration global" : 'Global admin panel'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </PremiumCard>
          )}
        </div>
      </div>
      <PartnerPendingPopup />
    </div>
  );
}
