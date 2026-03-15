import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onContentPublished, onContentUnpublished } from '@/lib/notifications';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useProgram, useProgramModules, useUpdateProgram,
  useCreateModule, useUpdateModule, useDeleteModule,
  useCreateLesson, useUpdateLesson, useDeleteLesson,
  useLesson,
} from '@/hooks/usePrograms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Plus, Save, Loader2, BookOpen, Layers, FileText, Video, Music,
  Link2, Trash2, GripVertical, ChevronDown, ChevronRight, Clock,
  Settings, Eye, Sparkles, DollarSign, Award, ArrowLeft,
  MoreVertical, Lock, PenLine, ImageIcon, Wand2
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/I18nContext';
import { LessonEditor } from '@/components/programs/LessonEditor';
import { AICourseGenerator } from '@/components/programs/AICourseGenerator';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LessonPreview } from '@/components/programs/LessonPreview';

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
  const [activeTab, setActiveTab] = useState('edit');

  // Lesson selection
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Module/lesson forms
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [applyingAI, setApplyingAI] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);

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

  // Auto-select first lesson
  useEffect(() => {
    if (!selectedLessonId && modules.length > 0) {
      const firstMod = modules[0];
      if (firstMod?.lessons?.length > 0) {
        setSelectedLessonId(firstMod.lessons[0].id);
        setSelectedModuleId(firstMod.id);
      }
    }
  }, [modules, selectedLessonId]);

  const currency = currentOrg?.currency || 'XOF';

  const handleSave = async () => {
    if (!currentOrg || !user || !title.trim() || !id) return;
    setSaving(true);
    try {
      const wasPublished = existingProgram?.is_published;
      await updateProgram.mutateAsync({
        id,
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
        if (!wasPublished && isPublished) onContentPublished(currentOrg.id, currentOrg.name, 'program', title.trim(), id, {}, user.id);
        if (wasPublished && !isPublished) onContentUnpublished(currentOrg.id, currentOrg.name, 'program', title.trim());
      }
      toast({ title: isFr ? '✅ Enregistré' : '✅ Saved' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!id || !newLessonTitle.trim()) return;
    try {
      const mod = modules.find((m: any) => m.id === moduleId);
      const result = await createLesson.mutateAsync({
        module_id: moduleId,
        title: newLessonTitle.trim(),
        content_type: 'text',
        display_order: (mod?.lessons?.length || 0),
        programId: id,
      });
      setNewLessonTitle('');
      setSelectedLessonId(result.data.id);
      setSelectedModuleId(moduleId);
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleAddModule = async () => {
    if (!id) return;
    try {
      const result = await createModule.mutateAsync({
        program_id: id,
        title: isFr ? `Module ${modules.length + 1}` : `Module ${modules.length + 1}`,
        display_order: modules.length,
      });
      toast({ title: isFr ? '✅ Module ajouté' : '✅ Module added' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!id || !confirm(isFr ? 'Supprimer ce module et ses leçons ?' : 'Delete this module and its lessons?')) return;
    try {
      if (selectedModuleId === moduleId) {
        setSelectedLessonId(null);
        setSelectedModuleId(null);
      }
      await deleteModule.mutateAsync({ moduleId, programId: id });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleDeleteLesson = async (lessonId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!id || !confirm(isFr ? 'Supprimer cette leçon ?' : 'Delete this lesson?')) return;
    try {
      if (selectedLessonId === lessonId) setSelectedLessonId(null);
      await deleteLesson.mutateAsync({ lessonId, programId: id });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleAIGenerated = async (structure: any) => {
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

  const totalLessons = modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0);

  // If not in edit mode, redirect to new flow
  if (!isEdit) {
    navigate('/admin/programs', { replace: true });
    return null;
  }

  return (
    <div className="h-[calc(100dvh-60px)] flex flex-col">
      {/* ─── TOP BAR ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/admin/programs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-8 text-sm font-semibold border-none bg-transparent px-1 hover:bg-muted/50 focus:bg-muted/50 transition-colors max-w-[280px]"
            />
            <Badge variant={isPublished ? 'default' : 'secondary'} className="text-[9px] shrink-0">
              {isPublished ? (isFr ? 'Publié' : 'Live') : (isFr ? 'Brouillon' : 'Draft')}
            </Badge>
          </div>
        </div>

        {/* Top bar nav */}
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            {[
              { key: 'edit', label: isFr ? 'Éditer' : 'Edit' },
              { key: 'preview', label: isFr ? 'Aperçu' : 'Preview' },
              { key: 'settings', label: isFr ? 'Paramètres' : 'Set up' },
              { key: 'publish', label: isFr ? 'Publier' : 'Publish' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden sm:block">
            {saving ? (isFr ? 'Enregistrement...' : 'Saving...') : (isFr ? '✓ Enregistré' : '✓ Saved')}
          </span>
          <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()} className="gap-1.5 h-8 text-xs">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {isFr ? 'Enregistrer' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ─── MAIN 3-PANEL LAYOUT ─── */}
      {activeTab === 'edit' && (
        <div className="flex flex-1 min-h-0">
          {/* LEFT: Lessons sidebar */}
          <div className="w-64 lg:w-72 border-r border-border bg-card flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-semibold">{isFr ? 'Leçons' : 'Lessons'}</span>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowAIGenerator(!showAIGenerator)}>
                      <Sparkles className="h-3.5 w-3.5 mr-2" /> {isFr ? 'Générer avec IA' : 'Generate with AI'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="icon" className="h-7 w-7" onClick={handleAddModule}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {modules.map((mod: any, mi: number) => (
                <div key={mod.id}>
                  {/* Module header */}
                  <div className="flex items-center gap-1.5 px-2 py-1.5 group">
                    <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex-1 truncate">
                      {mod.title}
                    </span>
                    <Button
                      variant="ghost" size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => handleDeleteModule(mod.id)}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>

                  {/* Lessons */}
                  {(mod.lessons || []).map((lesson: any, li: number) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setSelectedLessonId(lesson.id);
                        setSelectedModuleId(mod.id);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors group/lesson',
                        selectedLessonId === lesson.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0">{li + 1}</span>
                      <span className="text-xs flex-1 truncate">{lesson.title}</span>
                      {lesson.duration_minutes && (
                        <span className="text-[9px] text-muted-foreground">{lesson.duration_minutes}m</span>
                      )}
                      <Button
                        variant="ghost" size="icon"
                        className="h-5 w-5 opacity-0 group-hover/lesson:opacity-100 text-destructive shrink-0"
                        onClick={(e) => handleDeleteLesson(lesson.id, e)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </button>
                  ))}

                  {/* Add slide/lesson button */}
                  <div className="px-3 py-1">
                    <div className="flex items-center gap-1">
                      <Input
                        value={selectedModuleId === mod.id ? newLessonTitle : ''}
                        onChange={e => {
                          setSelectedModuleId(mod.id);
                          setNewLessonTitle(e.target.value);
                        }}
                        onFocus={() => setSelectedModuleId(mod.id)}
                        onKeyDown={e => e.key === 'Enter' && handleAddLesson(mod.id)}
                        placeholder={isFr ? '+ Nouvelle leçon' : '+ New lesson'}
                        className="h-7 text-[11px] border-none bg-transparent hover:bg-muted/30 focus:bg-muted/50 px-2"
                      />
                      {selectedModuleId === mod.id && newLessonTitle.trim() && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => handleAddLesson(mod.id)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {modules.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <Layers className="h-8 w-8 mx-auto text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">{isFr ? 'Aucun module' : 'No modules'}</p>
                  <div className="space-y-1.5">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full" onClick={handleAddModule}>
                      <Plus className="h-3 w-3" /> {isFr ? 'Ajouter un module' : 'Add module'}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full" onClick={() => setShowAIGenerator(true)}>
                      <Sparkles className="h-3 w-3" /> {isFr ? 'Générer avec IA' : 'Generate with AI'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Lesson content editor */}
          <div className="flex-1 min-w-0 overflow-y-auto bg-muted/30">
            {showAIGenerator ? (
              <div className="p-6 max-w-2xl mx-auto">
                <AICourseGenerator onGenerated={handleAIGenerated} onCancel={() => setShowAIGenerator(false)} />
              </div>
            ) : selectedLessonId ? (
              <LessonEditor
                lessonId={selectedLessonId}
                programId={id!}
                onBack={() => setSelectedLessonId(null)}
                embedded
              />
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6">
                <div className="space-y-3">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    {isFr ? 'Sélectionnez une leçon pour l\'éditer' : 'Select a lesson to edit'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PREVIEW TAB ─── */}
      {activeTab === 'preview' && id && (
        <div className="flex-1 min-h-0">
          <LessonPreview
            programId={id}
            initialLessonId={selectedLessonId || undefined}
            onClose={() => setActiveTab('edit')}
          />
        </div>
      )}

      {/* ─── SETTINGS TAB ─── */}
      {activeTab === 'settings' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Program info */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> {isFr ? 'Informations du cours' : 'Course information'}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{isFr ? 'Titre *' : 'Title *'}</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <RichTextEditor value={description} onChange={setDescription} placeholder={isFr ? "Décrivez le contenu..." : "Describe the content..."} />
                </div>
                <div>
                  <Label className="text-xs">{isFr ? 'Image de couverture' : 'Cover image'}</Label>
                  <ImageUploader value={coverUrl} onChange={setCoverUrl} folder={`programs/${currentOrg?.id}`} label="" aspectRatio="video" />
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
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Accessible sans paiement' : 'Free access'}</p>
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
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Délivré après complétion' : 'Issued upon completion'}</p>
                </div>
                <Switch checked={certificateEnabled} onCheckedChange={setCertificateEnabled} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PUBLISH TAB ─── */}
      {activeTab === 'publish' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> {isFr ? 'Publication' : 'Publication'}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Publier le cours' : 'Publish course'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Rendre visible aux membres' : 'Make visible to members'}</p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isFr
                    ? `Ce cours contient ${modules.length} module(s) et ${totalLessons} leçon(s).`
                    : `This course has ${modules.length} module(s) and ${totalLessons} lesson(s).`}
                </p>
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isPublished
                    ? (isFr ? 'Mettre à jour et publier' : 'Update & publish')
                    : (isFr ? 'Enregistrer comme brouillon' : 'Save as draft')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
