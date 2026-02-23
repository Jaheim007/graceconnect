import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import {
  Heart, ShoppingBag, Link2, TrendingUp, Copy, ExternalLink, CheckCircle,
  AlertTriangle, DollarSign, Download, BookOpen, Eye, FileText, Music,
  Wallet, ArrowUpRight, Sparkle, Gift, BarChart3, Clock, Users, Share2
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
import { PageTour } from '@/components/onboarding/PageTour';

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

type DashboardTab = 'apercu' | 'ressources' | 'affiliation' | 'historique';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);
  const [requestingAffiliate, setRequestingAffiliate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('apercu');
  const [downloading, setDownloading] = useState<string | null>(null);

  const dateFnsLocale = locale === 'fr' ? fr : enUS;
  const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

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

  const { data: referralInfo } = useQuery({
    queryKey: ['user-referral-info', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await db.from('profiles').select('referral_code').eq('id', user.id).maybeSingle();
      const { data: referrals } = await db.from('user_referrals').select('*').eq('referrer_id', user.id);
      return {
        code: profile?.referral_code || `SV-${user.id.slice(0, 8).toUpperCase()}`,
        referrals: referrals || [],
        totalReferred: referrals?.length || 0,
        converted: referrals?.filter((r: any) => r.status === 'converted').length || 0,
      };
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
  const baseUrl = window.location.origin;

  const managedOrgIds = userOrgs.filter(o => o.owner_id === user?.id).map(o => o.id);

  const { data: orgDonationRevenue = [] } = useQuery({
    queryKey: ['user-org-donations-rev', user?.id, managedOrgIds],
    queryFn: async () => {
      if (!managedOrgIds.length) return [];
      const { data } = await db.from('donations').select('amount, organization_amount').in('organization_id', managedOrgIds).eq('status', 'completed');
      return data || [];
    },
    enabled: managedOrgIds.length > 0,
  });

  const { data: orgPurchaseRevenue = [] } = useQuery({
    queryKey: ['user-org-purchases-rev', user?.id, managedOrgIds],
    queryFn: async () => {
      if (!managedOrgIds.length) return [];
      const { data } = await db.from('product_purchases').select('amount, organization_amount').in('organization_id', managedOrgIds).eq('status', 'completed');
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
    mutationFn: async ({ orgId, orgSlug }: { orgId: string; orgSlug: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: memberRow } = await db.from('organization_members').select('id, role').eq('user_id', user.id).eq('organization_id', orgId).single();
      if (!memberRow) throw new Error('Must be a member');
      if (memberRow.role === 'affiliate') throw new Error('Already affiliate');
      const { error: roleErr } = await db.from('organization_members').update({ role: 'affiliate' }).eq('id', memberRow.id);
      if (roleErr) throw roleErr;
      const code = `${orgSlug.slice(0, 6).toUpperCase()}-${user.id.slice(0, 6).toUpperCase()}`;
      const { data: existingLink } = await db.from('affiliate_links').select('id').eq('user_id', user.id).eq('organization_id', orgId).maybeSingle();
      if (!existingLink) {
        await db.from('affiliate_links').insert({ user_id: user.id, organization_id: orgId, code, link_type: 'org' });
      }
    },
    onSuccess: () => {
      toast({ title: t('dash.you_are_affiliate'), description: t('dash.affiliate_ready') });
      qc.invalidateQueries({ queryKey: ['user-affiliate-links', user?.id] });
      qc.invalidateQueries({ queryKey: ['user-memberships', user?.id] });
    },
    onError: (err: Error) => { toast({ title: t('common.error'), description: err.message, variant: 'destructive' }); },
  });

  const affiliateLinkOrgIds = new Set(affiliateLinks.map(l => l.organization_id));
  const orgsEligibleForAffiliate = userOrgs.filter(o => o.affiliation_enabled && !affiliateLinkOrgIds.has(o.id));

  const payableByOrg: Record<string, { orgId: string; amount: number; currency: string }> = {};
  for (const s of affiliateSales) {
    const sale = s as { status: string; organization_id: string; commission_amount: number; currency?: string };
    if (sale.status === 'payable') {
      if (!payableByOrg[sale.organization_id]) payableByOrg[sale.organization_id] = { orgId: sale.organization_id, amount: 0, currency: sale.currency || 'USD' };
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

  const tabs: { key: DashboardTab; label: string; icon: typeof Heart; desc: string }[] = [
    { key: 'apercu', label: t('dash.overview'), icon: BarChart3, desc: 'Dashboard' },
    { key: 'ressources', label: t('dash.resources'), icon: BookOpen, desc: t('dash.your_purchases') },
    { key: 'affiliation', label: t('dash.affiliation'), icon: Link2, desc: t('dash.commissions') },
    { key: 'historique', label: t('dash.history'), icon: Clock, desc: 'Transactions' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-4 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* Page description */}
        <div>
          <h1 className="sr-only">{t('page.dashboard')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('page.dashboard_desc')}</p>
        </div>

        <PageTour pageId="dashboard" steps={[
          { titleKey: 'tour.dashboard_1_title', descKey: 'tour.dashboard_1_desc', icon: <BarChart3 className="h-4 w-4" /> },
          { titleKey: 'tour.dashboard_2_title', descKey: 'tour.dashboard_2_desc', icon: <Sparkle className="h-4 w-4" /> },
          { titleKey: 'tour.dashboard_3_title', descKey: 'tour.dashboard_3_desc', icon: <BookOpen className="h-4 w-4" /> },
        ]} />
        {/* ══ COMPACT HERO ══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-primary p-4 sm:p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt={initials} className="h-full w-full object-cover" />
              ) : (
                <span className="text-base font-bold text-white">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                {greeting}, {displayName}
              </h1>
              <p className="text-[11px] text-white/60">{userOrgs.length} {userOrgs.length > 1 ? t('feed.organizations') : t('feed.organization')}</p>
            </div>
          </div>

          {/* Inline stats */}
          <div className="relative z-10 flex items-center gap-4 mt-3 pt-3 border-t border-white/15 overflow-x-auto scrollbar-hide">
            {[
              ...(managedOrgIds.length > 0 ? [
                { label: t('dash.sales'), value: fmt(totalOrgRevenue) },
                { label: t('dash.received'), value: fmt(totalOrgReceived) },
              ] : []),
              { label: t('dash.donations'), value: fmt(totalDonated) },
              { label: t('dash.commissions'), value: fmt(totalEarned) },
              ...(managedOrgIds.length === 0 ? [{ label: t('dash.available'), value: fmt(payableCommission) }] : []),
            ].map((s) => (
              <div key={s.label} className="shrink-0 text-center">
                <p className="text-sm font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ══ TABS ══ */}
        <div className="flex gap-1 sm:gap-1.5 bg-muted/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex-1 justify-center',
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* ══ TAB: OVERVIEW ══ */}
        {activeTab === 'apercu' && (
          <div className="space-y-5">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t('dash.my_resources'), icon: BookOpen, colorClass: 'bg-accent/10 text-accent', onClick: () => setActiveTab('ressources'), count: myResources?.length || 0 },
                { label: t('dash.affiliation'), icon: Link2, colorClass: 'bg-primary/10 text-primary', onClick: () => setActiveTab('affiliation'), count: affiliateLinks.length },
                { label: t('dash.create_org'), icon: Gift, colorClass: 'bg-green-500/10 text-green-500', onClick: () => navigate('/create-org'), count: null },
                { label: t('dash.my_account'), icon: ArrowUpRight, colorClass: 'bg-muted text-foreground', onClick: () => navigate('/profile'), count: null },
              ].map((a, i) => (
                <motion.button
                  key={a.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={a.onClick}
                  className="group bg-card border border-border rounded-2xl p-4 shadow-card text-left hover:shadow-elevated transition-all hover:-translate-y-0.5"
                >
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-3', a.colorClass)}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{a.label}</p>
                  {a.count !== null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.count} {a.count > 1 ? t('dash.items_plural') : t('dash.items')}</p>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Recent Resources */}
            {myResources && myResources.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> {t('dash.latest_resources')}</h2>
                  <button onClick={() => setActiveTab('ressources')} className="text-xs text-primary font-medium hover:underline">{t('dash.view_all')}</button>
                </div>
                <div className="divide-y divide-border/50">
                  {myResources.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {p.product.cover_image_url ? <img src={p.product.cover_image_url} alt="" className="w-full h-full object-cover" /> : (typeIcons[p.product.product_type] || <FileText className="h-5 w-5 text-muted-foreground" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.product.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{p.product.product_type}</p>
                      </div>
                      {p.product.file_url && (
                        <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => handleFileAction(p, 'inline')}>
                          <Eye className="h-3 w-3" /> {t('dash.read')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Affiliate summary */}
            {affiliateLinks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> {t('dash.affiliation')}</h2>
                  <button onClick={() => setActiveTab('affiliation')} className="text-xs text-primary font-medium hover:underline">{t('dash.details')}</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('dash.links'), value: affiliateLinks.length, colorClass: '' },
                    { label: t('dash.total_earned'), value: fmt(totalEarned), colorClass: 'text-primary' },
                    { label: t('dash.withdrawable'), value: fmt(payableCommission), colorClass: 'text-green-500' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className={cn('text-lg font-bold', s.colorClass)}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ══ TAB: RESOURCES ══ */}
        {activeTab === 'ressources' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> {t('dash.my_resources')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dash.all_purchased')}</p>
            </div>
            {resLoading ? <SkeletonRow count={3} /> : !myResources?.length ? (
              <div className="text-center py-10">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('dash.no_purchases')}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/feed')}>{t('dash.explore')}</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myResources.map((purchase) => (
                  <div key={purchase.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors shadow-card">
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {purchase.product.cover_image_url ? <img src={purchase.product.cover_image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">{typeIcons[purchase.product.product_type] || <FileText className="h-6 w-6" />}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{purchase.product.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{purchase.product.product_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {purchase.completed_at ? format(new Date(purchase.completed_at), 'dd MMM yyyy', { locale: dateFnsLocale }) : format(new Date(purchase.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                      {purchase.product.file_url && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => handleFileAction(purchase, 'inline')} disabled={downloading === purchase.id}>
                            <Eye className="h-3 w-3" /> {t('dash.read')}
                          </Button>
                          <Button size="sm" className="gap-1 text-[10px] h-7 bg-primary text-primary-foreground border-0" onClick={() => handleFileAction(purchase, 'download')} disabled={downloading === purchase.id}>
                            <Download className="h-3 w-3" /> {downloading === purchase.id ? '...' : t('dash.download')}
                          </Button>
                        </>
                      )}
                      {purchase.product.external_link && (
                        <a href={purchase.product.external_link} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 w-full"><ExternalLink className="h-3 w-3" /> {t('dash.access')}</Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: AFFILIATION ══ */}
        {activeTab === 'affiliation' && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> {t('dash.my_affiliate_links')}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('dash.share_links')}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {payableCommission > 0 && <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-0 text-xs">{fmt(payableCommission)} {t('dash.available_amount')}</Badge>}
                  {pendingCommission > 0 && <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-xs">{fmt(pendingCommission)} {t('dash.status_pending').toLowerCase()}</Badge>}
                </div>
              </div>

              {aLoading ? <SkeletonRow count={2} /> : affiliateLinks.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">{t('dash.no_links')}</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">{t('dash.no_links_desc')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {affiliateLinks.map((l) => {
                    const shareUrl = `https://siteviral.com/org/${l.organizations?.slug}?ref=${l.code}`;
                    return (
                      <div key={l.id} className="border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{l.organizations?.name || 'Organization'}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{t('dash.affiliate_code')} <span className="font-mono">{l.code}</span></p>
                          </div>
                          <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', l.is_active ? 'bg-accent/10 text-accent-foreground' : 'bg-muted text-muted-foreground')}>
                            {l.is_active ? t('dash.active') : t('dash.inactive')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-muted/50 p-2">
                            <p className="text-sm font-bold">{l.clicks || 0}</p>
                            <p className="text-[10px] text-muted-foreground">{t('dash.clicks')}</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2">
                            <p className="text-sm font-bold">{l.conversions || 0}</p>
                            <p className="text-[10px] text-muted-foreground">{t('dash.conversions')}</p>
                          </div>
                          <div className="rounded-lg bg-primary/10 p-2">
                            <p className="text-sm font-bold text-primary">{fmt(l.total_earned || 0)}</p>
                            <p className="text-[10px] text-muted-foreground">{t('dash.earned')}</p>
                          </div>
                        </div>
                        <AffiliateShareTools
                          shareUrl={shareUrl}
                          orgName={l.organizations?.name || 'Organization'}
                          affiliateCode={l.code}
                        />
                        <ProductAffiliateLinkGen
                          orgId={l.organization_id}
                          orgSlug={l.organizations?.slug || ''}
                          userId={user?.id || ''}
                          affiliateCode={l.code}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {orgsEligibleForAffiliate.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-card">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> {t('dash.become_affiliate')}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('dash.become_affiliate_desc')}</p>
                </div>
                <div className="space-y-2">
                  {orgsEligibleForAffiliate.map((org) => (
                    <div key={org.id} className="border border-primary/20 bg-primary/5 rounded-xl p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-lg" /> : <span className="text-xs font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{org.name}</p>
                        <p className="text-xs text-primary font-semibold">{t('dash.earn_percent').replace('{percent}', String(org.affiliation_commission_percent))}</p>
                      </div>
                      <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground border-0 shrink-0" disabled={requestingAffiliate === org.id || requestAffiliateRole.isPending} onClick={async () => { setRequestingAffiliate(org.id); await requestAffiliateRole.mutateAsync({ orgId: org.id, orgSlug: org.slug }); setRequestingAffiliate(null); }}>
                        {requestingAffiliate === org.id ? t('dash.becoming') : t('dash.become')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(payableByOrg).length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-card">
                <h2 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> {t('dash.request_payout')}</h2>
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

            {affiliateSales.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-card">
                <h2 className="font-semibold text-sm">{t('dash.commission_history')}</h2>
                <p className="text-xs text-muted-foreground">{t('dash.commission_delay')}</p>
                <div className="space-y-1">
                  {affiliateSales.map((s: { id: string; transaction_type: string; gross_amount: number; commission_amount: number; commission_percent: number; currency?: string; status: string; created_at: string; payable_at?: string }) => (
                    <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">{t('dash.sale')} {s.transaction_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')} · {s.commission_percent}% · {t('dash.gross')} {fmt(s.gross_amount, s.currency || 'USD')}</p>
                      </div>
                      <span className="font-semibold text-sm text-primary">+{fmt(s.commission_amount, s.currency || 'USD')}</span>
                      <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', saleStatusColor[s.status] || '')}>{s.status === 'payable' ? t('dash.status_available') : s.status === 'pending' ? t('dash.status_pending') : s.status === 'paid' ? t('dash.status_paid') : s.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referral Program */}
            {referralInfo && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {t('dash.referral_program')}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('dash.referral_desc')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold">{referralInfo.totalReferred}</p>
                    <p className="text-[10px] text-muted-foreground">{t('dash.invited')}</p>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3 text-center">
                    <p className="text-lg font-bold text-primary">{referralInfo.converted}</p>
                    <p className="text-[10px] text-muted-foreground">{t('dash.converted')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{t('dash.your_referral_code')}</p>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <p className="text-sm font-mono font-bold flex-1">{referralInfo.code}</p>
                    <CopyButton text={`https://siteviral.com/auth?invite=${referralInfo.code}`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t('dash.share_link')} <span className="font-mono">siteviral.com/auth?invite={referralInfo.code}</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: HISTORY ══ */}
        {activeTab === 'historique' && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-card">
              <h2 className="font-semibold text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> {t('dash.donation_history')}</h2>
              {dLoading ? <SkeletonRow count={3} /> : donations.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t('dash.no_donations')}</p>
              ) : (
                <div className="space-y-1">
                  {donations.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.donor_name || t('dash.anonymous')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p>
                      </div>
                      <span className="font-semibold text-sm">{fmt(d.amount, d.currency)}</span>
                      <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[d.status] || '')}>{d.status === 'completed' ? t('dash.completed') : d.status === 'pending' ? t('dash.pending') : d.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-card">
              <h2 className="font-semibold text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-accent" /> {t('dash.purchase_history')}</h2>
              {pLoading ? <SkeletonRow count={3} /> : purchases.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t('dash.no_purchases_hist')}</p>
              ) : (
                <div className="space-y-1">
                  {purchases.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t('dash.product_purchase')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p>
                      </div>
                      <span className="font-semibold text-sm">{fmt(p.amount, p.currency)}</span>
                      <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[p.status] || '')}>{p.status === 'completed' ? t('dash.completed') : p.status === 'pending' ? t('dash.pending') : p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
