import { cn } from '@/lib/utils';

interface LessonImageBackdropProps {
  imageUrl?: string;
  imageClassName?: string;
  overlayClassName?: string;
  /** Where the text block sits — the scrim is darkened only on that side. */
  focus?: 'bottom' | 'top' | 'center';
}

/**
 * Photo backdrop for a slide.
 *
 * Rule: the AI illustration stays CRISP (no blur, never degraded) but it must
 * read as a calm background, not as the subject of the slide. So it gets a
 * light, even tint plus a directional scrim behind the text block only.
 */
export function LessonImageBackdrop({
  imageUrl,
  imageClassName,
  overlayClassName,
  focus = 'bottom',
}: LessonImageBackdropProps) {
  if (!imageUrl) return null;

  const scrim =
    focus === 'top'
      ? 'bg-gradient-to-b from-black/55 via-black/12 to-transparent'
      : focus === 'center'
        ? 'bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.14)_55%,rgba(0,0,0,0.02)_100%)]'
        : 'bg-gradient-to-t from-black/58 via-black/14 to-transparent';

  return (
    <>
      {/* The illustration is also painted as a CSS background on this layer, so
          it shows even if the <img> element itself is not repainted (some
          engines skip repainting a lazily decoded image inside an animated
          overlay — this was making buyer-preview slides look empty). */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${imageUrl}")` }}
        aria-hidden
      />
      <img
        key={imageUrl}
        src={imageUrl}
        alt=""
        loading="eager"
        decoding="sync"
        // @ts-expect-error - fetchpriority is valid HTML, typed in newer React
        fetchpriority="high"
        className={cn('absolute inset-0 z-0 h-full w-full object-cover', imageClassName)}
      />

      {/* Very light tint: the photo must stay clearly visible */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-black/10" />
      {/* Directional scrim: only behind the text, image stays visible elsewhere */}
      <div className={cn('absolute inset-0 z-[1] pointer-events-none', scrim, overlayClassName)} />
      {/* Soft vignette for depth (no blur, no quality loss) */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.3)_100%)]" />
    </>
  );

}

