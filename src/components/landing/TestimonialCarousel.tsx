import { useEffect, useRef, useState } from 'react';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  flag?: string;
  country?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  /** If true, shows a stat card in the middle */
  statCard?: { value: string; label: string };
}

export function TestimonialCarousel({ testimonials, statCard }: TestimonialCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animFrame: number;
    let scrollPos = 0;
    const speed = 0.5;

    const scroll = () => {
      if (!isPaused && el) {
        scrollPos += speed;
        if (scrollPos >= el.scrollWidth / 2) scrollPos = 0;
        el.scrollLeft = scrollPos;
      }
      animFrame = requestAnimationFrame(scroll);
    };
    animFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animFrame);
  }, [isPaused]);

  // Duplicate for infinite scroll
  const items = [...testimonials, ...testimonials];

  return (
    <div
      ref={scrollRef}
      className="flex gap-5 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {items.map((tst, i) => {
        // Insert stat card in the middle of first set
        const showStat = statCard && i === Math.floor(testimonials.length / 2);
        return (
          <div key={`${tst.name}-${i}`} className="flex gap-5 shrink-0">
            {showStat && (
              <div className="w-[260px] shrink-0 rounded-2xl bg-primary p-8 flex flex-col items-center justify-center text-center">
                <p className="text-4xl font-black text-primary-foreground">{statCard.value}</p>
                <p className="text-sm text-primary-foreground/70 mt-1 font-medium">{statCard.label}</p>
              </div>
            )}
            <div className={cn(
              'w-[320px] shrink-0 bg-card rounded-2xl border border-border p-6 space-y-3 relative',
              'hover:border-primary/20 transition-colors'
            )}>
              <Quote className="h-6 w-6 text-primary/10 absolute top-5 right-5" />
              <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-4">"{tst.text}"</p>
              <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                {tst.flag && <span className="text-lg">{tst.flag}</span>}
                <div>
                  <p className="font-semibold text-sm">{tst.name}</p>
                  <p className="text-xs text-muted-foreground">{tst.role}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
