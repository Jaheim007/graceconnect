import { useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgOfferings, useCreateOffering, useUpdateOffering, useDeleteOffering, Offering } from '@/hooks/useOfferings';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, X, GripVertical, HandHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

const defaultPresets = [1000, 2500, 5000, 10000];

interface OfferingFormData {
  title: string;
  description: string;
  is_active: boolean;
  is_recurring_allowed: boolean;
  preset_amounts: number[];
  currency: string;
  image_url: string;
}

const emptyForm: OfferingFormData = {
  title: '',
  description: '',
  is_active: true,
  is_recurring_allowed: true,
  preset_amounts: defaultPresets,
  currency: 'XOF',
  image_url: '',
};

export default function AdminOfferings() {
  const { currentOrg } = useOrg();
  const { data: offerings = [], isLoading } = useOrgOfferings(currentOrg?.id, false);
  const createOffering = useCreateOffering();
  const updateOffering = useUpdateOffering();
  const deleteOffering = useDeleteOffering();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferingFormData>(emptyForm);
  const [newPreset, setNewPreset] = useState('');
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (o: Offering) => {
    setEditingId(o.id);
    setForm({
      title: o.title,
      description: o.description || '',
      is_active: o.is_active,
      is_recurring_allowed: o.is_recurring_allowed,
      preset_amounts: o.preset_amounts || defaultPresets,
      currency: o.currency || 'XOF',
      image_url: o.image_url || '',
    });
    setDialogOpen(true);
  };

  const addPreset = () => {
    const val = parseInt(newPreset);
    if (!val || val <= 0 || form.preset_amounts.includes(val)) return;
    setForm(f => ({ ...f, preset_amounts: [...f.preset_amounts, val].sort((a, b) => a - b) }));
    setNewPreset('');
  };

  const removePreset = (val: number) => {
    setForm(f => ({ ...f, preset_amounts: f.preset_amounts.filter(p => p !== val) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Le titre est requis', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
        is_recurring_allowed: form.is_recurring_allowed,
        preset_amounts: form.preset_amounts,
        currency: form.currency,
        image_url: form.image_url.trim() || null,
      };

      if (editingId) {
        await updateOffering.mutateAsync({ id: editingId, updates: payload });
        toast({ title: 'Offrande mise à jour ✅' });
      } else {
        await createOffering.mutateAsync({
          ...payload,
          organization_id: currentOrg!.id,
          display_order: offerings.length,
        });
        toast({ title: 'Offrande créée ✅' });
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOffering.mutateAsync({ id, orgId: currentOrg!.id });
      toast({ title: 'Offrande supprimée' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AdminPageShell title="Offrandes" backRoute="/admin">
      <div className="space-y-4">
        {/* Header action */}
        <div className="flex justify-end">
          <Button size="sm" onClick={openNew} className="gap-1.5 text-xs h-9">
            <Plus className="h-3.5 w-3.5" /> Nouvelle offrande
          </Button>
        </div>

        {isLoading ? <SkeletonRow count={3} /> : offerings.length === 0 ? (
          <EmptyState
            variant="generic"
            title="Aucune offrande configurée"
            description="Créez des types d'offrandes (dîmes, offrandes spéciales, etc.) pour que vos membres puissent contribuer facilement."
            action={{ label: 'Créer une offrande', onClick: openNew }}
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <HandHeart className="h-4 w-4 text-primary" />
              {offerings.length} offrande{offerings.length > 1 ? 's' : ''}
            </h2>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              {offerings.map((o: Offering) => (
                <motion.div
                  key={o.id}
                  variants={fadeUp}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all group"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.preset_amounts?.map(a => a.toLocaleString('fr-FR')).join(' · ')} {o.currency}
                      {o.is_recurring_allowed && ' · Récurrent'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] shrink-0 border-0',
                      o.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {o.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(o)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette offrande ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Les transactions existantes seront conservées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier l\'offrande' : 'Nouvelle offrande'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="off-title">Titre *</Label>
              <Input
                id="off-title"
                placeholder="ex: Dîme, Offrande spéciale, Don libre…"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="off-desc">Description</Label>
              <Textarea
                id="off-desc"
                placeholder="Description courte (optionnel)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Devise</Label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF (CFA)</SelectItem>
                  <SelectItem value="XAF">XAF (CFA)</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="GHS">GHS</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preset amounts */}
            <div className="space-y-2">
              <Label>Montants suggérés</Label>
              <div className="flex flex-wrap gap-1.5">
                {form.preset_amounts.map(a => (
                  <Badge key={a} variant="secondary" className="gap-1 text-xs pr-1">
                    {a.toLocaleString('fr-FR')}
                    <button onClick={() => removePreset(a)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Ajouter un montant"
                  value={newPreset}
                  onChange={e => setNewPreset(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPreset())}
                  className="flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={addPreset} className="shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="off-img">URL de l'image (optionnel)</Label>
              <Input
                id="off-img"
                placeholder="https://..."
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="off-recurring">Autoriser les dons récurrents</Label>
              <Switch
                id="off-recurring"
                checked={form.is_recurring_allowed}
                onCheckedChange={v => setForm(f => ({ ...f, is_recurring_allowed: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="off-active">Active</Label>
              <Switch
                id="off-active"
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
