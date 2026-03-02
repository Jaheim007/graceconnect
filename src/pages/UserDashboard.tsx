import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import {
  Heart, ShoppingBag, Link2, TrendingUp, Copy, ExternalLink, CheckCircle,
  AlertTriangle, DollarSign, Download, BookOpen, Eye, FileText, Music,
  Wallet, ArrowUpRight, Share2, Rocket, ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { requestAffiliatePayout } from '@/lib/api';
import { useOrg } from '@/contexts/OrgContext';
import { useMyPurchases } from '@/hooks/usePurchases';
import { motion } from 'framer-motion';
import { fetchWatermarkedFile, isPdfLikeFile, openFileInline, triggerBrowserDownload } from '@/lib/secureDownload';
import { AffiliateShareTools } from '@/components/affiliate/AffiliateShareTools';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useStreak, useBadges, useRecordActivity, useCheckAndAwardBadges } from '@/hooks/useGamification';
import { useEffect } from 'react';
import { AmbassadorOnlyDashboard } from '@/components/ambassador/AmbassadorOnlyDashboard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BuyerLoyaltyCard } from '@/components/gamification/BuyerLoyaltyCard';
import { ReferralWidget } from '@/components/referral/ReferralWidget';
import { UserMilestoneTracker } from '@/components/gamification/UserMilestoneTracker';

const statusColor: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
  pending: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
};

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  ebook: <BookOpen className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
};

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const primaryCurrency = userOrgs[0]?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency || primaryCurrency, locale);

  // Gamification
  const { data: streak } = useStreak();
  const { data: badges = [] } = useBadges();
  const recordActivity = useRecordActivity();
  const checkBadges = useCheckAndAwardBadges();

  useEffect(() => {
    if (user) {
      try { recordActivity.mutate(); } catch {}
      try { checkBadges.mutate(); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Data
  const { data: donations = [] } = useQuery({
    queryKey: ['user-donations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      return (data || []) as Donation[];
    },
    enabled: !!user,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('product_purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      return (data || []) as ProductPurchase[];
    },
    enabled: !!user,
  });

  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links').select('*, organizations(name, slug)').eq('user_id', user.id).order('created_at', { ascending: false });
      return (data || []) as (AffiliateLink & { organizations: { name: string; slug: string } | null })[];
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

  const { data: kycStatuses = {} } = useQuery({
    queryKey: ['user-kyc-statuses', user?.id],
    queryFn: async () => {
      if (!user || !userOrgs.length) return {};
      const map: Record<string, string> = {};
      for (const org of userOrgs) { map[org.id] = org.kyc_status || 'none'; }
      return map;
    },
    enabled: !!user && userOrgs.length > 0,
  });

  const { data: myResources, isLoading: resLoading } = useMyPurchases();

  const totalDonated = donations.filter(d => d.status === 'completed').reduce((s, d) => s + d.amount, 0);
  const totalEarned = affiliateLinks.reduce((s, l) => s + (l.total_earned || 0), 0);
  const payableCommission = affiliateSales.filter((s: { status: string }) => s.status === 'payable').reduce((sum: number, s: { commission_amount: number }) => sum + s.commission_amount, 0);

  const managedOrgIds = userOrgs.filter(o => o.owner_id === user?.id).map(o => o.id);

  const payableByOrg: Record<string, { orgId: string; amount: number; currency: string }> = {};
  for (const s of affiliateSales) {
    const sale = s as { status: string; organization_id: string; commission_amount: number; currency?: string };
    if (sale.status === 'payable') {
      if (!payableByOrg[sale.organization_id]) payableByOrg[sale.organization_id] = { orgId: sale.organization_id, amount: 0, currency: sale.currency || primaryCurrency };
      payableByOrg[sale.organization_id].amount += sale.commission_amount;
    }
  }

  const handleRequestPayout = async (orgId: string, orgKycStatus: string) => {
    if (orgKycStatus === 'none' || orgKycStatus === 'pending') {
      toast({ title: t('dash.kyc_required_title'), description: t('dash.kyc_required_desc') });
      navigate('/admin/kyc');
      return;
    }
    setRequestingPayout(orgId);
    try {
      const result = await requestAffiliatePayout(orgId);
      toast({ title: t('dash.payout_requested'), description: `${result.amount?.toLocaleString()} disponible.` });
      qc.invalidateQueries({ queryKey: ['user-affiliate-sales', user?.id] });
    } catch (err: unknown) {
      toast({ title: t('dash.request_failed'), description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setRequestingPayout(null); }
  };

  const handleFileAction = async (purchase: NonNullable<typeof myResources>[number], mode: 'download' | 'inline') => {
    if (!purchase.product.file_url || !user) return;
    setDownloading(purchase.id);
    try {
      const file = await fetchWatermarkedFile({
        fileUrl: purchase.product.file_url,
        productId: purchase.product_id,
        productTitle: purchase.product.title,
        inline: mode === 'inline',
      });
      if (mode === 'inline') openFileInline(file);
      else triggerBrowserDownload(file);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger le fichier.', variant: 'destructive' });
    } finally { setDownloading(null); }
  };

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const displayName = profile?.display_name?.split(' ')[0] || 'User';
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Ambassador-only mode
  if (userOrgs.length === 0 && affiliateLinks.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl px-4 py-5 sm:py-6">
          <SEOHead title="Mon espace — Siteviral" noindex />
          <AmbassadorOnlyDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-4 py-5 sm:py-6 space-y-5">
        <SEOHead title="Mon espace — Siteviral" noindex />

        {/* ═══ GREETING ═══ */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={initials} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">{initials}</span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold">{greeting}, {displayName}</h1>
            <p className="text-xs text-muted-foreground">Ton espace Siteviral</p>
          </div>
        </div>

        {/* ═══ BLOCK A: MES GAINS ═══ */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-accent" /> Mes gains
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-accent">{fmt(totalEarned)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Total gagné</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-500">{fmt(payableCommission)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">À retirer</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{affiliateLinks.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Liens de partage</p>
            </div>
          </div>

          {/* Payout actions */}
          {Object.keys(payableByOrg).length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
              {Object.values(payableByOrg).map(({ orgId, amount, currency }) => {
                const org = userOrgs.find(o => o.id === orgId);
                const kycStatus = kycStatuses[orgId] || 'none';
                return (
                  <div key={orgId} className="flex items-center gap-2">
                    <span className="text-xs flex-1">{org?.name}: <strong className="text-green-500">{fmt(amount, currency)}</strong></span>
                    <Button size="sm" className="h-7 text-xs" disabled={requestingPayout === orgId} onClick={() => handleRequestPayout(orgId, kycStatus)}>
                      {requestingPayout === orgId ? '...' : 'Retirer'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => navigate('/quick-start')}>
              <Share2 className="h-3.5 w-3.5" /> Partage maintenant
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => navigate('/affiliation')}>
              <TrendingUp className="h-3.5 w-3.5" /> Voir mes liens
            </Button>
          </div>
        </div>

        {/* ═══ BLOCK B: MES PARTAGES (summary) ═══ */}
        {affiliateLinks.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" /> Mes liens de partage
              </h2>
              <button onClick={() => navigate('/affiliation')} className="text-xs text-primary font-medium hover:underline">Tout voir</button>
            </div>
            <div className="space-y-2">
              {affiliateLinks.slice(0, 3).map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
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
          </div>
        )}

        {/* ═══ BLOCK C: MES ACHATS ═══ */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-500" /> Mes achats
            </h2>
            <button onClick={() => navigate('/resources')} className="text-xs text-primary font-medium hover:underline">Bibliothèque</button>
          </div>
          {resLoading ? <div className="px-5 pb-5"><SkeletonRow count={3} /></div> : !myResources?.length ? (
            <div className="text-center py-8 px-5">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Aucun achat pour le moment.</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => navigate('/marketplace')}>Explorer la marketplace</Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {myResources.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.product.cover_image_url ? <img src={p.product.cover_image_url} alt="" className="w-full h-full object-cover" /> : (typeIcons[p.product.product_type] || <FileText className="h-4 w-4 text-muted-foreground" />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.product.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{p.product.product_type}</p>
                  </div>
                  {p.product.file_url && isPdfLikeFile(p.product.file_url, p.product.product_type) && (
                    <Button size="sm" variant="ghost" className="gap-1 text-[10px] h-7" onClick={() => handleFileAction(p, 'inline')}>
                      <Eye className="h-3 w-3" /> Lire
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ ROLE CTA for new users ═══ */}
        {managedOrgIds.length === 0 && affiliateLinks.length === 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/quick-start')}
              className="group bg-accent/5 border border-accent/20 rounded-xl p-4 text-left hover:border-accent/40 transition-all"
            >
              <Share2 className="h-5 w-5 text-accent mb-2" />
              <h3 className="font-bold text-sm">💰 Gagner de l'argent</h3>
              <p className="text-xs text-muted-foreground mt-1">Partage et gagne des commissions</p>
            </button>
            <button
              onClick={() => navigate('/create-org')}
              className="group bg-primary/5 border border-primary/20 rounded-xl p-4 text-left hover:border-primary/40 transition-all"
            >
              <Rocket className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-bold text-sm">🏢 Vendre mon contenu</h3>
              <p className="text-xs text-muted-foreground mt-1">Crée ta plateforme digitale</p>
            </button>
          </div>
        )}

        {/* ═══ ADVANCED (collapsible) ═══ */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdvanced && 'rotate-180')} />
              {showAdvanced ? 'Masquer les détails' : 'Voir plus (gains, dons, badges...)'}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {/* Gamification */}
            <div className="grid lg:grid-cols-2 gap-3">
              <BuyerLoyaltyCard />
              <UserMilestoneTracker
                purchases={purchases.filter(p => p.status === 'completed').length}
                donations={donations.filter(d => d.status === 'completed').length}
                orgsJoined={userOrgs.length}
                streak={streak?.current_streak || 0}
                badges={badges.length}
                affiliateLinks={affiliateLinks.length}
              />
            </div>

            <ReferralWidget />

            {/* Transactions */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-xs flex items-center gap-2"><Heart className="h-3.5 w-3.5 text-destructive" /> Dons</h3>
                {donations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">Aucun don</p>
                ) : donations.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                    <span className="flex-1 truncate">{d.donor_name || 'Anonyme'}</span>
                    <span className="font-semibold">{fmt(d.amount, d.currency)}</span>
                    <Badge variant="outline" className={cn('text-[9px] border-0', statusColor[d.status])}>{d.status === 'completed' ? '✓' : '⏳'}</Badge>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-xs flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5 text-amber-500" /> Achats</h3>
                {purchases.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">Aucun achat</p>
                ) : purchases.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                    <span className="flex-1 truncate">Achat</span>
                    <span className="font-semibold">{fmt(p.amount, p.currency)}</span>
                    <Badge variant="outline" className={cn('text-[9px] border-0', statusColor[p.status])}>{p.status === 'completed' ? '✓' : '⏳'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* KYC banner */}
        {userOrgs.some(o => o.owner_id === user?.id && (o.kyc_status === 'none')) && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">KYC requis pour les retraits</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/kyc')} className="h-7 text-xs">Soumettre</Button>
          </div>
        )}
      </div>
    </div>
  );
}
