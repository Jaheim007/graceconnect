import { useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminPrograms() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const orgId = currentOrg?.id;

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [isFree, setIsFree] = useState(true);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['admin-programs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('programs').select('*')
        .eq('organization_id', orgId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const createProgram = useMutation({
    mutationFn: async () => {
      if (!orgId || !title.trim()) throw new Error('Titre requis');
      const { error } = await db.from('programs').insert({
        organization_id: orgId,
        created_by: user?.id,
        title: title.trim(),
        description: description.trim() || null,
        price: isFree ? 0 : parseFloat(price) || 0,
        is_free: isFree,
        currency: currentOrg?.currency || 'XOF',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Programme créé' });
      setTitle(''); setDescription(''); setPrice('0'); setIsFree(true); setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['admin-programs', orgId] });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await db.from('programs').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Statut mis à jour' });
      qc.invalidateQueries({ queryKey: ['admin-programs', orgId] });
    },
  });

  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Programme supprimé' });
      qc.invalidateQueries({ queryKey: ['admin-programs', orgId] });
    },
  });

  return (
    <AdminPageShell title="Programmes de formation" subtitle="Créez des parcours structurés pour votre communauté" backRoute="/admin"
      newLabel="Nouveau programme" newRoute={undefined}>
      <div className="space-y-4">
        <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground"
          onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> Nouveau programme
        </Button>

        {showCreate && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" /> Créer un programme
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Titre *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Formation Leadership" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="Décrivez le contenu du programme..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={isFree} onCheckedChange={setIsFree} />
                  <Label className="text-xs">Gratuit</Label>
                </div>
                {!isFree && (
                  <div className="flex items-center gap-2">
                    <Input value={price} onChange={e => setPrice(e.target.value)} type="number" className="h-8 text-xs w-24" />
                    <span className="text-xs text-muted-foreground">{currentOrg?.currency || 'XOF'}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-xs" onClick={() => createProgram.mutate()} disabled={createProgram.isPending}>
                {createProgram.isPending ? 'Création...' : 'Créer le programme'}
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowCreate(false)}>Annuler</Button>
            </div>
          </motion.div>
        )}

        {isLoading ? <SkeletonRow /> : programs.length === 0 && !showCreate ? (
          <EmptyState variant="generic" title="Aucun programme"
            description="Créez des programmes de formation structurés avec modules et leçons."
            action={{ label: 'Créer un programme', onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="space-y-2">
            {programs.map((p: any) => (
              <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible"
                className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.is_free ? 'Gratuit' : `${p.price?.toLocaleString('fr-FR')} ${p.currency}`}
                    {' · '}{p.enrollment_count || 0} inscrits
                  </p>
                </div>
                <Badge variant="outline" className={cn('text-[10px] border-0 shrink-0',
                  p.is_published ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                  {p.is_published ? 'Publié' : 'Brouillon'}
                </Badge>
                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => togglePublish.mutate({ id: p.id, published: !p.is_published })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => deleteProgram.mutate(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
