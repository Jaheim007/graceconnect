import { useState, useEffect } from 'react';
import { useProgramModules, useProgram } from '@/hooks/usePrograms';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, BookOpen, Clock, CheckCircle2,
  Monitor, Tablet, Smartphone, X, Maximize2, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonPreviewProps {
  programId: string;
  initialLessonId?: string;
  onClose?: () => void;
}

type DeviceMode = 'mobile' | 'tablet' | 'desktop';

export function LessonPreview({ programId, initialLessonId, onClose }: LessonPreviewProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: program } = useProgram(programId);
  const { data: modules = [] } = useProgramModules(programId);

  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  // Flatten all lessons for slide navigation
  const allLessons = modules.flatMap((mod: any) =>
    (mod.lessons || []).map((lesson: any) => ({
      ...lesson,
      moduleTitle: mod.title,
      moduleId: mod.id,
    }))
  );

  // Set initial slide based on initialLessonId
  useEffect(() => {
    if (initialLessonId && allLessons.length > 0) {
      const idx = allLessons.findIndex((l: any) => l.id === initialLessonId);
      if (idx >= 0) setCurrentSlideIndex(idx);
    }
  }, [initialLessonId, allLessons.length]);

  const currentLesson = allLessons[currentSlideIndex];
  const totalSlides = allLessons.length;

  const goNext = () => {
    if (currentSlideIndex < totalSlides - 1) setCurrentSlideIndex(i => i + 1);
  };
  const goPrev = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(i => i - 1);
  };

  const deviceDimensions: Record<DeviceMode, { w: string; maxW: string }> = {
    mobile: { w: '375px', maxW: '375px' },
    tablet: { w: '768px', maxW: '768px' },
    desktop: { w: '100%', maxW: '1024px' },
  };

  if (allLessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div className="space-y-3">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Aucune leçon à prévisualiser' : 'No lessons to preview'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold truncate">{program?.title || ''}</span>
          <Badge variant="outline" className="text-[9px] shrink-0">
            {currentSlideIndex + 1} / {totalSlides}
          </Badge>
        </div>

        {/* Device toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
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

        <div className="flex items-center gap-1">
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

      {/* Main preview area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar lesson list */}
        {showSidebar && (
          <div className="w-60 border-r border-border bg-card overflow-y-auto shrink-0">
            {modules.map((mod: any) => (
              <div key={mod.id} className="py-2">
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {mod.title}
                  </span>
                </div>
                {(mod.lessons || []).map((lesson: any) => {
                  const globalIdx = allLessons.findIndex((l: any) => l.id === lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentSlideIndex(globalIdx)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                        globalIdx === currentSlideIndex
                          ? 'bg-primary/10 text-primary border-l-2 border-primary'
                          : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0">
                        {globalIdx + 1}
                      </span>
                      <span className="text-xs flex-1 truncate">{lesson.title}</span>
                      {lesson.duration_minutes && (
                        <span className="text-[9px] text-muted-foreground">{lesson.duration_minutes}m</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Slide viewport */}
        <div className="flex-1 flex items-center justify-center p-4 bg-muted/20 relative overflow-hidden">
          {/* Navigation arrows */}
          {currentSlideIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-4 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentSlideIndex < totalSlides - 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Device frame */}
          <div
            className={cn(
              'bg-background rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-300 flex flex-col',
              deviceMode === 'mobile' && 'rounded-[2rem]'
            )}
            style={{
              width: deviceDimensions[deviceMode].w,
              maxWidth: deviceDimensions[deviceMode].maxW,
              height: deviceMode === 'mobile' ? '680px' : deviceMode === 'tablet' ? '600px' : '560px',
            }}
          >
            {/* Slide header */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="h-4 w-4 text-primary-foreground/80 shrink-0" />
                <span className="text-xs font-medium text-primary-foreground truncate">
                  {currentLesson?.moduleTitle}
                </span>
              </div>
              <Badge variant="secondary" className="text-[9px] shrink-0 bg-primary-foreground/20 text-primary-foreground border-none">
                {currentSlideIndex + 1} / {totalSlides}
              </Badge>
            </div>

            {/* Slide content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto"
              >
                <div className={cn(
                  'p-6',
                  deviceMode === 'mobile' && 'p-4',
                )}>
                  {/* Lesson title */}
                  <h1 className={cn(
                    'font-bold text-foreground mb-1',
                    deviceMode === 'mobile' ? 'text-lg' : 'text-xl'
                  )}>
                    {currentLesson?.title}
                  </h1>

                  {currentLesson?.duration_minutes && (
                    <div className="flex items-center gap-1 text-muted-foreground mb-4">
                      <Clock className="h-3 w-3" />
                      <span className="text-[11px]">{currentLesson.duration_minutes} min</span>
                    </div>
                  )}

                  {/* Lesson content */}
                  {currentLesson?.content ? (
                    <div
                      className={cn(
                        'prose prose-sm max-w-none',
                        'prose-headings:text-foreground prose-p:text-foreground/90',
                        'prose-strong:text-foreground prose-blockquote:border-primary',
                        'prose-li:text-foreground/90',
                        deviceMode === 'mobile' && 'text-sm',
                      )}
                      dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {isFr ? 'Aucun contenu pour cette leçon' : 'No content for this lesson'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom navigation */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-between shrink-0 bg-card">
              {/* Progress dots */}
              <div className="flex items-center gap-1 overflow-hidden max-w-[40%]">
                {allLessons.slice(
                  Math.max(0, currentSlideIndex - 2),
                  Math.min(totalSlides, currentSlideIndex + 3)
                ).map((_: any, i: number) => {
                  const actualIdx = Math.max(0, currentSlideIndex - 2) + i;
                  return (
                    <div
                      key={actualIdx}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        actualIdx === currentSlideIndex
                          ? 'w-4 bg-primary'
                          : 'w-1.5 bg-muted-foreground/20'
                      )}
                    />
                  );
                })}
              </div>

              <Button
                size="sm"
                onClick={goNext}
                disabled={currentSlideIndex >= totalSlides - 1}
                className="gap-1.5 text-xs"
              >
                {currentSlideIndex >= totalSlides - 1
                  ? (isFr ? 'Terminé' : 'Finished')
                  : (isFr ? 'Continuer' : 'Continue')}
                {currentSlideIndex < totalSlides - 1 && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
