/**
 * Story-style segmented progress bar.
 *
 * One segment per slide of the CURRENT lesson: filled for slides already seen,
 * highlighted for the active slide, dim for the rest. Mirrors the Instagram /
 * WhatsApp story pattern used by the full-screen slide player.
 */
import { cn } from '@/lib/utils';

interface SlideSegmentBarProps {
  /** Number of slides in the current lesson */
  count: number;
  /** Zero-based index of the active slide inside the lesson */
  activeIndex: number;
  onSelect?: (indexInLesson: number) => void;
  className?: string;
}

export function SlideSegmentBar({ count, activeIndex, onSelect, className }: SlideSegmentBarProps) {
  if (count <= 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)} role="progressbar" aria-valuemin={1} aria-valuemax={count} aria-valuenow={activeIndex + 1}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          tabIndex={onSelect ? 0 : -1}
          aria-label={`${i + 1}/${count}`}
          onClick={onSelect ? () => onSelect(i) : undefined}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            onSelect ? 'cursor-pointer' : 'cursor-default',
            i < activeIndex && 'bg-primary/60',
            i === activeIndex && 'bg-primary',
            i > activeIndex && 'bg-muted',
          )}
        />
      ))}
    </div>
  );
}
