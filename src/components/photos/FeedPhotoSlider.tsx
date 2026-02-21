import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';
import { cn } from '@/lib/utils';

interface FeedPhotoSliderProps {
  orgIds: string[];
}

export function FeedPhotoSlider({ orgIds }: FeedPhotoSliderProps) {
  const { data: photos = [] } = useQuery({
    queryKey: ['feed-photos', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const { data } = await db
        .from('org_photos')
        .select('*, organizations!org_photos_organization_id_fkey(name, logo_url)')
        .in('organization_id', orgIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: orgIds.length > 0,
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!photos.length || photos.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % photos.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [photos.length, isPaused]);

  useEffect(() => {
    if (!scrollRef.current || !photos.length) return;
    const container = scrollRef.current;
    const slideWidth = container.firstElementChild
      ? (container.firstElementChild as HTMLElement).offsetWidth + 16
      : 300;
    container.scrollTo({ left: currentSlide * slideWidth, behavior: 'smooth' });
  }, [currentSlide, photos.length]);

  if (!photos.length) return null;

  const goNext = () => setCurrentSlide((c) => (c + 1) % photos.length);
  const goPrev = () => setCurrentSlide((c) => (c - 1 + photos.length) % photos.length);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Camera className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-base">Photos de la communauté</h2>
        </div>
        {photos.length > 3 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={goPrev}
              className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {photos.map((photo: any, i: number) => (
          <div
            key={photo.id}
            className={cn(
              'shrink-0 w-72 sm:w-80 rounded-2xl overflow-hidden border border-border bg-card shadow-card cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated',
              currentSlide === i && 'ring-2 ring-primary/50 shadow-elevated'
            )}
            onClick={() => setLightboxIndex(i)}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={photo.image_url}
                alt={photo.caption || 'Photo'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>
            <div className="p-3 flex items-center gap-2.5">
              {photo.organizations?.logo_url ? (
                <img
                  src={photo.organizations.logo_url}
                  alt=""
                  className="h-6 w-6 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-6 w-6 rounded-lg gold-gradient shrink-0" />
              )}
              <p className="text-xs text-muted-foreground font-medium truncate">
                {photo.organizations?.name || 'Communauté'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Slide indicator dots */}
      {photos.length > 1 && photos.length <= 12 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {photos.map((_, i) => (
            <button
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === currentSlide ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              )}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
      )}

      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </section>
  );
}
