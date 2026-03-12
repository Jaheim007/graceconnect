// Generic stub for remaining admin pages
import { stripHtml } from '@/lib/formatText';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { AdminPageShell } from './AdminPageShell';
import IdentityVerificationWizard from '@/components/verification/IdentityVerificationWizard';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgAnnouncements, useDeleteAnnouncement, useUpdateAnnouncement } from '@/hooks/useAnnouncements';
import { useOrgEvents, useDeleteEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Link2, Copy, CheckCircle, UserPlus, AlertTriangle, Users, Plus, PenLine, Upload, ChevronDown, Eye, EyeOff, Megaphone, CalendarDays } from 'lucide-react';
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
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: items = [], isLoading } = useOrgAnnouncements(currentOrg?.id, false);
  const del = useDeleteAnnouncement();
  const update = useUpdateAnnouncement();
  const togglePublish = async (a: any) => {
    await update.mutateAsync({ id: a.id, updates: { is_published: !a.is_published, published_at: !a.is_published ? new Date().toISOString() : a.published_at } });
    toast({ title: a.is_published ? (isFr ? 'Annonce dépubliée' : 'Announcement unpublished') : (isFr ? 'Annonce publiée' : 'Announcement published') });
  };
  return (
    <AdminPageShell title={isFr ? 'Annonces' : 'Announcements'} newRoute="/admin/announcements/new" newLabel={isFr ? 'Nouvelle annonce' : 'New announcement'} backRoute="/admin">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="generic" title={isFr ? 'Aucune annonce' : 'No announcements'} action={{ label: isFr ? 'Créer une annonce' : 'Create announcement', onClick: () => navigate('/admin/announcements/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{items.length} {isFr ? 'annonce' : 'announcement'}{items.length > 1 ? 's' : ''}</h2>
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
                  {a.is_published ? (isFr ? 'Publié' : 'Published') : (isFr ? 'Brouillon' : 'Draft')}
                </Badge>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title={a.is_published ? (isFr ? 'Dépublier' : 'Unpublish') : (isFr ? 'Publier' : 'Publish')} onClick={() => togglePublish(a)}>
                    {a.is_published ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/admin/announcements/${a.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={async () => { await del.mutateAsync({ id: a.id, orgId: currentOrg!.id }); toast({ title: isFr ? 'Supprimé' : 'Deleted' }); }}>
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: items = [], isLoading } = useOrgEvents(currentOrg?.id, false);
  const del = useDeleteEvent();
  const update = useUpdateEvent();
  const togglePublish = async (ev: any) => {
    await update.mutateAsync({ id: ev.id, updates: { is_published: !ev.is_published } });
    toast({ title: ev.is_published ? (isFr ? 'Événement dépublié' : 'Event unpublished') : (isFr ? 'Événement publié' : 'Event published') });
  };
  return (
    <AdminPageShell title={isFr ? 'Événements' : 'Events'} newRoute="/admin/events/new" newLabel={isFr ? 'Nouvel événement' : 'New event'} backRoute="/admin">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="generic" title={isFr ? 'Aucun événement' : 'No events'} action={{ label: isFr ? 'Créer un événement' : 'Create event', onClick: () => navigate('/admin/events/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{items.length} {isFr ? 'événement' : 'event'}{items.length > 1 ? 's' : ''}</h2>
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
                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (isFr ? 'À définir' : 'TBD')}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] shrink-0 border-0', ev.is_published ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}
                >
                  {ev.is_published ? (isFr ? 'Publié' : 'Published') : (isFr ? 'Brouillon' : 'Draft')}
                </Badge>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title={ev.is_published ? (isFr ? 'Dépublier' : 'Unpublish') : (isFr ? 'Publier' : 'Publish')} onClick={() => togglePublish(ev)}>
                    {ev.is_published ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/admin/events/${ev.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={async () => { await del.mutateAsync({ id: ev.id, orgId: currentOrg!.id }); toast({ title: isFr ? 'Supprimé' : 'Deleted' }); }}>
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt } = useDisplayCurrency();

  const handleToggleActive = async (c: any) => {
    await db.from('donation_campaigns').update({ is_active: !c.is_active }).eq('id', c.id);
    qc.invalidateQueries({ queryKey: ['org-campaigns'] });
    toast({ title: c.is_active ? (isFr ? 'Campagne désactivée' : 'Campaign deactivated') : (isFr ? 'Campagne activée ✅' : 'Campaign activated ✅') });
  };

  const handleDelete = async (c: any) => {
    const { count } = await db.from('donations').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id);
    if (count && count > 0) {
      toast({ title: isFr ? 'Suppression impossible' : 'Cannot delete', description: isFr ? `Cette campagne a reçu ${count} don(s). Vous pouvez la désactiver à la place.` : `This campaign has ${count} donation(s). You can deactivate it instead.`, variant: 'destructive' });
      return;
    }
    await db.from('donation_campaigns').delete().eq('id', c.id);
    qc.invalidateQueries({ queryKey: ['org-campaigns'] });
    toast({ title: isFr ? 'Campagne supprimée' : 'Campaign deleted' });
  };

  return (
    <AdminPageShell title={isFr ? 'Campagnes de dons' : 'Donation campaigns'} newRoute="/admin/campaigns/new" newLabel={isFr ? 'Nouvelle campagne' : 'New campaign'} backRoute="/admin">
      {currentOrg?.kyc_status === 'none' && (
        <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-xs text-foreground mb-3 flex items-center gap-2">
          <span>💡</span>
          <span className="text-muted-foreground">{isFr ? 'Soumettez le KYC avant de demander un retrait. Les dons sont déjà acceptés.' : 'Submit KYC before requesting a payout. Donations are already accepted.'}</span>
          <Button size="sm" variant="ghost" className="h-6 text-xs ml-auto text-primary" onClick={() => navigate('/admin/kyc')}>
            {isFr ? 'Soumettre KYC →' : 'Submit KYC →'}
          </Button>
        </div>
      )}
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="campaigns" action={{ label: isFr ? 'Nouvelle campagne' : 'New campaign', onClick: () => navigate('/admin/campaigns/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{items.length} {isFr ? 'campagne' : 'campaign'}{items.length > 1 ? 's' : ''}</h2>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {items.map(c => (
              <motion.div key={c.id} variants={fadeUp} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    {(c as any).is_express_demo && <Badge variant="outline" className="text-[9px] border-dashed">{isFr ? 'Démo' : 'Demo'}</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 flex-1 max-w-24 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: c.goal_amount ? `${Math.min(100, (c.current_amount / c.goal_amount) * 100)}%` : '0%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmt(c.current_amount, c.currency)} / {c.goal_amount ? fmt(c.goal_amount, c.currency) : '∞'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-[10px] border-0 shrink-0', c.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                  {c.is_active ? (isFr ? 'Active' : 'Active') : (isFr ? 'Inactive' : 'Inactive')}
                </Badge>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/admin/campaigns/${c.id}/edit`)} title={isFr ? 'Modifier' : 'Edit'}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleToggleActive(c)} title={c.is_active ? (isFr ? 'Désactiver' : 'Deactivate') : (isFr ? 'Activer' : 'Activate')}>
                    {c.is_active ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" title={isFr ? 'Supprimer' : 'Delete'}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{isFr ? 'Supprimer cette campagne ?' : 'Delete this campaign?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isFr ? 'Si la campagne a déjà reçu des dons, elle ne pourra pas être supprimée mais seulement désactivée.' : 'If the campaign has already received donations, it cannot be deleted but only deactivated.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{isFr ? 'Annuler' : 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {isFr ? 'Supprimer' : 'Delete'}
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmtPrice } = useDisplayCurrency();

  const handleBulkPublish = async (ids: string[]) => {
    await db.from('digital_products').update({ is_published: true }).in('id', ids);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    bulk.clear();
    toast({ title: isFr ? `${ids.length} produit(s) publié(s) ✅` : `${ids.length} product(s) published ✅` });
  };
  const handleBulkUnpublish = async (ids: string[]) => {
    await db.from('digital_products').update({ is_published: false }).in('id', ids);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    bulk.clear();
    toast({ title: isFr ? `${ids.length} produit(s) dépublié(s)` : `${ids.length} product(s) unpublished` });
  };
  const handleBulkDelete = async (ids: string[]) => {
    await db.from('digital_products').delete().in('id', ids);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    bulk.clear();
    toast({ title: isFr ? `${ids.length} produit(s) supprimé(s)` : `${ids.length} product(s) deleted` });
  };

  const handleTogglePublish = async (p: any) => {
    await db.from('digital_products').update({ is_published: !p.is_published }).eq('id', p.id);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    toast({ title: p.is_published ? (isFr ? 'Produit dépublié' : 'Product unpublished') : (isFr ? 'Produit publié ✅' : 'Product published ✅') });
  };

  const handleDeleteSingle = async (p: any) => {
    const { count } = await db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('product_id', p.id);
    if (count && count > 0) {
      toast({ title: isFr ? 'Suppression impossible' : 'Cannot delete', description: isFr ? `Ce produit a ${count} achat(s). Vous pouvez le dépublier à la place.` : `This product has ${count} purchase(s). You can unpublish it instead.`, variant: 'destructive' });
      return;
    }
    await db.from('digital_products').delete().eq('id', p.id);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    toast({ title: isFr ? 'Produit supprimé' : 'Product deleted' });
  };

  return (
    <AdminPageShell
      title={isFr ? 'Boutique digitale' : 'Digital shop'}
      backRoute="/admin"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs h-9">
              <Plus className="h-3.5 w-3.5" /> {isFr ? 'Nouveau' : 'New'} <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/ecrire')} className="gap-2 py-2.5">
              <PenLine className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">{isFr ? 'Écrire avec l\'IA' : 'Write with AI'}</p>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'Crée un livre en 5 min' : 'Create a book in 5 min'}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/products/new')} className="gap-2 py-2.5">
              <Upload className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs font-semibold">{isFr ? 'Importer / Créer' : 'Import / Create'}</p>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'PDF, vidéo, formation…' : 'PDF, video, course…'}</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="purchases" title={isFr ? 'Aucun produit' : 'No products'} action={{ label: isFr ? 'Nouveau produit' : 'New product', onClick: () => navigate('/admin/products/new') }} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{items.length} {isFr ? 'produit' : 'product'}{items.length > 1 ? 's' : ''}</h2>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={bulk.toggleAll}>
              {bulk.allSelected ? (isFr ? 'Désélectionner' : 'Deselect') : (isFr ? 'Tout sélectionner' : 'Select all')}
            </Button>
          </div>
          <BulkActionsToolbar
            selectedIds={bulk.selectedIds}
            totalCount={items.length}
            onClear={bulk.clear}
            actions={[
              { label: isFr ? 'Publier' : 'Publish', icon: CheckCircle, onClick: handleBulkPublish },
              { label: isFr ? 'Dépublier' : 'Unpublish', icon: Pencil, onClick: handleBulkUnpublish },
              { label: isFr ? 'Supprimer' : 'Delete', icon: Trash2, variant: 'destructive', onClick: handleBulkDelete },
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
                    {(p as any).is_express_demo && <Badge variant="outline" className="text-[9px] border-dashed">{isFr ? 'Démo' : 'Demo'}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fmtPrice(p.price || 0, p.is_free, p.currency)} · {p.sales_count || 0} {isFr ? 'vente' : 'sale'}{(p.sales_count || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="outline" className={cn('text-xs border-0 shrink-0', p.is_published ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                  {p.is_published ? (isFr ? 'Publié' : 'Published') : (isFr ? 'Brouillon' : 'Draft')}
                </Badge>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title={isFr ? 'Voir le produit' : 'View product'}
                    onClick={(e) => { e.stopPropagation(); navigate(`/org/${currentOrg?.slug}/product/${p.id}`); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title={isFr ? 'Modifier' : 'Edit'}
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/${p.id}/edit`); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title={p.is_published ? (isFr ? 'Dépublier' : 'Unpublish') : (isFr ? 'Publier' : 'Publish')}
                    onClick={(e) => { e.stopPropagation(); handleTogglePublish(p); }}>
                    {p.is_published ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" title={isFr ? 'Supprimer' : 'Delete'}
                        onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{isFr ? 'Supprimer ce produit ?' : 'Delete this product?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isFr ? 'Si le produit a déjà été acheté, il ne pourra pas être supprimé mais seulement dépublié.' : 'If the product has already been purchased, it cannot be deleted but only unpublished.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{isFr ? 'Annuler' : 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSingle(p)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {isFr ? 'Supprimer' : 'Delete'}
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const inviteUrl = currentOrg ? `https://siteviral.com/org/${currentOrg.slug}` : '';

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    toast({ title: isFr ? 'Lien d\'invitation copié !' : 'Invite link copied!' });
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <AdminPageShell title={isFr ? 'Membres' : 'Members'} backRoute="/admin">
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{isFr ? 'Comment rejoindre' : 'How to join'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isFr ? 'Partagez le lien de votre page publique. Les visiteurs qui cliquent « Rejoindre » apparaîtront ici.' : 'Share your public page link. Visitors who click "Join" will appear here.'}
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

        {isLoading ? <SkeletonRow /> : members.length === 0 ? (
          <EmptyState variant="members" title={isFr ? 'Aucun membre' : 'No members'} description={isFr ? 'Partagez votre lien d\'invitation ci-dessus pour agrandir votre communauté.' : 'Share your invite link above to grow your community.'} />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">{members.length} {isFr ? 'membre' : 'member'}{members.length > 1 ? 's' : ''}</h2>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              {(members as any[]).map((m) => (
                <motion.div key={m.id} variants={fadeUp} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">
                      {(m.profiles?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.profiles?.display_name || (isFr ? 'Utilisateur' : 'User')}</p>
                    <p className="text-xs text-muted-foreground">
                      {isFr ? 'Rejoint' : 'Joined'} {new Date(m.joined_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' })}
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt } = useDisplayCurrency();

  const { data: existingLinks = [], isLoading } = useOrgAffiliateLinks(currentOrg?.id);
  const baseUrl = window.location.origin;

  if (!currentOrg?.affiliation_enabled) {
    return (
      <AdminPageShell title={isFr ? 'Mes affiliés' : 'My affiliates'} backRoute="/admin">
        <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Link2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">{isFr ? 'Affiliation non activée' : 'Affiliation not enabled'}</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {isFr ? 'Allez dans les Paramètres pour activer le programme d\'affiliation et définir un taux de commission.' : 'Go to Settings to enable the affiliate program and set a commission rate.'}
          </p>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate('/admin/settings')}>
            {isFr ? 'Activer dans les Paramètres →' : 'Enable in Settings →'}
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
    <AdminPageShell title={isFr ? 'Mes affiliés' : 'My affiliates'} backRoute="/admin">
      <div className="space-y-4">
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4 space-y-2">
          <p className="font-semibold text-sm">{isFr ? '💡 Comment fonctionne l\'affiliation' : '💡 How affiliation works'}</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">1.</span>{isFr ? 'Les visiteurs découvrent votre page publique et cliquent sur « Devenir affilié ».' : 'Visitors discover your public page and click "Become affiliate".'}</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">2.</span>{isFr ? 'Ils sont automatiquement inscrits — aucune action de votre part n\'est nécessaire.' : 'They are automatically enrolled — no action required from you.'}</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">3.</span>{isFr ? <>Ils partagent leur lien. Quand quelqu'un donne ou achète via ce lien, ils gagnent <strong>{currentOrg.affiliation_commission_percent}%</strong>.</> : <>They share their link. When someone donates or buys via this link, they earn <strong>{currentOrg.affiliation_commission_percent}%</strong>.</>}</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">4.</span>{isFr ? 'Après 15 jours, les commissions deviennent retirables (KYC requis).' : 'After 15 days, commissions become withdrawable (KYC required).'}</li>
          </ol>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{currentOrg.affiliation_commission_percent}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'Taux de commission' : 'Commission rate'}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{activeLinks.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'Affiliés actifs' : 'Active affiliates'}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{totalClicks.toLocaleString(isFr ? 'fr-FR' : 'en-US')}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'Clics totaux' : 'Total clicks'}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{totalConversions.toLocaleString(isFr ? 'fr-FR' : 'en-US')}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'Conversions' : 'Conversions'}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{isFr ? 'Total commissions versées' : 'Total commissions paid'}</p>
            <p className="text-2xl font-bold text-primary">{fmt(totalEarned, currentOrg.currency)}</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/admin/settings')}>
            {isFr ? 'Modifier le taux' : 'Change rate'}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{isFr ? 'Affiliés actifs' : 'Active affiliates'} ({activeLinks.length})</h2>

          {isLoading ? (
            <SkeletonRow count={3} />
          ) : activeLinks.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">{isFr ? 'Aucun affilié pour le moment' : 'No affiliates yet'}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {isFr ? 'Partagez le lien de votre page publique. Les visiteurs pourront rejoindre votre programme d\'affiliation en un clic.' : 'Share your public page link. Visitors can join your affiliate program in one click.'}
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
                        <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary mt-0.5">{isFr ? 'Affilié' : 'Affiliate'}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
                      <p className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{shareUrl}</p>
                      <AffiliateCopyButton text={shareUrl} />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-0.5">
                      <span>👆 {link.clicks || 0} {isFr ? 'clics' : 'clicks'}</span>
                      <span>✅ {link.conversions || 0} {isFr ? 'conversions' : 'conversions'}</span>
                      <span className="text-primary font-semibold ml-auto">
                        {fmt(link.total_earned || 0, currentOrg.currency)} {isFr ? 'gagnés' : 'earned'}
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  return (
    <AdminPageShell title={isFr ? 'Analytiques' : 'Analytics'} backRoute="/admin">
      <div className="grid grid-cols-2 gap-3">
        {(isFr ? ['Vues totales', 'Total des dons', 'Revenus totaux', 'Membres actifs'] : ['Total views', 'Total donations', 'Total revenue', 'Active members']).map((label) => (
          <motion.div key={label} variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <p className="text-2xl font-bold text-muted-foreground">—</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'Bientôt disponible' : 'Coming soon'}</p>
          </motion.div>
        ))}
      </div>
    </AdminPageShell>
  );
}

export function AdminKYC() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  return (
    <AdminPageShell title={isFr ? 'Vérification de compte' : 'Account verification'} backRoute="/admin">
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/8">
          <p className="font-semibold text-sm mb-1">{isFr ? '💡 La vérification est requise uniquement pour les retraits' : '💡 Verification is only required for withdrawals'}</p>
          <p className="text-xs text-muted-foreground">
            {isFr ? 'Vous pouvez accepter les dons, vendre des produits et gérer le programme d\'affiliation sans vérification. Elle est nécessaire uniquement pour retirer vos revenus.' : 'You can accept donations, sell products and manage the affiliate program without verification. It is only required to withdraw your earnings.'}
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';

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
    toast({ title: isFr ? '✅ Pixels sauvegardés' : '✅ Pixels saved' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">{isFr ? 'Pixels de tracking' : 'Tracking pixels'}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{isFr ? 'Ajoutez vos pixels pour le suivi publicitaire sur votre page publique.' : 'Add your pixels for ad tracking on your public page.'}</p>
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
        {saving ? (isFr ? 'Sauvegarde…' : 'Saving…') : (isFr ? 'Sauvegarder les pixels' : 'Save pixels')}
      </Button>
    </div>
  );
}

function WebhookSettings({ orgId }: { orgId?: string }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

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
    toast({ title: isFr ? '✅ Webhooks sauvegardés' : '✅ Webhooks saved' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Webhooks (Zapier / Make)</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{isFr ? 'Envoyez automatiquement les événements vers un outil externe.' : 'Automatically send events to an external tool.'}</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{isFr ? 'URL du webhook' : 'Webhook URL'}</Label>
        <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." className="h-8 text-xs font-mono" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{isFr ? 'Événements à envoyer' : 'Events to send'}</Label>
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
        <p className="text-[10px] text-muted-foreground">{isFr ? 'Si aucun n\'est sélectionné, tous les événements seront envoyés.' : 'If none are selected, all events will be sent.'}</p>
      </div>
      <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
        {saving ? (isFr ? 'Sauvegarde…' : 'Saving…') : (isFr ? 'Sauvegarder les webhooks' : 'Save webhooks')}
      </Button>
    </div>
  );
}

function PopupSettings({ orgId }: { orgId?: string }) {
  const { data: pageSettings } = useOrgPageSettings(orgId);
  const upsert = useUpsertOrgPageSettings();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

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
    toast({ title: isFr ? '✅ Popup sauvegardé' : '✅ Popup saved' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">{isFr ? 'Popup intelligent' : 'Smart popup'}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{isFr ? 'Affichez un popup sur votre page publique pour capter les visiteurs.' : 'Display a popup on your public page to capture visitors.'}</p>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{isFr ? 'Activer le popup' : 'Enable popup'}</Label>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      {enabled && (
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isFr ? 'Titre' : 'Title'}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isFr ? 'Ne partez pas si vite !' : "Don't leave so fast!"} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isFr ? 'Message' : 'Message'}</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={isFr ? 'Rejoignez-nous...' : 'Join us...'} rows={2} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isFr ? 'Texte du bouton' : 'Button text'}</Label>
            <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder={isFr ? "S'inscrire" : 'Sign up'} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isFr ? 'Déclencheur' : 'Trigger'}</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exit_intent">{isFr ? 'Intention de sortie' : 'Exit intent'}</SelectItem>
                <SelectItem value="scroll_50">{isFr ? 'Scroll 50%' : 'Scroll 50%'}</SelectItem>
                <SelectItem value="timer_10s">{isFr ? 'Après 10 secondes' : 'After 10 seconds'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">{isFr ? 'Collecter les emails' : 'Collect emails'}</Label>
            <Switch checked={collectEmail} onCheckedChange={setCollectEmail} />
          </div>
        </div>
      )}
      <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
        {saving ? (isFr ? 'Sauvegarde…' : 'Saving…') : (isFr ? 'Sauvegarder le popup' : 'Save popup')}
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';

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
  const [orgCurrency, setOrgCurrency] = useState(currentOrg?.currency ?? 'XOF');
  const [orgCountry, setOrgCountry] = useState((currentOrg as any)?.country ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleSlugChange = (v: string) => {
    const clean = slugify(v);
    setOrgSlug(clean);
    if (clean.length < 3) setSlugError(isFr ? 'Minimum 3 caractères' : 'Minimum 3 characters');
    else if (!/^[a-z0-9-]+$/.test(clean)) setSlugError(isFr ? 'Lettres minuscules, chiffres et tirets uniquement' : 'Lowercase letters, numbers and hyphens only');
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
    setOrgCurrency(currentOrg.currency ?? 'XOF');
    setOrgCountry(oa?.country ?? '');
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
      toast({ title: isFr ? 'Erreur' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isFr ? '✅ Module Dons sauvegardé' : '✅ Donations module saved' });
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
      toast({ title: isFr ? 'Slug invalide' : 'Invalid slug', description: slugError, variant: 'destructive' });
      return;
    }
    if (orgSlug.length < 3) {
      toast({ title: isFr ? 'Slug trop court' : 'Slug too short', description: isFr ? 'Minimum 3 caractères.' : 'Minimum 3 characters.', variant: 'destructive' });
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
        toast({ title: isFr ? 'Slug déjà utilisé' : 'Slug already taken', description: isFr ? 'Choisissez un autre identifiant URL.' : 'Choose a different URL identifier.', variant: 'destructive' });
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
        currency: orgCurrency,
        country: orgCountry.trim() || null,
      } as any)
      .eq('id', currentOrg.id);
    setSavingProfile(false);
    if (error) {
      if (error.message.includes('slug') || error.message.includes('unique') || error.message.includes('duplicate')) {
        toast({ title: 'Slug déjà utilisé', description: 'Choisissez un autre identifiant URL.', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      }
    } else {
      // Sync all products to the new org currency
      if (orgCurrency !== currentOrg.currency) {
        await supabase
          .from('digital_products')
          .update({ currency: orgCurrency } as any)
          .eq('organization_id', currentOrg.id);
        qc.invalidateQueries({ queryKey: ['admin-products'] });
        qc.invalidateQueries({ queryKey: ['discover'] });
      }
      toast({ title: '✅ ' + (isFr ? 'Profil sauvegardé' : 'Profile saved') });
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
      toast({ title: isFr ? 'Erreur' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isFr ? '✅ Biographie du leader sauvegardée' : '✅ Leader biography saved' });
      refetchOrgs();
      qc.invalidateQueries({ queryKey: ['org-by-slug'] });
      qc.invalidateQueries({ queryKey: ['org-by-id'] });
    }
  };

  return (
    <AdminPageShell title={isFr ? 'Paramètres' : 'Settings'} backRoute="/admin">
      <div className="space-y-4">

        {/* ── PROFILE ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">{isFr ? 'Profil de l\'organisation' : 'Organization profile'}</h2>

          {/* Banner upload */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{isFr ? 'Image de bannière' : 'Banner image'}</Label>
            <div
              className="relative h-32 rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/40 cursor-pointer group"
              onClick={() => document.getElementById('banner-upload')?.click()}
            >
              {bannerUrl
                ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs text-muted-foreground">{isFr ? 'Cliquez pour télécharger la bannière (16:9 recommandé)' : 'Click to upload banner (16:9 recommended)'}</span>
                  </div>
              }
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">{isFr ? 'Changer la bannière' : 'Change banner'}</span>
              </div>
              <input id="banner-upload" type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'banner'); }} />
            </div>
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{isFr ? 'Logo / Photo de profil' : 'Logo / Profile photo'}</Label>
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
              <p className="text-xs text-muted-foreground">{isFr ? 'Image carrée recommandée. Apparaîtra comme avatar de votre organisation sur la plateforme.' : 'Square image recommended. Will appear as your organization avatar on the platform.'}</p>
            </div>
          </div>

          {/* Text fields */}
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-medium">{isFr ? 'Nom de l\'organisation' : 'Organization name'}</Label>
              <Input id="org-name" value={orgName} onChange={e => setOrgName(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-desc" className="text-xs font-medium">Description</Label>
              <textarea
                id="org-desc"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isFr ? 'Décrivez votre organisation aux visiteurs…' : 'Describe your organization to visitors…'}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-website" className="text-xs font-medium">{isFr ? 'Site web' : 'Website'}</Label>
                <Input id="org-website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourchurch.com" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-whatsapp" className="text-xs font-medium">{isFr ? 'Numéro WhatsApp' : 'WhatsApp number'}</Label>
                <Input id="org-whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+225 07 00 00 00 00" className="h-8 text-xs" />
              </div>
            </div>
          </div>

          {/* Editable slug */}
          <div className="space-y-2 border-t border-border/60 pt-3">
            <Label htmlFor="org-slug" className="text-xs font-medium">{isFr ? 'Lien public personnalisé' : 'Custom public link'}</Label>
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
              {isFr ? 'C\'est le lien à partager pour que les membres rejoignent votre communauté.' : 'This is the link to share for members to join your community.'}
            </p>
          </div>

          {/* Editable currency & country + read-only plan */}
          <div className="grid gap-3 border-t border-border/60 pt-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-currency" className="text-xs font-medium">{isFr ? 'Devise' : 'Currency'}</Label>
                <CurrencySelector value={orgCurrency} onChange={(c) => setOrgCurrency(c)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-country" className="text-xs font-medium">{isFr ? 'Pays' : 'Country'}</Label>
                <Input id="org-country" value={orgCountry} onChange={e => setOrgCountry(e.target.value)} placeholder="Ex: CI, SN, FR…" className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{currentOrg?.plan_type || 'Free'}</span>
            </div>
          </div>

          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (isFr ? 'Sauvegarde…' : 'Saving…') : (isFr ? 'Sauvegarder le profil' : 'Save profile')}
          </Button>
        </div>

        {/* ── LEADER BIOGRAPHY ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">{isFr ? 'Biographie du Leader' : 'Leader biography'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFr ? 'Présentez le leader de votre organisation aux visiteurs de votre page publique.' : 'Present your organization\'s leader to your public page visitors.'}
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
            <p className="text-xs text-muted-foreground">{isFr ? 'Photo du leader (carrée recommandée)' : 'Leader photo (square recommended)'}</p>
          </div>

          <div className="grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="leader-name" className="text-xs font-medium">{isFr ? 'Nom du leader' : 'Leader name'}</Label>
                <Input id="leader-name" value={leaderName} onChange={e => setLeaderName(e.target.value)} placeholder="Ex: Pasteur Jean Dupont" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leader-title" className="text-xs font-medium">{isFr ? 'Titre / Fonction' : 'Title / Role'}</Label>
                <Input id="leader-title" value={leaderTitle} onChange={e => setLeaderTitle(e.target.value)} placeholder="Ex: Pasteur Principal, Fondateur…" className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leader-bio" className="text-xs font-medium">{isFr ? 'Biographie' : 'Biography'}</Label>
              <textarea
                id="leader-bio"
                rows={4}
                value={leaderBio}
                onChange={e => setLeaderBio(e.target.value)}
                placeholder={isFr ? 'Présentez le parcours, la vision et la mission du leader…' : 'Present the leader\'s background, vision and mission…'}
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
            {savingLeader ? (isFr ? 'Sauvegarde…' : 'Saving…') : (isFr ? 'Sauvegarder la biographie' : 'Save biography')}
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
            <h2 className="font-semibold text-sm">{isFr ? 'Module Dons' : 'Donations module'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFr ? 'Activez cette fonctionnalité pour permettre à vos membres de faire des dons (dîmes, offrandes, contributions libres, etc.). Chaque type de don est personnalisable.' : 'Enable this feature to allow your members to make donations (tithes, offerings, free contributions, etc.). Each donation type is customizable.'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="offerings-toggle" className="text-xs font-medium">{isFr ? 'Activer le module Dons' : 'Enable donations module'}</Label>
            <Switch id="offerings-toggle" checked={offeringsEnabled} onCheckedChange={setOfferingsEnabled} />
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={handleSaveOfferings}
            disabled={savingOfferings}
          >
            {savingOfferings ? (isFr ? 'Sauvegarde…' : 'Saving…') : (isFr ? 'Sauvegarder' : 'Save')}
          </Button>
        </div>

        {/* ── AFFILIATION ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">{isFr ? 'Programme d\'affiliation' : 'Affiliate program'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFr ? 'Permettez aux membres de gagner des commissions en partageant des liens de parrainage.' : 'Allow members to earn commissions by sharing referral links.'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="affiliation-toggle" className="text-xs font-medium">{isFr ? 'Activer l\'affiliation' : 'Enable affiliation'}</Label>
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

