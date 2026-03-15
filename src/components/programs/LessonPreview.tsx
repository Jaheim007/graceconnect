import { useState, useEffect, useMemo } from 'react';
import { useProgramModules, useProgram } from '@/hooks/usePrograms';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight,
  Monitor, Tablet, Smartphone, X, List, Settings2, Star, Trophy, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseContentIntoSlides, ContentSlide, type QuizData } from './lesson-preview/parseContentSlides';
import { SlideRenderer } from './lesson-preview/SlideRenderer';
import { SlideCustomizationPanel, DEFAULT_CUSTOMIZATION, type SlideCustomization } from './lesson-preview/SlideCustomizationPanel';
import { FinalAssessmentSlide } from './lesson-preview/FinalAssessmentSlide';
import { CourseCompletionSlide } from './lesson-preview/CourseCompletionSlide';
import { getSlideTheme } from './lesson-preview/slideThemes';
import { Switch } from '@/components/ui/switch';

interface LessonPreviewProps {
  programId: string;
  initialLessonId?: string;
  onClose?: () => void;
}

type DeviceMode = 'mobile' | 'tablet' | 'desktop';

/** Extract the first <img src="…"> URL from HTML */
function extractFirstImageUrl(html: string | null): string | undefined {
  if (!html) return undefined;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || undefined;
}

/** Extract the first image found across all lessons in a module */
function extractModuleImageUrl(lessons: any[]): string | undefined {
  for (const lesson of lessons) {
    const url = extractFirstImageUrl(lesson.content);
    if (url) return url;
  }
  return undefined;
}

interface FlatSlide {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  moduleId: string;
  slide: ContentSlide;
  lessonIndex: number;
  slideInLesson: number;
  moduleImageUrl?: string;
}

export function LessonPreview({ programId, initialLessonId, onClose }: LessonPreviewProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: program } = useProgram(programId);
  const { data: modules = [] } = useProgramModules(programId);

  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(true);

  // Per-slide customizations keyed by slide index
  const [slideCustomizations, setSlideCustomizations] = useState<Record<number, SlideCustomization>>({});
  const [starsEarned, setStarsEarned] = useState(0);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  
  // Final assessment state
  const [assessmentScore, setAssessmentScore] = useState<number | undefined>();
  const [assessmentTotal, setAssessmentTotal] = useState<number | undefined>();

  const orgLogoUrl = (program as any)?.organizations?.logo_url;

  // Collect all quiz questions across lessons for final assessment
  const allQuizQuestions: QuizData[] = useMemo(() => {
    const quizzes: QuizData[] = [];
    for (const mod of modules) {
      for (const lesson of (mod as any).lessons || []) {
        const contentSlides = parseContentIntoSlides(lesson.content || '');
        for (const cs of contentSlides) {
          if (cs.type === 'quiz' && cs.quiz) {
            quizzes.push(cs.quiz);
          }
        }
      }
    }
    return quizzes;
  }, [modules]);

  // Build flat slide array
  const allSlides: FlatSlide[] = useMemo(() => {
    const slides: FlatSlide[] = [];
    let lessonIdx = 0;

    for (const mod of modules) {
      const modLessons = (mod as any).lessons || [];
      const moduleImage = extractModuleImageUrl(modLessons);

      for (const lesson of modLessons) {
        slides.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleTitle: (mod as any).title,
          moduleId: (mod as any).id,
          slide: { type: 'title-card', bodyHtml: lesson.description || '' },
          lessonIndex: lessonIdx,
          slideInLesson: 0,
          moduleImageUrl: moduleImage,
        });

        const contentSlides = parseContentIntoSlides(lesson.content || '');
        contentSlides.forEach((cs, si) => {
          slides.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            moduleTitle: (mod as any).title,
            moduleId: (mod as any).id,
            slide: cs,
            lessonIndex: lessonIdx,
            slideInLesson: si + 1,
            moduleImageUrl: moduleImage,
          });
        });

        lessonIdx++;
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
    });

    return slides;
  }, [modules, allQuizQuestions.length, isFr]);

  useEffect(() => {
    if (initialLessonId && allSlides.length > 0) {
      const idx = allSlides.findIndex(s => s.lessonId === initialLessonId && s.slideInLesson === 0);
      if (idx >= 0) setCurrentIndex(idx);
    }
  }, [initialLessonId, allSlides.length]);

  const current = allSlides[currentIndex];
  const total = allSlides.length;

  const totalQuizzes = useMemo(() => 
    allSlides.filter(s => s.slide.type === 'quiz').length, 
    [allSlides]
  );

  const goNext = () => { if (currentIndex < total - 1) setCurrentIndex(i => i + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(i => i - 1); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, total]);

  const deviceStyles: Record<DeviceMode, { w: string; maxW: string; h: string }> = {
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
    const theme = getSlideTheme(currentIndex);

    // Final assessment
    if (current.slide.type === 'final-assessment') {
      // Select up to 10 questions for the final assessment
      const assessmentQuestions = allQuizQuestions.length > 10
        ? allQuizQuestions.sort(() => 0.5 - Math.random()).slice(0, 10)
        : allQuizQuestions;

      return (
        <FinalAssessmentSlide
          questions={assessmentQuestions}
          theme={theme}
          slideIndex={currentIndex}
          totalSlides={total}
          lessonTitle={current.lessonTitle}
          orgLogoUrl={orgLogoUrl}
          deviceMode={deviceMode}
          gamificationEnabled={gamificationEnabled}
          onComplete={(score, t) => {
            setAssessmentScore(score);
            setAssessmentTotal(t);
            if (gamificationEnabled) {
              setStarsEarned(s => s + score);
            }
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
          gamificationEnabled={gamificationEnabled}
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
        onStarEarned={() => {
          if (gamificationEnabled) {
            setStarsEarned(s => s + 1);
          }
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {orgLogoUrl && (
            <img src={orgLogoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
          )}
          <span className="text-sm font-semibold truncate">{program?.title || ''}</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {currentIndex + 1} / {total}
          </span>
          {gamificationEnabled && starsEarned > 0 && (
            <motion.span 
              className="flex items-center gap-1 text-[10px] font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={starsEarned}
            >
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {starsEarned}
            </motion.span>
          )}
        </div>

        {/* Device toggle + gamification toggle */}
        <div className="flex items-center gap-3">
          {/* Gamification toggle */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {isFr ? 'Étoiles' : 'Stars'}
            </span>
            <Switch 
              checked={gamificationEnabled} 
              onCheckedChange={setGamificationEnabled}
              className="scale-75"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
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
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={showCustomizer ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowCustomizer(!showCustomizer)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(!showSidebar)}>
            <List className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-56 border-r border-border bg-card overflow-y-auto shrink-0">
            {lessonGroups.map((group: any) => (
              <div key={group.moduleId} className="py-2">
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.moduleTitle}
                  </span>
                </div>
                {group.lessons.map((lesson: any) => {
                  const isActive = current?.lessonId === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        const idx = allSlides.findIndex(s => s.lessonId === lesson.id && s.slideInLesson === 0);
                        if (idx >= 0) setCurrentIndex(idx);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-xs',
                        isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary'
                          : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <span className="flex-1 truncate">{lesson.title}</span>
                      {lesson.duration && (
                        <span className="text-[9px] text-muted-foreground shrink-0">{lesson.duration}m</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Final assessment entry in sidebar */}
            {allQuizQuestions.length >= 3 && (
              <div className="py-2 border-t border-border">
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {isFr ? 'Évaluation' : 'Assessment'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const idx = allSlides.findIndex(s => s.slide.type === 'final-assessment');
                    if (idx >= 0) setCurrentIndex(idx);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-xs',
                    current?.slide.type === 'final-assessment'
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'hover:bg-muted/50 text-foreground'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">{isFr ? 'Évaluation finale' : 'Final Assessment'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Viewport */}
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-3 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentIndex < total - 1 && (
            <button
              onClick={goNext}
              className="absolute right-3 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            className={cn(
              'rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-300 flex flex-col',
              deviceMode === 'mobile' && 'rounded-[2rem]'
            )}
            style={{
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
            <div className="border-t border-border px-4 py-2.5 flex items-center justify-between shrink-0 bg-card">
              <div className="flex-1 mr-4">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={false}
                    animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <Button
                size="sm"
                onClick={goNext}
                disabled={currentIndex >= total - 1}
                className="gap-1.5 text-xs"
              >
                {currentIndex >= total - 1
                  ? (isFr ? 'Terminé' : 'Finished')
                  : (isFr ? 'Continuer' : 'Continue')}
                {currentIndex < total - 1 && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        {showCustomizer && current?.slide.type !== 'final-assessment' && current?.slide.type !== 'course-completion' && (
          <SlideCustomizationPanel
            customization={currentCustomization}
            onChange={(c) => setSlideCustomizations(prev => ({ ...prev, [currentIndex]: c }))}
            onGenerateImage={() => {
              // TODO: wire AI image generation
            }}
          />
        )}
      </div>
    </div>
  );
}
