import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Plus, Save, Loader2, BookOpen, Layers, FileText, Video, Music, Link2, Trash2, GripVertical, ChevronDown, ChevronRight, Clock, Settings, Eye, Zap, DollarSign, Award, ArrowLeft, MoreVertical, Lock, PenLine, ImageIcon, Wand2, Users, Share2, HelpCircle } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/I18nContext';
import { LessonEditor } from '@/components/programs/LessonEditor';
import { AICourseGenerator } from '@/components/programs/AICourseGenerator';
import { ModuleQuizEditor } from '@/components/programs/ModuleQuizEditor';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LessonPreview } from '@/components/programs/LessonPreview';
import { CourseIntelligencePanel } from '@/components/programs/CourseIntelligencePanel';
import { MobilePreviewOverlay } from '@/components/programs/MobilePreviewOverlay';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const queryClient = useQueryClient();

  const { data: existingProgram } = useProgram(id);
  const { data: modules = [] } = useProgramModules(id);

  // Migrate legacy HTML lessons into real slide rows (idempotent, admin-only)
  useEnsureProgramSlides(id, isEdit);


  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [price, setPrice] = useState(0);
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [passingScore, setPassingScore] = useState(70);
  const [requireSequential, setRequireSequential] = useState(false);
  const [requireAssessmentForCert, setRequireAssessmentForCert] = useState(false);
  const [assessmentEnabled, setAssessmentEnabled] = useState(true);
  const [gamificationEnabledSetting, setGamificationEnabledSetting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const isMobile = useIsMobile();
  const isMobileViewport = isMobile || (typeof window !== 'undefined' && window.innerWidth < 768);

  // Lesson selection
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Module/lesson forms
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');
  const [applyingAI, setApplyingAI] = useState(false);
  const [editingQuizModuleId, setEditingQuizModuleId] = useState<string | null>(null);
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
      const aiGen = (existingProgram as any).ai_generated === true;
      setIsAiGenerated(aiGen);
      setIsFree(aiGen ? false : (existingProgram.is_free ?? true));
      setPrice(existingProgram.price || 0);
      setCertificateEnabled((existingProgram as any).certificate_enabled || false);
      setPassingScore((existingProgram as any).passing_score ?? 70);
      setRequireSequential((existingProgram as any).require_sequential_lessons || false);
      setRequireAssessmentForCert((existingProgram as any).require_assessment_for_cert || false);
      setAssessmentEnabled((existingProgram as any).assessment_enabled !== false);
      setGamificationEnabledSetting((existingProgram as any).gamification_enabled !== false);
    }
  }, [existingProgram]);

  // Auto-select first lesson on desktop only.
  // On mobile, users must be able to stay on the full lesson list screen.
  useEffect(() => {
    if (isMobileViewport || selectedLessonId || modules.length === 0) return;

      const firstMod = modules[0];
      if (firstMod?.lessons?.length > 0) {
        setSelectedLessonId(firstMod.lessons[0].id);
        setSelectedModuleId(firstMod.id);
      }
  }, [isMobileViewport, modules, selectedLessonId]);

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
        passing_score: passingScore,
        require_sequential_lessons: requireSequential,
        require_assessment_for_cert: requireAssessmentForCert,
        assessment_enabled: assessmentEnabled,
        gamification_enabled: gamificationEnabledSetting,
      } as any);

      // Auto-create/update linked digital product for paid courses (enables affiliate system)
      if (!isFree && price > 0 && isPublished) {
        try {
          const externalLink = `/program/${id}`;
          const { data: existingProduct } = await supabase.from('digital_products')
            .select('id')
            .eq('organization_id', currentOrg.id)
            .eq('product_type', 'course')
            .ilike('title', title.trim())
            .maybeSingle();

          const productPayload = {
            title: title.trim(),
            description: description.trim()?.replace(/<[^>]*>/g, '').slice(0, 500) || `${isFr ? 'Cours' : 'Course'}: ${title.trim()}`,
            cover_image_url: coverUrl || null,
            external_link: externalLink,
            price,
            currency,
            is_free: false,
            is_published: true,
            publication_status: 'published',
            product_type: 'course',
            organization_id: currentOrg.id,
            created_by: user.id,
            ai_generated: false,
          };

          if (existingProduct) {
            await supabase.from('digital_products').update(productPayload).eq('id', existingProduct.id);
          } else {
            await supabase.from('digital_products').insert(productPayload);
          }
        } catch (e) {
          console.warn('[AdminProgramForm] Auto-product sync error (non-fatal):', e);
        }
      }

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

  const handleRenameModule = async (moduleId: string) => {
    if (!id || !editingModuleTitle.trim()) {
      setEditingModuleId(null);
      return;
    }
    try {
      await updateModule.mutateAsync({ id: moduleId, programId: id, title: editingModuleTitle.trim() });
      toast({ title: isFr ? '✅ Module renommé' : '✅ Module renamed' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setEditingModuleId(null);
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
      const deferredImageJobs: Array<{ id: string; title: string; imagePrompt: string }> = [];

      for (let mi = 0; mi < structure.modules.length; mi++) {
        const mod = structure.modules[mi];
        const modResult = await createModule.mutateAsync({
          program_id: id,
          title: mod.title,
          description: mod.description,
          display_order: modules.length + mi,
        });
        for (let li = 0; li < (mod.lessons || []).length; li++) {
          const lesson = mod.lessons[li];
          const lessonResult = await createLesson.mutateAsync({
            module_id: modResult.id,
            title: lesson.title,
            content_type: lesson.content_type || 'text',
            content: lesson.content || '',
            duration_minutes: lesson.duration_minutes,
            display_order: li,
            programId: id,
          });
          if (lesson?.image_prompt && lessonResult?.data?.id) {
            deferredImageJobs.push({
              id: lessonResult.data.id,
              title: lesson.title,
              imagePrompt: lesson.image_prompt,
            });
          }
        }
      }

      // Final assessment as a separate module
      if (structure?.final_assessment?.questions?.length > 0) {
        const assessmentModule = await createModule.mutateAsync({
          program_id: id,
          title: structure.final_assessment.title || (isFr ? 'Évaluation finale' : 'Final Assessment'),
          description: structure.final_assessment.description || '',
          display_order: modules.length + structure.modules.length,
        });
        const quizComments = structure.final_assessment.questions
          .map((q: any) => `<!-- QUIZ:${JSON.stringify(q)} -->`)
          .join('\n');
        await createLesson.mutateAsync({
          module_id: assessmentModule.id,
          title: isFr ? 'Évaluation finale' : 'Final Assessment',
          content_type: 'text',
          content: `<h2>${isFr ? '🏆 Évaluation finale' : '🏆 Final Assessment'}</h2><p>${isFr ? 'Testez vos connaissances sur le cours complet.' : 'Test your knowledge of the entire course.'}</p>${quizComments}`,
          duration_minutes: 15,
          display_order: 0,
          programId: id,
        });
      }

      // Queue lesson image generation in background (fire-and-forget)
      if (deferredImageJobs.length > 0) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const { queueDeferredCourseLessonImages } = await import('@/lib/programImageGeneration');
            void queueDeferredCourseLessonImages({
              programId: id,
              lessonJobs: deferredImageJobs,
              sessionToken: session.access_token,
              tier: 'standard',
            });
          }
        } catch (imgErr) {
          console.warn('[AdminProgramForm] Lesson image queueing failed:', imgErr);
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
  const showMobilePreviewOverlay = activeTab === 'preview' && !!id && isMobileViewport;

  const handleAIHelp = async (type: 'title' | 'description') => {
    const setter = type === 'title' ? setGeneratingTitle : setGeneratingDesc;
    setter(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('ai-course-help', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { type, course_title: title, course_description: description?.replace(/<[^>]*>/g, ''), language: isFr ? 'fr' : 'en' },
      });
      if (error) throw error;
      if (data?.result) {
        if (type === 'title') setTitle(data.result);
        else setDescription(data.result);
        toast({ title: isFr ? 'Généré par l\'IA' : 'AI generated' });
      }
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setter(false);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('ai-generate-course-cover', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { title, description: description?.replace(/<[^>]*>/g, '').slice(0, 300), tier: 'standard', org_id: currentOrg?.id },
      });
      if (error) throw error;
      if (data?.url) {
        setCoverUrl(data.url);
        toast({ title: isFr ? 'Couverture générée !' : 'Cover generated!' });
      }
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingCover(false);
    }
  };

  // If not in edit mode, redirect to new flow
  if (!isEdit) {
    navigate('/admin/programs', { replace: true });
    return null;
  }

  return (
    <div className="h-[calc(100dvh-60px)] flex flex-col">
      {/* ─── TOP BAR ─── */}
      <div className="border-b border-border bg-card shrink-0">
        {/* Row 1: Back + title + save */}
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/admin/programs')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-8 text-sm font-semibold border-none bg-transparent px-1 hover:bg-muted/50 focus:bg-muted/50 transition-colors min-w-0 flex-1"
            />
            <Badge variant={isPublished ? 'default' : 'secondary'} className="text-[9px] shrink-0">
              {isPublished ? (isFr ? 'Publié' : 'Published') : (isFr ? 'Brouillon' : 'Draft')}
            </Badge>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()} className="gap-1.5 h-8 text-xs shrink-0">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            <span className="hidden sm:inline">{isFr ? 'Enregistrer' : 'Save'}</span>
          </Button>
        </div>

        {/* Row 2: Tabs */}
        <div className="flex items-center px-3 pb-2 overflow-x-auto">
          <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5 w-full">
            {[
              { key: 'edit', label: isFr ? 'Éditer' : 'Edit' },
              { key: 'preview', label: isFr ? 'Aperçu' : 'Preview' },
              { key: 'settings', label: isFr ? 'Paramètres' : 'Settings' },
              { key: 'publish', label: isFr ? 'Publier' : 'Publish' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap text-center',
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
      </div>

      {/* ─── MAIN LAYOUT — stacked on mobile, side-by-side on desktop ─── */}
      {activeTab === 'edit' && (
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* LEFT: Lessons sidebar — on mobile: show only when no lesson selected */}
          {(!isMobileViewport || !selectedLessonId) && (
            <div className={cn(
              'border-b md:border-b-0 md:border-r border-border bg-card flex flex-col shrink-0',
              isMobileViewport ? 'flex-1 overflow-y-auto' : 'overflow-hidden md:w-64 lg:w-72',
            )}>
              {/* Mobile course overview header */}
              {isMobileViewport && (
                <div className="p-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{isFr ? 'Structure de la formation' : 'Formation structure'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{totalLessons} {isFr ? 'leçon' : 'lesson'}{totalLessons !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
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
                         {isFr ? 'Générer avec IA' : 'Generate with AI'}
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
                    <div
                      className="flex items-center gap-1.5 px-2 py-1.5 group cursor-pointer hover:bg-muted/30 rounded-md"
                      onClick={() => {
                        if (editingModuleId === mod.id) return;
                        setCollapsedModules(prev => {
                          const next = new Set(prev);
                          if (next.has(mod.id)) next.delete(mod.id);
                          else next.add(mod.id);
                          return next;
                        });
                      }}
                    >
                      {collapsedModules.has(mod.id) ? (
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />

                      {editingModuleId === mod.id ? (
                        <Input
                          autoFocus
                          value={editingModuleTitle}
                          onChange={e => setEditingModuleTitle(e.target.value)}
                          onBlur={() => handleRenameModule(mod.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameModule(mod.id);
                            if (e.key === 'Escape') setEditingModuleId(null);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="h-5 text-[11px] font-semibold uppercase tracking-wide px-1 py-0 border-primary"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex-1 truncate">
                          {mod.title}
                        </span>
                      )}

                      <span className="text-[9px] text-muted-foreground/60">{(mod.lessons || []).length}</span>
                      <Button
                        variant="ghost" size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-primary"
                        title={isFr ? 'Renommer' : 'Rename'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModuleId(mod.id);
                          setEditingModuleTitle(mod.title);
                        }}
                      >
                        <PenLine className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>

                    {/* Lessons — collapsible */}
                    {!collapsedModules.has(mod.id) && (
                      <>
                        {(mod.lessons || []).map((lesson: any, li: number) => (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => {
                              setSelectedLessonId(lesson.id);
                              setSelectedModuleId(mod.id);
                              setEditingQuizModuleId(null);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 rounded-lg text-left transition-colors group/lesson',
                              isMobileViewport ? 'py-3 min-h-[48px]' : 'py-2',
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

                        {/* Module quiz button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuizModuleId(mod.id);
                            setSelectedLessonId(null);
                            setSelectedModuleId(mod.id);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-[11px]',
                            editingQuizModuleId === mod.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-muted/50 text-muted-foreground'
                          )}
                        >
                          <HelpCircle className="h-3 w-3 shrink-0" />
                          <span className="flex-1">{isFr ? 'Quiz & Flashcards' : 'Quiz & Flashcards'}</span>
                        </button>
                      </>
                    )}
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
                         {isFr ? 'Générer avec IA' : 'Generate with AI'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Course Intelligence Panel */}
                {modules.length > 0 && (
                  <div className="px-2 pb-2">
                    <CourseIntelligencePanel
                      modules={modules}
                      courseTitle={title}
                      programId={id!}
                      onLessonSelect={(lessonId) => {
                        setSelectedLessonId(lessonId);
                        const mod = modules.find((m: any) => m.lessons?.some((l: any) => l.id === lessonId));
                        if (mod) setSelectedModuleId(mod.id);
                      }}
                      onRefresh={() => {
                        queryClient.invalidateQueries({ queryKey: ['program-modules', id] });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CENTER: Lesson content editor — on mobile: show only when lesson selected */}
          {(!isMobileViewport || selectedLessonId) && (
            <div className="flex-1 min-w-0 overflow-y-auto bg-muted/30">
              {/* Mobile: back to lessons list button */}
              {selectedLessonId && isMobileViewport && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => {
                    setSelectedLessonId(null);
                    setSelectedModuleId(null);
                  }}>
                    <ArrowLeft className="h-3.5 w-3.5" /> {isFr ? 'Toutes les leçons' : 'All lessons'}
                  </Button>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {modules.find((m: any) => m.id === selectedModuleId)?.title}
                  </span>
                </div>
              )}
              {showAIGenerator ? (
                <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                  <AICourseGenerator onGenerated={handleAIGenerated} onCancel={() => setShowAIGenerator(false)} />
                </div>
              ) : editingQuizModuleId ? (
                <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                  {isMobileViewport && (
                    <div className="mb-3">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => {
                        setEditingQuizModuleId(null);
                      }}>
                        <ArrowLeft className="h-3.5 w-3.5" /> {isFr ? 'Retour' : 'Back'}
                      </Button>
                    </div>
                  )}
                  <ModuleQuizEditor
                    moduleId={editingQuizModuleId}
                    moduleTitle={modules.find((m: any) => m.id === editingQuizModuleId)?.title || ''}
                    programId={id!}
                    courseTitle={title}
                  />
                </div>
              ) : selectedLessonId ? (
                <LessonEditor
                  lessonId={selectedLessonId}
                  programId={id!}
                  courseTitle={title}
                  onBack={() => {
                    setSelectedLessonId(null);
                    setSelectedModuleId(null);
                  }}
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
          )}
        </div>
      )}

      {/* ─── PREVIEW TAB ─── */}
      {activeTab === 'preview' && id && !showMobilePreviewOverlay && (
        <div className="flex-1 min-h-0">
          <LessonPreview
            programId={id}
            initialLessonId={selectedLessonId || undefined}
            onClose={() => setActiveTab('edit')}
          />
        </div>
      )}

      {showMobilePreviewOverlay && id && (
        <MobilePreviewOverlay open={showMobilePreviewOverlay}>
          <LessonPreview
            programId={id}
            initialLessonId={selectedLessonId || undefined}
            onClose={() => setActiveTab('edit')}
          />
        </MobilePreviewOverlay>
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
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{isFr ? 'Titre *' : 'Title *'}</Label>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-6 gap-1 text-[10px] text-primary hover:text-primary"
                      onClick={() => handleAIHelp('title')}
                      disabled={generatingTitle}
                    >
                      {generatingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                      {isFr ? 'IA' : 'AI'}
                    </Button>
                  </div>
                  <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Description</Label>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-6 gap-1 text-[10px] text-primary hover:text-primary"
                      onClick={() => handleAIHelp('description')}
                      disabled={generatingDesc}
                    >
                      {generatingDesc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                      {isFr ? 'IA' : 'AI'}
                    </Button>
                  </div>
                  <RichTextEditor value={description} onChange={setDescription} placeholder={isFr ? "Décrivez le contenu..." : "Describe the content..."} />
                </div>
                <div>
                  <Label className="text-xs">{isFr ? 'Image de couverture' : 'Cover image'}</Label>
                  <ImageUploader value={coverUrl} onChange={setCoverUrl} folder={`programs/${currentOrg?.id}`} label="" aspectRatio="video" />
                  {/* AI cover generation removed — use upload or Canva */}
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
                  <p className="text-[10px] text-muted-foreground">
                    {isAiGenerated
                      ? (isFr ? 'Les formations créées par IA doivent être payantes' : 'AI-generated courses must be paid')
                      : (isFr ? 'Accessible sans paiement' : 'Free access')}
                  </p>
                </div>
                <Switch checked={isFree} onCheckedChange={setIsFree} disabled={isAiGenerated} />
              </div>
              <div className={cn(isFree && 'opacity-40 pointer-events-none')}>
                <Label className="text-xs">{isFr ? 'Prix' : 'Price'} ({currency})</Label>
                <Input type="number" min={0} value={isFree ? 0 : price} onChange={e => setPrice(Number(e.target.value))} className="h-9 w-[200px]" disabled={isFree} />
              </div>
            </div>

            {/* LMS Settings */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" /> {isFr ? 'Paramètres LMS' : 'LMS Settings'}
              </h3>

              {/* Sequential lessons */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Progression séquentielle' : 'Sequential progression'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Les apprenants doivent suivre les leçons dans l\'ordre' : 'Learners must complete lessons in order'}</p>
                </div>
                <Switch checked={requireSequential} onCheckedChange={setRequireSequential} />
              </div>

              {/* Assessment */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Évaluation finale' : 'Final assessment'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Quiz final à la fin du cours' : 'Final quiz at end of course'}</p>
                </div>
                <Switch checked={assessmentEnabled} onCheckedChange={setAssessmentEnabled} />
              </div>

              {/* Gamification */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Gamification (étoiles)' : 'Gamification (stars)'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Récompenser les bonnes réponses' : 'Reward correct answers'}</p>
                </div>
                <Switch checked={gamificationEnabledSetting} onCheckedChange={setGamificationEnabledSetting} />
              </div>

              {/* Passing score */}
              <div>
                <Label className="text-xs">{isFr ? 'Score minimum de réussite' : 'Minimum passing score'}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Select value={String(passingScore)} onValueChange={v => setPassingScore(Number(v))}>
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="60">60%</SelectItem>
                      <SelectItem value="70">70%</SelectItem>
                      <SelectItem value="80">80%</SelectItem>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground">{isFr ? 'requis pour réussir' : 'required to pass'}</span>
                </div>
              </div>
            </div>

            {/* Certificate */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> {isFr ? 'Certificat' : 'Certificate'}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">{isFr ? 'Certificat de réussite' : 'Completion certificate'}</Label>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'Délivré après complétion du cours' : 'Issued upon course completion'}</p>
                </div>
                <Switch checked={certificateEnabled} onCheckedChange={setCertificateEnabled} />
              </div>

              {certificateEnabled && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-primary/20">
                  <div>
                    <Label className="text-xs">{isFr ? 'Exiger l\'évaluation finale' : 'Require final assessment'}</Label>
                    <p className="text-[10px] text-muted-foreground">{isFr ? 'Le score minimum doit être atteint' : 'Minimum score must be reached'}</p>
                  </div>
                  <Switch checked={requireAssessmentForCert} onCheckedChange={setRequireAssessmentForCert} />
                </div>
              )}
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

            {/* Ambassador / Affiliate section */}
            {!isFree && price > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" /> {isFr ? 'Programme Ambassadeur' : 'Ambassador Program'}
                </h3>
                <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">{isFr ? 'Ce cours sera promu par vos ambassadeurs' : 'This course can be promoted by ambassadors'}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isFr
                      ? `Quand vous publiez un cours payant, il est automatiquement disponible dans le marketplace ambassadeur. Les ambassadeurs peuvent partager votre cours et gagner une commission (${currentOrg?.affiliation_commission_percent || 10}%) sur chaque vente.`
                      : `When you publish a paid course, it's automatically available in the ambassador marketplace. Ambassadors can share your course and earn a commission (${currentOrg?.affiliation_commission_percent || 10}%) on each sale.`}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{currentOrg?.affiliation_commission_percent || 10}%</p>
                      <p className="text-[9px] text-muted-foreground">{isFr ? 'Commission' : 'Commission'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{price.toLocaleString()} {currency}</p>
                      <p className="text-[9px] text-muted-foreground">{isFr ? 'Prix du cours' : 'Course price'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">
                        {Math.round(price * (currentOrg?.affiliation_commission_percent || 10) / 100).toLocaleString()} {currency}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{isFr ? 'Gain/vente' : 'Earn/sale'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
