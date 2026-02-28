import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, useProgramModules, useCreateProgram, useUpdateProgram, useCreateModule, useDeleteModule, useCreateLesson, useDeleteLesson } from '@/hooks/usePrograms';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Plus, Save, Loader2, BookOpen, Layers, FileText, Video, Music,
  Link2, Trash2, GripVertical, ChevronDown, ChevronRight, Clock
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const CONTENT_TYPES = [
  { value: 'text', label: 'Texte', icon: FileText },
  { value: 'video', label: 'Vidéo', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'link', label: 'Lien externe', icon: Link2 },
];

export function ProgramForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: existingProgram } = useProgram(id);
  const { data: modules = [] } = useProgramModules(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  // New module form
  const [newModuleTitle, setNewModuleTitle] = useState('');
  // New lesson form per module
  const [newLessonForms, setNewLessonForms] = useState<Record<string, { title: string; content_type: string; content_url: string; duration: string }>>({});
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const createModule = useCreateModule();
  const deleteModule = useDeleteModule();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();

  useEffect(() => {
    if (existingProgram) {
      setTitle(existingProgram.title || '');
      setDescription(existingProgram.description || '');
      setCoverUrl(existingProgram.cover_image_url || '');
      setIsPublished(existingProgram.is_published || false);
    }
  }, [existingProgram]);

  useEffect(() => {
    if (modules.length > 0) {
      setOpenModules(new Set(modules.map((m: any) => m.id)));
    }
  }, [modules]);

  const handleSave = async () => {
    if (!currentOrg || !user || !title.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateProgram.mutateAsync({
          id: id!,
          title: title.trim(),
          description: description.trim() || undefined,
          cover_image_url: coverUrl || undefined,
          is_published: isPublished,
        });
        toast({ title: '✅ Programme mis à jour' });
      } else {
        const result = await createProgram.mutateAsync({
          organization_id: currentOrg.id,
          title: title.trim(),
          description: description.trim() || undefined,
          cover_image_url: coverUrl || undefined,
          is_published: isPublished,
          created_by: user.id,
        });
        toast({ title: '✅ Programme créé' });
        navigate(`/admin/programs/${result.id}/edit`, { replace: true });
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    if (!id || !newModuleTitle.trim()) return;
    try {
      await createModule.mutateAsync({
        program_id: id,
        title: newModuleTitle.trim(),
        display_order: modules.length + 1,
      });
      setNewModuleTitle('');
      toast({ title: '✅ Module ajouté' });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!id || !confirm('Supprimer ce module et toutes ses leçons ?')) return;
    try {
      await deleteModule.mutateAsync({ moduleId, programId: id });
      toast({ title: '🗑️ Module supprimé' });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!id) return;
    const form = newLessonForms[moduleId];
    if (!form?.title?.trim()) return;
    try {
      const module = modules.find((m: any) => m.id === moduleId);
      await createLesson.mutateAsync({
        module_id: moduleId,
        title: form.title.trim(),
        content_type: form.content_type || 'text',
        content_url: form.content_url || undefined,
        duration_minutes: form.duration ? parseInt(form.duration) : undefined,
        display_order: (module?.lessons?.length || 0) + 1,
        programId: id,
      });
      setNewLessonForms(prev => ({ ...prev, [moduleId]: { title: '', content_type: 'text', content_url: '', duration: '' } }));
      toast({ title: '✅ Leçon ajoutée' });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!id || !confirm('Supprimer cette leçon ?')) return;
    try {
      await deleteLesson.mutateAsync({ lessonId, programId: id });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const getLessonForm = (moduleId: string) => newLessonForms[moduleId] || { title: '', content_type: 'text', content_url: '', duration: '' };
  const updateLessonForm = (moduleId: string, field: string, value: string) => {
    setNewLessonForms(prev => ({ ...prev, [moduleId]: { ...getLessonForm(moduleId), [field]: value } }));
  };

  const totalLessons = modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0);

  return (
    <AdminPageShell title={isEdit ? 'Modifier le programme' : 'Nouveau programme'} backRoute="/admin/programs">
      <div className="space-y-6 max-w-3xl">
        {/* Program details */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Informations du programme</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Titre *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Formation Marketing Digital" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez le contenu et les objectifs de ce programme..." rows={3} />
            </div>
            <div>
              <Label className="text-xs">Image de couverture</Label>
              <ImageUploader
                bucket="org-uploads"
                folder={`programs/${currentOrg?.id}`}
                currentUrl={coverUrl}
                onUploaded={setCoverUrl}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Publier</Label>
                <p className="text-[10px] text-muted-foreground">Rendre visible aux membres</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !title.trim()} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isEdit ? 'Enregistrer' : 'Créer le programme'}
          </Button>
        </div>

        {/* Modules & Lessons — only show after program is created */}
        {isEdit && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Modules & Leçons
                <Badge variant="secondary" className="text-[10px]">{modules.length} modules · {totalLessons} leçons</Badge>
              </h2>
            </div>

            {/* Existing modules */}
            {modules.map((mod: any, mi: number) => (
              <Collapsible key={mod.id} open={openModules.has(mod.id)} onOpenChange={() => toggleModule(mod.id)}>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <Badge variant="outline" className="text-[10px] shrink-0">M{mi + 1}</Badge>
                    <span className="text-sm font-medium flex-1 text-left truncate">{mod.title}</span>
                    <span className="text-[10px] text-muted-foreground">{mod.lessons?.length || 0} leçon{(mod.lessons?.length || 0) !== 1 ? 's' : ''}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {openModules.has(mod.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border p-3 space-y-2">
                      {/* Existing lessons */}
                      {(mod.lessons || []).map((lesson: any, li: number) => {
                        const typeInfo = CONTENT_TYPES.find(ct => ct.value === lesson.content_type) || CONTENT_TYPES[0];
                        const TypeIcon = typeInfo.icon;
                        return (
                          <div key={lesson.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                            <span className="text-[10px] text-muted-foreground font-mono w-5">{li + 1}</span>
                            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium flex-1 truncate">{lesson.title}</span>
                            {lesson.duration_minutes && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{lesson.duration_minutes}min</span>
                            )}
                            <Badge variant="outline" className="text-[9px]">{typeInfo.label}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteLesson(lesson.id)}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        );
                      })}

                      {/* Add lesson form */}
                      <div className="flex items-end gap-2 pt-2 border-t border-border/50">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px]">Nouvelle leçon</Label>
                          <Input
                            value={getLessonForm(mod.id).title}
                            onChange={e => updateLessonForm(mod.id, 'title', e.target.value)}
                            placeholder="Titre de la leçon"
                            className="h-7 text-xs"
                            onKeyDown={e => e.key === 'Enter' && handleAddLesson(mod.id)}
                          />
                        </div>
                        <Select value={getLessonForm(mod.id).content_type} onValueChange={v => updateLessonForm(mod.id, 'content_type', v)}>
                          <SelectTrigger className="h-7 w-[100px] text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTENT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          value={getLessonForm(mod.id).content_url}
                          onChange={e => updateLessonForm(mod.id, 'content_url', e.target.value)}
                          placeholder="URL (optionnel)"
                          className="h-7 text-xs w-[140px]"
                        />
                        <Input
                          type="number"
                          value={getLessonForm(mod.id).duration}
                          onChange={e => updateLessonForm(mod.id, 'duration', e.target.value)}
                          placeholder="min"
                          className="h-7 text-xs w-[60px]"
                        />
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleAddLesson(mod.id)} disabled={!getLessonForm(mod.id).title.trim()}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}

            {/* Add module form */}
            <div className="flex items-center gap-2">
              <Input
                value={newModuleTitle}
                onChange={e => setNewModuleTitle(e.target.value)}
                placeholder="Nom du nouveau module..."
                className="h-9"
                onKeyDown={e => e.key === 'Enter' && handleAddModule()}
              />
              <Button onClick={handleAddModule} disabled={!newModuleTitle.trim() || createModule.isPending} className="gap-1.5 shrink-0">
                <Plus className="h-3.5 w-3.5" /> Ajouter module
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
