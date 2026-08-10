import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { onContentPublished, onContentUnpublished } from '@/lib/notifications';
import { useOrg } from '@/contexts/OrgContext';
import { useEnsureProgramSlides } from '@/hooks/useProgramSlides';
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
import { CourseBuilder } from '@/components/programs/builder/CourseBuilder';
import { CourseCompletionRules } from '@/components/programs/CourseCompletionRules';
import { CertificateTemplateEditor, type CertificateDesign } from '@/components/programs/CertificateTemplateEditor';
import { useProgramSlideMap } from '@/hooks/useProgramSlides';
import { minAiCoursePrice } from '@/lib/coursePricing';
import type { CourseRules } from '@/hooks/useCourseDraft';

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
import { askConfirm } from '@/components/ui/confirm-dialog';

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
  const minAiPrice = minAiCoursePrice(currency);

  // ── Completion rules ────────────────────────────────────────────────────────
  // Quiz slides are the source of truth for scores/retries (the learner player
  // reads them), so the panel is derived from them and written back on save.
  const { data: slideMap = {} } = useProgramSlideMap(id);
  const flatLessons = modules.flatMap((m: any) =>
    (m.lessons || []).map((l: any) => ({ id: l.id as string, title: l.title as string })));
  const [rules, setRules] = useState<CourseRules>({ score_mode: 'none', passing_score: 70, max_quiz_attempts: 0, certificate_enabled: true });
  const [rulesLoaded, setRulesLoaded] = useState(false);

  // ── Certificate template design ─────────────────────────────────────────────
  const [certDesign, setCertDesign] = useState<CertificateDesign>({});
  useEffect(() => {
    const d = (existingProgram as any)?.certificate_design;
    if (d && typeof d === 'object') setCertDesign({ ...d });
  }, [existingProgram]);

  useEffect(() => {
    if (rulesLoaded || !existingProgram || flatLessons.length === 0 || Object.keys(slideMap).length === 0) return;
    const perLesson: Record<string, { passing_score?: number; max_attempts?: number }> = {};
    let anyScored = false;
    const seen: { pass: number; tries: number }[] = [];
    flatLessons.forEach((l, i) => {
      const quizzes = (slideMap[l.id] || []).filter((s: any) => s.slide_type === 'quiz');
      if (quizzes.length === 0) return;
      const pass = Number((quizzes[0].data as any)?.passingScore || 0);
      const tries = Number((quizzes[0].data as any)?.maxAttempts ?? 0);
      seen.push({ pass, tries });
      if (pass > 0) {
        anyScored = true;
        perLesson[String(i)] = { passing_score: pass, max_attempts: tries };
      }
    });
    const uniform = seen.length > 0 && seen.every(s => s.pass === seen[0].pass && s.tries === seen[0].tries);
    const mode = !anyScored ? 'none' : uniform ? 'global' : 'per_lesson';
    setRules({
      score_mode: mode,
      require_score: mode !== 'none',
      passing_score: (existingProgram as any).passing_score || seen[0]?.pass || 70,
      max_quiz_attempts: seen[0]?.tries ?? 0,
      certificate_enabled: (existingProgram as any).certificate_enabled !== false,
      lesson_rules: mode === 'per_lesson' ? perLesson : undefined,
    });
    setRulesLoaded(true);
  }, [rulesLoaded, existingProgram, flatLessons.length, slideMap]);

  /** Write the chosen rules onto every quiz slide of the course. */
  const stampQuizRules = async () => {
    const mode = rules.score_mode ?? 'none';
    const defaultPass = rules.passing_score ?? 70;
    const defaultTries = rules.max_quiz_attempts ?? 0;
    const updates: PromiseLike<any>[] = [];
    flatLessons.forEach((l, i) => {
      const rule = mode === 'per_lesson' ? rules.lesson_rules?.[String(i)] : undefined;
      const pass = mode === 'per_lesson' ? (rule?.passing_score ?? 0) : mode === 'global' ? defaultPass : 0;
      const tries = rule?.max_attempts ?? defaultTries;
      (slideMap[l.id] || []).forEach((s: any) => {
        if (s.slide_type !== 'quiz') return;
        updates.push(
          supabase.from('program_slides')
            .update({ data: { ...(s.data || {}), passingScore: pass, maxAttempts: tries, revealAnswers: false } as any })
            .eq('id', s.id),
        );
      });
    });
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['program-slides'] });
  };

  const handleSave = async () => {
    if (!currentOrg || !user || !title.trim() || !id) return;
    if (isAiGenerated && price < minAiPrice) {
      toast({
        title: isFr ? 'Prix requis' : 'Price required',
        description: isFr
          ? `Un cours généré par l’IA ne peut pas être gratuit. Minimum ${minAiPrice} ${currency}.`
          : `An AI-generated course cannot be free. Minimum ${minAiPrice} ${currency}.`,
        variant: 'destructive',
      });
      return;
    }
    // A course can only go live either as an explicit free course (non-AI) or
    // with a real price. "Paid but 0" is never publishable.
    if (isPublished && !isFree && price <= 0) {
      toast({
        title: isFr ? 'Prix manquant' : 'Missing price',
        description: isFr
          ? 'Ajoutez un prix, ou marquez le cours comme gratuit, avant de le publier.'
          : 'Add a price, or mark the course as free, before publishing it.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const wasPublished = existingProgram?.is_published;
      const scored = (rules.score_mode ?? 'none') !== 'none';
      const effectiveFree = isAiGenerated ? false : isFree;
      await updateProgram.mutateAsync({
        id,
        title: title.trim(),
        description: description.trim() || undefined,
        cover_image_url: coverUrl || undefined,
        is_published: isPublished,
        is_free: effectiveFree,
        price: effectiveFree ? 0 : price,
        currency,
        certificate_enabled: rules.certificate_enabled !== false,
        certificate_design: certDesign,
        passing_score: scored ? (rules.passing_score ?? 70) : 0,
        max_quiz_attempts: (rules.max_quiz_attempts ?? 0) === 0 ? 10 : rules.max_quiz_attempts,
        require_sequential_lessons: true,
        require_assessment_for_cert: scored,
        assessment_enabled: assessmentEnabled,
        gamification_enabled: false,
      } as any);
      await stampQuizRules();


      // Auto-create/update linked digital product for paid courses (enables affiliate system)
      const externalLink = `/program/${id}`;
      if (!isFree && price > 0 && isPublished) {
        try {
          // Match on the stable program link, never on the title (renaming a course
          // used to orphan its marketplace listing).
          const { data: existingProduct } = await supabase.from('digital_products')
            .select('id')
            .eq('organization_id', currentOrg.id)
            .eq('product_type', 'course')
            .eq('external_link', externalLink)
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
      } else if (wasPublished && !isPublished) {
        // Course taken offline → its marketplace listing must follow.
        try {
          await supabase.from('digital_products')
            .update({ is_published: false, publication_status: 'draft' })
            .eq('organization_id', currentOrg.id)
            .eq('product_type', 'course')
            .eq('external_link', externalLink);
        } catch (e) {
          console.warn('[AdminProgramForm] Mirror unpublish error (non-fatal):', e);
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
    if (!id || !(await askConfirm(isFr ? 'Supprimer ce module et ses leçons ?' : 'Delete this module and its lessons?'))) return;
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
    if (!id || !(await askConfirm(isFr ? 'Supprimer cette leçon ?' : 'Delete this lesson?'))) return;
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

      {/* ─── MAIN LAYOUT — three-pane course builder ─── */}
      {activeTab === 'edit' && (
        <div className="flex flex-1 min-h-0 flex-col">
          {/* Secondary toolbar: AI generator + module-level quiz */}
          <div className="flex items-center gap-1.5 border-b border-border bg-card px-3 py-1.5 overflow-x-auto shrink-0">
            <Button
              variant={showAIGenerator ? 'default' : 'ghost'} size="sm"
              className="h-7 gap-1.5 text-[11px] shrink-0"
              onClick={() => { setShowAIGenerator(v => !v); setEditingQuizModuleId(null); }}
            >
              <Wand2 className="h-3 w-3" /> {isFr ? 'Générer avec IA' : 'Generate with AI'}
            </Button>
            {modules.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px] shrink-0">
                    <HelpCircle className="h-3 w-3" /> {isFr ? 'Quiz & Flashcards' : 'Quiz & Flashcards'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {modules.map((mod: any) => (
                    <DropdownMenuItem
                      key={mod.id}
                      onClick={() => { setEditingQuizModuleId(mod.id); setShowAIGenerator(false); }}
                    >
                      {mod.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px] shrink-0" onClick={handleAddModule}>
              <Plus className="h-3 w-3" /> {isFr ? 'Module' : 'Module'}
            </Button>
          </div>

          {showAIGenerator ? (
            <div className="flex-1 min-h-0 overflow-y-auto bg-muted/30">
              <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <AICourseGenerator onGenerated={handleAIGenerated} onCancel={() => setShowAIGenerator(false)} />
              </div>
            </div>
          ) : editingQuizModuleId ? (
            <div className="flex-1 min-h-0 overflow-y-auto bg-muted/30">
              <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-3">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setEditingQuizModuleId(null)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> {isFr ? 'Retour au builder' : 'Back to builder'}
                </Button>
                <ModuleQuizEditor
                  moduleId={editingQuizModuleId}
                  moduleTitle={modules.find((m: any) => m.id === editingQuizModuleId)?.title || ''}
                  programId={id!}
                  courseTitle={title}
                />
              </div>
            </div>
          ) : (
            <CourseBuilder
              programId={id!}
              modules={modules as any}
              courseTitle={title}
              orgLogoUrl={(currentOrg as any)?.logo_url}
            />
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

      {/* ─── SETTINGS TAB — the single place for everything about the course ─── */}
      {activeTab === 'settings' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{isFr ? 'Image de couverture' : 'Cover image'}</Label>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-6 gap-1 text-[10px] text-primary hover:text-primary"
                      onClick={handleGenerateCover}
                      disabled={generatingCover || !title.trim()}
                    >
                      {generatingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                      {isFr ? 'Générer avec l’IA' : 'Generate with AI'}
                    </Button>
                  </div>
                  <ImageUploader value={coverUrl} onChange={setCoverUrl} folder={`programs/${currentOrg?.id}`} label="" aspectRatio="video" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> {isFr ? 'Tarification' : 'Pricing'}
              </h3>
              {isAiGenerated ? (
                <p className="text-[11px] text-muted-foreground">
                  {isFr
                    ? `Ce cours a été écrit par l’IA : il doit être payant (minimum ${minAiPrice.toLocaleString()} ${currency}).`
                    : `This course was written by the AI: it must be paid (minimum ${minAiPrice.toLocaleString()} ${currency}).`}
                </p>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">{isFr ? 'Cours gratuit' : 'Free course'}</Label>
                    <p className="text-[10px] text-muted-foreground">{isFr ? 'Accessible sans paiement' : 'Free access'}</p>
                  </div>
                  <Switch checked={isFree} onCheckedChange={setIsFree} />
                </div>
              )}
              <div className={cn(isFree && !isAiGenerated && 'opacity-40 pointer-events-none')}>
                <Label className="text-xs">{isFr ? 'Prix' : 'Price'} ({currency})</Label>
                <Input
                  type="number" min={isAiGenerated ? minAiPrice : 0}
                  value={isFree && !isAiGenerated ? 0 : price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="h-9 w-[200px]" disabled={isFree && !isAiGenerated}
                />
                {isAiGenerated && price < minAiPrice && (
                  <p className="mt-1 text-[11px] text-destructive">
                    {isFr ? `Minimum ${minAiPrice.toLocaleString()} ${currency}.` : `Minimum ${minAiPrice.toLocaleString()} ${currency}.`}
                  </p>
                )}
              </div>
            </div>

            {/* Completion rules — score mode, retries, certificate */}
            <CourseCompletionRules
              rules={rules}
              lessons={flatLessons}
              onChange={(patch) => setRules(r => ({ ...r, ...patch }))}
            />

            {/* Certificate template — only when certificates are issued */}
            {rules.certificate_enabled !== false && (
              <CertificateTemplateEditor
                design={certDesign}
                onChange={(patch) => setCertDesign(d => ({ ...d, ...patch }))}
                courseTitle={title}
                orgName={currentOrg?.name || 'SiteViral'}
                orgLogo={(currentOrg as any)?.logo_url}
                lessons={flatLessons}
              />
            )}

            <Button onClick={handleSave} disabled={saving || !title.trim()} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isFr ? 'Enregistrer les réglages' : 'Save settings'}
            </Button>
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
