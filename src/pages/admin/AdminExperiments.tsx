import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Plus, FlaskConical, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminPageShell } from './AdminPageShell';

export default function AdminExperiments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', variants: 'a,b', traffic_percent: 100 });

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: async () => {
      const { data } = await db.from('experiments').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const handleSave = async () => {
    const variantsArray = form.variants.split(',').map(v => v.trim()).filter(Boolean);
    if (variantsArray.length < 2) {
      toast({ title: 'Au moins 2 variantes requises', variant: 'destructive' });
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      variants: variantsArray,
      traffic_percent: Math.max(1, Math.min(100, form.traffic_percent)),
      created_by: user?.id,
    };

    if (editing) {
      await db.from('experiments').update(payload).eq('id', editing.id);
    } else {
      await db.from('experiments').insert(payload as any);
    }

    qc.invalidateQueries({ queryKey: ['experiments'] });
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', variants: 'a,b', traffic_percent: 100 });
    toast({ title: editing ? '✅ Expérience mise à jour' : '✅ Expérience créée' });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await db.from('experiments').update({ is_active: !isActive }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['experiments'] });
  };

  const deleteExperiment = async (id: string) => {
    await db.from('experiments').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['experiments'] });
    toast({ title: 'Expérience supprimée' });
  };

  const openEdit = (exp: any) => {
    setEditing(exp);
    setForm({
      name: exp.name,
      description: exp.description || '',
      variants: (exp.variants || []).join(', '),
      traffic_percent: exp.traffic_percent || 100,
    });
    setOpen(true);
  };

  return (
    <AdminPageShell title="Expériences A/B" subtitle="Créez et gérez vos tests A/B pour optimiser vos conversions.">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nouvelle expérience
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier' : 'Créer'} une expérience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom de l'expérience</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="hero-cta-color" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Test du CTA principal..." />
              </div>
              <div>
                <Label>Variantes (séparées par des virgules)</Label>
                <Input value={form.variants} onChange={(e) => setForm(f => ({ ...f, variants: e.target.value }))} placeholder="a, b, c" />
                <p className="text-xs text-muted-foreground mt-1">Minimum 2 variantes</p>
              </div>
              <div>
                <Label>% du trafic exposé</Label>
                <Input type="number" min={1} max={100} value={form.traffic_percent} onChange={(e) => setForm(f => ({ ...f, traffic_percent: Number(e.target.value) }))} />
              </div>
              <Button onClick={handleSave} disabled={!form.name} className="w-full">
                {editing ? 'Mettre à jour' : 'Créer l\'expérience'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <SkeletonRow count={3} /> : experiments.length === 0 ? (
        <EmptyState variant="generic" title="Aucune expérience" description="Créez votre premier test A/B pour optimiser votre conversion." />
      ) : (
        <div className="space-y-3">
          {experiments.map((exp: any) => (
            <Card key={exp.id} className="shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{exp.name}</CardTitle>
                    <Badge variant={exp.is_active ? 'default' : 'secondary'}>
                      {exp.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={exp.is_active} onCheckedChange={() => toggleActive(exp.id, exp.is_active)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(exp)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteExperiment(exp.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {exp.description && <p className="text-xs text-muted-foreground mb-2">{exp.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  {(exp.variants || []).map((v: string) => (
                    <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">{exp.traffic_percent}% du trafic</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
