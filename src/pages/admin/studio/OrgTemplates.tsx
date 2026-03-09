import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Layout, Plus, Edit3, Trash2, Loader2, Sparkles } from 'lucide-react';

const PROJECT_TYPES = [
  { value: 'ebook', label: 'Ebook' },
  { value: 'kids_book', label: 'Livre Enfant' },
  { value: 'coloring_book', label: 'Coloriage' },
  { value: 'course_pack', label: 'Cours' },
  { value: 'sermon_pack', label: 'Prédication' },
  { value: 'bible_pack', label: 'Pack Bible' },
  { value: 'marketing_pack', label: 'Marketing' },
];

export default function OrgTemplates() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('ebook');
  const [promptTemplate, setPromptTemplate] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['org-templates', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await db.from('ai_templates')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .order('display_order');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const resetForm = () => {
    setName(''); setDescription(''); setProjectType('ebook'); setPromptTemplate('');
    setEditingId(null);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setName(t.name);
    setDescription(t.description || '');
    setProjectType(t.project_type);
    setPromptTemplate(t.prompt_template || '');
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user) throw new Error('Missing context');
      const payload = {
        organization_id: currentOrg.id,
        created_by: user.id,
        name,
        description: description || null,
        project_type: projectType,
        prompt_template: promptTemplate || null,
        is_global: false,
        is_active: true,
      };
      if (editingId) {
        const { error } = await db.from('ai_templates').update(payload as any).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await db.from('ai_templates').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? 'Template modifié ✓' : 'Template créé ✓' });
      queryClient.invalidateQueries({ queryKey: ['org-templates', currentOrg?.id] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await db.from('ai_templates').delete().eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Template supprimé' });
      queryClient.invalidateQueries({ queryKey: ['org-templates', currentOrg?.id] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layout className="h-6 w-6 text-primary" /> Templates
        </h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier le template' : 'Nouveau template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Nom *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ebook Leadership" />
              </div>
              <div>
                <Label>Type de projet</Label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ce template est idéal pour..." rows={2} />
              </div>
              <div>
                <Label>Prompt template (instructions IA)</Label>
                <Textarea value={promptTemplate} onChange={e => setPromptTemplate(e.target.value)} placeholder="Instructions spécifiques pour l'IA..." rows={4} />
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending} className="w-full">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingId ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Card key={i}><CardContent className="py-4"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : !templates?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun template</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez des templates réutilisables pour accélérer vos créations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t: any) => (
            <Card key={t.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {PROJECT_TYPES.find(p => p.value === t.project_type)?.label}
                    </Badge>
                    {t.description && <span className="text-xs text-muted-foreground truncate">{t.description}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(t.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
