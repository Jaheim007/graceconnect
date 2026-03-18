import { useAuth } from '@/contexts/AuthContext';
import { getEffectivePrice } from '@/lib/effectivePrice';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
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
import { EarningsCard } from '@/components/ambassador/EarningsCard';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { DailyTip } from '@/components/ambassador/DailyTip';

import { PremiumCard } from '@/components/ui/PremiumCard';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardSection } from '@/components/ui/DashboardSection';

export default function AmbassadorDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userOrgs } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);

  const primaryCurrency = userOrgs[0]?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency || primaryCurrency, locale);

  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links').select('*, organizations(name, slug, affiliation_commission_percent)').eq('user_id', user.id).order('created_at', { ascending: false });
      return (data || []) as any[];
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

  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-commission-products'],
    queryFn: async () => {
      const { data } = await db.from('digital_products')
        .select('id, title, price, sale_price, sale_ends_at, cover_image_url, slug, currency, organization_id, organizations(name, slug, commission_percent)')
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(6);
      if (data && data.length > 0) {
        return [...data]
          .sort((a: any, b: any) => (b.organizations?.commission_percent || 0) - (a.organizations?.commission_percent || 0))
          .slice(0, 3);
      }
      const { data: fallback } = await db.from('digital_products')
        .select('id, title, price, sale_price, sale_ends_at, cover_image_url, slug, currency, organization_id, organizations(name, slug, commission_percent)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      return fallback || [];
    },
  });

  const totalEarned = affiliateLinks.reduce((s, l) => s + (l.total_earned || 0), 0);
  const payableCommission = affiliateSales.filter((s: any) => s.status === 'payable').reduce((sum: number, s: any) => sum + s.commission_amount, 0);
  const totalClicks = affiliateLinks.reduce((s, l) => s + (l.clicks || 0), 0);
  const totalConversions = affiliateSales.length;

  const hasShared = affiliateLinks.length > 0;
  const hasClick = totalClicks > 0;

  const missionItems = [
    { done: hasShared, label: isFr ? 'Choisir un produit à partager' : 'Choose a product to share', icon: Store },
    { done: hasShared, label: isFr ? 'Partager sur WhatsApp' : 'Share on WhatsApp', icon: Share2 },
    { done: hasClick, label: isFr ? 'Obtenir 1 clic' : 'Get 1 click', icon: Target },
  ];
  const completedMissions = missionItems.filter(m => m.done).length;

  const handleRequestPayout = async (orgId: string) => {
    setRequestingPayout(orgId);
    try {
      const result = await requestAffiliatePayout(orgId);
      toast({ title: isFr ? 'Demande envoyée' : 'Request sent', description: `${result.amount?.toLocaleString()} ${isFr ? 'disponible' : 'available'}.` });
    } catch (err: unknown) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setRequestingPayout(null); }
  };

  const hour = new Date().getHours();
  const greeting = isFr
    ? (hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir')
    : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  const displayName = profile?.display_name?.split(' ')[0] || (isFr ? 'Ambassadeur' : 'Ambassador');

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl px-4 py-5 sm:py-6 space-y-5">
        <SEOHead title={isFr ? 'Espace Ambassadeur — Siteviral' : 'Ambassador Dashboard — Siteviral'} noindex />

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-emerald-500/10 flex items-center justify-center ring-2 ring-emerald-500/20">
            <Share2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{greeting}, {displayName}</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{isFr ? 'Espace Ambassadeur' : 'Ambassador Dashboard'}</p>
          </div>
        </motion.div>

        {/* ═══ EARNINGS KPIs ═══ */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Wallet}
            label={isFr ? 'Total gagné' : 'Total earned'}
            value={fmt(totalEarned)}
            color="emerald"
            delay={0.05}
          />
          <StatCard
            icon={Wallet}
            label={isFr ? 'À retirer' : 'Available'}
            value={fmt(payableCommission)}
            color="primary"
            delay={0.1}
          />
        </div>

        {payableCommission > 0 && (
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => {
            const firstOrg = affiliateSales.find((s: any) => s.status === 'payable');
            if (firstOrg) handleRequestPayout((firstOrg as any).organization_id);
          }} disabled={!!requestingPayout}>
            <Wallet className="h-4 w-4" />
            {requestingPayout ? (isFr ? 'En cours…' : 'Processing…') : (isFr ? 'Retirer mes gains' : 'Withdraw earnings')}
          </Button>
        )}

        {/* ═══ DAILY TIP ═══ */}
        <DailyTip />

        {/* ═══ TODAY'S MISSION ═══ */}
        <DashboardSection
          title={isFr ? "🎯 Ta mission aujourd'hui" : "🎯 Today's mission"}
          icon={Target}
          subtitle={isFr ? 'Complète ces étapes pour débloquer tes premiers gains.' : 'Complete these steps to unlock your first earnings.'}
        >
          <div className="space-y-2">
            {missionItems.map((item, i) => (
              <PremiumCard key={i} variant="default" noPadding animate={false} className={cn(
                'p-3',
                item.done ? 'border-emerald-500/20 bg-emerald-500/5' : ''
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                    item.done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {item.done ? <CheckCircle className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
                  </div>
                  <span className={cn('text-sm font-medium flex-1', item.done && 'line-through text-muted-foreground')}>{item.label}</span>
                  {item.done && <span className="text-xs text-emerald-500 font-semibold">✓</span>}
                </div>
              </PremiumCard>
            ))}
          </div>

          {completedMissions >= 2 && (
            <PremiumCard variant="default" delay={0.1} className="!p-3 border-amber-500/20 bg-amber-500/5 text-center mt-3">
              <p className="text-sm font-bold">{isFr ? '🔥 Premier partage effectué !' : '🔥 First share done!'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{isFr ? 'Ta 1ère vente peut tomber aujourd\'hui.' : 'Your first sale could come today.'}</p>
            </PremiumCard>
          )}

          {!hasShared && (
            <Button className="w-full mt-3 gap-2" onClick={() => navigate('/marketplace')}>
              <Rocket className="h-4 w-4" /> {isFr ? 'Choisir un produit à partager' : 'Choose a product to share'}
            </Button>
          )}
        </DashboardSection>

        {/* ═══ TOP COMMISSIONS ═══ */}
        <DashboardSection
          title="Top commissions"
          icon={Trophy}
          actions={
            <button onClick={() => navigate('/marketplace')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              {isFr ? 'Tout voir' : 'View all'} <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          {topProducts.length === 0 ? (
            <PremiumCard variant="default" className="text-center">
              <p className="text-sm text-muted-foreground mb-3">{isFr ? 'Aucun produit disponible.' : 'No products available yet.'}</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/marketplace')}>
                <Store className="h-3.5 w-3.5" /> {isFr ? 'Explorer' : 'Browse'}
              </Button>
            </PremiumCard>
          ) : (
            <div className="space-y-2">
              {topProducts.map((product: any) => {
                const commission = product.organizations?.commission_percent || 10;
                const estimatedGain = Math.round(getEffectivePrice(product) * commission / 100);
                const orgSlug = product.organizations?.slug;
                const shareUrl = orgSlug ? `${window.location.origin}/org/${orgSlug}/p/${product.slug || product.id}` : '';

                return (
                  <PremiumCard key={product.id} variant="default" noPadding className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 ring-1 ring-border">
                        {product.cover_image_url ? (
                          <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Store className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{product.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-emerald-500">{commission}%</span>
                          {estimatedGain > 0 && (
                            <span className="text-[10px] text-muted-foreground">≈ {fmt(estimatedGain, product.currency)} / {isFr ? 'vente' : 'sale'}</span>
                          )}
                        </div>
                      </div>
                      {shareUrl && (
                        <AffiliateShareTools shareUrl={shareUrl} orgName={product.organizations?.name || ''} affiliateCode="" />
                      )}
                    </div>
                  </PremiumCard>
                );
              })}
            </div>
          )}
        </DashboardSection>

        {/* ═══ SHAREABLE EARNINGS CARD ═══ */}
        {totalEarned > 0 && (
          <DashboardSection
            title={isFr ? '🎉 Partager mes gains' : '🎉 Share my earnings'}
            icon={Trophy}
            collapsible
          >
            <p className="text-xs text-muted-foreground mb-3">
              {isFr
                ? "Partage ta carte de gains et inspire d'autres à rejoindre le mouvement !"
                : 'Share your earnings card and inspire others to join!'}
            </p>
            <EarningsCard
              totalEarned={totalEarned}
              currency={primaryCurrency}
              salesCount={totalConversions}
              clicksCount={totalClicks}
              topOrgName={affiliateLinks[0]?.organizations?.name}
            />
          </DashboardSection>
        )}

        {/* ═══ ACTIVE LINKS ═══ */}
        {affiliateLinks.length > 0 && (
          <DashboardSection
            title={isFr ? 'Mes liens actifs' : 'My active links'}
            icon={Link2}
            collapsible
            actions={
              <button onClick={() => navigate('/affiliation')} className="text-xs text-primary font-medium hover:underline">
                {isFr ? 'Tout voir' : 'View all'}
              </button>
            }
          >
            <div className="space-y-2">
              {affiliateLinks.slice(0, 3).map((link) => (
                <PremiumCard key={link.id} variant="default" noPadding className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1">
                        {link.organizations?.name || (isFr ? 'Organisation' : 'Organization')}
                        {((link.organizations as any)?.is_verified || (link.organizations as any)?.kyc_status === 'level1' || (link.organizations as any)?.kyc_status === 'level2') && <VerifiedBadge size="xs" />}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{link.clicks || 0} {isFr ? 'clics' : 'clicks'} · {link.conversions || 0} {isFr ? 'ventes' : 'sales'}</p>
                    </div>
                    <AffiliateShareTools
                      shareUrl={`${window.location.origin}/org/${link.organizations?.slug}?ref=${link.code}`}
                      orgName={link.organizations?.name || ''}
                      affiliateCode={link.code}
                    />
                  </div>
                </PremiumCard>
              ))}
            </div>
          </DashboardSection>
        )}
      </div>
    </div>
  );
}
