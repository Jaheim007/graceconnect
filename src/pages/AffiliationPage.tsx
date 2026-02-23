import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { AffiliateLink } from '@/types/database';
import {
  Link2, TrendingUp, Copy, CheckCircle, DollarSign, AlertTriangle,
  Users, ExternalLink, Search, Sparkle, Building2, ArrowRight, Wallet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { requestAffiliatePayout } from '@/lib/api';
import { AffiliateShareTools } from '@/components/affiliate/AffiliateShareTools';
import { ProductAffiliateLinkGen } from '@/components/affiliate/ProductAffiliateLinkGen';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { PageTour } from '@/components/onboarding/PageTour';
import { formatCurrency } from '@/lib/currency';

const saleStatusColor: Record<string, string> = {
  pending: 'bg-primary/10 text-primary',
  payable: 'bg-green-500/15 text-green-600 dark:text-green-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

type AffiliationTab = 'mes-liens' | 'decouvrir' | 'resultats';

export default function AffiliationPage() {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AffiliationTab>('mes-liens');
  const [requestingAffiliate, setRequestingAffiliate] = useState<string | null>(null);
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency);

  // My affiliate links
  const { data: affiliateLinks = [], isLoading: aLoading } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links')
        .select('*, organizations(name, slug, logo_url, affiliation_commission_percent)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as (AffiliateLink & { organizations: { name: string; slug: string; logo_url: string | null; affiliation_commission_percent: number | null } | null })[];
    },
    enabled: !!user,
  });

  // Affiliate sales
  const { data: affiliateSales = [] } = useQuery({
    queryKey: ['user-affiliate-sales', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_sales')
        .select('*')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // ALL orgs with affiliation enabled (for discovery)
  const { data: allAffiliateOrgs = [], isLoading: discoverLoading } = useQuery({
    queryKey: ['all-affiliate-orgs'],
    queryFn: async () => {
      const { data } = await db.from('organizations')
        .select('id, name, slug, logo_url, banner_url, description, affiliation_commission_percent, category, owner_id')
        .eq('is_active', true)
        .eq('affiliation_enabled', true)
        .order('affiliation_commission_percent', { ascending: false });
      return data || [];
    },
  });

  // KYC statuses
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

  // Exclude orgs the user owns — owners cannot be affiliates of their own org
  const ownedOrgIds = new Set(userOrgs.filter(o => o.owner_id === user?.id).map(o => o.id));
  // Filter out self-owned affiliate links from "Mes liens" display
  const filteredAffiliateLinks = affiliateLinks.filter(l => !ownedOrgIds.has(l.organization_id));
  const affiliateLinkOrgIds = new Set(filteredAffiliateLinks.map(l => l.organization_id));
  const subscribedOrgIds = new Set(userOrgs.map(o => o.id));

  // Split discovery orgs: subscribed first, then others — exclude owned orgs
  const subscribedWithAffiliation = allAffiliateOrgs.filter(o => subscribedOrgIds.has(o.id) && !affiliateLinkOrgIds.has(o.id) && !ownedOrgIds.has(o.id));
  const otherOrgs = allAffiliateOrgs.filter(o => !subscribedOrgIds.has(o.id) && !affiliateLinkOrgIds.has(o.id) && (o as any).owner_id !== user?.id);

  const filteredSubscribed = search
    ? subscribedWithAffiliation.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : subscribedWithAffiliation;
  const filteredOthers = search
    ? otherOrgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : otherOrgs;

  const totalEarned = filteredAffiliateLinks.reduce((s, l) => s + (l.total_earned || 0), 0);
  const payableCommission = affiliateSales.filter((s: any) => s.status === 'payable').reduce((sum: number, s: any) => sum + s.commission_amount, 0);
  const pendingCommission = affiliateSales.filter((s: any) => s.status === 'pending').reduce((sum: number, s: any) => sum + s.commission_amount, 0);
  const totalClicks = filteredAffiliateLinks.reduce((s, l) => s + (l.clicks || 0), 0);
  const totalConversions = filteredAffiliateLinks.reduce((s, l) => s + (l.conversions || 0), 0);

  const requestAffiliateRole = useMutation({
    mutationFn: async ({ orgId, orgSlug }: { orgId: string; orgSlug: string }) => {
      if (!user) throw new Error('Non authentifié');
      // Block owners from becoming affiliates of their own org
      const { data: orgRow } = await db.from('organizations').select('owner_id').eq('id', orgId).single();
      if (orgRow?.owner_id === user.id) throw new Error('Vous ne pouvez pas devenir affilié de votre propre organisation.');

      // Check if already member
      const { data: memberRow } = await db.from('organization_members')
        .select('id, role').eq('user_id', user.id).eq('organization_id', orgId).maybeSingle();
      
      if (!memberRow) {
        await db.from('organization_members').insert({ user_id: user.id, organization_id: orgId, role: 'affiliate' });
      } else if (memberRow.role !== 'affiliate' && memberRow.role !== 'owner' && memberRow.role !== 'admin' && memberRow.role !== 'editor') {
        await db.from('organization_members').update({ role: 'affiliate' }).eq('id', memberRow.id);
      }
      const code = `${orgSlug.slice(0, 6).toUpperCase()}-${user.id.slice(0, 6).toUpperCase()}`;
      const { data: existingLink } = await db.from('affiliate_links').select('id').eq('user_id', user.id).eq('organization_id', orgId).maybeSingle();
      if (!existingLink) {
        await db.from('affiliate_links').insert({ user_id: user.id, organization_id: orgId, code, link_type: 'org' });
      }
    },
    onSuccess: () => {
      toast({ title: 'Vous êtes affilié !', description: 'Votre lien est prêt à être partagé.' });
      qc.invalidateQueries({ queryKey: ['user-affiliate-links'] });
      qc.invalidateQueries({ queryKey: ['user-memberships'] });
    },
    onError: (err: Error) => { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); },
  });

  const handleRequestPayout = async (orgId: string, orgKycStatus: string) => {
    if (orgKycStatus === 'none' || orgKycStatus === 'pending') {
      toast({ title: 'KYC requis', description: 'Complétez la vérification avant de demander un retrait.' });
      navigate('/admin/kyc');
      return;
    }
    setRequestingPayout(orgId);
    try {
      const result = await requestAffiliatePayout(orgId);
      toast({ title: 'Retrait demandé', description: `Montant : ${result.amount?.toLocaleString() || '0'} XOF` });
      qc.invalidateQueries({ queryKey: ['user-affiliate-sales'] });
    } catch (err: unknown) {
      toast({ title: 'Échec', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setRequestingPayout(null); }
  };

  const payableByOrg: Record<string, { orgId: string; amount: number; currency: string }> = {};
  for (const s of affiliateSales) {
    const sale = s as any;
    if (sale.status === 'payable') {
      if (!payableByOrg[sale.organization_id]) payableByOrg[sale.organization_id] = { orgId: sale.organization_id, amount: 0, currency: sale.currency || 'XOF' };
      payableByOrg[sale.organization_id].amount += sale.commission_amount;
    }
  }

  const tabs: { key: AffiliationTab; label: string; icon: typeof Link2 }[] = [
    { key: 'mes-liens', label: 'Mes liens', icon: Link2 },
    { key: 'decouvrir', label: 'Découvrir', icon: Search },
    { key: 'resultats', label: 'Résultats', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Affiliation — Siteviral" description="Gagnez des commissions en partageant les ressources des organisations." />
      <div className="container max-w-4xl px-4 py-5 sm:py-6 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" /> {t('page.affiliation')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('page.affiliation_desc')}
          </p>
        </motion.div>

        <PageTour pageId="affiliation" steps={[
          { titleKey: 'tour.affiliation_1_title', descKey: 'tour.affiliation_1_desc', icon: <Link2 className="h-4 w-4" /> },
          { titleKey: 'tour.affiliation_2_title', descKey: 'tour.affiliation_2_desc', icon: <Search className="h-4 w-4" /> },
          { titleKey: 'tour.affiliation_3_title', descKey: 'tour.affiliation_3_desc', icon: <TrendingUp className="h-4 w-4" /> },
        ]} />

        {/* Stats Banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Liens actifs', value: filteredAffiliateLinks.length, colorClass: '' },
            { label: 'Clics totaux', value: totalClicks, colorClass: '' },
            { label: 'Conversions', value: totalConversions, colorClass: 'text-primary' },
            { label: 'Gains totaux', value: fmt(totalEarned), colorClass: 'text-green-600 dark:text-green-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-3 text-center shadow-card">
              <p className={cn('text-lg font-bold', s.colorClass)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex-1 justify-center',
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: My Links */}
        {activeTab === 'mes-liens' && (
          <div className="space-y-4">
            {payableCommission > 0 && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <Wallet className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">{fmt(payableCommission)} disponible(s) pour retrait</p>
                  {pendingCommission > 0 && <p className="text-[10px] text-muted-foreground">{fmt(pendingCommission)} en attente de validation</p>}
                </div>
              </div>
            )}

            {aLoading ? <SkeletonRow count={3} /> : filteredAffiliateLinks.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Link2 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">Aucun lien d'affiliation</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">Découvrez les organisations avec un programme d'affiliation et commencez à gagner des commissions.</p>
                <Button size="sm" onClick={() => setActiveTab('decouvrir')} className="mt-2 gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Découvrir des programmes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAffiliateLinks.map((l) => {
                  const shareUrl = `${window.location.origin}/org/${l.organizations?.slug}?ref=${l.code}`;
                  return (
                    <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {l.organizations?.logo_url ? (
                            <img src={l.organizations.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{l.organizations?.name || 'Organisation'}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{l.code}</p>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px] border-0', l.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground')}>
                          {l.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        {l.organizations?.affiliation_commission_percent && (
                          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{l.organizations.affiliation_commission_percent}%</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <p className="text-sm font-bold">{l.clicks || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Clics</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2">
                          <p className="text-sm font-bold">{l.conversions || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Conversions</p>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-2">
                          <p className="text-sm font-bold text-primary">{fmt(l.total_earned || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">Gagné</p>
                        </div>
                      </div>
                      <AffiliateShareTools shareUrl={shareUrl} orgName={l.organizations?.name || ''} affiliateCode={l.code} />
                      <ProductAffiliateLinkGen orgId={l.organization_id} orgSlug={l.organizations?.slug || ''} userId={user?.id || ''} affiliateCode={l.code} />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Payout requests */}
            {Object.keys(payableByOrg).length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-card">
                <h2 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Demander un retrait</h2>
                <p className="text-xs text-muted-foreground">La vérification KYC est requise avant tout retrait.</p>
                <div className="space-y-2">
                  {Object.values(payableByOrg).map(({ orgId, amount, currency }) => {
                    const org = userOrgs.find(o => o.id === orgId) || allAffiliateOrgs.find(o => o.id === orgId);
                    const kycStatus = kycStatuses[orgId] || 'none';
                    const kycApproved = kycStatus === 'level1' || kycStatus === 'level2';
                    return (
                      <div key={orgId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{org?.name || orgId}</p>
                          <p className="text-xs text-primary font-semibold">{fmt(amount, currency)} disponible</p>
                        </div>
                        {!kycApproved && <div className="flex items-center gap-1 text-[10px] text-primary"><AlertTriangle className="h-3 w-3" /><span>KYC requis</span></div>}
                        <Button size="sm" className="h-7 text-xs" disabled={requestingPayout === orgId} onClick={() => handleRequestPayout(orgId, kycStatus)}>
                          {requestingPayout === orgId ? 'Envoi...' : kycApproved ? 'Retirer' : 'Soumettre KYC'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Discover */}
        {activeTab === 'decouvrir' && (
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une organisation..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            {/* Subscribed orgs with affiliation */}
            {filteredSubscribed.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Sparkle className="h-4 w-4 text-primary" /> Vos abonnements avec affiliation</h2>
                  <p className="text-[11px] text-muted-foreground">Organisations auxquelles vous êtes abonné et qui proposent un programme d'affiliation.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredSubscribed.map((org: any) => (
                    <OrgAffiliateCard
                      key={org.id}
                      org={org}
                      isSubscribed
                      onBecome={() => {
                        setRequestingAffiliate(org.id);
                        requestAffiliateRole.mutateAsync({ orgId: org.id, orgSlug: org.slug }).finally(() => setRequestingAffiliate(null));
                      }}
                      loading={requestingAffiliate === org.id}
                      onView={() => navigate(`/org/${org.slug}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other orgs */}
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> Tous les programmes d'affiliation</h2>
                <p className="text-[11px] text-muted-foreground">Classés par taux de commission décroissant. Rejoignez n'importe quel programme pour commencer à gagner.</p>
              </div>
              {discoverLoading ? <SkeletonRow count={4} /> : filteredOthers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {search ? 'Aucune organisation trouvée.' : 'Aucun autre programme d\'affiliation disponible.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredOthers.map((org: any) => (
                    <OrgAffiliateCard
                      key={org.id}
                      org={org}
                      isSubscribed={false}
                      onBecome={() => {
                        setRequestingAffiliate(org.id);
                        requestAffiliateRole.mutateAsync({ orgId: org.id, orgSlug: org.slug }).finally(() => setRequestingAffiliate(null));
                      }}
                      loading={requestingAffiliate === org.id}
                      onView={() => navigate(`/org/${org.slug}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Results */}
        {activeTab === 'resultats' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card border border-border p-4 shadow-card">
                <p className="text-2xl font-bold text-primary">{fmt(payableCommission)}</p>
                <p className="text-xs text-muted-foreground">Disponible pour retrait</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-4 shadow-card">
                <p className="text-2xl font-bold">{fmt(pendingCommission)}</p>
                <p className="text-xs text-muted-foreground">En attente (72h)</p>
              </div>
            </div>

            {/* Sales history */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-card">
              <h2 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Historique des commissions</h2>
              <p className="text-xs text-muted-foreground">Les commissions sont payables après un délai de sécurité de 72h.</p>
              {affiliateSales.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune commission pour le moment.</p>
                  <p className="text-xs text-muted-foreground">Partagez vos liens pour commencer à gagner !</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {affiliateSales.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">Vente {s.transaction_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString('fr-FR')} · {s.commission_percent}% · Brut {fmt(s.gross_amount, s.currency || 'XOF')}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-primary">+{fmt(s.commission_amount, s.currency || 'XOF')}</span>
                      <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', saleStatusColor[s.status] || '')}>
                        {s.status === 'payable' ? 'Disponible' : s.status === 'pending' ? 'En attente' : s.status === 'paid' ? 'Payé' : s.status}
                      </Badge>
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

// Sub-component: Org card for discovery
function OrgAffiliateCard({ org, isSubscribed, onBecome, loading, onView }: {
  org: { id: string; name: string; slug: string; logo_url: string | null; description: string | null; affiliation_commission_percent: number | null; category: string | null };
  isSubscribed: boolean;
  onBecome: () => void;
  loading: boolean;
  onView: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card border rounded-2xl p-4 space-y-3 shadow-card transition-all hover:shadow-elevated',
        isSubscribed ? 'border-primary/30' : 'border-border'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
          {org.logo_url ? (
            <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{org.name}</p>
          {org.category && <p className="text-[10px] text-muted-foreground capitalize">{org.category}</p>}
        </div>
        <Badge className="bg-primary text-primary-foreground border-0 text-xs font-bold shrink-0">
          {org.affiliation_commission_percent || 10}%
        </Badge>
      </div>
      {org.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">{org.description}</p>
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={onBecome} disabled={loading}>
          <Link2 className="h-3.5 w-3.5" />
          {loading ? 'En cours...' : 'Devenir affilié'}
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={onView}>
          <ExternalLink className="h-3 w-3" /> Voir
        </Button>
      </div>
      {isSubscribed && (
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
          <Sparkle className="h-2.5 w-2.5 mr-1" /> Abonné
        </Badge>
      )}
    </motion.div>
  );
}

