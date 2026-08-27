import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { useProgramModules, useProgram } from '@/hooks/usePrograms';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Monitor, Tablet, Smartphone, X, List, Settings2, Trophy, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseContentIntoSlides, ContentSlide, type QuizData } from './lesson-preview/parseContentSlides';
import { SlideRenderer } from './lesson-preview/SlideRenderer';
import { SlideCustomizationPanel, DEFAULT_CUSTOMIZATION, type SlideCustomization } from './lesson-preview/SlideCustomizationPanel';
import { FinalAssessmentSlide } from './lesson-preview/FinalAssessmentSlide';
import { CourseCompletionSlide } from './lesson-preview/CourseCompletionSlide';
import { ModuleQuizPlayer } from './ModuleQuizPlayer';
import { useSaveSlideProgress, useSaveLessonCompletion, useEnrollmentProgress } from '@/hooks/useLearnerProgress';
import { useModuleQuiz } from '@/hooks/useModuleQuiz';
import { getSlideThemeFor } from './lesson-preview/slideThemes';
import { db } from '@/lib/db';
import { useProgramSlideMap, useUpdateSlide } from '@/hooks/useProgramSlides';
import { rowToContentSlide } from './lesson-preview/slideAdapters';
import { SlideSegmentBar } from './lesson-preview/SlideSegmentBar';
import { PreviewPaywallSlide } from './lesson-preview/PreviewPaywallSlide';
import { buildPreviewLessonIds, isSlidePreviewable } from '@/lib/coursePreview';
import { formatPrice } from '@/lib/currency';


interface LessonPreviewProps {
  programId: string;
  initialLessonId?: string;
  /** Resume directly at this `program_slides.id` when it exists in the course */
  initialSlideId?: string | null;
  /** Resume at this flat player index (legacy HTML lessons with no slide rows) */
  initialSlideIndex?: number | null;
  onClose?: () => void;
  headerActions?: ReactNode;
  /**
   * 'creator' shows customization/device tools, 'learner' shows the clean player
   * with progress saving, 'preview' shows the clean player for guests/non-buyers
   * with the preview boundary enforced and NO progress saving.
   */
  mode?: 'creator' | 'learner' | 'preview';
  /** Called when a visitor asks for full access from the paywall slide */
  onRequestAccess?: () => void;
}

type DeviceMode = 'mobile' | 'tablet' | 'desktop';

/** Extract the first <img src="…"> URL from HTML */
function extractFirstImageUrl(html: string | null): string | undefined {
  if (!html) return undefined;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || undefined;
}

/** Extract the first image found across all lessons in a module */
function stripHtmlToText(html: string | null): string {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickAssessmentQuestions(questions: QuizData[], lessonCount: number): QuizData[] {
  const target = lessonCount >= 14
    ? Math.min(25, 20 + Math.max(0, lessonCount - 14))
    : 15;
  if (questions.length <= target) return questions;

  // Sample evenly across the full course instead of over-representing the
  // first lessons or reshuffling on every render.
  return Array.from({ length: target }, (_, index) => (
    questions[Math.floor(index * questions.length / target)]
  ));
}

function extractLessonMedia(html: string | null): { lessonImageUrl?: string; cleanedHtml: string } {
  if (!html) return { cleanedHtml: '' };

  const heroMatch = html.match(/<div[^>]*class=["'][^"']*lesson-hero-image[^"']*["'][^>]*>[\s\S]*?<\/div>/i);
  if (!heroMatch) {
    return { lessonImageUrl: extractFirstImageUrl(html), cleanedHtml: html };
  }

  return {
    lessonImageUrl: extractFirstImageUrl(heroMatch[0]),
    cleanedHtml: html.replace(heroMatch[0], '').trim(),
  };
}

interface FlatSlide {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  moduleId: string;
  slide: ContentSlide;
  lessonIndex: number;
  slideInLesson: number;
  /** real `program_slides.id`, or null for legacy/synthetic slides */
  slideId: string | null;
  countsForProgress: boolean;
  lessonImageUrl?: string;
  moduleQuiz?: any; // populated for module-quiz slides
}

export function LessonPreview({ programId, initialLessonId, initialSlideId, initialSlideIndex, onClose, headerActions, mode = 'creator', onRequestAccess }: LessonPreviewProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { data: program } = useProgram(programId);
  const { data: modules = [] } = useProgramModules(programId);
  const { data: slideMap = {} } = useProgramSlideMap(programId);
  const isPreview = mode === 'preview';
  // Preview mode reuses the clean learner chrome, but never writes progress.
  const isLearner = mode === 'learner' || isPreview;
  const tracksProgress = mode === 'learner';

  /**
   * Slides for a lesson: persisted `program_slides` rows win; legacy lessons
   * fall back to parsing the single HTML blob at render time.
   */
  const getLessonSlides = useCallback((lesson: any, cleanedHtml: string): { slide: ContentSlide; slideId: string | null }[] => {
    const rows = (slideMap as Record<string, any[]>)[lesson?.id];
    if (rows && rows.length > 0) return rows.map((row) => ({ slide: rowToContentSlide(row), slideId: row.id as string }));
    // Legacy HTML lesson (not yet backfilled): parsed at render time, no slide ids.
    return parseContentIntoSlides(cleanedHtml).map((slide) => ({ slide, slideId: null }));
  }, [slideMap]);


  // Fetch all module quizzes for this program
  const moduleIds = useMemo(() => modules.map((m: any) => m.id), [modules]);
  const { data: moduleQuizzes = [] } = useQuery({
    queryKey: ['all-module-quizzes', programId, moduleIds],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      if (!moduleIds.length) return [];
      const { data } = await db.from('program_quizzes')
        .select('*, quiz_questions(*)')
        .in('module_id', moduleIds);
      return (data || []).map((q: any) => ({
        ...q,
        questions: (q.quiz_questions || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
      }));
    },
  });

  const initialViewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const [viewportWidth, setViewportWidth] = useState(initialViewportWidth);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => (initialViewportWidth < 768 ? 'mobile' : 'desktop'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobileViewport = viewportWidth < 768;
  const isCompactCreatorPreview = !isLearner && isMobileViewport;
  const [showSidebar, setShowSidebar] = useState(() => !isMobileViewport && (!isLearner || initialViewportWidth >= 1024));
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isGeneratingSlideImage, setIsGeneratingSlideImage] = useState(false);

  // Per-slide customizations keyed by slide index
  const [slideCustomizations, setSlideCustomizations] = useState<Record<number, SlideCustomization>>({});
  const [starsEarned, setStarsEarned] = useState(0);
  // Star gamification was removed from the product; kept as a constant so the
  // slide components stay compatible without showing any star UI.
  const gamificationEnabled = false;

  // Track the highest slide index the learner has reached (for slide locking)
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);

  // Progress saving hooks (only active for learners)
  const saveProgress = useSaveSlideProgress(programId);
  const saveLessonCompletion = useSaveLessonCompletion();
  const { data: enrollmentProgress } = useEnrollmentProgress(tracksProgress ? programId : undefined);

  // Restore stars from DB on mount (slide position is restored after allSlides is built)
  const restoredRef = useRef(false);
  useEffect(() => {
    if (tracksProgress && enrollmentProgress?.total_stars) setStarsEarned(enrollmentProgress.total_stars);
  }, [isLearner, enrollmentProgress?.total_stars]);

  // Debounced progress save - refs only, effect is after allSlides
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedRef = useRef<number>(-1);
  useEffect(() => {
    const updateViewport = () => {
      const w = window.innerWidth;
      setViewportWidth(w);

      if (isLearner) {
        if (w < 768) setDeviceMode('mobile');
        else if (w < 1024) setDeviceMode('tablet');
        else setDeviceMode('desktop');
      } else if (w < 768) {
        setDeviceMode('mobile');
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [isLearner]);

  useEffect(() => {
    if (isMobileViewport) {
      setShowSidebar(false);
      setShowCustomizer(false);
    }
  }, [isMobileViewport]);
  
  // Final assessment state
  const [assessmentScore, setAssessmentScore] = useState<number | undefined>();
  const [assessmentTotal, setAssessmentTotal] = useState<number | undefined>();

  const orgLogoUrl = (program as any)?.organizations?.logo_url;

  // Collect all quiz questions across lessons for final assessment
  const allQuizQuestions: QuizData[] = useMemo(() => {
    const quizzes: QuizData[] = [];
    for (const mod of modules) {
      for (const lesson of (mod as any).lessons || []) {
        const contentSlides = getLessonSlides(lesson, lesson.content || '');
        for (const { slide: cs } of contentSlides) {
          if (cs.type === 'quiz' && cs.quiz) {
            quizzes.push(cs.quiz);
          }
        }
      }
    }
    return quizzes;
  }, [modules, getLessonSlides]);


  // Build flat slide array
  const allSlides: FlatSlide[] = useMemo(() => {
    const slides: FlatSlide[] = [];
    let lessonIdx = 0;
    let lastLessonImageUrl: string | undefined;
    // Last resort backdrop: the course cover, so no slide ever falls back to a
    // bare gradient when illustrations were not generated.
    const coverFallback: string | undefined = (program as any)?.cover_image_url || undefined;

    for (const mod of modules) {
      const modLessons = (mod as any).lessons || [];

      for (const lesson of modLessons) {
        const { lessonImageUrl: ownImageUrl, cleanedHtml } = extractLessonMedia(lesson.content || '');
        if (ownImageUrl) lastLessonImageUrl = ownImageUrl;
        // Illustration generation can stop early: reuse the closest available
        // image so no lesson falls back to a bare gradient.
        const lessonImageUrl = ownImageUrl || lastLessonImageUrl || coverFallback;

        slides.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleTitle: (mod as any).title,
          moduleId: (mod as any).id,
          slide: { type: 'title-card', bodyHtml: lesson.description || '' },
          lessonIndex: lessonIdx,
          slideInLesson: 0,
          slideId: null,
          countsForProgress: true,
          lessonImageUrl,
        });

        const contentSlides = getLessonSlides(lesson, cleanedHtml);
        contentSlides.forEach(({ slide: cs, slideId }, si) => {
          slides.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            moduleTitle: (mod as any).title,
            moduleId: (mod as any).id,
            slide: cs,
            lessonIndex: lessonIdx,
            slideInLesson: si + 1,
            slideId,
            countsForProgress: true,
            lessonImageUrl,
          });
        });

        lessonIdx++;
      }

      // Add module quiz slide if quiz exists for this module
      const modQuiz = moduleQuizzes.find((q: any) => q.module_id === (mod as any).id);
      if (modQuiz && modQuiz.questions?.length > 0) {
        slides.push({
          lessonId: `__module_quiz_${(mod as any).id}__`,
          lessonTitle: `${isFr ? 'Quiz' : 'Quiz'} — ${(mod as any).title}`,
          moduleTitle: (mod as any).title,
          moduleId: (mod as any).id,
          slide: { type: 'module-quiz' as any, bodyHtml: '' },
          lessonIndex: lessonIdx,
          slideInLesson: 0,
          slideId: null,
          countsForProgress: true,
          lessonImageUrl: lastLessonImageUrl || coverFallback,
          moduleQuiz: modQuiz,
        });
      }
    }

    // Add final assessment slide if there are quiz questions
    if (allQuizQuestions.length >= 3) {
      slides.push({
        lessonId: '__final_assessment__',
        lessonTitle: isFr ? 'Évaluation finale' : 'Final Assessment',
        moduleTitle: isFr ? 'Évaluation' : 'Assessment',
        moduleId: '__assessment__',
        slide: { type: 'final-assessment', bodyHtml: '' },
        lessonIndex: lessonIdx,
        slideInLesson: 0,
        slideId: null,
        countsForProgress: true,
        lessonImageUrl: lastLessonImageUrl || coverFallback,
      });
    }

    // Add completion slide
    slides.push({
      lessonId: '__completion__',
      lessonTitle: isFr ? 'Terminé' : 'Completed',
      moduleTitle: isFr ? 'Fin du cours' : 'Course Complete',
      moduleId: '__completion__',
      slide: { type: 'course-completion', bodyHtml: '' },
      lessonIndex: lessonIdx + 1,
      slideInLesson: 0,
      slideId: null,
      countsForProgress: false,
      lessonImageUrl: lastLessonImageUrl || coverFallback,
    });

    return slides;
  }, [modules, allQuizQuestions.length, isFr, moduleQuizzes, getLessonSlides, program]);

  /**
   * Resume resolution (runs once the flat slide list exists):
   *  1. explicit `initialSlideId` / enrollment `current_slide_id` → exact slide
   *     (only possible for lessons backed by real `program_slides` rows)
   *  2. explicit `initialSlideIndex` / enrollment `last_slide_index` inside the
   *     stored `current_lesson_id` → exact position for legacy HTML lessons
   *  3. first slide of `current_lesson_id` → start of the last-opened lesson
   *  4. `initialLessonId` → start of that lesson
   */
  useEffect(() => {
    if (allSlides.length === 0 || restoredRef.current) return;

    const targetSlideId = initialSlideId ?? (isLearner ? enrollmentProgress?.current_slide_id : null);
    const targetLessonId = (isLearner ? enrollmentProgress?.current_lesson_id : null) || initialLessonId;
    const targetIndex = initialSlideIndex ?? (isLearner ? enrollmentProgress?.last_slide_index ?? -1 : -1);

    let idx = -1;
    if (targetSlideId) idx = allSlides.findIndex(s => s.slideId === targetSlideId);
    if (idx < 0 && targetLessonId && targetIndex >= 0 && targetIndex < allSlides.length
        && allSlides[targetIndex].lessonId === targetLessonId) {
      idx = targetIndex;
    }
    if (idx < 0 && targetLessonId) {
      idx = allSlides.findIndex(s => s.lessonId === targetLessonId && s.slideInLesson === 0);
    }
    if (idx < 0 && isLearner && targetIndex > 0 && targetIndex < allSlides.length) idx = targetIndex;

    if (idx >= 0) {
      restoredRef.current = true;
      setCurrentIndex(idx);
      setMaxReachedIndex(prev => Math.max(prev, Math.max(idx, isLearner ? (enrollmentProgress?.last_slide_index ?? 0) : 0)));
    } else if (isLearner && (enrollmentProgress || initialSlideIndex != null)) {
      restoredRef.current = true;
    }
  }, [allSlides.length, initialLessonId, initialSlideId, initialSlideIndex, isLearner,
      enrollmentProgress?.current_slide_id, enrollmentProgress?.current_lesson_id, enrollmentProgress?.last_slide_index]);

  const current = allSlides[currentIndex];
  const total = allSlides.length;
  const progressPercent = total ? ((currentIndex + 1) / total) * 100 : 0;

  /**
   * Story-style segments: one per slide of the CURRENT lesson, so the learner
   * always sees their position inside the lesson rather than the whole course.
   */
  const lessonSegments = useMemo(() => {
    if (!current) return { count: 0, activeIndex: 0, startIndex: 0 };
    const indexes: number[] = [];
    allSlides.forEach((s, i) => { if (s.lessonId === current.lessonId) indexes.push(i); });
    return {
      count: indexes.length,
      activeIndex: Math.max(0, indexes.indexOf(currentIndex)),
      startIndex: indexes[0] ?? 0,
    };
  }, [allSlides, current?.lessonId, currentIndex]);

  /** slideId → persisted row, used to hydrate & save slide styling */
  const rowsById = useMemo(() => {
    const map: Record<string, any> = {};
    Object.values(slideMap as Record<string, any[]>).forEach((rows) => {
      (rows || []).forEach((r) => { map[r.id] = r; });
    });
    return map;
  }, [slideMap]);

  /** Hydrate saved styling so the Customize panel reflects what is stored */
  const hydratedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (allSlides.length === 0) return;
    const next: Record<number, SlideCustomization> = {};
    allSlides.forEach((s, index) => {
      if (!s.slideId || hydratedRef.current.has(s.slideId)) return;
      const saved = rowsById[s.slideId]?.data?.customization;
      hydratedRef.current.add(s.slideId);
      if (saved) next[index] = { ...DEFAULT_CUSTOMIZATION, ...saved, layout: 'text-only' };
    });
    if (Object.keys(next).length) {
      setSlideCustomizations((prev) => ({ ...next, ...prev }));
    }
  }, [allSlides, rowsById]);

  const updateSlide = useUpdateSlide();
  const persistCustomization = useCallback((index: number, c: SlideCustomization) => {
    if (isLearner) return;
    const slideId = allSlides[index]?.slideId;
    if (!slideId) return;
    const row = rowsById[slideId];
    updateSlide.mutate({ id: slideId, data: { ...(row?.data || {}), customization: c } } as any);
  }, [allSlides, rowsById, updateSlide, isLearner]);

  const customizationsRef = useRef<Record<number, SlideCustomization>>({});
  useEffect(() => { customizationsRef.current = slideCustomizations; }, [slideCustomizations]);

  const applyCustomizationToAll = useCallback((partial: Partial<SlideCustomization>) => {
    const prev = customizationsRef.current;
    const next: Record<number, SlideCustomization> = { ...prev };

    allSlides.forEach((slide, index) => {
      if (slide.slide.type === 'final-assessment' || slide.slide.type === 'course-completion') return;
      next[index] = {
        ...(prev[index] || DEFAULT_CUSTOMIZATION),
        ...partial,
        layout: 'text-only',
      };
      persistCustomization(index, next[index]);
    });

    setSlideCustomizations(next);
  }, [allSlides, persistCustomization]);


  const handleGenerateSlideBackground = useCallback(async () => {
    if (!current || !(program as any)?.organization_id) return;

    setIsGeneratingSlideImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(isFr ? 'Session expirée. Reconnectez-vous.' : 'Session expired. Please sign in again.');
      }

      const contextText = stripHtmlToText(current.slide.bodyHtml).slice(0, 220);
      const description = [current.moduleTitle, current.lessonTitle, current.slide.heading, contextText]
        .filter(Boolean)
        .join('. ');

      const { data, error } = await supabase.functions.invoke('ai-generate-course-cover', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          title: current.slide.heading || current.lessonTitle,
          description,
          tier: 'standard',
          org_id: (program as any).organization_id,
          image_type: 'slide_background',
        },
      });

      if (error) {
        let detail: any = null;
        try { detail = await (error as any).context?.json?.(); } catch { /* response body unavailable */ }
        const status = Number((error as any)?.context?.status || 0);
        if (status === 402) {
          throw new Error(detail?.error || (isFr
            ? 'Crédits insuffisants pour générer cette image. Ajoutez des crédits puis réessayez.'
            : 'Not enough credits to generate this image. Add credits and try again.'));
        }
        throw new Error(detail?.error || error.message);
      }
      if (!data?.url) throw new Error(isFr ? 'Aucune image n’a été générée.' : 'No image was generated.');

      const generated: SlideCustomization = {
        ...(customizationsRef.current[currentIndex] || DEFAULT_CUSTOMIZATION),
        bgImageUrl: data.url,
        imagePosition: 'cover',
        layout: 'text-only',
      };
      setSlideCustomizations((prev) => ({ ...prev, [currentIndex]: generated }));
      persistCustomization(currentIndex, generated);

      toast({
        title: isFr ? 'Image de fond générée' : 'Background image generated',
        description: isFr ? 'Le visuel a été ajouté derrière la diapositive.' : 'The visual was added behind the slide.',
      });
    } catch (error: any) {
      toast({
        title: isFr ? 'Erreur' : 'Error',
        description: error?.message || (isFr ? 'Impossible de générer l’image.' : 'Could not generate the image.'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSlideImage(false);
    }
  }, [current, currentIndex, isFr, program, toast, persistCustomization]);

  const totalQuizzes = useMemo(() => 
    allSlides.filter(s => s.slide.type === 'quiz').length, 
    [allSlides]
  );

  // Total slides that count toward progress (everything except the completion slide)
  const countableSlides = useMemo(() => allSlides.filter(s => s.countsForProgress), [allSlides]);

  // Save progress as learner navigates (debounced)
  useEffect(() => {
    if (!tracksProgress || currentIndex === lastSavedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedRef.current = currentIndex;
      const cur = allSlides[currentIndex];
      const reached = Math.max(currentIndex, maxReachedIndex);
      // Legacy/synthetic slides have no uuid, so they are counted positionally.
      const legacyCompletedCount = allSlides
        .slice(0, reached + 1)
        .filter(s => s.countsForProgress && !s.slideId).length;

      saveProgress.mutate({
        slideIndex: currentIndex,
        totalSlides: total,
        slideId: cur?.slideId ?? null,
        lessonId: cur?.lessonId ?? null,
        totalCountableSlides: countableSlides.length,
        legacyCompletedCount,
        starsEarned,
        completed: cur?.slide.type === 'course-completion',
      });
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [isLearner, currentIndex, starsEarned, total, allSlides, maxReachedIndex, countableSlides.length]);

  /** Lessons the creator flagged as free preview */
  const previewLessonIds = useMemo(() => buildPreviewLessonIds(modules as any[]), [modules]);

  /** Indexes a guest / non-buyer is allowed to actually see */
  const previewAllowed = useMemo(() => {
    if (!isPreview) return null;
    const set = new Set<number>();
    allSlides.forEach((s, i) => {
      if (isSlidePreviewable({ lessonId: s.lessonId, lessonIndex: s.lessonIndex, slideInLesson: s.slideInLesson }, previewLessonIds)) {
        set.add(i);
      }
    });
    return set;
  }, [isPreview, allSlides, previewLessonIds]);

  /** First slide a preview visitor is not allowed to see — the paywall lands here */
  const firstLockedIndex = useMemo(() => {
    if (!previewAllowed) return -1;
    for (let i = 0; i < allSlides.length; i++) if (!previewAllowed.has(i)) return i;
    return -1;
  }, [previewAllowed, allSlides.length]);

  const isPaywalled = isPreview && !!previewAllowed && !previewAllowed.has(currentIndex);

  const canGoTo = (idx: number) => {
    if (isPreview && previewAllowed) {
      // Reachable: any preview slide, plus the first locked slide (shows paywall).
      return previewAllowed.has(idx) || idx === firstLockedIndex;
    }
    if (!isLearner) return true;
    return idx <= maxReachedIndex + 1;
  };

  const goNext = () => {
    if (currentIndex < total - 1 && canGoTo(currentIndex + 1)) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setMaxReachedIndex(prev => Math.max(prev, nextIdx));
    }
  };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(i => i - 1); };

  // Tap / swipe navigation for the full-screen story player
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const goToSlide = (idx: number) => {
    if (canGoTo(idx)) {
      setCurrentIndex(idx);
      setMaxReachedIndex(prev => Math.max(prev, idx));
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, total]);

  // For learners, slides fill the viewport; for creators, use device frames
  const deviceStyles: Record<DeviceMode, { w: string; maxW: string; h: string }> = isLearner
    ? { mobile: { w: '100%', maxW: '100%', h: '100%' }, tablet: { w: '100%', maxW: '100%', h: '100%' }, desktop: { w: '100%', maxW: '100%', h: '100%' } }
    : {
        mobile: { w: '375px', maxW: '375px', h: '700px' },
        tablet: { w: '768px', maxW: '768px', h: '600px' },
        desktop: { w: '100%', maxW: '960px', h: '560px' },
      };

  const currentCustomization = slideCustomizations[currentIndex] || DEFAULT_CUSTOMIZATION;

  if (allSlides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div className="space-y-3">
          <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Monitor className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Aucune leçon à prévisualiser' : 'No lessons to preview'}
          </p>
        </div>
      </div>
    );
  }

  const lessonGroups = modules.map((mod: any) => ({
    moduleTitle: mod.title,
    moduleId: mod.id,
    lessons: (mod.lessons || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      duration: l.duration_minutes,
    })),
  }));

  const renderSlideContent = () => {
    if (!current) return null;
    const theme = getSlideThemeFor(`${program?.title || ''}|${current.lessonTitle || ''}`, currentIndex);

    // Preview boundary: render the paywall instead of the locked slide's content.
    if (isPaywalled) {
      return (
        <PreviewPaywallSlide
          programId={programId}
          courseTitle={program?.title || ''}
          priceLabel={program && !(program as any).is_free && ((program as any).price ?? 0) > 0
            ? formatPrice((program as any).price ?? 0, (program as any).is_free, (program as any).currency)
            : undefined}
          lockedSlideId={current.slideId}
          lockedSlideIndex={currentIndex}
          lessonTitle={current.lessonTitle}
          previewedSlides={previewAllowed ? previewAllowed.size : 0}
          onRequestAccess={onRequestAccess}
        />
      );
    }

    // Module quiz
    if ((current.slide.type as string) === 'module-quiz' && current.moduleQuiz) {
      return (
        <ModuleQuizPlayer
          quiz={current.moduleQuiz}
          moduleTitle={current.moduleTitle}
          gamificationEnabled={gamificationEnabled}
          onReview={() => {
            const first = allSlides.findIndex(sl => sl.lessonId === current.lessonId);
            setCurrentIndex(first >= 0 ? first : 0);
          }}
          onComplete={(passed) => {
            if (passed || !isLearner) goNext();
          }}
        />
      );
    }

    // Final assessment
    if (current.slide.type === 'final-assessment') {
      const lessonCount = modules.reduce((count, mod: any) => count + ((mod.lessons || []).length), 0);
      const assessmentQuestions = pickAssessmentQuestions(allQuizQuestions, lessonCount);

      return (
        <FinalAssessmentSlide
          questions={assessmentQuestions}
          theme={theme}
          slideIndex={currentIndex}
          totalSlides={total}
          lessonTitle={current.lessonTitle}
          orgLogoUrl={orgLogoUrl}
          deviceMode={deviceMode}
          lessonImageUrl={current.lessonImageUrl}
          gamificationEnabled={gamificationEnabled}
          passingScore={(program as any)?.passing_score ?? 0}
          onContinue={() => goNext()}
          onReview={() => setCurrentIndex(0)}
          onComplete={(score, t) => {
            setAssessmentScore(score);
            setAssessmentTotal(t);
          }}
        />
      );
    }

    // Course completion
    if (current.slide.type === 'course-completion') {
      return (
        <CourseCompletionSlide
          theme={theme}
          starsEarned={starsEarned}
          totalQuizzes={totalQuizzes}
          assessmentScore={assessmentScore}
          assessmentTotal={assessmentTotal}
          courseTitle={program?.title || ''}
          programId={programId}
          orgLogoUrl={orgLogoUrl}
          deviceMode={deviceMode}
          lessonImageUrl={current.lessonImageUrl}
          gamificationEnabled={gamificationEnabled}
          mode={mode === 'preview' ? 'creator' : mode}
        />
      );
    }

    // Regular slides
    return (
      <SlideRenderer
        slide={current.slide}
        slideIndex={currentIndex}
        totalSlides={total}
        lessonTitle={current.lessonTitle}
        moduleTitle={current.moduleTitle}
        orgLogoUrl={orgLogoUrl}
        deviceMode={deviceMode}
        customization={currentCustomization}
        lessonImageUrl={current.lessonImageUrl}
        showHeaderCounter={!isCompactCreatorPreview}
        onStarEarned={() => {
          if (gamificationEnabled) {
            setStarsEarned(s => s + 1);
          }
        }}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/30">
      {/* Top bar */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex items-start justify-between gap-3 px-3 py-2 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              {orgLogoUrl && (
                <img src={orgLogoUrl} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
              )}
              <span className="text-sm font-semibold truncate">{program?.title || ''}</span>
            </div>

            <div className="mt-1 flex items-center gap-2 min-w-0 flex-wrap">
              <span className="min-w-0 flex-1 text-[11px] text-muted-foreground truncate">{current?.lessonTitle || ''}</span>

              {isCompactCreatorPreview && (
                <span className="shrink-0 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  {currentIndex + 1}/{total}
                </span>
              )}

              {!isCompactCreatorPreview && (
                <span className="shrink-0 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {currentIndex + 1}/{total}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isLearner && (
              <>


                <div className="hidden md:flex items-center gap-0.5 bg-muted rounded-lg p-0.5 mr-1">
                  {([
                    { key: 'mobile' as DeviceMode, Icon: Smartphone },
                    { key: 'tablet' as DeviceMode, Icon: Tablet },
                    { key: 'desktop' as DeviceMode, Icon: Monitor },
                  ]).map(({ key, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setDeviceMode(key)}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        deviceMode === key
                          ? 'bg-background shadow-xs text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {headerActions}

            {!isLearner && (
              <Button
                variant={showCustomizer ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setShowCustomizer(!showCustomizer)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowSidebar(!showSidebar)}>
              <List className="h-4 w-4" />
            </Button>

            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {(isLearner || isPreview) && (
          <div className="px-3 pb-2">
            <SlideSegmentBar
              count={lessonSegments.count}
              activeIndex={lessonSegments.activeIndex}
              onSelect={(i) => goToSlide(lessonSegments.startIndex + i)}
            />
          </div>
        )}

        {isCompactCreatorPreview && !isLearner && !isPreview && (
          <div className="px-3 pb-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))` }}
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — overlay on mobile, inline on desktop */}
        {showSidebar && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-20 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <div className={cn(
              'h-full max-h-full shrink-0 overflow-y-auto overscroll-contain border-r border-border bg-card',
              'fixed inset-y-0 left-0 z-30 w-[min(88vw,18rem)] max-w-full md:static md:w-60 md:max-h-none md:z-auto'
            )}>
              {/* Mobile close button */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border md:hidden">
                <span className="text-xs font-semibold">{isFr ? 'Leçons' : 'Lessons'}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSidebar(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Course progress summary */}
              {isLearner && (
                <div className="px-3 py-3 border-b border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isFr ? 'Progression' : 'Progress'}
                    </span>
                    <span className="text-[10px] font-bold text-foreground">
                      {Math.round(((currentIndex + 1) / total) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {lessonGroups.map((group: any, gi: number) => (
                <div key={group.moduleId} className="py-2">
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                      {gi + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider truncate">
                      {group.moduleTitle}
                    </span>
                  </div>
                  {group.lessons.map((lesson: any) => {
                    const isActive = current?.lessonId === lesson.id;
                    const lessonSlideIdx = allSlides.findIndex(s => s.lessonId === lesson.id && s.slideInLesson === 0);
                    const isLocked = (isLearner || isPreview) && !canGoTo(lessonSlideIdx);
                    const lastSlideOfLesson = [...allSlides].reverse().find(s => s.lessonId === lesson.id);
                    const lastSlideIdx = lastSlideOfLesson ? allSlides.indexOf(lastSlideOfLesson) : -1;
                    const isCompleted = isLearner && lastSlideIdx >= 0 && maxReachedIndex >= lastSlideIdx;

                    return (
                      <button
                        key={lesson.id}
                        disabled={isLocked}
                        onClick={() => {
                          if (lessonSlideIdx >= 0) goToSlide(lessonSlideIdx);
                          if (window.innerWidth < 768) setShowSidebar(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-xs',
                          isActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium'
                            : isLocked
                              ? 'text-muted-foreground/50 cursor-not-allowed'
                              : 'hover:bg-muted/50 text-foreground'
                        )}
                      >
                        {isCompleted && !isLocked ? (
                          <span className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <svg className="h-2.5 w-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : isLocked ? (
                          <span className="text-[9px] shrink-0">🔒</span>
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-border shrink-0" />
                        )}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        {!isLocked && lesson.duration && (
                          <span className="text-[9px] text-muted-foreground shrink-0">{lesson.duration}m</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Final assessment entry in sidebar */}
              {allQuizQuestions.length >= 3 && (() => {
                const assessIdx = allSlides.findIndex(s => s.slide.type === 'final-assessment');
                const isLocked = isLearner && !canGoTo(assessIdx);
                return (
                  <div className="py-2 border-t border-border">
                    <div className="px-3 py-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {isFr ? 'Évaluation' : 'Assessment'}
                      </span>
                    </div>
                    <button
                      disabled={isLocked}
                      onClick={() => {
                        if (assessIdx >= 0) goToSlide(assessIdx);
                        if (window.innerWidth < 768) setShowSidebar(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-xs',
                        current?.slide.type === 'final-assessment'
                          ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium'
                          : isLocked
                            ? 'text-muted-foreground/50 cursor-not-allowed'
                            : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      {isLocked ? <span className="text-[9px]">🔒</span> : <Trophy className="h-3.5 w-3.5 shrink-0" />}
                      <span className="flex-1 truncate">{isFr ? 'Évaluation finale' : 'Final Assessment'}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* Viewport */}
          <div
            className={cn(
              'relative flex-1 min-h-0 overflow-hidden',
              isLearner || isCompactCreatorPreview ? 'flex items-stretch justify-stretch p-0' : 'flex items-center justify-center p-4'
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className={cn(
                'absolute z-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors',
                isCompactCreatorPreview ? 'left-2 bottom-16 h-9 w-9' : 'left-3 bottom-20 h-10 w-10'
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentIndex < total - 1 && canGoTo(currentIndex + 1) && (
            <button
              onClick={goNext}
              className={cn(
                'absolute z-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors',
                isCompactCreatorPreview ? 'right-2 bottom-16 h-9 w-9' : 'right-3 bottom-20 h-10 w-10'
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            className={cn(
              'overflow-hidden transition-all duration-300 flex flex-col bg-card',
              isLearner || isCompactCreatorPreview ? 'w-full h-full' : cn('rounded-2xl shadow-2xl border border-border', deviceMode === 'mobile' && 'rounded-[2rem]')
            )}
            style={isLearner || isCompactCreatorPreview ? {} : {
              width: deviceStyles[deviceMode].w,
              maxWidth: deviceStyles[deviceMode].maxW,
              height: deviceStyles[deviceMode].h,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex-1 min-h-0 flex flex-col"
              >
                {renderSlideContent()}
              </motion.div>
            </AnimatePresence>

            {/* Bottom bar */}
            <div className={cn(
              'border-t border-border flex items-center justify-between shrink-0 bg-card',
              isCompactCreatorPreview ? 'gap-2 px-3 py-2' : 'gap-3 px-4 py-2.5'
            )}>
              {!isCompactCreatorPreview && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                  <span className="font-medium">{currentIndex + 1}/{total}</span>
                </div>
              )}

              <div className="flex-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))` }}
                    initial={false}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <Button
                size="sm"
                onClick={goNext}
                disabled={currentIndex >= total - 1 || !canGoTo(currentIndex + 1)}
                className={cn('gap-1.5 shrink-0', isCompactCreatorPreview ? 'h-9 px-3 text-xs' : 'text-xs')}
              >
                {currentIndex >= total - 1
                  ? (isFr ? 'Terminé' : 'Finished')
                  : (isFr ? 'Continuer' : 'Continue')}
                {currentIndex < total - 1 && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Customization Panel - Creator only, overlay on mobile */}
        {!isLearner && showCustomizer && current?.slide.type !== 'final-assessment' && current?.slide.type !== 'course-completion' && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-20 md:hidden"
              onClick={() => setShowCustomizer(false)}
            />
            <div className="fixed inset-0 z-30 h-full max-h-full overflow-hidden md:static md:z-auto md:h-auto md:max-h-none md:overflow-visible">
              <div className="relative h-full">
                <div className="absolute right-3 top-3 z-10 md:hidden">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowCustomizer(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              <SlideCustomizationPanel
                  customization={currentCustomization}
                  onChange={(c) => {
                    const next = { ...c, layout: 'text-only' as const };
                    setSlideCustomizations(prev => ({ ...prev, [currentIndex]: next }));
                    persistCustomization(currentIndex, next);
                  }}
                  onApplyToAll={applyCustomizationToAll}
                  onGenerateImage={handleGenerateSlideBackground}
                  isGenerating={isGeneratingSlideImage}
                  onBack={() => setShowCustomizer(false)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
