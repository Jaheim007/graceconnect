import { cn } from '@/lib/utils';

interface LessonImageBackdropProps {
  imageUrl?: string;
  imageClassName?: string;
  overlayClassName?: string;
}

export function LessonImageBackdrop({
  imageUrl,
  imageClassName,
  overlayClassName,
}: LessonImageBackdropProps) {
  if (!imageUrl) return null;

  return (
    <>
      <img
        src={imageUrl}
        alt=""
        className={cn('absolute inset-0 z-0 h-full w-full object-cover', imageClassName)}
      />
      <div
        className={cn(
          'absolute inset-0 z-[1] bg-gradient-to-br from-black/80 via-black/60 to-black/35',
          overlayClassName,
        )}
      />
    </>
  );
}