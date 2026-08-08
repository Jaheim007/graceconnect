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

  // Inline gradients on purpose: Tailwind `from-*/via-*` utilities rely on CSS
  // variables that are INHERITED from the slide container's own theme gradient,
  // which turned this scrim into a fully opaque panel and hid the illustration.
  const scrim =
    focus === 'top'
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0) 100%)'
      : focus === 'center'
        ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.14) 55%, rgba(0,0,0,0.02) 100%)'
        : 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.14) 45%, rgba(0,0,0,0) 100%)';

  return (
    <>
      <img
        key={imageUrl}
        src={imageUrl}
        alt=""
        loading="eager"
        decoding="async"
        className={cn('absolute inset-0 z-0 h-full w-full object-cover', imageClassName)}
      />
      {/* Very light tint: the photo must stay clearly visible */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-black/10" />
      {/* Directional scrim: only behind the text, image stays visible elsewhere */}
      <div
        className={cn('absolute inset-0 z-[1] pointer-events-none', overlayClassName)}
        style={{ backgroundImage: scrim }}
      />
      {/* Soft vignette for depth (no blur, no quality loss) */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.3) 100%)' }}
      />

    </>
  );

}

