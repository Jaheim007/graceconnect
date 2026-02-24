import { useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useWaitlists, useWaitlistEntries, useCreateWaitlist } from '@/hooks/useWaitlists';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, ChevronRight, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csvExport';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminWaitlists() {
  const { currentOrg } = useOrg();
  const { data: waitlists = [], isLoading } = useWaitlists(currentOrg?.id);
  const { toast } = useToast();
  const createWaitlist = useCreateWaitlist();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [launchDate, setLaunchDate] = useState('');

  const [selectedWaitlistId, setSelectedWaitlistId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !currentOrg) return;
    try {
      await createWaitlist.mutateAsync({
        organization_id: currentOrg.id,
        title: title.trim(),
        description: description.trim() || undefined,
        launch_date: launchDate || undefined,
      });
      toast({ title: '✅ Waitlist créée !' });
      setCreating(false);
      setTitle('');
      setDescription('');
      setLaunchDate('');
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AdminPageShell title="Waitlists" backRoute="/admin">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" /> Nouvelle waitlist
          </Button>
        </div>

        {isLoading ? <SkeletonRow /> : (waitlists as any[]).length === 0 ? (
          <EmptyState variant="generic" title="Aucune waitlist" description="Créez une waitlist pour collecter des emails avant le lancement d'un produit." />
        ) : (
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }} className="space-y-2">
            {(waitlists as any[]).map(w => {
              const count = w.waitlist_entries?.[0]?.count || 0;
              return (
                <motion.div key={w.id} variants={fadeUp}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => setSelectedWaitlistId(w.id)}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{w.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} inscrit{count > 1 ? 's' : ''}
                      {w.launch_date && ` · Lancement ${new Date(w.launch_date).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <Badge variant={w.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {w.is_active ? 'Active' : 'Fermée'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nouvelle waitlist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Titre *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Nouveau cours de marketing" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez ce qui arrive..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Date de lancement</Label>
              <Input type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} />
            </div>
            <Button className="w-full bg-primary text-primary-foreground" onClick={handleCreate} disabled={!title.trim() || createWaitlist.isPending}>
              {createWaitlist.isPending ? 'Création...' : 'Créer la waitlist'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entries dialog */}
      {selectedWaitlistId && (
        <WaitlistEntriesDialog waitlistId={selectedWaitlistId} onClose={() => setSelectedWaitlistId(null)} />
      )}
    </AdminPageShell>
  );
}

function WaitlistEntriesDialog({ waitlistId, onClose }: { waitlistId: string; onClose: () => void }) {
  const { data: entries = [], isLoading } = useWaitlistEntries(waitlistId);

  const handleExport = () => {
    if (!(entries as any[]).length) return;
    downloadCSV(
      (entries as any[]).map(e => ({ email: e.email, name: e.name || '', date: e.created_at })),
      `waitlist-${waitlistId.slice(0, 8)}`
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Inscrits ({(entries as any[]).length})
          </DialogTitle>
        </DialogHeader>
        {isLoading ? <SkeletonRow /> : (entries as any[]).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun inscrit pour le moment.</p>
        ) : (
          <div className="space-y-3">
            <Button size="sm" variant="outline" className="text-xs" onClick={handleExport}>
              Exporter CSV
            </Button>
            <div className="space-y-1.5">
              {(entries as any[]).map(e => (
                <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{e.email}</span>
                  {e.name && <span className="text-xs text-muted-foreground">{e.name}</span>}
                  <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
