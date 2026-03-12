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
import { useI18n } from '@/i18n/I18nContext';

export default function AdminExperiments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
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
      toast({ title: isFr ? 'Au moins 2 variantes requises' : 'At least 2 variants required', variant: 'destructive' });
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
    toast({ title: editing ? (isFr ? '✅ Expérience mise à jour' : '✅ Experiment updated') : (isFr ? '✅ Expérience créée' : '✅ Experiment created') });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await db.from('experiments').update({ is_active: !isActive }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['experiments'] });
  };

  const deleteExperiment = async (id: string) => {
    await db.from('experiments').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['experiments'] });
    toast({ title: isFr ? 'Expérience supprimée' : 'Experiment deleted' });
  };

  const openEdit = (exp: any) => {
    setEditing(exp);
    setForm({ name: exp.name, description: exp.description || '', variants: (exp.variants || []).join(', '), traffic_percent: exp.traffic_percent || 100 });
    setOpen(true);
  };

  return (
    <AdminPageShell title={isFr ? "Expériences A/B" : "A/B Experiments"} subtitle={isFr ? "Créez et gérez vos tests A/B pour optimiser vos conversions." : "Create and manage A/B tests to optimize your conversions."}>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {isFr ? 'Nouvelle expérience' : 'New experiment'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? (isFr ? 'Modifier' : 'Edit') : (isFr ? 'Créer' : 'Create')} {isFr ? 'une expérience' : 'an experiment'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isFr ? "Nom de l'expérience" : "Experiment name"}</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="hero-cta-color" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder={isFr ? "Test du CTA principal..." : "Main CTA test..."} />
              </div>
              <div>
                <Label>{isFr ? 'Variantes (séparées par des virgules)' : 'Variants (comma-separated)'}</Label>
                <Input value={form.variants} onChange={(e) => setForm(f => ({ ...f, variants: e.target.value }))} placeholder="a, b, c" />
                <p className="text-xs text-muted-foreground mt-1">{isFr ? 'Minimum 2 variantes' : 'Minimum 2 variants'}</p>
              </div>
              <div>
                <Label>{isFr ? '% du trafic exposé' : '% of exposed traffic'}</Label>
                <Input type="number" min={1} max={100} value={form.traffic_percent} onChange={(e) => setForm(f => ({ ...f, traffic_percent: Number(e.target.value) }))} />
              </div>
              <Button onClick={handleSave} disabled={!form.name} className="w-full">
                {editing ? (isFr ? 'Mettre à jour' : 'Update') : (isFr ? "Créer l'expérience" : 'Create experiment')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <SkeletonRow count={3} /> : experiments.length === 0 ? (
        <EmptyState variant="generic" title={isFr ? "Aucune expérience" : "No experiments"} description={isFr ? "Créez votre premier test A/B pour optimiser votre conversion." : "Create your first A/B test to optimize your conversion."} />
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
                      {exp.is_active ? (isFr ? 'Active' : 'Active') : (isFr ? 'Inactive' : 'Inactive')}
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
                  <span className="text-xs text-muted-foreground ml-auto">{exp.traffic_percent}% {isFr ? 'du trafic' : 'of traffic'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
