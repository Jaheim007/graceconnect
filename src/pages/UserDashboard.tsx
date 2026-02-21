import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import { Heart, ShoppingBag, Link2, TrendingUp, Copy, ExternalLink, CheckCircle, AlertTriangle, DollarSign, Download, BookOpen, Eye, FileText, Music } from 'lucide-react';
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
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const fmt = (n: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Lien copié !', description: 'Partagez-le pour gagner des commissions.' });
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
  const qc = useQueryClient();
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);
  const [requestingAffiliate, setRequestingAffiliate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('apercu');
  const [downloading, setDownloading] = useState<string | null>(null);

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
  const baseUrl = window.location.origin;

  const handleRequestPayout = async (orgId: string, orgKycStatus: string) => {
    if (orgKycStatus === 'none' || orgKycStatus === 'pending') {
      toast({ title: 'KYC requis pour le retrait', description: 'Veuillez compléter la vérification KYC avant de demander un retrait.' });
      navigate('/admin/kyc');
      return;
    }
    setRequestingPayout(orgId);
    try {
      const result = await requestAffiliatePayout(orgId);
      toast({ title: 'Retrait demandé', description: `${result.amount?.toLocaleString()} XOF demandé. Vous serez notifié du traitement.` });
      qc.invalidateQueries({ queryKey: ['user-affiliate-sales', user?.id] });
    } catch (err: unknown) {
      toast({ title: 'Échec de la demande', description: err instanceof Error ? err.message : 'Réessayez.', variant: 'destructive' });
    } finally { setRequestingPayout(null); }
  };

  const requestAffiliateRole = useMutation({
    mutationFn: async ({ orgId, orgSlug }: { orgId: string; orgSlug: string }) => {
      if (!user) throw new Error('Non authentifié');
      const { data: memberRow } = await db.from('organization_members').select('id, role').eq('user_id', user.id).eq('organization_id', orgId).single();
      if (!memberRow) throw new Error('Vous devez être membre de cette organisation.');
      if (memberRow.role === 'affiliate') throw new Error('Déjà affilié');
      const { error: roleErr } = await db.from('organization_members').update({ role: 'affiliate' }).eq('id', memberRow.id);
      if (roleErr) throw roleErr;
      const code = `${orgSlug.slice(0, 6).toUpperCase()}-${user.id.slice(0, 6).toUpperCase()}`;
      const { data: existingLink } = await db.from('affiliate_links').select('id').eq('user_id', user.id).eq('organization_id', orgId).maybeSingle();
      if (!existingLink) {
        await db.from('affiliate_links').insert({ user_id: user.id, organization_id: orgId, code, link_type: 'org' });
      }
    },
    onSuccess: () => {
      toast({ title: 'Vous êtes affilié !', description: 'Votre lien de parrainage est prêt. Partagez-le pour commencer à gagner.' });
      qc.invalidateQueries({ queryKey: ['user-affiliate-links', user?.id] });
      qc.invalidateQueries({ queryKey: ['user-memberships', user?.id] });
    },
    onError: (err: Error) => { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); },
  });

  const affiliateLinkOrgIds = new Set(affiliateLinks.map(l => l.organization_id));
  const orgsEligibleForAffiliate = userOrgs.filter(o => o.affiliation_enabled && !affiliateLinkOrgIds.has(o.id));

  const payableByOrg: Record<string, { orgId: string; amount: number; currency: string }> = {};
  for (const s of affiliateSales) {
    const sale = s as { status: string; organization_id: string; commission_amount: number; currency?: string };
    if (sale.status === 'payable') {
      if (!payableByOrg[sale.organization_id]) payableByOrg[sale.organization_id] = { orgId: sale.organization_id, amount: 0, currency: sale.currency || 'XOF' };
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
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const displayName = profile?.display_name?.split(' ')[0] || 'Utilisateur';

  const tabs: { key: DashboardTab; label: string }[] = [
    { key: 'apercu', label: 'Aperçu' },
    { key: 'ressources', label: 'Mes Ressources' },
    { key: 'affiliation', label: 'Affiliation' },
    { key: 'historique', label: 'Historique' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Greeting Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-2xl sm:text-3xl font-bold">{greeting}, <span className="text-primary">{displayName}</span></h1>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Dons', value: fmt(totalDonated), sub: `${donations.length} don${donations.length > 1 ? 's' : ''}`, icon: Heart, colorClass: 'text-destructive bg-destructive/10' },
            { label: 'Achats', value: String(purchases.length), sub: 'produits achetés', icon: ShoppingBag, colorClass: 'text-accent bg-accent/10' },
            { label: 'Commissions', value: fmt(totalEarned), sub: affiliateLinks.length > 0 ? `${affiliateLinks.length} lien${affiliateLinks.length > 1 ? 's' : ''}` : 'Aucun lien', icon: Link2, colorClass: 'text-primary bg-primary/10' },
            { label: 'Disponible', value: fmt(payableCommission), sub: pendingCommission > 0 ? `${fmt(pendingCommission)} en attente` : 'À retirer', icon: DollarSign, colorClass: 'text-green-500 bg-green-500/10' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-4 shadow-card"
            >
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-2', s.colorClass)}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all border',
                activeTab === t.key
                  ? 'gold-gradient text-primary-foreground border-primary shadow-gold'
                  : 'border-border text-muted-foreground hover:text-foreground bg-card'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB: APERÇU ══ */}
        {activeTab === 'apercu' && (
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-3">Accès rapide</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Mes Ressources', onClick: () => setActiveTab('ressources'), icon: BookOpen },
                  { label: 'Affiliation', onClick: () => setActiveTab('affiliation'), icon: Link2 },
                  { label: 'Historique', onClick: () => setActiveTab('historique'), icon: TrendingUp },
                  { label: 'Explorer', onClick: () => navigate('/discover'), icon: Heart },
                  { label: 'Mon Profil', onClick: () => navigate('/profile'), icon: CheckCircle },
                ].map((a) => (
                  <Button key={a.label} variant="outline" size="sm" onClick={a.onClick} className="gap-1.5 text-xs h-9 justify-start hover:bg-muted">
                    <a.icon className="h-3.5 w-3.5 text-primary" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Recent Resources preview */}
            {myResources && myResources.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Dernières ressources</h2>
                  <button onClick={() => setActiveTab('ressources')} className="text-xs text-primary font-medium hover:underline">Tout voir →</button>
                </div>
                <div className="space-y-2">
                  {myResources.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {p.product.cover_image_url ? <img src={p.product.cover_image_url} alt="" className="w-full h-full object-cover" /> : (typeIcons[p.product.product_type] || <FileText className="h-4 w-4 text-muted-foreground" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.product.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{p.product.product_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affiliate summary */}
            {affiliateLinks.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Affiliation</h2>
                  <button onClick={() => setActiveTab('affiliation')} className="text-xs text-primary font-medium hover:underline">Détails →</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold">{affiliateLinks.length}</p>
                    <p className="text-[10px] text-muted-foreground">Liens</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-3 text-center">
                    <p className="text-lg font-bold text-primary">{fmt(totalEarned)}</p>
                    <p className="text-[10px] text-muted-foreground">Total gagné</p>
                  </div>
                  <div className="rounded-xl bg-green-500/5 p-3 text-center">
                    <p className="text-lg font-bold text-green-500">{fmt(payableCommission)}</p>
                    <p className="text-[10px] text-muted-foreground">À retirer</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: RESSOURCES ══ */}
        {activeTab === 'ressources' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Mes Ressources</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Tous les produits que vous avez achetés.</p>
            </div>
            {resLoading ? <SkeletonRow count={3} /> : !myResources?.length ? (
              <div className="text-center py-10">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun achat pour le moment.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/discover')}>Explorer les communautés</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myResources.map((purchase) => (
                  <div key={purchase.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {purchase.product.cover_image_url ? <img src={purchase.product.cover_image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">{typeIcons[purchase.product.product_type] || <FileText className="h-6 w-6" />}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{purchase.product.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{purchase.product.product_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {purchase.completed_at ? format(new Date(purchase.completed_at), 'dd MMM yyyy', { locale: fr }) : format(new Date(purchase.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                      {purchase.product.file_url && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => handleFileAction(purchase, 'inline')} disabled={downloading === purchase.id}>
                            <Eye className="h-3 w-3" /> Lire
                          </Button>
                          <Button size="sm" className="gap-1 text-[10px] h-7 gold-gradient text-primary-foreground border-0 shadow-gold" onClick={() => handleFileAction(purchase, 'download')} disabled={downloading === purchase.id}>
                            <Download className="h-3 w-3" /> {downloading === purchase.id ? '...' : 'Télécharger'}
                          </Button>
                        </>
                      )}
                      {purchase.product.external_link && (
                        <a href={purchase.product.external_link} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 w-full"><ExternalLink className="h-3 w-3" /> Accéder</Button>
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
            {/* Affiliate Links */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Mes liens d'affiliation</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Partagez ces liens pour gagner des commissions.</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {payableCommission > 0 && <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-0 text-xs">{fmt(payableCommission)} disponible</Badge>}
                  {pendingCommission > 0 && <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-xs">{fmt(pendingCommission)} en attente</Badge>}
                </div>
              </div>

              {aLoading ? <SkeletonRow count={2} /> : affiliateLinks.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">Aucun lien d'affiliation.</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">Rejoignez une organisation avec un programme d'affiliation activé.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {affiliateLinks.map((l) => {
                    const shareUrl = `${baseUrl}/org/${l.organizations?.slug}?ref=${l.code}`;
                    return (
                      <div key={l.id} className="border border-border rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{l.organizations?.name || 'Organisation'}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">Affilié · code: <span className="font-mono">{l.code}</span></p>
                          </div>
                          <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', l.is_active ? 'bg-accent/10 text-accent-foreground' : 'bg-muted text-muted-foreground')}>
                            {l.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{l.clicks || 0} clics</span>
                          <span>{l.conversions || 0} conversions</span>
                          <span className="text-primary font-semibold">{fmt(l.total_earned || 0)} gagné</span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                          <p className="text-[11px] font-mono text-muted-foreground flex-1 truncate">{shareUrl}</p>
                          <CopyButton text={shareUrl} />
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => window.open(shareUrl, '_blank')}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Become Affiliate */}
            {orgsEligibleForAffiliate.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Devenir affilié</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ces organisations ont un programme d'affiliation ouvert.</p>
                </div>
                <div className="space-y-2">
                  {orgsEligibleForAffiliate.map((org) => (
                    <div key={org.id} className="border border-primary/20 bg-primary/5 rounded-xl p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                        {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-lg" /> : <span className="text-xs font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{org.name}</p>
                        <p className="text-xs text-primary font-semibold">Gagnez {org.affiliation_commission_percent}% par parrainage</p>
                      </div>
                      <Button size="sm" className="h-7 text-xs gold-gradient text-primary-foreground border-0 shadow-gold shrink-0" disabled={requestingAffiliate === org.id || requestAffiliateRole.isPending} onClick={async () => { setRequestingAffiliate(org.id); await requestAffiliateRole.mutateAsync({ orgId: org.id, orgSlug: org.slug }); setRequestingAffiliate(null); }}>
                        {requestingAffiliate === org.id ? 'En cours...' : 'Devenir affilié'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payout */}
            {Object.keys(payableByOrg).length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Demander un retrait</h2>
                <p className="text-xs text-muted-foreground">La vérification KYC est requise avant un retrait.</p>
                <div className="space-y-2">
                  {Object.values(payableByOrg).map(({ orgId, amount, currency }) => {
                    const org = userOrgs.find(o => o.id === orgId);
                    const kycStatus = kycStatuses[orgId] || 'none';
                    const kycApproved = kycStatus === 'level1' || kycStatus === 'level2';
                    return (
                      <div key={orgId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{org?.name || orgId}</p>
                          <p className="text-xs text-primary font-semibold">{fmt(amount, currency)} disponible</p>
                        </div>
                        {!kycApproved && <div className="flex items-center gap-1 text-[10px] text-primary"><AlertTriangle className="h-3 w-3" /><span>KYC requis</span></div>}
                        <Button size="sm" className="h-7 text-xs gold-gradient text-primary-foreground border-0 shadow-gold" disabled={requestingPayout === orgId} onClick={() => handleRequestPayout(orgId, kycStatus)}>
                          {requestingPayout === orgId ? 'En cours...' : kycApproved ? 'Demander le retrait' : 'Soumettre KYC'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Commission History */}
            {affiliateSales.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold text-sm">Historique des commissions</h2>
                <p className="text-xs text-muted-foreground">Les commissions deviennent disponibles 72h après la transaction.</p>
                <div className="space-y-1">
                  {affiliateSales.map((s: { id: string; transaction_type: string; gross_amount: number; commission_amount: number; commission_percent: number; currency?: string; status: string; created_at: string; payable_at?: string }) => (
                    <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">Vente {s.transaction_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString('fr-FR')} · {s.commission_percent}% · brut {fmt(s.gross_amount, s.currency || 'XOF')}</p>
                      </div>
                      <span className="font-semibold text-sm text-primary">+{fmt(s.commission_amount, s.currency || 'XOF')}</span>
                      <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', saleStatusColor[s.status] || '')}>{s.status === 'payable' ? 'Disponible' : s.status === 'pending' ? 'En attente' : s.status === 'paid' ? 'Payé' : s.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: HISTORIQUE ══ */}
        {activeTab === 'historique' && (
          <div className="space-y-5">
            {/* Donations */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Historique des dons</h2>
              {dLoading ? <SkeletonRow count={3} /> : donations.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Aucun don pour le moment.</p>
              ) : (
                <div className="space-y-1">
                  {donations.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.donor_name || 'Anonyme'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <span className="font-semibold text-sm">{fmt(d.amount, d.currency)}</span>
                      <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[d.status] || '')}>{d.status === 'completed' ? 'Complété' : d.status === 'pending' ? 'En attente' : d.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchases */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-accent" /> Historique des achats</h2>
              {pLoading ? <SkeletonRow count={3} /> : purchases.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Aucun achat pour le moment.</p>
              ) : (
                <div className="space-y-1">
                  {purchases.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Achat de produit</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <span className="font-semibold text-sm">{fmt(p.amount, p.currency)}</span>
                      <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[p.status] || '')}>{p.status === 'completed' ? 'Complété' : p.status === 'pending' ? 'En attente' : p.status}</Badge>
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
