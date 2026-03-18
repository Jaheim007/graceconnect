import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  Package, Store, Share2, ArrowRight,
  BookOpen, Rocket, Sparkles, GraduationCap, Heart, Shield, Building2
} from 'lucide-react';
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

export default function UserDashboard() {
  const { user, profile, isSuperadmin } = useAuth();
  const { userOrgs } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const hasOrgs = userOrgs.length > 0;
  const isFr = locale === 'fr';

  const primaryCurrency = userOrgs[0]?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency || primaryCurrency, locale);

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

        {/* ═══ QUICK START PATHS ═══ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
          <QuickStartPaths />
        </motion.div>

        {/* ═══ SMART NUDGE ═══ */}
        <SmartNudge />

        {/* ═══ MY PURCHASES ═══ */}
        <DashboardSection
          title={isFr ? 'Mes achats' : 'My purchases'}
          icon={Package}
          actions={purchases.length > 0 ? (
            <button onClick={() => navigate('/resources')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              {isFr ? 'Tout voir' : 'View all'} <ArrowRight className="h-3 w-3" />
            </button>
          ) : undefined}
        >
          <PremiumCard variant="default" delay={0.05} noPadding className="p-4">
            {purchases.length === 0 ? (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{isFr ? "Tu n'as pas encore d'achat" : 'No purchases yet'}</p>
                <Button size="sm" className="gap-2" onClick={() => navigate('/marketplace')}>
                  <Store className="h-3.5 w-3.5" /> {isFr ? 'Découvrir les produits' : 'Discover products'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {purchases.slice(0, 6).map((purchase: any) => {
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
          </PremiumCard>
        </DashboardSection>

        {/* ═══ MY PROGRAMS ═══ */}
        {programProgress.length > 0 && (
          <DashboardSection
            title={isFr ? 'Mes formations' : 'My courses'}
            icon={GraduationCap}
          >
            <div className="space-y-2">
              {programProgress.map((prog: any) => {
                const pct = prog.totalLessons > 0 ? Math.round((prog.completedLessons / prog.totalLessons) * 100) : 0;
                return (
                  <PremiumCard key={prog.id} variant="default" noPadding className="p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate">{prog.programs?.title || 'Formation'}</p>
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        pct >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                      )}>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-1.5">{prog.completedLessons}/{prog.totalLessons} {isFr ? 'leçons' : 'lessons'}</p>
                  </PremiumCard>
                );
              })}
            </div>
          </DashboardSection>
        )}

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

        {/* ═══ DISCOVER & EARN — compact action cards ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PremiumCard variant="glass" delay={0.12} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{isFr ? 'Découvrir' : 'Discover'}</h3>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'eBooks, formations, templates' : 'eBooks, courses, templates'}</p>
              </div>
            </div>
            <Button className="w-full gap-2" variant="outline" size="sm" onClick={() => navigate('/marketplace')}>
              <Store className="h-3.5 w-3.5" /> {isFr ? 'Explorer' : 'Browse'}
            </Button>
          </PremiumCard>

          <PremiumCard variant="glass" delay={0.15} className="space-y-3 border-emerald-500/20">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{isFr ? 'Gagner' : 'Earn'}</h3>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'Partage et gagne des commissions' : 'Share & earn commissions'}</p>
              </div>
            </div>
            <Button className="w-full gap-2" size="sm" onClick={() => navigate('/gagner')}>
              <Rocket className="h-3.5 w-3.5" /> {isFr ? 'Commencer' : 'Start'}
            </Button>
          </PremiumCard>
        </div>

        {/* ═══ QUICK ACCESS ═══ */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold px-1">{isFr ? 'Accès rapide' : 'Quick access'}</p>

          {hasOrgs && (
            <PremiumCard variant="default" noPadding animate={false} className="p-0">
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-3 p-3.5 text-left group"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{isFr ? 'Mon espace créateur' : 'Creator space'}</p>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Produits, ventes, ambassadeurs' : 'Products, sales, ambassadors'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </PremiumCard>
          )}

          {!hasOrgs && (
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
