import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ShieldCheck, Plus, Edit3, Trash2, Loader2 } from 'lucide-react';

export default function AiPoliciesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresReview, setRequiresReview] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [rulesText, setRulesText] = useState('');

  const { data: policies } = useQuery({
    queryKey: ['ai-policies'],
    queryFn: async () => {
      const { data } = await db.from('ai_policies').select('*').order('created_at');
      return data || [];
    },
  });

  const resetForm = () => { setName(''); setDescription(''); setRequiresReview(true); setIsActive(true); setRulesText(''); setEditingId(null); };

  const openEdit = (p: any) => {
    setEditingId(p.id); setName(p.name); setDescription(p.description || '');
    setRequiresReview(p.requires_human_review); setIsActive(p.is_active);
    setRulesText(JSON.stringify(p.rules, null, 2)); setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let rules = {};
      try { rules = rulesText ? JSON.parse(rulesText) : {}; } catch { throw new Error('JSON invalide pour les règles'); }
      const payload = { name, description: description || null, requires_human_review: requiresReview, is_active: isActive, rules };
      if (editingId) {
        const { error } = await db.from('ai_policies').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await db.from('ai_policies').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Politique sauvegardée ✓' });
      queryClient.invalidateQueries({ queryKey: ['ai-policies'] });
      setDialogOpen(false); resetForm();
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await db.from('ai_policies').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ai-policies'] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> Politiques IA</h1>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouvelle politique</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Modifier' : 'Nouvelle politique'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Nom *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="kids_safe, religious_safe..." /></div>
              <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
              <div><Label>Règles (JSON)</Label><Textarea value={rulesText} onChange={e => setRulesText(e.target.value)} rows={4} placeholder='{"forbidden_topics": ["violence"], "max_complexity": 3}' className="font-mono text-xs" /></div>
              <div className="flex items-center gap-2"><Switch checked={requiresReview} onCheckedChange={setRequiresReview} /><Label>Revue humaine obligatoire</Label></div>
              <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label></div>
              <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending} className="w-full">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {!policies?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune politique configurée</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {policies.map((p: any) => (
            <Card key={p.id}><CardContent className="py-3 flex items-center gap-3">
              <div className="flex-1"><p className="font-medium text-sm">{p.name}</p>
                <div className="flex gap-2 mt-0.5">
                  {p.requires_human_review && <Badge variant="outline" className="text-[10px]">Revue requise</Badge>}
                  {!p.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                  {p.description && <span className="text-xs text-muted-foreground">{p.description}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Edit3 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
