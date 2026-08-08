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
      ? 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
      : focus === 'center'
        ? 'bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.26)_55%,rgba(0,0,0,0.08)_100%)]'
        : 'bg-gradient-to-t from-black/72 via-black/32 to-transparent';

  return (
    <>
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn('absolute inset-0 z-0 h-full w-full object-cover', imageClassName)}
      />
      {/* Even, light tint: keeps the photo clean and quiet behind the content */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-black/25" />
      {/* Directional scrim: only behind the text, image stays visible elsewhere */}
      <div className={cn('absolute inset-0 z-[1] pointer-events-none', scrim, overlayClassName)} />
      {/* Soft vignette for depth (no blur, no quality loss) */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />
    </>
  );
}

