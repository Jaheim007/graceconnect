// Generic stub for remaining admin pages
import { stripHtml } from '@/lib/formatText';
import { AdminPageShell } from './AdminPageShell';
import IdentityVerificationWizard from '@/components/verification/IdentityVerificationWizard';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgAnnouncements, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useOrgEvents, useDeleteEvent } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Link2, Copy, CheckCircle, UserPlus, AlertTriangle, Users, Plus, PenLine, Upload, ChevronDown, Eye, Megaphone, CalendarDays } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { brandUrl } from '@/lib/storageUrl';
import { buildShareUrlForPath } from '@/lib/shareMeta';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpsertOrgPageSettings, useOrgPageSettings } from '@/hooks/useOrgPageSettings';
import { BulkActionsToolbar, useBulkSelect } from '@/components/admin/BulkActions';
import { ImageCropDialog } from '@/components/ui/ImageCropDialog';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

function useOrgAffiliateLinks(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-affiliate-links', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('affiliate_links')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function AdminAnnouncements() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useOrgAnnouncements(currentOrg?.id, false);
  const del = useDeleteAnnouncement();
  return (
    <AdminPageShell title="Annonces" newRoute="/admin/announcements/new" newLabel="Nouvelle annonce" backRoute="/admin">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="generic" title="Aucune annonce" action={{ label: 'Créer une annonce', onClick: () => navigate('/admin/announcements/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{items.length} annonce{items.length > 1 ? 's' : ''}</h2>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {items.map(a => (
              <motion.div key={a.id} variants={fadeUp} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all group">
                {a.image_url ? (
                  <div className="h-16 w-28 rounded-xl overflow-hidden shrink-0 border border-border">
                    <img src={a.image_url} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                ) : a.is_pinned ? (
                  <span className="text-sm shrink-0">📌</span>
                ) : (
                  <div className="h-16 w-28 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Megaphone className="h-6 w-6 text-primary/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{stripHtml(a.body)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] shrink-0 border-0', a.is_published ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}
                >
                  {a.is_published ? 'Publié' : 'Brouillon'}
                </Badge>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/admin/announcements/${a.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={async () => { await del.mutateAsync({ id: a.id, orgId: currentOrg!.id }); toast({ title: 'Supprimé' }); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminEvents() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useOrgEvents(currentOrg?.id, false);
  const del = useDeleteEvent();
  return (
    <AdminPageShell title="Événements" newRoute="/admin/events/new" newLabel="Nouvel événement" backRoute="/admin">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="generic" title="Aucun événement" action={{ label: 'Créer un événement', onClick: () => navigate('/admin/events/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{items.length} événement{items.length > 1 ? 's' : ''}</h2>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {items.map(ev => (
              <motion.div key={ev.id} variants={fadeUp} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all group">
                {ev.image_url ? (
                  <div className="h-16 w-28 rounded-xl overflow-hidden shrink-0 border border-border">
                    <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-28 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {ev.event_date ? new Date(ev.event_date).getDate() : '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }) : 'À définir'}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] shrink-0 border-0', ev.is_published ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}
                >
                  {ev.is_published ? 'Publié' : 'Brouillon'}
                </Badge>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/admin/events/${ev.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={async () => { await del.mutateAsync({ id: ev.id, orgId: currentOrg!.id }); toast({ title: 'Supprimé' }); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminCampaigns() {
  const { currentOrg } = useOrg();
  const { data: items = [], isLoading } = useOrgCampaigns(currentOrg?.id, false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleToggleActive = async (c: any) => {
    await db.from('donation_campaigns').update({ is_active: !c.is_active }).eq('id', c.id);
    qc.invalidateQueries({ queryKey: ['org-campaigns'] });
    toast({ title: c.is_active ? 'Campagne désactivée' : 'Campagne activée ✅' });
  };

  const handleDelete = async (c: any) => {
    // Check if campaign has donations
    const { count } = await db.from('donations').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id);
    if (count && count > 0) {
      toast({ title: 'Suppression impossible', description: `Cette campagne a reçu ${count} don(s). Vous pouvez la désactiver à la place.`, variant: 'destructive' });
      return;
    }
    await db.from('donation_campaigns').delete().eq('id', c.id);
    qc.invalidateQueries({ queryKey: ['org-campaigns'] });
    toast({ title: 'Campagne supprimée' });
  };

  return (
    <AdminPageShell title="Campagnes de dons" newRoute="/admin/campaigns/new" newLabel="Nouvelle campagne" backRoute="/admin">
      {currentOrg?.kyc_status === 'none' && (
        <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-xs text-foreground mb-3 flex items-center gap-2">
          <span>💡</span>
          <span className="text-muted-foreground">Soumettez le KYC avant de demander un retrait. Les dons sont déjà acceptés.</span>
          <Button size="sm" variant="ghost" className="h-6 text-xs ml-auto text-primary" onClick={() => navigate('/admin/kyc')}>
            Soumettre KYC →
          </Button>
        </div>
      )}
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="campaigns" action={{ label: 'Nouvelle campagne', onClick: () => navigate('/admin/campaigns/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{items.length} campagne{items.length > 1 ? 's' : ''}</h2>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {items.map(c => (
              <motion.div key={c.id} variants={fadeUp} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    {(c as any).is_express_demo && <Badge variant="outline" className="text-[9px] border-dashed">Démo</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 flex-1 max-w-24 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: c.goal_amount ? `${Math.min(100, (c.current_amount / c.goal_amount) * 100)}%` : '0%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.current_amount.toLocaleString('fr-FR')} / {c.goal_amount?.toLocaleString('fr-FR') || '∞'} {c.currency}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-[10px] border-0 shrink-0', c.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/admin/campaigns/${c.id}/edit`)} title="Modifier">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleToggleActive(c)} title={c.is_active ? 'Désactiver' : 'Activer'}>
                    {c.is_active ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" title="Supprimer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Si la campagne a déjà reçu des dons, elle ne pourra pas être supprimée mais seulement désactivée.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminProducts() {
  const { currentOrg } = useOrg();
  const { data: items = [], isLoading } = useOrgProducts(currentOrg?.id, false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bulk = useBulkSelect(items as any[]);

  const handleBulkPublish = async (ids: string[]) => {
    await db.from('digital_products').update({ is_published: true }).in('id', ids);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    bulk.clear();
    toast({ title: `${ids.length} produit(s) publié(s) ✅` });
  };
  const handleBulkUnpublish = async (ids: string[]) => {
    await db.from('digital_products').update({ is_published: false }).in('id', ids);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    bulk.clear();
    toast({ title: `${ids.length} produit(s) dépublié(s)` });
  };
  const handleBulkDelete = async (ids: string[]) => {
    await db.from('digital_products').delete().in('id', ids);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    bulk.clear();
    toast({ title: `${ids.length} produit(s) supprimé(s)` });
  };

  const handleTogglePublish = async (p: any) => {
    await db.from('digital_products').update({ is_published: !p.is_published }).eq('id', p.id);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    toast({ title: p.is_published ? 'Produit dépublié' : 'Produit publié ✅' });
  };

  const handleDeleteSingle = async (p: any) => {
    // Check if product has purchases
    const { count } = await db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('product_id', p.id);
    if (count && count > 0) {
      toast({ title: 'Suppression impossible', description: `Ce produit a ${count} achat(s). Vous pouvez le dépublier à la place.`, variant: 'destructive' });
      return;
    }
    await db.from('digital_products').delete().eq('id', p.id);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    toast({ title: 'Produit supprimé' });
  };

  return (
    <AdminPageShell
      title="Boutique digitale"
      backRoute="/admin"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs h-9">
              <Plus className="h-3.5 w-3.5" /> Nouveau <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/ecrire')} className="gap-2 py-2.5">
              <PenLine className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">Écrire avec l'IA</p>
                <p className="text-[10px] text-muted-foreground">Crée un livre en 5 min</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/products/new')} className="gap-2 py-2.5">
              <Upload className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs font-semibold">Importer / Créer</p>
                <p className="text-[10px] text-muted-foreground">PDF, vidéo, formation…</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="purchases" title="Aucun produit" action={{ label: 'Nouveau produit', onClick: () => navigate('/admin/products/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{items.length} produit{items.length > 1 ? 's' : ''}</h2>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={bulk.toggleAll}>
              {bulk.allSelected ? 'Désélectionner' : 'Tout sélectionner'}
            </Button>
          </div>
          <BulkActionsToolbar
            selectedIds={bulk.selectedIds}
            totalCount={items.length}
            onClear={bulk.clear}
            actions={[
              { label: 'Publier', icon: CheckCircle, onClick: handleBulkPublish },
              { label: 'Dépublier', icon: Pencil, onClick: handleBulkUnpublish },
              { label: 'Supprimer', icon: Trash2, variant: 'destructive', onClick: handleBulkDelete },
            ]}
          />
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2.5">
            {items.map(p => (
              <motion.div key={p.id} variants={fadeUp}
                className={cn("flex items-center gap-4 p-4 rounded-xl border bg-background/50 hover:bg-background transition-all group cursor-pointer",
                  bulk.isSelected(p.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20')}
                onClick={() => bulk.toggle(p.id)}
              >
                <div className="h-14 w-14 rounded-xl bg-muted shrink-0 overflow-hidden">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted opacity-60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-medium truncate">{p.title}</p>
                    {(p as any).is_express_demo && <Badge variant="outline" className="text-[9px] border-dashed">Démo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.is_free ? 'Gratuit' : `${p.price?.toLocaleString('fr-FR')} ${p.currency}`} · {p.sales_count || 0} vente{(p.sales_count || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="outline" className={cn('text-xs border-0 shrink-0', p.is_published ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                  {p.is_published ? 'Publié' : 'Brouillon'}
                </Badge>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Voir le produit"
                    onClick={(e) => { e.stopPropagation(); navigate(`/org/${currentOrg?.slug}/product/${p.id}`); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Modifier"
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/${p.id}/edit`); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title={p.is_published ? 'Dépublier' : 'Publier'}
                    onClick={(e) => { e.stopPropagation(); handleTogglePublish(p); }}>
                    {p.is_published ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" title="Supprimer"
                        onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Si le produit a déjà été acheté, il ne pourra pas être supprimé mais seulement dépublié.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSingle(p)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminMembers() {
  const { currentOrg } = useOrg();
  const { data: members = [], isLoading } = useOrgMembers(currentOrg?.id);
  const { toast } = useToast();
  const [copiedInvite, setCopiedInvite] = useState(false);

  const inviteUrl = currentOrg ? `https://siteviral.com/org/${currentOrg.slug}` : '';

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    toast({ title: 'Lien d\'invitation copié !' });
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <AdminPageShell title="Membres" backRoute="/admin">
      <div className="space-y-4">
        {/* How members join explanation */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Comment rejoindre</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Partagez le lien de votre page publique. Les visiteurs qui cliquent « Rejoindre » apparaîtront ici.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-xs font-mono text-muted-foreground flex-1 truncate">{inviteUrl}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyInvite}>
              {copiedInvite ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Members list */}
        {isLoading ? <SkeletonRow /> : members.length === 0 ? (
          <EmptyState variant="members" title="Aucun membre" description="Partagez votre lien d'invitation ci-dessus pour agrandir votre communauté." />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">{members.length} membre{members.length > 1 ? 's' : ''}</h2>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              {(members as any[]).map((m) => (
                <motion.div key={m.id} variants={fadeUp} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">
                      {(m.profiles?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.profiles?.display_name || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground">
                      Rejoint {new Date(m.joined_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize">{m.role}</Badge>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}

function AffiliateCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Lien copié !' });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopy}>
      {copied ? <CheckCircle className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

export function AdminAffiliation() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();

  // Fetch existing affiliate links for this org
  const { data: existingLinks = [], isLoading } = useOrgAffiliateLinks(currentOrg?.id);

  const baseUrl = window.location.origin;

  if (!currentOrg?.affiliation_enabled) {
    return (
      <AdminPageShell title="Mes affiliés" backRoute="/admin">
        <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Link2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">Affiliation non activée</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Allez dans les Paramètres pour activer le programme d'affiliation et définir un taux de commission.
          </p>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate('/admin/settings')}>
            Activer dans les Paramètres →
          </Button>
        </div>
      </AdminPageShell>
    );
  }

  const activeLinks = (existingLinks as any[]).filter(l => l.is_active !== false);
  const totalClicks = activeLinks.reduce((s, l) => s + (l.clicks || 0), 0);
  const totalConversions = activeLinks.reduce((s, l) => s + (l.conversions || 0), 0);
  const totalEarned = activeLinks.reduce((s, l) => s + (l.total_earned || 0), 0);

  return (
    <AdminPageShell title="Mes affiliés" backRoute="/admin">
      <div className="space-y-4">
        {/* How it works */}
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4 space-y-2">
          <p className="font-semibold text-sm">💡 Comment fonctionne l'affiliation</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">1.</span>Les visiteurs découvrent votre page publique et cliquent sur « Devenir affilié ».</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">2.</span>Ils sont automatiquement inscrits — aucune action de votre part n'est nécessaire.</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">3.</span>Ils partagent leur lien. Quand quelqu'un donne ou achète via ce lien, ils gagnent <strong>{currentOrg.affiliation_commission_percent}%</strong>.</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">4.</span>Après 15 jours, les commissions deviennent retirables (KYC requis).</li>
          </ol>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{currentOrg.affiliation_commission_percent}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">Taux de commission</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{activeLinks.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Affiliés actifs</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{totalClicks.toLocaleString('fr-FR')}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Clics totaux</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{totalConversions.toLocaleString('fr-FR')}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Conversions</p>
          </div>
        </div>

        {/* Total commissions paid */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total commissions versées</p>
            <p className="text-2xl font-bold text-primary">{totalEarned.toLocaleString('fr-FR')} {currentOrg.currency}</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/admin/settings')}>
            Modifier le taux
          </Button>
        </div>

        {/* Active affiliates list */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">Affiliés actifs ({activeLinks.length})</h2>

          {isLoading ? (
            <SkeletonRow count={3} />
          ) : activeLinks.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">Aucun affilié pour le moment</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Partagez le lien de votre page publique. Les visiteurs pourront rejoindre votre programme d'affiliation en un clic.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeLinks.map((link: any) => {
                const shareUrl = buildShareUrlForPath(`/org/${currentOrg.slug}?ref=${link.code}`);
                return (
                  <motion.div key={link.id} variants={fadeUp} initial="hidden" animate="visible"
                    className="border border-primary/30 bg-primary/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold shrink-0 text-primary-foreground">
                        {link.code?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate font-mono">{link.code}</p>
                        <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary mt-0.5">Affilié</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
                      <p className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{shareUrl}</p>
                      <AffiliateCopyButton text={shareUrl} />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-0.5">
                      <span>👆 {link.clicks || 0} clics</span>
                      <span>✅ {link.conversions || 0} conversions</span>
                      <span className="text-primary font-semibold ml-auto">
                        {(link.total_earned || 0).toLocaleString('fr-FR')} {currentOrg.currency} gagnés
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}

export function AdminAnalytics() {
  return (
    <AdminPageShell title="Analytiques" backRoute="/admin">
      <div className="grid grid-cols-2 gap-3">
        {['Vues totales', 'Total des dons', 'Revenus totaux', 'Membres actifs'].map((label) => (
          <motion.div key={label} variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <p className="text-2xl font-bold text-muted-foreground">—</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Bientôt disponible</p>
          </motion.div>
        ))}
      </div>
    </AdminPageShell>
  );
}

export function AdminKYC() {
  const { currentOrg } = useOrg();
  return (
    <AdminPageShell title="Vérification KYC" backRoute="/admin">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/8">
          <p className="font-semibold text-sm mb-1">💡 Le KYC est requis uniquement pour les retraits</p>
          <p className="text-xs text-muted-foreground">
            Vous pouvez accepter les dons, vendre des produits et gérer le programme d'affiliation sans KYC.
            La vérification KYC est nécessaire uniquement pour retirer vos revenus.
          </p>
        </div>

        {currentOrg && (
          <IdentityVerificationWizard
            mode="org"
            entityId={currentOrg.id}
            status={currentOrg.kyc_status || 'none'}
            orgCategory={currentOrg.category}
          />
        )}
      </div>
    </AdminPageShell>
  );
}

function PixelSettings({ orgId }: { orgId?: string }) {
  const [fb, setFb] = useState('');
  const [tt, setTt] = useState('');
  const [gt, setGt] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ['pixel-settings', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await db.from('org_page_settings').select('facebook_pixel_id, tiktok_pixel_id, google_tag_id').eq('organization_id', orgId).maybeSingle();
      return data as { facebook_pixel_id: string | null; tiktok_pixel_id: string | null; google_tag_id: string | null } | null;
    },
    enabled: !!orgId,
  });

  useState(() => {
    if (settings) {
      setFb(settings.facebook_pixel_id || '');
      setTt(settings.tiktok_pixel_id || '');
      setGt(settings.google_tag_id || '');
    }
  });

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const updates = { facebook_pixel_id: fb.trim() || null, tiktok_pixel_id: tt.trim() || null, google_tag_id: gt.trim() || null };
    const { data: existing } = await db.from('org_page_settings').select('id').eq('organization_id', orgId).maybeSingle();
    if (existing) {
      await db.from('org_page_settings').update(updates).eq('organization_id', orgId);
    } else {
      await db.from('org_page_settings').insert({ organization_id: orgId, ...updates });
    }
    setSaving(false);
    toast({ title: '✅ Pixels sauvegardés' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Pixels de tracking</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Ajoutez vos pixels pour le suivi publicitaire sur votre page publique.</p>
      </div>
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Facebook Pixel ID</Label>
          <Input value={fb || settings?.facebook_pixel_id || ''} onChange={e => setFb(e.target.value)} placeholder="Ex: 123456789012345" className="h-8 text-xs font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">TikTok Pixel ID</Label>
          <Input value={tt || settings?.tiktok_pixel_id || ''} onChange={e => setTt(e.target.value)} placeholder="Ex: ABCDEF123456" className="h-8 text-xs font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Google Tag (gtag) ID</Label>
          <Input value={gt || settings?.google_tag_id || ''} onChange={e => setGt(e.target.value)} placeholder="Ex: G-XXXXXXXXXX" className="h-8 text-xs font-mono" />
        </div>
      </div>
      <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
        {saving ? 'Sauvegarde…' : 'Sauvegarder les pixels'}
      </Button>
    </div>
  );
}

function WebhookSettings({ orgId }: { orgId?: string }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { data: org } = useQuery({
    queryKey: ['org-webhook', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await db.from('organizations').select('webhook_url, webhook_events').eq('id', orgId).single();
      return data;
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (org) {
      setWebhookUrl(org.webhook_url || '');
      setWebhookEvents(org.webhook_events || []);
    }
  }, [org]);

  const allEvents = ['sale', 'donation', 'member_joined', 'payout_requested', 'subscription_started'];

  const toggleEvent = (ev: string) => {
    setWebhookEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  };

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    await db.from('organizations').update({ webhook_url: webhookUrl.trim() || null, webhook_events: webhookEvents }).eq('id', orgId);
    setSaving(false);
    toast({ title: '✅ Webhooks sauvegardés' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Webhooks (Zapier / Make)</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Envoyez automatiquement les événements vers un outil externe.</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">URL du webhook</Label>
        <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." className="h-8 text-xs font-mono" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Événements à envoyer</Label>
        <div className="flex flex-wrap gap-2">
          {allEvents.map(ev => (
            <Badge
              key={ev}
              variant={webhookEvents.includes(ev) ? 'default' : 'outline'}
              className="cursor-pointer text-[10px]"
              onClick={() => toggleEvent(ev)}
            >
              {ev}
            </Badge>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">Si aucun n'est sélectionné, tous les événements seront envoyés.</p>
      </div>
      <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
        {saving ? 'Sauvegarde…' : 'Sauvegarder les webhooks'}
      </Button>
    </div>
  );
}

function PopupSettings({ orgId }: { orgId?: string }) {
  const { data: pageSettings } = useOrgPageSettings(orgId);
  const upsert = useUpsertOrgPageSettings();
  const { toast } = useToast();

  const popupConfig = (pageSettings?.popup_config as any) || { enabled: false };
  const [enabled, setEnabled] = useState(popupConfig.enabled || false);
  const [title, setTitle] = useState(popupConfig.title || '');
  const [message, setMessage] = useState(popupConfig.message || '');
  const [ctaText, setCtaText] = useState(popupConfig.cta_text || '');
  const [trigger, setTrigger] = useState(popupConfig.trigger || 'exit_intent');
  const [collectEmail, setCollectEmail] = useState(popupConfig.collect_email || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pageSettings?.popup_config) {
      const c = pageSettings.popup_config as any;
      setEnabled(c.enabled || false);
      setTitle(c.title || '');
      setMessage(c.message || '');
      setCtaText(c.cta_text || '');
      setTrigger(c.trigger || 'exit_intent');
      setCollectEmail(c.collect_email || false);
    }
  }, [pageSettings]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    await upsert.mutateAsync({
      orgId,
      updates: {
        popup_config: { enabled, title: title || null, message: message || null, cta_text: ctaText || null, trigger, collect_email: collectEmail } as any,
      },
    });
    setSaving(false);
    toast({ title: '✅ Popup sauvegardé' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Popup intelligent</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Affichez un popup sur votre page publique pour capter les visiteurs.</p>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Activer le popup</Label>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      {enabled && (
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Titre</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ne partez pas si vite !" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Rejoignez-nous..." rows={2} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Texte du bouton</Label>
            <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="S'inscrire" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Déclencheur</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exit_intent">Intention de sortie</SelectItem>
                <SelectItem value="scroll_50">Scroll 50%</SelectItem>
                <SelectItem value="timer_10s">Après 10 secondes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Collecter les emails</Label>
            <Switch checked={collectEmail} onCheckedChange={setCollectEmail} />
          </div>
        </div>
      )}
      <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
        {saving ? 'Sauvegarde…' : 'Sauvegarder le popup'}
      </Button>
    </div>
  );
}

export function AdminSettings() {
  const { currentOrg, refetchOrgs } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const orgAny = currentOrg as any;

  const PUBLISHED_DOMAIN = 'https://siteviral.com';

  // Profile fields
  const [orgName, setOrgName] = useState(currentOrg?.name ?? '');
  const [orgSlug, setOrgSlug] = useState(currentOrg?.slug ?? '');
  const [slugError, setSlugError] = useState('');
  const [description, setDescription] = useState(currentOrg?.description ?? '');
  const [website, setWebsite] = useState(currentOrg?.website ?? '');
  const [whatsapp, setWhatsapp] = useState(currentOrg?.whatsapp ?? '');
  const [logoUrl, setLogoUrl] = useState(currentOrg?.logo_url ?? '');
  const [bannerUrl, setBannerUrl] = useState(currentOrg?.banner_url ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleSlugChange = (v: string) => {
    const clean = slugify(v);
    setOrgSlug(clean);
    if (clean.length < 3) setSlugError('Minimum 3 caractères');
    else if (!/^[a-z0-9-]+$/.test(clean)) setSlugError('Lettres minuscules, chiffres et tirets uniquement');
    else setSlugError('');
  };

  // Crop state for settings images
  const [settingsCropSrc, setSettingsCropSrc] = useState<string | null>(null);
  const [settingsCropType, setSettingsCropType] = useState<'logo' | 'banner' | 'leader'>('banner');
  const settingsCropAspect = settingsCropType === 'banner' ? 3 / 1 : 1;

  // Leader biography fields
  const [leaderName, setLeaderName] = useState(orgAny?.leader_name ?? '');
  const [leaderTitle, setLeaderTitle] = useState(orgAny?.leader_title ?? '');
  const [leaderBio, setLeaderBio] = useState(orgAny?.leader_bio ?? '');
  const [leaderImageUrl, setLeaderImageUrl] = useState(orgAny?.leader_image_url ?? '');
  const [savingLeader, setSavingLeader] = useState(false);

  // Affiliation fields
  const [affiliationEnabled, setAffiliationEnabled] = useState(currentOrg?.affiliation_enabled ?? false);
  const [commissionPercent, setCommissionPercent] = useState(
    String(currentOrg?.affiliation_commission_percent ?? 10)
  );
  const [savingAffiliation, setSavingAffiliation] = useState(false);

  // Offerings (Dons) toggle
  const orgAnySettings = currentOrg as any;
  const [offeringsEnabled, setOfferingsEnabled] = useState(orgAnySettings?.offerings_enabled ?? false);
  const [savingOfferings, setSavingOfferings] = useState(false);

  // Sync all form state when currentOrg changes (e.g. org switch)
  useEffect(() => {
    if (!currentOrg) return;
    const oa = currentOrg as any;
    setOrgName(currentOrg.name ?? '');
    setOrgSlug(currentOrg.slug ?? '');
    setSlugError('');
    setDescription(currentOrg.description ?? '');
    setWebsite(currentOrg.website ?? '');
    setWhatsapp(currentOrg.whatsapp ?? '');
    setLogoUrl(currentOrg.logo_url ?? '');
    setBannerUrl(currentOrg.banner_url ?? '');
    setLeaderName(oa?.leader_name ?? '');
    setLeaderTitle(oa?.leader_title ?? '');
    setLeaderBio(oa?.leader_bio ?? '');
    setLeaderImageUrl(oa?.leader_image_url ?? '');
    setAffiliationEnabled(currentOrg.affiliation_enabled ?? false);
    setCommissionPercent(String(currentOrg.affiliation_commission_percent ?? 10));
    setOfferingsEnabled(oa?.offerings_enabled ?? false);
  }, [currentOrg?.id]);

  const handleSaveOfferings = async () => {
    if (!currentOrg) return;
    setSavingOfferings(true);
    const { error } = await supabase
      .from('organizations')
      .update({ offerings_enabled: offeringsEnabled } as any)
      .eq('id', currentOrg.id);
    setSavingOfferings(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Module Dons sauvegardé' });
      refetchOrgs();
    }
  };


  const handleSaveProfile = async () => {
    if (!currentOrg) return;
    if (!orgName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (slugError) {
      toast({ title: 'Slug invalide', description: slugError, variant: 'destructive' });
      return;
    }
    if (orgSlug.length < 3) {
      toast({ title: 'Slug trop court', description: 'Minimum 3 caractères.', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    // Check slug uniqueness if changed
    if (orgSlug !== currentOrg.slug) {
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .neq('id', currentOrg.id)
        .maybeSingle();
      if (existing) {
        setSavingProfile(false);
        toast({ title: 'Slug déjà utilisé', description: 'Choisissez un autre identifiant URL.', variant: 'destructive' });
        return;
      }
    }
    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgName.trim(),
        slug: orgSlug,
        description: description.trim() || null,
        website: website.trim() || null,
        whatsapp: whatsapp.trim() || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
      })
      .eq('id', currentOrg.id);
    setSavingProfile(false);
    if (error) {
      if (error.message.includes('slug') || error.message.includes('unique') || error.message.includes('duplicate')) {
        toast({ title: 'Slug déjà utilisé', description: 'Choisissez un autre identifiant URL.', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: '✅ Profil sauvegardé' });
      refetchOrgs();
      qc.invalidateQueries({ queryKey: ['org-by-slug'] });
      qc.invalidateQueries({ queryKey: ['org-by-id'] });
    }
  };

  const handleSaveAffiliation = async () => {
    if (!currentOrg) return;
    const pct = parseFloat(commissionPercent);
    if (isNaN(pct) || pct < 1 || pct > 80) {
      toast({ title: 'Invalid commission', description: 'Enter a value between 1 and 80.', variant: 'destructive' });
      return;
    }
    setSavingAffiliation(true);
    const { error } = await supabase
      .from('organizations')
      .update({ affiliation_enabled: affiliationEnabled, affiliation_commission_percent: pct })
      .eq('id', currentOrg.id);
    setSavingAffiliation(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Affiliation settings saved' });
      refetchOrgs();
      qc.invalidateQueries({ queryKey: ['user-memberships'] });
    }
  };

  const handleUploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!currentOrg) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Please select an image file', variant: 'destructive' }); return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: 'Image must be under 10MB', variant: 'destructive' }); return; }
    // Open crop dialog
    const url = URL.createObjectURL(file);
    setSettingsCropSrc(url);
    setSettingsCropType(type);
  };

  const handleUploadLeaderImage = async (file: File) => {
    if (!currentOrg) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Sélectionnez une image', variant: 'destructive' }); return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: 'Image max 10 Mo', variant: 'destructive' }); return; }
    const url = URL.createObjectURL(file);
    setSettingsCropSrc(url);
    setSettingsCropType('leader');
  };

  const handleCropDone = async (blob: Blob) => {
    if (!currentOrg) return;
    setSettingsCropSrc(null);
    const path = `${currentOrg.id}/${settingsCropType}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage.from('org-uploads').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return; }
    const { data: { publicUrl } } = supabase.storage.from('org-uploads').getPublicUrl(data.path);
    const branded = brandUrl(publicUrl);
    if (settingsCropType === 'logo') setLogoUrl(branded);
    else if (settingsCropType === 'banner') setBannerUrl(branded);
    else setLeaderImageUrl(branded);
  };

  const handleSaveLeader = async () => {
    if (!currentOrg) return;
    setSavingLeader(true);
    const { error } = await db
      .from('organizations')
      .update({
        leader_name: leaderName.trim() || null,
        leader_title: leaderTitle.trim() || null,
        leader_bio: leaderBio.trim() || null,
        leader_image_url: leaderImageUrl || null,
      })
      .eq('id', currentOrg.id);
    setSavingLeader(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Biographie du leader sauvegardée' });
      refetchOrgs();
      qc.invalidateQueries({ queryKey: ['org-by-slug'] });
      qc.invalidateQueries({ queryKey: ['org-by-id'] });
    }
  };

  return (
    <AdminPageShell title="Paramètres" backRoute="/admin">
      <div className="space-y-4">

        {/* ── PROFILE ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">Profil de l'organisation</h2>

          {/* Banner upload */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Image de bannière</Label>
            <div
              className="relative h-32 rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/40 cursor-pointer group"
              onClick={() => document.getElementById('banner-upload')?.click()}
            >
              {bannerUrl
                ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs text-muted-foreground">Cliquez pour télécharger la bannière (16:9 recommandé)</span>
                  </div>
              }
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Changer la bannière</span>
              </div>
              <input id="banner-upload" type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'banner'); }} />
            </div>
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Logo / Photo de profil</Label>
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/40 cursor-pointer flex items-center justify-center group shrink-0"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="text-xl">🏛️</span>
                }
                <input id="logo-upload" type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'logo'); }} />
              </div>
              <p className="text-xs text-muted-foreground">Image carrée recommandée. Apparaîtra comme avatar de votre organisation sur la plateforme.</p>
            </div>
          </div>

          {/* Text fields */}
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-medium">Nom de l'organisation</Label>
              <Input id="org-name" value={orgName} onChange={e => setOrgName(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-desc" className="text-xs font-medium">Description</Label>
              <textarea
                id="org-desc"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez votre organisation aux visiteurs…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-website" className="text-xs font-medium">Site web</Label>
                <Input id="org-website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourchurch.com" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-whatsapp" className="text-xs font-medium">Numéro WhatsApp</Label>
                <Input id="org-whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+225 07 00 00 00 00" className="h-8 text-xs" />
              </div>
            </div>
          </div>

          {/* Editable slug */}
          <div className="space-y-2 border-t border-border/60 pt-3">
            <Label htmlFor="org-slug" className="text-xs font-medium">Lien public personnalisé</Label>
            <div className="flex items-center gap-0 bg-muted/50 rounded-lg overflow-hidden border border-border">
              <span className="text-[11px] text-muted-foreground px-3 py-2 shrink-0 bg-muted/80 border-r border-border">
                siteviral.com/org/
              </span>
              <Input
                id="org-slug"
                value={orgSlug}
                onChange={e => handleSlugChange(e.target.value)}
                className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="mon-eglise"
              />
            </div>
            {slugError && <p className="text-xs text-destructive">{slugError}</p>}
            <p className="text-[11px] text-muted-foreground">
              C'est le lien à partager pour que les membres rejoignent votre communauté.
            </p>
          </div>

          {/* Read-only info */}
          <div className="grid gap-1.5 text-xs border-t border-border/60 pt-3">
            {[
              { label: 'Plan', value: currentOrg?.plan_type },
              { label: 'Pays', value: currentOrg?.country },
              { label: 'Devise', value: currentOrg?.currency },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium capitalize">{value || '—'}</span>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? 'Sauvegarde…' : 'Sauvegarder le profil'}
          </Button>
        </div>

        {/* ── LEADER BIOGRAPHY ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">Biographie du Leader</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Présentez le leader de votre organisation aux visiteurs de votre page publique.
            </p>
          </div>

          {/* Leader image */}
          <div className="flex items-center gap-4">
            <div
              className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/40 cursor-pointer flex items-center justify-center group shrink-0"
              onClick={() => document.getElementById('leader-upload')?.click()}
            >
              {leaderImageUrl
                ? <img src={leaderImageUrl} alt="Leader" className="w-full h-full object-cover" />
                : <span className="text-2xl">👤</span>
              }
              <input id="leader-upload" type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadLeaderImage(f); }} />
            </div>
            <p className="text-xs text-muted-foreground">Photo du leader (carrée recommandée)</p>
          </div>

          <div className="grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="leader-name" className="text-xs font-medium">Nom du leader</Label>
                <Input id="leader-name" value={leaderName} onChange={e => setLeaderName(e.target.value)} placeholder="Ex: Pasteur Jean Dupont" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leader-title" className="text-xs font-medium">Titre / Fonction</Label>
                <Input id="leader-title" value={leaderTitle} onChange={e => setLeaderTitle(e.target.value)} placeholder="Ex: Pasteur Principal, Fondateur…" className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leader-bio" className="text-xs font-medium">Biographie</Label>
              <textarea
                id="leader-bio"
                rows={4}
                value={leaderBio}
                onChange={e => setLeaderBio(e.target.value)}
                placeholder="Présentez le parcours, la vision et la mission du leader…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={handleSaveLeader}
            disabled={savingLeader}
          >
            {savingLeader ? 'Sauvegarde…' : 'Sauvegarder la biographie'}
          </Button>
        </div>

        {/* ── TRACKING PIXELS ── */}
        <PixelSettings orgId={currentOrg?.id} />

        {/* ── WEBHOOKS ── */}
        <WebhookSettings orgId={currentOrg?.id} />

        {/* ── POPUP CONFIG ── */}
        <PopupSettings orgId={currentOrg?.id} />

        {/* ── MODULE DONS ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">Module Dons</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activez cette fonctionnalité pour permettre à vos membres de faire des dons (dîmes, offrandes, contributions libres, etc.). Chaque type de don est personnalisable.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="offerings-toggle" className="text-xs font-medium">Activer le module Dons</Label>
            <Switch id="offerings-toggle" checked={offeringsEnabled} onCheckedChange={setOfferingsEnabled} />
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={handleSaveOfferings}
            disabled={savingOfferings}
          >
            {savingOfferings ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </div>

        {/* ── AFFILIATION ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">Programme d'affiliation</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permettez aux membres de gagner des commissions en partageant des liens de parrainage.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="affiliation-toggle" className="text-xs font-medium">Activer l'affiliation</Label>
            <Switch id="affiliation-toggle" checked={affiliationEnabled} onCheckedChange={setAffiliationEnabled} />
          </div>

          {affiliationEnabled && (
            <div className="space-y-2">
              <Label htmlFor="commission-pct" className="text-xs font-medium">Taux de commission (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="commission-pct"
                  type="number"
                  min={1}
                  max={80}
                  value={commissionPercent}
                  onChange={e => setCommissionPercent(e.target.value)}
                  className="h-8 text-xs w-24"
                />
                <span className="text-xs text-muted-foreground">% par vente/don via lien affilié</span>
              </div>
            </div>
          )}

          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={handleSaveAffiliation}
            disabled={savingAffiliation}
          >
            {savingAffiliation ? 'Sauvegarde…' : 'Sauvegarder l\'affiliation'}
          </Button>
        </div>

        {/* ── DANGER ZONE ── */}
        {currentOrg?.owner_id === user?.id && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="font-semibold text-sm text-destructive">Zone dangereuse</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              La suppression est irréversible. Toutes les données (médias, événements, dons, produits, membres) seront définitivement perdues.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-xs gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer cette organisation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer « {currentOrg?.name} » ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Tous les médias, événements, dons, produits, membres et données associées seront définitivement supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      try {
                        const { data, error } = await db.rpc('delete_organization', { _org_id: currentOrg!.id });
                        if (error) throw error;
                        const result = data as any;
                        const notified = result?.members_notified || 0;
                        toast({ title: '✅ Organisation supprimée', description: notified > 0 ? `${notified} membre(s) notifié(s).` : undefined });
                        qc.invalidateQueries({ queryKey: ['user-memberships'] });
                        navigate('/dashboard');
                      } catch (e: any) {
                        toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
                      }
                    }}
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">Contactez le support pour modifier le plan, le pays ou la devise.</p>
      </div>
      {/* Crop Dialog */}
      {settingsCropSrc && (
        <ImageCropDialog
          open={!!settingsCropSrc}
          imageSrc={settingsCropSrc}
          aspect={settingsCropAspect}
          onClose={() => setSettingsCropSrc(null)}
          onCropComplete={handleCropDone}
        />
      )}
    </AdminPageShell>
  );
}

