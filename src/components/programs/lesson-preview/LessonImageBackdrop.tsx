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
 * Rule: the AI illustration must stay CRISP and full quality — no blur, no flat
 * black wash on top of it. Readability comes from a directional scrim behind the
 * text block only, plus a soft vignette on the edges.
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
      ? 'bg-gradient-to-b from-black/75 via-black/30 to-transparent'
      : focus === 'center'
        ? 'bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.08)_100%)]'
        : 'bg-gradient-to-t from-black/78 via-black/34 to-transparent';

  return (
    <>
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn('absolute inset-0 z-0 h-full w-full object-cover', imageClassName)}
      />
      {/* Directional scrim: only behind the text, image stays visible elsewhere */}
      <div className={cn('absolute inset-0 z-[1] pointer-events-none', scrim, overlayClassName)} />
      {/* Soft vignette for depth (no blur, no quality loss) */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />
    </>
  );
}
