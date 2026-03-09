import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Layout, Plus, Edit3, Trash2, Loader2, Globe } from 'lucide-react';

const PROJECT_TYPES = [
  { value: 'ebook', label: 'Ebook' },
  { value: 'kids_book', label: 'Livre Enfant' },
  { value: 'coloring_book', label: 'Coloriage' },
  { value: 'course_pack', label: 'Cours' },
  { value: 'sermon_pack', label: 'Prédication' },
  { value: 'bible_pack', label: 'Pack Bible' },
  { value: 'marketing_pack', label: 'Marketing' },
];

export default function GlobalTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('ebook');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['global-templates'],
    queryFn: async () => {
      const { data } = await db.from('ai_templates')
        .select('*')
        .eq('is_global', true)
        .order('display_order');
      return data || [];
    },
  });

  const resetForm = () => { setName(''); setDescription(''); setProjectType('ebook'); setPromptTemplate(''); setIsActive(true); setEditingId(null); };

  const openEdit = (t: any) => {
    setEditingId(t.id); setName(t.name); setDescription(t.description || '');
    setProjectType(t.project_type); setPromptTemplate(t.prompt_template || '');
    setIsActive(t.is_active); setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description: description || null, project_type: projectType, prompt_template: promptTemplate || null, is_global: true, is_active: isActive } as any;
      if (editingId) {
        const { error } = await db.from('ai_templates').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await db.from('ai_templates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Template sauvegardé ✓' });
      queryClient.invalidateQueries({ queryKey: ['global-templates'] });
      setDialogOpen(false); resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await db.from('ai_templates').delete().eq('id', id); },
    onSuccess: () => { toast({ title: 'Supprimé' }); queryClient.invalidateQueries({ queryKey: ['global-templates'] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="h-6 w-6 text-primary" /> Templates globaux</h1>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Modifier' : 'Nouveau template global'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Nom *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Type</Label>
                <Select value={projectType} onValueChange={setProjectType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
              <div><Label>Prompt template</Label><Textarea value={promptTemplate} onChange={e => setPromptTemplate(e.target.value)} rows={4} /></div>
              <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Actif</Label></div>
              <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending} className="w-full">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {!templates?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun template global</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t: any) => (
            <Card key={t.id}><CardContent className="py-3 flex items-center gap-3">
              <div className="flex-1"><p className="font-medium text-sm">{t.name}</p>
                <div className="flex gap-2 mt-0.5"><Badge variant="secondary" className="text-[10px]">{PROJECT_TYPES.find(p => p.value === t.project_type)?.label}</Badge>
                  {!t.is_active && <Badge variant="outline" className="text-[10px]">Inactif</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Edit3 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
