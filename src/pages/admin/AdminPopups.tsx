import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { AdminPageShell } from './AdminPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, MessageSquare, Bell, Megaphone, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

const POPUP_TYPES = [
  { value: 'popup', label: 'Pop-up modal', icon: MessageSquare },
  { value: 'banner', label: 'Bandeau (top/bottom)', icon: Megaphone },
  { value: 'slide_in', label: 'Slide-in (coin)', icon: Bell },
];

const TRIGGERS = [
  { value: 'page_load', label: 'Au chargement de page' },
  { value: 'exit_intent', label: "À l'intention de sortie" },
  { value: 'scroll_50', label: 'Après 50% de scroll' },
  { value: 'time_delay', label: 'Après un délai (secondes)' },
];

const PAGES = [
  { value: 'all', label: 'Toutes les pages' },
  { value: 'storefront', label: 'Vitrine (boutique)' },
  { value: 'product', label: 'Pages produit' },
  { value: 'campaign', label: 'Pages campagne' },
  { value: 'checkout', label: 'Page de paiement' },
];

export default function AdminPopups() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [popupType, setPopupType] = useState('popup');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [trigger, setTrigger] = useState('page_load');
  const [delaySeconds, setDelaySeconds] = useState('5');
  const [targetPage, setTargetPage] = useState('all');
  const [bgColor, setBgColor] = useState('#7c3aed');
  const [textColor, setTextColor] = useState('#ffffff');

  const orgId = currentOrg?.id;

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ['admin-popups', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('org_popups')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const createPopup = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error('Not authenticated');
      if (!title.trim()) throw new Error('Le titre est requis');

      const { error } = await db.from('org_popups').insert({
        org_id: orgId,
        popup_type: popupType,
        title: title.trim(),
        body: body.trim(),
        cta_text: ctaText.trim() || null,
        cta_link: ctaUrl.trim() || null,
        trigger_type: trigger,
        delay_seconds: trigger === 'time_delay' ? parseInt(delaySeconds) || 5 : 0,
        bg_color: bgColor,
        text_color: textColor,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Popup créé' });
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin-popups', orgId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await db.from('org_popups').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-popups', orgId] }),
  });

  const deletePopup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('org_popups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Popup supprimé' });
      qc.invalidateQueries({ queryKey: ['admin-popups', orgId] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setTitle(''); setBody(''); setCtaText(''); setCtaUrl('');
    setPopupType('popup'); setTrigger('page_load'); setTargetPage('all');
    setBgColor('#7c3aed'); setTextColor('#ffffff'); setDelaySeconds('5');
  };

  return (
    <AdminPageShell title="Pop-ups & Bannières" backRoute="/admin/content">
      <div className="space-y-4">
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4 space-y-1">
          <p className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Pop-ups intelligents
          </p>
          <p className="text-xs text-muted-foreground">
            Créez des pop-ups, bannières et notifications pour engager vos visiteurs. Ciblez par page et déclencheur.
          </p>
        </div>

        {!showForm ? (
          <Button size="sm" className="bg-primary text-primary-foreground gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Nouveau popup
          </Button>
        ) : (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">Nouveau popup</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={popupType} onValueChange={setPopupType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POPUP_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Déclencheur</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {trigger === 'time_delay' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Délai (secondes)</Label>
                  <Input type="number" value={delaySeconds} onChange={e => setDelaySeconds(e.target.value)} className="h-8 text-xs" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Page cible</Label>
                <Select value={targetPage} onValueChange={setTargetPage}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Titre</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="🎉 Offre spéciale !" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Message</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Profitez de -20% sur tout le catalogue..." className="text-xs min-h-[60px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bouton CTA (texte)</Label>
                <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="En profiter →" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lien CTA</Label>
                <Input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Couleur fond</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                  <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 text-xs flex-1 font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Couleur texte</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                  <Input value={textColor} onChange={e => setTextColor(e.target.value)} className="h-8 text-xs flex-1 font-mono" />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Eye className="h-3 w-3" /> Aperçu</Label>
              <div 
                className="rounded-xl p-4 text-center space-y-2 border"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                <p className="font-bold text-sm">{title || 'Titre du popup'}</p>
                {body && <p className="text-xs opacity-90">{body}</p>}
                {ctaText && (
                  <button className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: textColor, color: bgColor }}>
                    {ctaText}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => createPopup.mutate()} disabled={createPopup.isPending}>
                {createPopup.isPending ? 'Création…' : 'Créer'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>Annuler</Button>
            </div>
          </motion.div>
        )}

        {isLoading ? <SkeletonRow count={3} /> : popups.length === 0 ? (
          <EmptyState variant="generic" title="Aucun popup" description="Créez votre premier popup ou bannière pour engager vos visiteurs." />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">{popups.length} popup{popups.length > 1 ? 's' : ''}</h2>
            <div className="space-y-2">
              {(popups as any[]).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-all group">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: p.bg_color || '#7c3aed' }}>
                    {p.popup_type === 'banner' ? <Megaphone className="h-5 w-5" style={{ color: p.text_color || '#fff' }} /> :
                     p.popup_type === 'slide_in' ? <Bell className="h-5 w-5" style={{ color: p.text_color || '#fff' }} /> :
                     <MessageSquare className="h-5 w-5" style={{ color: p.text_color || '#fff' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {POPUP_TYPES.find(t => t.value === p.popup_type)?.label || p.popup_type} · {TRIGGERS.find(t => t.value === p.trigger_type)?.label || p.trigger_type}
                    </p>
                  </div>
                  <Switch checked={p.is_active} onCheckedChange={v => toggleActive.mutate({ id: p.id, is_active: v })} />
                  <Badge variant="outline" className={cn('text-[10px] border-0', p.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                    {p.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-60 group-hover:opacity-100" onClick={() => deletePopup.mutate(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
