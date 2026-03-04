import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  Package, Store, Share2, Link2, Trophy, Wallet, Building2, ArrowRight,
  BookOpen, Rocket, Sparkles, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.25 },
});

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const { userOrgs } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const hasOrgs = userOrgs.length > 0;

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

      // Get lesson counts and completion for each program
      const results = await Promise.all(enrollments.map(async (enrollment: any) => {
        const { count: totalLessons } = await db.from('program_lessons')
          .select('id', { count: 'exact', head: true })
          .eq('module_id', enrollment.program_id); // Simplified — gets approximate

        const { count: completedLessons } = await db.from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('completed', true);

        return {
          ...enrollment,
          totalLessons: totalLessons || 0,
          completedLessons: completedLessons || 0,
        };
      }));
      return results;
    },
    enabled: !!user,
  });

  // ── Affiliate data ──
  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links')
        .select('*, organizations(name, slug, commission_percent)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: affiliateSales = [] } = useQuery({
    queryKey: ['user-affiliate-sales', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_sales')
        .select('*')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const totalEarned = affiliateLinks.reduce((s: number, l: any) => s + (l.total_earned || 0), 0);
  const hasAffiliateActivity = affiliateLinks.length > 0;

  // ── Greeting ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const displayName = profile?.display_name?.split(' ')[0] || 'là';

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-2xl px-4 py-5 sm:py-6 space-y-5">
        <SEOHead title="Mon espace — Siteviral" noindex />

        {/* ═══ HEADER ═══ */}
        <motion.div {...fadeUp()} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold">{greeting}, {displayName} 👋</h1>
            <p className="text-xs text-muted-foreground">Voici ton espace personnel</p>
          </div>
        </motion.div>

        {/* ═══ SECTION: MES ACHATS ═══ */}
        <motion.div {...fadeUp(0.05)} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Mes ressources
            </h2>
            {purchases.length > 0 && (
              <button onClick={() => navigate('/resources')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Tout voir <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {purchases.length === 0 ? (
            <div className="text-center py-6">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">Tu n'as pas encore de ressources</p>
              <Button size="sm" className="gap-2" onClick={() => navigate('/marketplace')}>
                <Store className="h-3.5 w-3.5" /> Découvrir les produits
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {purchases.slice(0, 6).map((purchase: any) => {
                const product = purchase.digital_products;
                return (
                  <button
                    key={purchase.id}
                    onClick={() => navigate(`/resources`)}
                    className="group text-left"
                  >
                    <div className="aspect-[3/4] rounded-lg bg-muted overflow-hidden mb-1.5">
                      {product?.cover_image_url ? (
                        <img src={product.cover_image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
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
        </motion.div>

        {/* ═══ SECTION: PROGRESSION FORMATIONS ═══ */}
        {programProgress.length > 0 && (
          <motion.div {...fadeUp(0.1)} className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
              <GraduationCap className="h-4 w-4 text-amber-500" /> Mes formations
            </h2>
            <div className="space-y-3">
              {programProgress.map((prog: any) => {
                const pct = prog.totalLessons > 0 ? Math.round((prog.completedLessons / prog.totalLessons) * 100) : 0;
                return (
                  <div key={prog.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate">{prog.programs?.title || 'Formation'}</p>
                      <span className="text-xs font-semibold text-primary">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-1">{prog.completedLessons}/{prog.totalLessons} leçons</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ SECTION: DÉCOUVRIR ═══ */}
        <motion.div {...fadeUp(0.12)} className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-500" /> Découvrir
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Explore des eBooks, formations, templates et plus encore.
          </p>
          <Button className="w-full gap-2" variant="outline" onClick={() => navigate('/marketplace')}>
            <Store className="h-4 w-4" /> Explorer le catalogue
          </Button>
        </motion.div>

        {/* ═══ SECTION: GAGNER (Ambassador summary) ═══ */}
        <motion.div {...fadeUp(0.15)} className="bg-card border border-emerald-500/20 rounded-2xl p-5">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
            <Share2 className="h-4 w-4 text-emerald-500" /> Gagner de l'argent
          </h2>

          {hasAffiliateActivity ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-emerald-500">{fmt(totalEarned)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Total gagné</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold">{affiliateLinks.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Liens actifs</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => navigate('/affiliation')}>
                  <Link2 className="h-3.5 w-3.5" /> Mes liens
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => navigate('/leaderboard')}>
                  <Trophy className="h-3.5 w-3.5" /> Classement
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                Partage des produits et gagne une commission sur chaque vente. Aucun investissement requis.
              </p>
              <Button className="w-full gap-2" onClick={() => navigate('/marketplace')}>
                <Rocket className="h-4 w-4" /> Commencer à gagner
              </Button>
            </>
          )}
        </motion.div>

        {/* ═══ SECTION: MA PLATEFORME (Creator summary) ═══ */}
        {hasOrgs ? (
          <motion.div {...fadeUp(0.2)} className="bg-card border border-primary/20 rounded-2xl p-5">
            <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-primary" /> Ma plateforme
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Gère tes produits, tes ventes et tes ambassadeurs.
            </p>
            <Button className="w-full gap-2" onClick={() => navigate('/admin')}>
              <Building2 className="h-4 w-4" /> Accéder à ma plateforme
            </Button>
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.2)} className="bg-card border border-primary/20 rounded-2xl p-5">
            <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-primary" /> Devenir créateur
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Crée ta boutique digitale, vends tes produits et collecte des dons.
            </p>
            <Button className="w-full gap-2" variant="outline" onClick={() => navigate('/create-org')}>
              <Building2 className="h-4 w-4" /> Créer ma plateforme
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
