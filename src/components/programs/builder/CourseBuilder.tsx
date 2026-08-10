import { useEffect, useMemo, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgRole } from '@/hooks/useOrgRole';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProgramSlideMap, useCreateSlide, useUpdateSlide, useDeleteSlide, useReorderSlides,
} from '@/hooks/useProgramSlides';
import { useReorderLessons } from '@/hooks/useReorderLessons';
import { useCreateLesson, useDeleteLesson, useCreateModule } from '@/hooks/usePrograms';
import { emptySlide, type ProgramSlideRow, type SlideType } from '@/components/programs/lesson-preview/slideAdapters';
import { LessonEditor } from '@/components/programs/LessonEditor';
import { BuilderTree, type TreeModule } from './BuilderTree';
import { SlideFormEditor, useSlideDraft } from './SlideFormEditor';
import { SlidePhonePreview } from './SlidePhonePreview';
import { LessonSettingsPanel } from './LessonSettingsPanel';
import { askConfirm } from '@/components/ui/confirm-dialog';

type CenterMode = 'slide' | 'lesson-settings' | 'raw-html' | 'empty';

interface CourseBuilderProps {
  programId: string;
  modules: TreeModule[];
  courseTitle: string;
  orgLogoUrl?: string | null;
}

const EDITOR_ROLES = ['owner', 'admin', 'editor'];

export function CourseBuilder({ programId, modules, courseTitle, orgLogoUrl }: CourseBuilderProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { currentOrg } = useOrg();
  const { data: role } = useOrgRole(currentOrg?.id);
  const isMobile = useIsMobile();

  // RLS (slides_manage_by_org / can_manage_org) is the real authority; this only
  // hides controls for members whose role cannot author content.
  const canEdit = !role || EDITOR_ROLES.includes(role);

  const { data: slideMap = {} } = useProgramSlideMap(programId);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [centerMode, setCenterMode] = useState<CenterMode>('empty');
  // On mobile the phone preview is a full-screen sheet, never an inline pane,
  // so the editor keeps the whole viewport.
  const [showPreview, setShowPreview] = useState(!isMobile);

  const [saving, setSaving] = useState(false);

  const createSlide = useCreateSlide();
  const updateSlide = useUpdateSlide();
  const deleteSlide = useDeleteSlide();
  const reorderSlides = useReorderSlides();
  const reorderLessons = useReorderLessons();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();
  const createModule = useCreateModule();

  const lessonSlides: ProgramSlideRow[] = useMemo(
    () => (selectedLessonId ? slideMap[selectedLessonId] || [] : []),
    [slideMap, selectedLessonId],
  );

  const selectedSlide = useMemo(
    () => lessonSlides.find(s => s.id === selectedSlideId) || null,
    [lessonSlides, selectedSlideId],
  );

  const { draft, patch, dirty, setDirty } = useSlideDraft(selectedSlide);

  // Auto-select first lesson on desktop
  useEffect(() => {
    if (isMobile || selectedLessonId || modules.length === 0) return;
    const mod = modules.find(m => (m.lessons || []).length > 0);
    const lesson = mod?.lessons?.[0];
    if (mod && lesson) {
      setSelectedLessonId(lesson.id);
      setSelectedModuleId(mod.id);
      setCenterMode('slide');
    }
  }, [isMobile, modules, selectedLessonId]);

  useEffect(() => {
    if (centerMode !== 'slide') return;
    if (selectedSlideId && lessonSlides.some(s => s.id === selectedSlideId)) return;
    setSelectedSlideId(lessonSlides[0]?.id ?? null);
  }, [lessonSlides, selectedSlideId, centerMode]);

  const moduleTitle = modules.find(m => m.id === selectedModuleId)?.title || '';
  const lessonTitle =
    modules.flatMap(m => m.lessons || []).find(l => l.id === selectedLessonId)?.title || '';

  const fail = (e: any) =>
    toast({ title: isFr ? 'Erreur' : 'Error', description: e?.message, variant: 'destructive' });

  // ── Slide actions ──
  const handleAddSlide = async (lessonId: string, type: SlideType) => {
    try {
      const order = (slideMap[lessonId] || []).length;
      const row = await createSlide.mutateAsync(emptySlide(lessonId, order, type));
      setSelectedLessonId(lessonId);
      setSelectedSlideId(row.id);
      setCenterMode('slide');
    } catch (e) { fail(e); }
  };

  const handleDuplicateSlide = async (slide: ProgramSlideRow) => {
    try {
      const { id, ...rest } = slide;
      const row = await createSlide.mutateAsync({
        ...rest,
        display_order: (slideMap[slide.lesson_id] || []).length,
      });
      setSelectedSlideId(row.id);
      setCenterMode('slide');
    } catch (e) { fail(e); }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!(await askConfirm(isFr ? 'Supprimer cette diapositive ?' : 'Delete this slide?'))) return;
    try {
      await deleteSlide.mutateAsync(slideId);
      if (selectedSlideId === slideId) setSelectedSlideId(null);
    } catch (e) { fail(e); }
  };

  const handleSaveSlide = async () => {
    if (!selectedSlide || !draft) return;
    setSaving(true);
    try {
      await updateSlide.mutateAsync({
        id: selectedSlide.id,
        slide_type: draft.slide_type,
        title: draft.title || null,
        body: draft.body || null,
        media_url: draft.media_url || null,
        caption: draft.caption || null,
        duration_seconds: draft.duration_seconds,
        data: draft.data,
      });
      setDirty(false);
      toast({ title: isFr ? 'Diapositive enregistrée' : 'Slide saved' });
    } catch (e) { fail(e); } finally { setSaving(false); }
  };

  // ── Lesson actions ──
  const handleAddLesson = async (moduleId: string) => {
    try {
      const mod = modules.find(m => m.id === moduleId);
      const order = (mod?.lessons || []).length;
      const res = await createLesson.mutateAsync({
        module_id: moduleId,
        title: isFr ? `Leçon ${order + 1}` : `Lesson ${order + 1}`,
        content_type: 'text',
        display_order: order,
        programId,
      });
      const newId = (res as any)?.data?.id;
      if (newId) {
        setSelectedLessonId(newId);
        setSelectedModuleId(moduleId);
        setSelectedSlideId(null);
        setCenterMode('lesson-settings');
      }
    } catch (e) { fail(e); }
  };

  const handleDuplicateLesson = async (lessonId: string, moduleId: string) => {
    try {
      const mod = modules.find(m => m.id === moduleId);
      const source = (mod?.lessons || []).find(l => l.id === lessonId);
      const order = (mod?.lessons || []).length;
      const res = await createLesson.mutateAsync({
        module_id: moduleId,
        title: `${source?.title || 'Lesson'} (${isFr ? 'copie' : 'copy'})`,
        content_type: 'text',
        duration_minutes: source?.duration_minutes || 0,
        display_order: order,
        programId,
      });
      const newId = (res as any)?.data?.id;
      if (!newId) return;
      for (const s of slideMap[lessonId] || []) {
        const { id, ...rest } = s;
        await createSlide.mutateAsync({ ...rest, lesson_id: newId });
      }
      setSelectedLessonId(newId);
      setSelectedModuleId(moduleId);
      setCenterMode('slide');
    } catch (e) { fail(e); }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!(await askConfirm(isFr ? 'Supprimer cette leçon ?' : 'Delete this lesson?'))) return;
    try {
      await deleteLesson.mutateAsync({ lessonId, programId });
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setSelectedSlideId(null);
        setCenterMode('empty');
      }
    } catch (e) { fail(e); }
  };

  const handleAddModule = async () => {
    try {
      await createModule.mutateAsync({
        program_id: programId,
        title: `Module ${modules.length + 1}`,
        display_order: modules.length,
      });
    } catch (e) { fail(e); }
  };

  const showTree = !isMobile || centerMode === 'empty';
  const showCenter = !isMobile || centerMode !== 'empty';

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* ── LEFT: tree ── */}
      {showTree && (
        <div className={cn(
          'border-b border-border bg-card md:border-b-0 md:border-r',
          isMobile ? 'min-h-0 flex-1' : 'w-64 shrink-0 lg:w-72',
        )}>
          <BuilderTree
            modules={modules}
            slideMap={slideMap}
            selectedLessonId={selectedLessonId}
            selectedSlideId={selectedSlideId}
            canEdit={canEdit}
            isFr={isFr}
            onSelectLesson={(lessonId, moduleId) => {
              setSelectedLessonId(lessonId);
              setSelectedModuleId(moduleId);
              setCenterMode('slide');
            }}
            onSelectSlide={(slideId, lessonId, moduleId) => {
              setSelectedLessonId(lessonId);
              setSelectedModuleId(moduleId);
              setSelectedSlideId(slideId);
              setCenterMode('slide');
            }}
            onOpenLessonSettings={(lessonId, moduleId) => {
              setSelectedLessonId(lessonId);
              setSelectedModuleId(moduleId);
              setCenterMode('lesson-settings');
            }}
            onAddLesson={handleAddLesson}
            onDuplicateLesson={handleDuplicateLesson}
            onDeleteLesson={handleDeleteLesson}
            onAddSlide={handleAddSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onReorderLessons={(_moduleId, orderedIds) =>
              reorderLessons.mutate({ orderedIds, programId })}
            onReorderSlides={(_lessonId, orderedIds) => reorderSlides.mutate(orderedIds)}
            onAddModule={handleAddModule}
          />
        </div>
      )}

      {/* ── CENTER: editor ── */}
      {showCenter && (
        <div className="flex min-w-0 flex-1 flex-col bg-muted/30">
          <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
            {isMobile && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                onClick={() => setCenterMode('empty')}>
                <ArrowLeft className="h-3.5 w-3.5" /> {isFr ? 'Structure' : 'Structure'}
              </Button>
            )}
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {lessonTitle || courseTitle}
            </span>
            {centerMode === 'raw-html' && (
              <Button variant="ghost" size="sm" className="h-8 text-xs"
                onClick={() => setCenterMode('lesson-settings')}>
                {isFr ? 'Quitter le mode avancé' : 'Exit advanced mode'}
              </Button>
            )}
            {centerMode !== 'raw-html' && (
              <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-[11px] md:hidden"
                onClick={() => setShowPreview(true)}>
                <Smartphone className="h-3.5 w-3.5" /> {isFr ? 'Aperçu' : 'Preview'}
              </Button>
            )}

          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {centerMode === 'raw-html' && selectedLessonId ? (
              <LessonEditor
                lessonId={selectedLessonId}
                programId={programId}
                courseTitle={courseTitle}
                onBack={() => setCenterMode('lesson-settings')}
                embedded
              />
            ) : centerMode === 'lesson-settings' && selectedLessonId ? (
              <LessonSettingsPanel
                lessonId={selectedLessonId}
                programId={programId}
                canEdit={canEdit}
                isFr={isFr}
                hasSlides={lessonSlides.length > 0}
                onOpenAdvanced={() => setCenterMode('raw-html')}
              />
            ) : selectedSlide && draft ? (
              <SlideFormEditor
                slide={selectedSlide}
                draft={draft}
                onChange={patch}
                onSave={handleSaveSlide}
                saving={saving}
                dirty={dirty}
                canEdit={canEdit}
                isFr={isFr}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div className="space-y-3">
                  <Layers className="mx-auto h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    {selectedLessonId
                      ? (isFr ? 'Ajoutez une première diapositive à cette leçon.' : 'Add a first slide to this lesson.')
                      : (isFr ? 'Sélectionnez une leçon ou une diapositive.' : 'Select a lesson or a slide.')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RIGHT: live phone preview (desktop pane) ── */}
      {showPreview && !isMobile && centerMode !== 'raw-html' && (
        <div className="w-[320px] shrink-0 border-l border-border bg-card xl:w-[360px]">
          <SlidePhonePreview
            slide={selectedSlide}
            draft={draft}
            slideIndex={Math.max(0, lessonSlides.findIndex(s => s.id === selectedSlideId))}
            totalSlides={Math.max(1, lessonSlides.length)}
            lessonTitle={lessonTitle}
            moduleTitle={moduleTitle}
            orgLogoUrl={orgLogoUrl}
            isFr={isFr}
          />
        </div>
      )}

      {/* ── Mobile: preview as a full-screen sheet so the editor keeps the viewport ── */}
      {showPreview && isMobile && centerMode !== 'raw-html' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
            <span className="min-w-0 truncate text-xs font-semibold">
              {isFr ? 'Aperçu apprenant' : 'Learner preview'}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPreview(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SlidePhonePreview
              slide={selectedSlide}
              draft={draft}
              slideIndex={Math.max(0, lessonSlides.findIndex(s => s.id === selectedSlideId))}
              totalSlides={Math.max(1, lessonSlides.length)}
              lessonTitle={lessonTitle}
              moduleTitle={moduleTitle}
              orgLogoUrl={orgLogoUrl}
              isFr={isFr}
            />
          </div>
        </div>
      )}

    </div>
  );
}
