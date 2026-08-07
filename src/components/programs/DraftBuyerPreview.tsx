/**
 * "Preview as buyer" for an AI course draft.
 *
 * The draft has no `programs` row yet, so the real learner player cannot be
 * used. This overlay renders the draft's Lesson → Slide tree with the SAME
 * free-preview boundary as published courses (Phase 5: lesson 1's first slides
 * are free, everything after is locked), so the creator sees exactly what a
 * visitor sees before paying.
 */
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { SlideRenderer } from './lesson-preview/SlideRenderer';
import { SlideSegmentBar } from './lesson-preview/SlideSegmentBar';
import { rowToContentSlide, type ProgramSlideRow } from './lesson-preview/slideAdapters';
import { PREVIEW_SLIDES_IN_FIRST_LESSON } from '@/lib/coursePreview';
import type { CourseDraft } from '@/hooks/useCourseDraft';
import { formatPrice } from '@/lib/currency';

interface DraftBuyerPreviewProps {
  draft: CourseDraft;
  price?: number;
  currency?: string;
  isFree?: boolean;
  /** Start in full (creator) mode where nothing is locked. */
  initialUnlocked?: boolean;
  onClose: () => void;
}

interface FlatDraftSlide {
  lessonIndex: number;
  lessonTitle: string;
  slideInLesson: number;
  slide: ReturnType<typeof rowToContentSlide>;
  previewable: boolean;
}

export function DraftBuyerPreview({ draft, price = 0, currency = 'XOF', isFree, initialUnlocked, onClose }: DraftBuyerPreviewProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [index, setIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(!!initialUnlocked);


  const slides = useMemo<FlatDraftSlide[]>(() => {
    const flat: FlatDraftSlide[] = [];
    (draft.lessons || []).forEach((lesson, lessonIndex) => {
      (lesson.slides || []).forEach((s, slideInLesson) => {
        const row: ProgramSlideRow = {
          id: `${lessonIndex}-${slideInLesson}`,
          lesson_id: `draft-${lessonIndex}`,
          display_order: slideInLesson,
          slide_type: (s.slide_type as any) || 'text',
          title: s.title ?? null,
          body: s.body ?? null,
          media_url: s.media_url ?? null,
          caption: s.caption ?? null,
          data: s.data || {},
          duration_seconds: s.duration_seconds ?? null,
        };
        flat.push({
          lessonIndex,
          lessonTitle: lesson.title,
          slideInLesson,
          slide: rowToContentSlide(row),
          // Same rule as published courses, minus creator-set free lessons
          // (a draft has no per-lesson free-preview flag yet).
          previewable: lessonIndex === 0 && slideInLesson <= PREVIEW_SLIDES_IN_FIRST_LESSON
            && (s.slide_type as string) !== 'quiz',
        });
      });
    });
    return flat;
  }, [draft]);

  const current = slides[index];
  const lessonSegments = useMemo(() => {
    if (!current) return { count: 0, activeIndex: 0, startIndex: 0 };
    const idx: number[] = [];
    slides.forEach((s, i) => { if (s.lessonIndex === current.lessonIndex) idx.push(i); });
    return { count: idx.length, activeIndex: Math.max(0, idx.indexOf(index)), startIndex: idx[0] ?? 0 };
  }, [slides, current?.lessonIndex, index]);

  const priceLabel = isFree || !(price > 0)
    ? (isFr ? 'Gratuit' : 'Free')
    : formatPrice(price, false, currency);

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{draft.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {isFr ? 'Vue acheteur' : 'Buyer view'} · {current?.lessonTitle || ''} · {priceLabel}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label={isFr ? 'Fermer' : 'Close'}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-3 pb-2">
          <SlideSegmentBar
            count={lessonSegments.count}
            activeIndex={lessonSegments.activeIndex}
            onSelect={(i) => setIndex(lessonSegments.startIndex + i)}
          />
        </div>
      </div>

      {/* Slide stage — only the current slide is mounted, so media loads on arrival */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="h-full flex flex-col"
          >
            {!current ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                {isFr ? 'Aucune diapositive à prévisualiser.' : 'No slides to preview.'}
              </div>
            ) : current.previewable ? (
              <SlideRenderer
                slide={current.slide}
                slideIndex={index}
                totalSlides={slides.length}
                lessonTitle={current.lessonTitle}
                moduleTitle={draft.title}
                deviceMode="desktop"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-sm text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-base font-semibold">
                    {isFr ? 'Contenu réservé aux acheteurs' : 'Buyers-only content'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isFr
                      ? `À partir d’ici, un visiteur voit l’écran d’achat (${priceLabel}). Les ${PREVIEW_SLIDES_IN_FIRST_LESSON + 1} premières diapositives de la leçon 1 restent gratuites.`
                      : `From here a visitor sees the purchase screen (${priceLabel}). The first ${PREVIEW_SLIDES_IN_FIRST_LESSON + 1} slides of lesson 1 stay free.`}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="border-t border-border bg-card shrink-0 flex items-center justify-between gap-3 px-3 py-2.5">
        <Button variant="outline" size="sm" className="gap-1" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          <ChevronLeft className="h-3.5 w-3.5" /> {isFr ? 'Précédent' : 'Back'}
        </Button>
        <span className="text-[11px] text-muted-foreground">{slides.length ? index + 1 : 0}/{slides.length}</span>
        <Button size="sm" className="gap-1" disabled={index >= slides.length - 1} onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}>
          {isFr ? 'Suivant' : 'Next'} <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>,
    document.body,
  );
}
