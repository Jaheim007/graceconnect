import { SlideRenderer } from '@/components/programs/lesson-preview/SlideRenderer';
import { rowToContentSlide, type ProgramSlideRow } from '@/components/programs/lesson-preview/slideAdapters';
import type { SlideDraft } from './SlideFormEditor';
import { Smartphone } from 'lucide-react';

interface SlidePhonePreviewProps {
  slide: ProgramSlideRow | null;
  draft: SlideDraft | null;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  moduleTitle: string;
  orgLogoUrl?: string | null;
  isFr: boolean;
}

/** Live phone-shaped preview of the slide currently being edited */
export function SlidePhonePreview({
  slide, draft, slideIndex, totalSlides, lessonTitle, moduleTitle, orgLogoUrl, isFr,
}: SlidePhonePreviewProps) {
  const merged: ProgramSlideRow | null = slide
    ? {
        ...slide,
        slide_type: draft?.slide_type ?? slide.slide_type,
        title: draft ? draft.title || null : slide.title,
        body: draft ? draft.body || null : slide.body,
        media_url: draft ? draft.media_url || null : slide.media_url,
        caption: draft ? draft.caption || null : slide.caption,
        data: draft?.data ?? slide.data,
      }
    : null;

  return (
    <div className="flex h-full flex-col items-center gap-3 overflow-y-auto p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Smartphone className="h-3.5 w-3.5" />
        {isFr ? 'Aperçu apprenant' : 'Learner preview'}
      </div>

      <div className="relative mx-auto w-full max-w-[280px]">
        <div className="rounded-[2.25rem] border-[8px] border-foreground/85 bg-foreground/85 shadow-2xl">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[1.7rem] bg-background">
            {merged ? (
              <SlideRenderer
                key={`${merged.id}-${merged.slide_type}`}
                slide={rowToContentSlide(merged)}
                slideIndex={slideIndex}
                totalSlides={totalSlides}
                lessonTitle={lessonTitle}
                moduleTitle={moduleTitle}
                orgLogoUrl={orgLogoUrl}
                deviceMode="mobile"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-[11px] text-muted-foreground">
                {isFr ? 'Sélectionnez une diapositive' : 'Select a slide'}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="max-w-[280px] text-center text-[10px] leading-relaxed text-muted-foreground">
        {isFr
          ? 'Rendu identique à celui vu par l’apprenant.'
          : 'Rendered exactly as the learner sees it.'}
      </p>
    </div>
  );
}
