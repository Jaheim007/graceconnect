import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import {
  Heart, ShoppingBag, Link2, TrendingUp, Copy, ExternalLink, CheckCircle,
  AlertTriangle, DollarSign, Download, BookOpen, Eye, FileText, Music,
  Wallet, ArrowUpRight, Sparkle, Gift, BarChart3, Clock, Users, Share2, Rocket
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
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateShareTools } from '@/components/affiliate/AffiliateShareTools';
import { ProductAffiliateLinkGen } from '@/components/affiliate/ProductAffiliateLinkGen';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageTour } from '@/components/onboarding/PageTour';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useStreak, useBadges, useRecordActivity, useCheckAndAwardBadges, BADGE_DEFINITIONS } from '@/hooks/useGamification';
import { useEffect } from 'react';
import { Flame, Award as AwardIcon, Trophy, CreditCard, MessageCircle } from 'lucide-react';
import { useMySubscriptions } from '@/hooks/useSubscriptions';

const statusColor: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
  pending: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
};

const saleStatusColor: Record<string, string> = {
  pending: 'bg-primary/10 text-primary',
  payable: 'bg-green-500/15 text-green-600 dark:text-green-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: t('dash.link_copied'), description: t('dash.link_copied_desc') });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  ebook: <BookOpen className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);
  const [requestingAffiliate, setRequestingAffiliate] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const dateFnsLocale = locale === 'fr' ? fr : enUS;
  const primaryCurrency = userOrgs[0]?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency || primaryCurrency, locale);

  // Gamification
  const { data: streak } = useStreak();
  const { data: badges = [] } = useBadges();
  const recordActivity = useRecordActivity();
  const checkBadges = useCheckAndAwardBadges();

  useEffect(() => {
    if (user) {
      recordActivity.mutate();
      checkBadges.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Data queries
  const { data: donations = [], isLoading: dLoading } = useQuery({
    queryKey: ['user-donations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      return (data || []) as Donation[];
    },
    enabled: !!user,
  });

  const { data: purchases = [], isLoading: pLoading } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('product_purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      return (data || []) as ProductPurchase[];
    },
    enabled: !!user,
  });

  const { data: affiliateLinks = [], isLoading: aLoading } = useQuery({
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
  const pendingCommission = affiliateSales.filter((s: { status: string }) => s.status === 'pending').reduce((sum: number, s: { commission_amount: number }) => sum + s.commission_amount, 0);

  const managedOrgIds = userOrgs.filter(o => o.owner_id === user?.id).map(o => o.id);

  const { data: orgDonationRevenue = [] } = useQuery({
    queryKey: ['user-org-donations-rev', user?.id, managedOrgIds],
    queryFn: async () => {
      if (!managedOrgIds.length) return [];
      const { data } = await db.from('donations').select('amount, organization_amount, currency').in('organization_id', managedOrgIds).eq('status', 'completed');
      return data || [];
    },
    enabled: managedOrgIds.length > 0,
  });

  const { data: orgPurchaseRevenue = [] } = useQuery({
    queryKey: ['user-org-purchases-rev', user?.id, managedOrgIds],
    queryFn: async () => {
      if (!managedOrgIds.length) return [];
      const { data } = await db.from('product_purchases').select('amount, organization_amount, currency').in('organization_id', managedOrgIds).eq('status', 'completed');
      return data || [];
    },
    enabled: managedOrgIds.length > 0,
  });

  const allOrgTxns = [...orgDonationRevenue, ...orgPurchaseRevenue];
  const totalOrgRevenue = allOrgTxns.reduce((s, t2) => s + (t2.amount || 0), 0);
  const totalOrgReceived = allOrgTxns.reduce((s, t2) => s + (t2.organization_amount || 0), 0);

  const handleRequestPayout = async (orgId: string, orgKycStatus: string) => {
    if (orgKycStatus === 'none' || orgKycStatus === 'pending') {
      toast({ title: t('dash.kyc_required_title'), description: t('dash.kyc_required_desc') });
      navigate('/admin/kyc');
      return;
    }
    setRequestingPayout(orgId);
    try {
      const result = await requestAffiliatePayout(orgId);
      toast({ title: t('dash.payout_requested'), description: t('dash.payout_desc').replace('{amount}', result.amount?.toLocaleString() || '0') });
      qc.invalidateQueries({ queryKey: ['user-affiliate-sales', user?.id] });
    } catch (err: unknown) {
      toast({ title: t('dash.request_failed'), description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setRequestingPayout(null); }
  };

  const requestAffiliateRole = useMutation({
    mutationFn: async ({ orgId }: { orgId: string; orgSlug: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db.rpc('self_enroll_affiliate', { _org_id: orgId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: t('dash.you_are_affiliate'), description: t('dash.affiliate_ready') });
      qc.invalidateQueries({ queryKey: ['user-affiliate-links', user?.id] });
      qc.invalidateQueries({ queryKey: ['user-memberships', user?.id] });
    },
    onError: (err: Error) => { toast({ title: t('common.error'), description: err.message, variant: 'destructive' }); },
  });

  const affiliateLinkOrgIds = new Set(affiliateLinks.map(l => l.organization_id));
  const orgsEligibleForAffiliate = userOrgs.filter(o => o.affiliation_enabled && !affiliateLinkOrgIds.has(o.id) && o.owner_id !== user?.id);

  const payableByOrg: Record<string, { orgId: string; amount: number; currency: string }> = {};
  for (const s of affiliateSales) {
    const sale = s as { status: string; organization_id: string; commission_amount: number; currency?: string };
    if (sale.status === 'payable') {
      if (!payableByOrg[sale.organization_id]) payableByOrg[sale.organization_id] = { orgId: sale.organization_id, amount: 0, currency: sale.currency || primaryCurrency };
      payableByOrg[sale.organization_id].amount += sale.commission_amount;
    }
  }

  const handleFileAction = async (purchase: NonNullable<typeof myResources>[number], mode: 'download' | 'inline') => {
    if (!purchase.product.file_url || !user) return;
    setDownloading(purchase.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watermark-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ file_url: purchase.product.file_url, product_id: purchase.product_id, product_title: purchase.product.title, inline: mode === 'inline' }),
      });
      if (!res.ok) { window.open(purchase.product.file_url, '_blank'); return; }
      const blob = await res.blob();
      if (mode === 'inline') { const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' })); window.open(url, '_blank'); }
      else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${purchase.product.title}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
    } catch { window.open(purchase.product.file_url, '_blank'); }
    finally { setDownloading(null); }
  };

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dash.good_morning') : hour < 18 ? t('dash.good_afternoon') : t('dash.good_evening');
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const displayName = profile?.display_name?.split(' ')[0] || 'User';
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Build stat cards
  const statCards = [
    ...(managedOrgIds.length > 0
      ? [
          { label: t('dash.sales'), value: fmt(totalOrgRevenue), icon: DollarSign, colorClass: 'text-primary bg-primary/10' },
          { label: t('dash.received'), value: fmt(totalOrgReceived), icon: TrendingUp, colorClass: 'text-green-500 bg-green-500/10' },
        ]
      : []),
    { label: t('dash.donations'), value: fmt(totalDonated), icon: Heart, colorClass: 'text-rose-500 bg-rose-500/10' },
    { label: t('dash.commissions'), value: fmt(totalEarned), icon: Link2, colorClass: 'text-primary bg-primary/10' },
    { label: t('dash.available'), value: fmt(payableCommission), icon: Wallet, colorClass: 'text-green-500 bg-green-500/10' },
    { label: t('sidebar.my_purchases'), value: String(myResources?.length || 0), icon: ShoppingBag, colorClass: 'text-amber-500 bg-amber-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl px-4 py-5 sm:py-6 space-y-5">
        <SEOHead title="Tableau de bord — Siteviral" description="Suivez vos ventes, commissions, donations et activités sur Siteviral." noindex />
        <div>
          <h1 className="sr-only">{t('page.dashboard')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('page.dashboard_desc')}</p>
        </div>

        <PageTour pageId="dashboard" steps={[
          { titleKey: 'tour.dashboard_1_title', descKey: 'tour.dashboard_1_desc', icon: <BarChart3 className="h-4 w-4" /> },
          { titleKey: 'tour.dashboard_2_title', descKey: 'tour.dashboard_2_desc', icon: <Sparkle className="h-4 w-4" /> },
          { titleKey: 'tour.dashboard_3_title', descKey: 'tour.dashboard_3_desc', icon: <BookOpen className="h-4 w-4" /> },
        ]} />

        {/* ══ GREETING HEADER ══ */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={initials} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {greeting}, {displayName}
            </h2>
            <p className="text-xs text-muted-foreground">{userOrgs.length} {userOrgs.length > 1 ? t('feed.organizations') : t('feed.organization')}</p>
          </div>
        </div>

        {/* ══ GAMIFICATION: Streak + Badges ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Streak */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold">{streak?.current_streak || 0} <span className="text-sm font-normal text-muted-foreground">{locale === 'fr' ? 'jours' : 'days'}</span></p>
              <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Série en cours' : 'Current streak'} · {locale === 'fr' ? 'Record' : 'Best'}: {streak?.longest_streak || 0}</p>
            </div>
          </div>
          {/* Badges */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">{badges.length} {locale === 'fr' ? 'badges' : 'badges'}</p>
            </div>
            {badges.length === 0 ? (
              <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Continuez pour débloquer des badges !' : 'Keep going to unlock badges!'}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {badges.slice(0, 8).map((b) => {
                  const def = BADGE_DEFINITIONS[b.badge_type];
                  return (
                    <span key={b.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-[11px] font-medium" title={def?.description || b.badge_label}>
                      {def?.emoji || '🏅'} {b.badge_label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ STAT CARDS — clean grid like reference ══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', card.colorClass)}>
                <card.icon className="h-4 w-4" />
              </div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ══ ROLE-ADAPTIVE CTA ══ */}
        {managedOrgIds.length === 0 && affiliateLinks.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/create')}
              className="group bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 rounded-2xl p-5 text-left hover:border-primary/40 hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Rocket className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-bold text-sm">{locale === 'fr' ? 'Créer ma plateforme' : 'Create my platform'}</h3>
              <p className="text-xs text-muted-foreground mt-1">{locale === 'fr' ? 'Vendez vos ressources et collectez des dons' : 'Sell your resources and collect donations'}</p>
            </button>
            <button
              onClick={() => navigate('/ambassador')}
              className="group bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/25 rounded-2xl p-5 text-left hover:border-amber-500/40 hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Share2 className="h-5 w-5 text-amber-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-sm">{locale === 'fr' ? 'Devenir ambassadeur' : 'Become ambassador'}</h3>
              <p className="text-xs text-muted-foreground mt-1">{locale === 'fr' ? 'Partagez du contenu et gagnez des commissions' : 'Share content and earn commissions'}</p>
            </button>
            <button onClick={() => navigate('/create-org')} className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-left">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">{locale === 'fr' ? 'Créer ma plateforme' : 'Create my platform'}</p>
                <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Vendez, collectez des dons, gérez votre communauté' : 'Sell, collect donations, manage your community'}</p>
              </div>
            </button>
            <button onClick={() => navigate('/ambassador')} className="flex items-center gap-3 p-4 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all text-left">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Share2 className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">{locale === 'fr' ? 'Devenir ambassadeur' : 'Become an ambassador'}</p>
                <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Gagnez des commissions en partageant du contenu' : 'Earn commissions by sharing content'}</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* ══ QUICK ACTIONS ══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: t('sidebar.my_purchases'), icon: BookOpen, onClick: () => navigate('/resources') },
            { label: t('sidebar.affiliation'), icon: Link2, onClick: () => navigate('/affiliation') },
            ...(managedOrgIds.length > 0
              ? [{ label: t('sidebar.manage_org'), icon: ArrowUpRight, onClick: () => navigate('/admin') }]
              : [{ label: t('dash.create_org'), icon: Gift, onClick: () => navigate('/create-org') }]),
            { label: t('dash.my_account'), icon: ArrowUpRight, onClick: () => navigate('/profile') },
          ].map((a, i) => (
            <Button
              key={`${a.label}-${i}`}
              variant="outline"
              size="sm"
              onClick={a.onClick}
              className="gap-2 text-xs h-10 justify-start hover:bg-primary/5 hover:border-primary/30 transition-colors"
            >
              <a.icon className="h-4 w-4 text-primary" />
              {a.label}
            </Button>
          ))}
        </div>

        {/* ══ MAIN CONTENT GRID ══ */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent Resources */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> {t('dash.latest_resources')}</h3>
              <button onClick={() => navigate('/resources')} className="text-xs text-primary font-medium hover:underline">{t('dash.view_all')}</button>
            </div>
            {resLoading ? <div className="px-5 pb-5"><SkeletonRow count={3} /></div> : !myResources?.length ? (
              <div className="text-center py-8 px-5">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('dash.no_purchases')}</p>
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
                    {p.product.file_url && (
                      <Button size="sm" variant="ghost" className="gap-1 text-[10px] h-7" onClick={() => handleFileAction(p, 'inline')}>
                        <Eye className="h-3 w-3" /> {t('dash.read')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Affiliate summary */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> {t('dash.affiliation')}</h3>
              <button onClick={() => navigate('/affiliation')} className="text-xs text-primary font-medium hover:underline">{t('dash.details')}</button>
            </div>
            {affiliateLinks.length === 0 ? (
              <div className="text-center py-6">
                <Link2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('dash.no_links')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: t('dash.links'), value: affiliateLinks.length, colorClass: '' },
                  { label: t('dash.total_earned'), value: fmt(totalEarned), colorClass: 'text-primary' },
                  { label: t('dash.withdrawable'), value: fmt(payableCommission), colorClass: 'text-green-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className={cn('text-base font-bold', s.colorClass)}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Eligible orgs for affiliate */}
            {orgsEligibleForAffiliate.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground">{t('dash.become_affiliate')}</p>
                {orgsEligibleForAffiliate.slice(0, 3).map((org) => (
                  <div key={org.id} className="flex items-center gap-2 p-2 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
                      {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-md" /> : <span className="text-[10px] font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{org.name}</p>
                      <p className="text-[10px] text-primary">{t('dash.earn_percent').replace('{percent}', String(org.affiliation_commission_percent))}</p>
                    </div>
                    <Button size="sm" className="h-6 text-[10px] px-2 bg-primary text-primary-foreground border-0" disabled={requestingAffiliate === org.id || requestAffiliateRole.isPending} onClick={async () => { setRequestingAffiliate(org.id); await requestAffiliateRole.mutateAsync({ orgId: org.id, orgSlug: org.slug }); setRequestingAffiliate(null); }}>
                      {requestingAffiliate === org.id ? '...' : t('dash.become')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ RECENT TRANSACTIONS ══ */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Donation history */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> {t('dash.donation_history')}</h3>
            {dLoading ? <SkeletonRow count={3} /> : donations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('dash.no_donations')}</p>
            ) : (
              <div className="space-y-1">
                {donations.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{d.donor_name || t('dash.anonymous')}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p>
                    </div>
                    <span className="font-semibold text-sm">{fmt(d.amount, d.currency)}</span>
                    <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[d.status] || '')}>{d.status === 'completed' ? t('dash.completed') : t('dash.pending')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchase history */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-amber-500" /> {t('dash.purchase_history')}</h3>
            {pLoading ? <SkeletonRow count={3} /> : purchases.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('dash.no_purchases_hist')}</p>
            ) : (
              <div className="space-y-1">
                {purchases.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t('dash.product_purchase')}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p>
                    </div>
                    <span className="font-semibold text-sm">{fmt(p.amount, p.currency)}</span>
                    <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[p.status] || '')}>{p.status === 'completed' ? t('dash.completed') : t('dash.pending')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ PAYOUT ══ */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Payout requests */}
          {Object.keys(payableByOrg).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> {t('dash.request_payout')}</h3>
              <p className="text-xs text-muted-foreground">{t('dash.kyc_required')}</p>
              <div className="space-y-2">
                {Object.values(payableByOrg).map(({ orgId, amount, currency }) => {
                  const org = userOrgs.find(o => o.id === orgId);
                  const kycStatus = kycStatuses[orgId] || 'none';
                  const kycApproved = kycStatus === 'level1' || kycStatus === 'level2';
                  return (
                    <div key={orgId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{org?.name || orgId}</p>
                        <p className="text-xs text-primary font-semibold">{fmt(amount, currency)} {t('dash.available_amount')}</p>
                      </div>
                      {!kycApproved && <div className="flex items-center gap-1 text-[10px] text-primary"><AlertTriangle className="h-3 w-3" /><span>{t('dash.kyc_required_short')}</span></div>}
                      <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground border-0" disabled={requestingPayout === orgId} onClick={() => handleRequestPayout(orgId, kycStatus)}>
                        {requestingPayout === orgId ? t('dash.requesting') : kycApproved ? t('dash.request_withdrawal') : t('dash.submit_kyc')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* KYC banner */}
        {userOrgs.some(o => o.owner_id === user?.id && (o.kyc_status === 'none')) && (
          <div className="flex flex-col sm:flex-row items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t('dash.kyc_required_title')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('dash.kyc_required_desc')}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/kyc')} className="h-8 text-xs shrink-0 w-full sm:w-auto">
              {t('dash.submit_kyc')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
