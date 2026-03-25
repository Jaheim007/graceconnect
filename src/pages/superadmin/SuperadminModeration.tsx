import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { sendEmailNotification } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Shield, Eye, EyeOff, Trash2, AlertTriangle, Ban, Search,
  ExternalLink, Package, Heart, Film, Building2, Clock, CheckCircle2
} from 'lucide-react';

const REASON_CATEGORIES = [
  { value: 'plagiarism', label: '📋 Plagiat / Droits d\'auteur' },
  { value: 'fraud', label: '🚨 Fraude / Arnaque' },
  { value: 'inappropriate', label: '🔞 Contenu inapproprié' },
  { value: 'low_quality', label: '📉 Qualité insuffisante' },
  { value: 'copyright', label: '©️ Violation copyright' },
  { value: 'empty_content', label: '📭 Contenu vide / incomplet' },
  { value: 'other', label: '📝 Autre' },
];

const ACTION_LABELS: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  unpublish: { label: 'Dépublier', icon: EyeOff, color: 'text-amber-500' },
  delete: { label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
  warn: { label: 'Avertir', icon: AlertTriangle, color: 'text-orange-500' },
  suspend_org: { label: 'Suspendre org', icon: Ban, color: 'text-destructive' },
};

// Fetch all published products across all orgs
function useAllProducts(search: string) {
  return useQuery({
    queryKey: ['moderation-products', search],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('id, title, description, price, currency, cover_image_url, is_published, publication_status, is_free, file_url, external_link, created_at, organization_id, created_by, organizations(name, slug)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });
}

function useAllCampaigns(search: string) {
  return useQuery({
    queryKey: ['moderation-campaigns', search],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('id, title, description, goal_amount, current_amount, currency, is_published, is_active, created_at, organization_id, organizations(name, slug)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });
}

function useModerationHistory() {
  return useQuery({
    queryKey: ['moderation-history'],
    queryFn: async () => {
      const { data } = await db
        .from('moderation_actions')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
  });
}

function useModerateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { target_type: string; target_id: string; action: string; reason: string; reason_category: string }) => {
      const { data, error } = await db.rpc('moderate_content', {
        _target_type: params.target_type,
        _target_id: params.target_id,
        _action: params.action,
        _reason: params.reason,
        _reason_category: params.reason_category,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation'] });
      qc.invalidateQueries({ queryKey: ['moderation-products'] });
      qc.invalidateQueries({ queryKey: ['moderation-campaigns'] });
      qc.invalidateQueries({ queryKey: ['moderation-history'] });
    },
  });
}

function useProductQuality(productId: string | null) {
  return useQuery({
    queryKey: ['product-quality', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await db.rpc('check_product_quality', { _product_id: productId });
      if (error) throw error;
      return data as { score: number; issues: string[] };
    },
    enabled: !!productId,
  });
}

// ─── MODERATION DIALOG ───
function ModerationDialog({
  open, onClose, target,
}: {
  open: boolean;
  onClose: () => void;
  target: { type: string; id: string; title: string; orgId: string } | null;
}) {
  const [action, setAction] = useState('warn');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('other');
  const moderate = useModerateContent();

  const handleSubmit = async () => {
    if (!target || !reason.trim()) {
      toast.error('Veuillez indiquer un motif');
      return;
    }
    try {
      await moderate.mutateAsync({
        target_type: target.type,
        target_id: target.id,
        action,
        reason: reason.trim(),
        reason_category: category,
      });

      // Send moderation email to the content owner
      try {
        // Resolve the owner's email via org
        const { data: org } = await db
          .from('organizations')
          .select('owner_id, name')
          .eq('id', target.orgId)
          .single();

        if (org?.owner_id) {
          const { data: authData } = await db.rpc('get_user_email_for_notification' as any, { _user_id: org.owner_id });
          const ownerEmail = typeof authData === 'string' ? authData : null;

          // Fallback: get display name from profile
          const { data: profile } = await db
            .from('profiles')
            .select('display_name')
            .eq('id', org.owner_id)
            .single();

          if (ownerEmail) {
            sendEmailNotification('moderation_action', ownerEmail, {
              name: profile?.display_name || '',
              content_title: target.title,
              action,
              reason_category: category,
              reason: reason.trim(),
              org_name: org.name || '',
            }, target.orgId).catch(() => {});
          }
        }
      } catch {
        // Email is best-effort, don't block the flow
      }

      toast.success(`Action "${ACTION_LABELS[action]?.label}" effectuée`);
      setReason('');
      setAction('warn');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Modération : {target?.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Action</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ACTION_LABELS).map(([key, { label, icon: Icon, color }]) => (
                <button
                  key={key}
                  onClick={() => setAction(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    action === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40 text-muted-foreground'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${action === key ? 'text-primary' : color}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Catégorie</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASON_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Motif (visible par le créateur)</label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Ce contenu semble être une copie non autorisée..."
              rows={3}
            />
          </div>

          {action === 'delete' && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              ⚠️ Cette action est irréversible. Le contenu sera supprimé définitivement.
            </div>
          )}
          {action === 'suspend_org' && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              ⚠️ Toute l'organisation sera suspendue. Ses produits ne seront plus accessibles.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button
            size="sm"
            variant={action === 'delete' || action === 'suspend_org' ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={moderate.isPending}
          >
            {moderate.isPending ? '...' : `Confirmer : ${ACTION_LABELS[action]?.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── QUALITY BADGE ───
function QualityBadge({ productId }: { productId: string }) {
  const { data } = useProductQuality(productId);
  if (!data) return null;
  const score = data.score;
  const color = score >= 80 ? 'bg-emerald-500/10 text-emerald-600' : score >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive';
  return (
    <Badge className={`${color} text-[10px] border-0`}>
      Q:{score}
    </Badge>
  );
}

// ─── PRODUCT ROW ───
function ContentRow({ item, type, onModerate }: {
  item: any;
  type: 'product' | 'campaign';
  onModerate: (target: { type: string; id: string; title: string; orgId: string }) => void;
}) {
  const orgName = item.organizations?.name || '—';
  const orgSlug = item.organizations?.slug || '';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-border transition-colors group">
      {type === 'product' && item.cover_image_url ? (
        <img src={item.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {type === 'product' ? <Package className="h-5 w-5 text-muted-foreground" /> : <Heart className="h-5 w-5 text-muted-foreground" />}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{orgName}</span>
          <Badge variant={item.is_published ? 'default' : 'secondary'} className="text-[9px] h-4">
            {item.publication_status === 'moderated' ? '🚫 Modéré' : item.is_published ? 'Publié' : 'Brouillon'}
          </Badge>
          {type === 'product' && <QualityBadge productId={item.id} />}
          {type === 'product' && !item.file_url && !item.external_link && (
            <Badge className="bg-destructive/10 text-destructive text-[9px] border-0 h-4">Sans fichier</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {orgSlug && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
            <a href={type === 'product' ? `/org/${orgSlug}/product/${item.slug || item.id}` : `/org/${orgSlug}/store`} target="_blank" rel="noopener">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => onModerate({ type, id: item.id, title: item.title, orgId: item.organization_id })}
        >
          <Shield className="h-3 w-3" />
          Modérer
        </Button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function SuperadminModeration() {
  const [search, setSearch] = useState('');
  const [moderateTarget, setModerateTarget] = useState<{ type: string; id: string; title: string; orgId: string } | null>(null);

  const { data: products, isLoading: loadingP } = useAllProducts(search);
  const { data: campaigns, isLoading: loadingC } = useAllCampaigns(search);
  const { data: history } = useModerationHistory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Modération
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez, dépubliez ou supprimez du contenu inapproprié
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit ou une campagne..."
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Produits ({products?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            Campagnes ({campaigns?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Historique ({history?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <div className="space-y-2">
            {loadingP ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chargement…</p>
            ) : products?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucun produit trouvé</p>
            ) : (
              products?.map((p: any) => (
                <ContentRow key={p.id} item={p} type="product" onModerate={setModerateTarget} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <div className="space-y-2">
            {loadingC ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chargement…</p>
            ) : campaigns?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune campagne trouvée</p>
            ) : (
              campaigns?.map((c: any) => (
                <ContentRow key={c.id} item={c} type="campaign" onModerate={setModerateTarget} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-2">
            {history?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune action de modération</p>
            ) : (
              history?.map((h: any) => (
                <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    h.action === 'delete' ? 'bg-destructive/10' : h.action === 'suspend_org' ? 'bg-destructive/10' : 'bg-amber-500/10'
                  }`}>
                    {h.action === 'delete' ? <Trash2 className="h-4 w-4 text-destructive" /> :
                     h.action === 'suspend_org' ? <Ban className="h-4 w-4 text-destructive" /> :
                     h.action === 'unpublish' ? <EyeOff className="h-4 w-4 text-amber-500" /> :
                     <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{ACTION_LABELS[h.action]?.label || h.action}</span>
                      <Badge variant="outline" className="text-[9px] h-4">{h.target_type}</Badge>
                      {h.reason_category && (
                        <Badge className="text-[9px] h-4 bg-muted text-muted-foreground border-0">
                          {REASON_CATEGORIES.find(c => c.value === h.reason_category)?.label || h.reason_category}
                        </Badge>
                      )}
                    </div>
                    {h.reason && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{h.reason}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {h.organizations?.name || '—'} • {new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ModerationDialog
        open={!!moderateTarget}
        onClose={() => setModerateTarget(null)}
        target={moderateTarget}
      />
    </div>
  );
}
