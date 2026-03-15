import { useState, useEffect, useCallback } from 'react';
import { AICourseGenerator } from '@/components/programs/AICourseGenerator';
import { useNavigate, useParams } from 'react-router-dom';
import { onContentPublished, onContentUnpublished } from '@/lib/notifications';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useProgram, useProgramModules, useCreateProgram, useUpdateProgram,
  useCreateModule, useUpdateModule, useDeleteModule,
  useCreateLesson, useUpdateLesson, useDeleteLesson,
} from '@/hooks/usePrograms';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Plus, Save, Loader2, BookOpen, Layers, FileText, Video, Music,
  Link2, Trash2, GripVertical, ChevronDown, ChevronRight, Clock,
  Settings, Eye, Sparkles, DollarSign, Award
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useI18n } from '@/i18n/I18nContext';
import { LessonEditor } from '@/components/programs/LessonEditor';

const CONTENT_TYPES = [
  { value: 'text', label: 'Text', labelFr: 'Texte', icon: FileText },
  { value: 'video', label: 'Video', labelFr: 'Vidéo', icon: Video },
  { value: 'audio', label: 'Audio', labelFr: 'Audio', icon: Music },
  { value: 'link', label: 'External link', labelFr: 'Lien externe', icon: Link2 },
];

export function ProgramForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: existingProgram } = useProgram(id);
  const { data: modules = [] } = useProgramModules(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  // Module/lesson forms
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonForms, setNewLessonForms] = useState<Record<string, { title: string; content_type: string }>>({});
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [applyingAI, setApplyingAI] = useState(false);

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  useEffect(() => {
    if (existingProgram) {
      setTitle(existingProgram.title || '');
      setDescription(existingProgram.description || '');
      setCoverUrl(existingProgram.cover_image_url || '');
      setIsPublished(existingProgram.is_published || false);
      setIsFree(existingProgram.is_free ?? true);
      setPrice(existingProgram.price || 0);
      setCertificateEnabled(existingProgram.certificate_enabled || false);
    }
  }, [existingProgram]);

  useEffect(() => {
    if (modules.length > 0) {
      setOpenModules(new Set(modules.map((m: any) => m.id)));
    }
  }, [modules]);

  const currency = currentOrg?.currency || 'XOF';

  const handleSave = async () => {
    if (!currentOrg || !user || !title.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        const wasPublished = existingProgram?.is_published;
        await updateProgram.mutateAsync({
          id: id!,
          title: title.trim(),
          description: description.trim() || undefined,
          cover_image_url: coverUrl || undefined,
          is_published: isPublished,
          is_free: isFree,
          price: isFree ? 0 : price,
          currency,
          certificate_enabled: certificateEnabled,
        });
        if (currentOrg) {
          if (!wasPublished && isPublished) onContentPublished(currentOrg.id, currentOrg.name, 'program', title.trim(), id!, {}, user.id);
          if (wasPublished && !isPublished) onContentUnpublished(currentOrg.id, currentOrg.name, 'program', title.trim());
        }
        toast({ title: isFr ? '✅ Programme mis à jour' : '✅ Program updated' });
      } else {
        const result = await createProgram.mutateAsync({
          organization_id: currentOrg.id,
          title: title.trim(),
          description: description.trim() || undefined,
          cover_image_url: coverUrl || undefined,
          is_published: isPublished,
          is_free: isFree,
          price: isFree ? 0 : price,
          currency,
          created_by: user.id,
        });
        if (isPublished && currentOrg) onContentPublished(currentOrg.id, currentOrg.name, 'program', title.trim(), result.id, {}, user.id);
        toast({ title: isFr ? '✅ Programme créé' : '✅ Program created' });
        navigate(`/admin/programs/${result.id}/edit`, { replace: true });
      }
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
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
        display_order: modules.length,
      });
      setNewModuleTitle('');
      toast({ title: isFr ? '✅ Module ajouté' : '✅ Module added' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!id || !confirm(isFr ? 'Supprimer ce module et toutes ses leçons ?' : 'Delete this module and all its lessons?')) return;
    try {
      await deleteModule.mutateAsync({ moduleId, programId: id });
      toast({ title: isFr ? '🗑️ Module supprimé' : '🗑️ Module deleted' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!id) return;
    const form = newLessonForms[moduleId];
    if (!form?.title?.trim()) return;
    try {
      const mod = modules.find((m: any) => m.id === moduleId);
      await createLesson.mutateAsync({
        module_id: moduleId,
        title: form.title.trim(),
        content_type: form.content_type || 'text',
        display_order: (mod?.lessons?.length || 0),
        programId: id,
      });
      setNewLessonForms(prev => ({ ...prev, [moduleId]: { title: '', content_type: 'text' } }));
      toast({ title: isFr ? '✅ Leçon ajoutée' : '✅ Lesson added' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!id || !confirm(isFr ? 'Supprimer cette leçon ?' : 'Delete this lesson?')) return;
    try {
      await deleteLesson.mutateAsync({ lessonId, programId: id });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const getLessonForm = (moduleId: string) => newLessonForms[moduleId] || { title: '', content_type: 'text' };
  const updateLessonForm = (moduleId: string, field: string, value: string) => {
    setNewLessonForms(prev => ({ ...prev, [moduleId]: { ...getLessonForm(moduleId), [field]: value } }));
  };

  const totalLessons = modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0);

  // Apply AI-generated structure
  const handleAIGenerated = async (structure: { modules: Array<{ title: string; description?: string; lessons: Array<{ title: string; content_type: string; duration_minutes: number }> }> }) => {
    if (!id) return;
    setApplyingAI(true);
    try {
      for (let mi = 0; mi < structure.modules.length; mi++) {
        const mod = structure.modules[mi];
        const modResult = await createModule.mutateAsync({
          program_id: id,
          title: mod.title,
          description: mod.description,
          display_order: modules.length + mi,
        });
        for (let li = 0; li < mod.lessons.length; li++) {
          const lesson = mod.lessons[li];
          await createLesson.mutateAsync({
            module_id: modResult.id,
            title: lesson.title,
            content_type: lesson.content_type || 'text',
            duration_minutes: lesson.duration_minutes,
            display_order: li,
            programId: id,
          });
        }
      }
      toast({ title: isFr ? '✅ Structure appliquée !' : '✅ Structure applied!' });
      setShowAIGenerator(false);
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setApplyingAI(false);
    }
  };

  // Lesson editor view
  if (editingLessonId && id) {
    return (
      <LessonEditor
        lessonId={editingLessonId}
        programId={id}
        onBack={() => setEditingLessonId(null)}
      />
    );
  }

  return (
    <AdminPageShell
      title={isEdit ? (isFr ? 'Modifier le programme' : 'Edit program') : (isFr ? 'Nouveau programme' : 'New program')}
      backRoute="/admin/programs"
    >
      <div className="space-y-6 max-w-4xl">
        {/* Header with save */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{title || (isFr ? 'Sans titre' : 'Untitled')}</h2>
              {isEdit && (
                <p className="text-[10px] text-muted-foreground">
                  {modules.length} module{modules.length !== 1 ? 's' : ''} · {totalLessons} {isFr ? 'leçon' : 'lesson'}{totalLessons !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? 'default' : 'secondary'} className="text-[10px]">
              {isPublished ? (isFr ? 'Publié' : 'Published') : (isFr ? 'Brouillon' : 'Draft')}
            </Badge>
            <Button onClick={handleSave} disabled={saving || !title.trim()} size="sm" className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isFr ? 'Enregistrer' : 'Save'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="content" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" /> {isFr ? 'Contenu' : 'Content'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" /> {isFr ? 'Paramètres' : 'Settings'}
            </TabsTrigger>
          </TabsList>

          {/* ─── CONTENT TAB ─── */}
          <TabsContent value="content" className="space-y-4 mt-4">
            {!isEdit && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> {isFr ? 'Informations' : 'Information'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">{isFr ? 'Titre *' : 'Title *'}</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isFr ? 'Ex: Formation Marketing Digital' : 'E.g.: Digital Marketing Course'} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <RichTextEditor value={description} onChange={setDescription} placeholder={isFr ? "Décrivez le contenu et les objectifs..." : "Describe the content and objectives..."} />
                  </div>
                  <Button onClick={handleSave} disabled={saving || !title.trim()} className="gap-1.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    {isFr ? 'Créer le programme' : 'Create program'}
                  </Button>
                </div>
              </div>
            )}

            {isEdit && (
              <>
                {/* Modules & Lessons */}
                {modules.map((mod: any, mi: number) => (
                  <Collapsible key={mod.id} open={openModules.has(mod.id)} onOpenChange={() => toggleModule(mod.id)}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mi * 0.05 }}
                      className="bg-card border border-border rounded-xl overflow-hidden"
                    >
                      <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <Badge variant="outline" className="text-[10px] shrink-0 font-mono">M{mi + 1}</Badge>
                        <span className="text-sm font-medium flex-1 text-left truncate">{mod.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {mod.lessons?.length || 0} {isFr ? 'leçon' : 'lesson'}{(mod.lessons?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                          onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        {openModules.has(mod.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border p-3 space-y-2">
                          {(mod.lessons || []).map((lesson: any, li: number) => {
                            const typeInfo = CONTENT_TYPES.find(ct => ct.value === lesson.content_type) || CONTENT_TYPES[0];
                            const TypeIcon = typeInfo.icon;
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                                onClick={() => setEditingLessonId(lesson.id)}
                              >
                                <span className="text-[10px] text-muted-foreground font-mono w-5">{li + 1}</span>
                                <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-medium flex-1 truncate">{lesson.title}</span>
                                {lesson.duration_minutes && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />{lesson.duration_minutes}min
                                  </span>
                                )}
                                {lesson.is_free_preview && (
                                  <Badge variant="secondary" className="text-[9px]">
                                    <Eye className="h-2.5 w-2.5 mr-0.5" /> {isFr ? 'Aperçu' : 'Preview'}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[9px]">{isFr ? typeInfo.labelFr : typeInfo.label}</Badge>
                                <Button variant="ghost" size="icon"
                                  className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}>
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            );
                          })}

                          {/* Add lesson inline */}
                          <div className="flex items-end gap-2 pt-2 border-t border-border/50">
                            <div className="flex-1 space-y-1">
                              <Label className="text-[10px]">{isFr ? 'Nouvelle leçon' : 'New lesson'}</Label>
                              <Input
                                value={getLessonForm(mod.id).title}
                                onChange={e => updateLessonForm(mod.id, 'title', e.target.value)}
                                placeholder={isFr ? 'Titre de la leçon' : 'Lesson title'}
                                className="h-7 text-xs"
                                onKeyDown={e => e.key === 'Enter' && handleAddLesson(mod.id)}
                              />
                            </div>
                            <Select value={getLessonForm(mod.id).content_type} onValueChange={v => updateLessonForm(mod.id, 'content_type', v)}>
                              <SelectTrigger className="h-7 w-[100px] text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {CONTENT_TYPES.map(ct => (
                                  <SelectItem key={ct.value} value={ct.value}>{isFr ? ct.labelFr : ct.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                              onClick={() => handleAddLesson(mod.id)} disabled={!getLessonForm(mod.id).title.trim()}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </motion.div>
                  </Collapsible>
                ))}

                {/* Add module */}
                <div className="flex items-center gap-2">
                  <Input
                    value={newModuleTitle}
                    onChange={e => setNewModuleTitle(e.target.value)}
                    placeholder={isFr ? 'Nom du nouveau module...' : 'New module name...'}
                    className="h-9"
                    onKeyDown={e => e.key === 'Enter' && handleAddModule()}
                  />
                  <Button onClick={handleAddModule} disabled={!newModuleTitle.trim() || createModule.isPending} className="gap-1.5 shrink-0">
                    <Plus className="h-3.5 w-3.5" /> {isFr ? 'Module' : 'Module'}
                  </Button>
                </div>

                {modules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">{isFr ? 'Aucun module' : 'No modules yet'}</p>
                    <p className="text-xs mt-1">{isFr ? 'Ajoutez un module pour structurer votre cours' : 'Add a module to structure your course'}</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ─── SETTINGS TAB ─── */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> {isFr ? 'Informations du programme' : 'Program information'}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{isFr ? 'Titre *' : 'Title *'}</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isFr ? 'Ex: Formation Marketing Digital' : 'E.g.: Digital Marketing Course'} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <RichTextEditor value={description} onChange={setDescription} placeholder={isFr ? "Décrivez le contenu et les objectifs..." : "Describe the content and objectives..."} />
                </div>
                <div>
                  <Label className="text-xs">{isFr ? 'Image de couverture' : 'Cover image'}</Label>
                  <ImageUploader
                    value={coverUrl}
                    onChange={setCoverUrl}
                    folder={`programs/${currentOrg?.id}`}
                    label=""
                    aspectRatio="video"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> {isFr ? 'Tarification' : 'Pricing'}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Cours gratuit' : 'Free course'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Accessible à tous sans paiement' : 'Accessible to everyone for free'}</p>
                </div>
                <Switch checked={isFree} onCheckedChange={setIsFree} />
              </div>
              {!isFree && (
                <div>
                  <Label className="text-xs">{isFr ? 'Prix' : 'Price'} ({currency})</Label>
                  <Input type="number" min={0} value={price} onChange={e => setPrice(Number(e.target.value))} className="h-9 w-[200px]" />
                </div>
              )}
            </div>

            {/* Certificate */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> {isFr ? 'Certificat' : 'Certificate'}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Certificat de réussite' : 'Completion certificate'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Délivré automatiquement après complétion' : 'Automatically issued upon completion'}</p>
                </div>
                <Switch checked={certificateEnabled} onCheckedChange={setCertificateEnabled} />
              </div>
            </div>

            {/* Publication */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> {isFr ? 'Publication' : 'Publication'}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Publier le programme' : 'Publish program'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Rendre visible aux membres' : 'Make visible to members'}</p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageShell>
  );
}
