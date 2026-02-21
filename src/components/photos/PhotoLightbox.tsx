import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  image_url: string;
  caption?: string | null;
}

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex = 0, open, onClose }: PhotoLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (open) setCurrent(initialIndex);
  }, [open, initialIndex]);

  // Auto-slideshow
  useEffect(() => {
    if (!playing || !open) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % photos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [playing, open, photos.length]);

  // Keyboard nav
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % photos.length);
    if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + photos.length) % photos.length);
    if (e.key === 'Escape') onClose();
    if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
  }, [photos.length, onClose]);

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [open, handleKey]);

  if (!photos.length) return null;

  const photo = photos[current];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0 overflow-hidden flex flex-col items-center justify-center gap-0 [&>button]:hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-white/70 text-xs font-medium">
            {current + 1} / {photos.length}
          </span>
          <div className="flex items-center gap-1">
            {photos.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0 p-4 pt-14 pb-16">
          <img
            src={photo.image_url}
            alt={photo.caption || 'Photo'}
            className="max-w-full max-h-[80vh] object-contain rounded-lg transition-opacity duration-300"
            key={photo.id}
          />
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
              onClick={() => setCurrent((c) => (c - 1 + photos.length) % photos.length)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
              onClick={() => setCurrent((c) => (c + 1) % photos.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Caption + dots */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col items-center gap-2">
          {photo.caption && (
            <p className="text-white/90 text-sm text-center max-w-md">{photo.caption}</p>
          )}
          {photos.length > 1 && photos.length <= 20 && (
            <div className="flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  )}
                  onClick={() => setCurrent(i)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
