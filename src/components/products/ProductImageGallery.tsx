import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductImageGalleryProps {
  coverImage?: string | null;
  previewImages?: string[] | null;
  title: string;
  aspectClass?: string;
}

export function ProductImageGallery({ coverImage, previewImages, title, aspectClass = 'aspect-video' }: ProductImageGalleryProps) {
  const images = [
    ...(coverImage ? [coverImage] : []),
    ...(previewImages || []),
  ].filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className={cn('rounded-2xl overflow-hidden border border-border shadow-card bg-muted/30 flex items-center justify-center', aspectClass)}>
        <div className="text-muted-foreground/20 text-6xl font-bold">📦</div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div
        className={cn('rounded-2xl overflow-hidden border border-border shadow-card bg-muted/30 cursor-zoom-in group relative', aspectClass)}
        onClick={() => setLightboxOpen(true)}
      >
        <img src={images[0]} alt={title} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
        </div>
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
            <img src={images[0]} alt={title} className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const goTo = (i: number) => setActiveIndex((i + images.length) % images.length);

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div
        className={cn('rounded-2xl overflow-hidden border border-border shadow-card bg-muted/30 relative group cursor-zoom-in', aspectClass)}
        onClick={() => setLightboxOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={images[activeIndex]}
            alt={`${title} - ${activeIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Counter */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-[10px] font-medium">
          {activeIndex + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-0.5">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition-all',
              i === activeIndex ? 'border-primary ring-1 ring-primary/30' : 'border-border/40 opacity-60 hover:opacity-100'
            )}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
          <img src={images[activeIndex]} alt={title} className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          <div className="flex justify-center gap-2 pt-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'h-12 w-12 rounded-md overflow-hidden border-2 transition-all',
                  i === activeIndex ? 'border-white' : 'border-white/20 opacity-50 hover:opacity-80'
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
