import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { AffiliateLink } from '@/types/database';
import {
  Wallet, Link2, Share2, Trophy, CheckCircle, Target, ArrowRight, Rocket, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { requestAffiliatePayout } from '@/lib/api';
import { useOrg } from '@/contexts/OrgContext';
import { motion } from 'framer-motion';
import { AffiliateShareTools } from '@/components/affiliate/AffiliateShareTools';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

export default function AmbassadorDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userOrgs } = useOrg();
  const { locale } = useI18n();
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);

  const primaryCurrency = userOrgs[0]?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency || primaryCurrency, locale);

  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links').select('*, organizations(name, slug, commission_percent)').eq('user_id', user.id).order('created_at', { ascending: false });
      return (data || []) as (AffiliateLink & { organizations: { name: string; slug: string; commission_percent?: number } | null })[];
    },
    enabled: !!user,
  });

  const { data: affiliateSales = [] } = useQuery({
    queryKey: ['user-affiliate-sales', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_sales').select('*').eq('affiliate_user_id', user.id).order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Top commission products for sharing — fallback chain
  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-commission-products'],
    queryFn: async () => {
      // Try ordering by org commission (joined)
      const { data } = await db.from('digital_products')
        .select('id, title, price, cover_image_url, slug, currency, organization_id, organizations(name, slug, commission_percent)')
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(6);
      if (data && data.length > 0) {
        // Sort by commission_percent desc client-side, take top 3
        return [...data]
          .sort((a: any, b: any) => (b.organizations?.commission_percent || 0) - (a.organizations?.commission_percent || 0))
          .slice(0, 3);
      }
      // Fallback: newest products
      const { data: fallback } = await db.from('digital_products')
        .select('id, title, price, cover_image_url, slug, currency, organization_id, organizations(name, slug, commission_percent)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      return fallback || [];
    },
  });

  const totalEarned = affiliateLinks.reduce((s, l) => s + (l.total_earned || 0), 0);
  const payableCommission = affiliateSales.filter((s: any) => s.status === 'payable').reduce((sum: number, s: any) => sum + s.commission_amount, 0);
  const totalClicks = affiliateLinks.reduce((s, l) => s + (l.clicks || 0), 0);

  const hasShared = affiliateLinks.length > 0;
  const hasClick = totalClicks > 0;
  const hasConversion = affiliateSales.length > 0;

  // Checklist state
  const missionItems = [
    { done: hasShared, label: 'Choisir un produit à partager', icon: Store },
    { done: hasShared, label: 'Partager sur WhatsApp', icon: Share2 },
    { done: hasClick, label: 'Obtenir 1 clic', icon: Target },
  ];
  const completedMissions = missionItems.filter(m => m.done).length;

  const handleRequestPayout = async (orgId: string) => {
    setRequestingPayout(orgId);
    try {
      const result = await requestAffiliatePayout(orgId);
      toast({ title: 'Demande envoyée', description: `${result.amount?.toLocaleString()} disponible.` });
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setRequestingPayout(null); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const displayName = profile?.display_name?.split(' ')[0] || 'Ambassadeur';

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl px-4 py-5 sm:py-6 space-y-5">
        <SEOHead title="Espace Ambassadeur — Siteviral" noindex />

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{greeting}, {displayName}</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Espace Ambassadeur</p>
          </div>
        </motion.div>

        {/* ═══ SECTION 1: GAINS ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-emerald-500/20 rounded-2xl p-5"
        >
          <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-emerald-500" /> Mes gains
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-emerald-500">{fmt(totalEarned)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total gagné</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-foreground">{fmt(payableCommission)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">À retirer</p>
            </div>
          </div>
          {payableCommission > 0 && (
            <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
              const firstOrg = affiliateSales.find((s: any) => s.status === 'payable');
              if (firstOrg) handleRequestPayout((firstOrg as any).organization_id);
            }} disabled={!!requestingPayout}>
              {requestingPayout ? 'En cours…' : 'Retirer mes gains'}
            </Button>
          )}
        </motion.div>

        {/* ═══ SECTION 2: MISSION ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h2 className="font-bold text-sm flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-amber-500" /> 🎯 Ta mission aujourd'hui
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Complète ces étapes pour débloquer tes premiers gains.</p>

          <div className="space-y-3">
            {missionItems.map((item, i) => (
              <div key={i} className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                item.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border'
              )}>
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                  item.done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {item.done ? <CheckCircle className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
                </div>
                <span className={cn('text-sm font-medium flex-1', item.done && 'line-through text-muted-foreground')}>{item.label}</span>
                {item.done && <span className="text-xs text-emerald-500 font-semibold">✓</span>}
              </div>
            ))}
          </div>

          {completedMissions >= 2 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-sm font-bold">🔥 Premier partage effectué !</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ta 1ère vente peut tomber aujourd'hui.</p>
            </div>
          )}

          {!hasShared && (
            <Button className="w-full mt-4 gap-2" onClick={() => navigate('/marketplace')}>
              <Rocket className="h-4 w-4" /> Choisir un produit à partager
            </Button>
          )}
        </motion.div>

        {/* ═══ SECTION 3: TOP COMMISSIONS ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Top commissions
            </h2>
            <button onClick={() => navigate('/marketplace')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Tout voir <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Aucun produit disponible pour le moment.</p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/marketplace')}>
                  <Store className="h-3.5 w-3.5" /> Explorer le Hub
                </Button>
              </div>
            ) : topProducts.map((product: any) => {
              const commission = product.organizations?.commission_percent || 10;
              const estimatedGain = product.price ? Math.round((product.price * commission) / 100) : 0;
              const orgSlug = product.organizations?.slug;
              const shareUrl = orgSlug ? `${window.location.origin}/org/${orgSlug}/p/${product.slug || product.id}` : '';

              return (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                    {product.cover_image_url ? (
                      <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Store className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{product.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-emerald-500">{commission}% commission</span>
                      {estimatedGain > 0 && (
                        <span className="text-[10px] text-muted-foreground">≈ {fmt(estimatedGain, product.currency)} / vente</span>
                      )}
                    </div>
                  </div>
                  {shareUrl && (
                    <AffiliateShareTools
                      shareUrl={shareUrl}
                      orgName={product.organizations?.name || ''}
                      affiliateCode=""
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ ACTIVE LINKS ═══ */}
        {affiliateLinks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" /> Mes liens actifs
              </h2>
              <button onClick={() => navigate('/affiliation')} className="text-xs text-primary font-medium hover:underline">Tout voir</button>
            </div>
            <div className="space-y-2">
              {affiliateLinks.slice(0, 3).map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.organizations?.name || 'Organisation'}</p>
                    <p className="text-[10px] text-muted-foreground">{link.clicks || 0} clics · {link.conversions || 0} ventes</p>
                  </div>
                  <AffiliateShareTools
                    shareUrl={`${window.location.origin}/org/${link.organizations?.slug}?ref=${link.code}`}
                    orgName={link.organizations?.name || ''}
                    affiliateCode={link.code}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
