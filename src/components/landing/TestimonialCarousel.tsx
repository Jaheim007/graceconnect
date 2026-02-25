import { useEffect, useRef, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  flag?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
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
    const speed = 0.4;

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

  const items = [...testimonials, ...testimonials];

  return (
    <div
      ref={scrollRef}
      className="flex gap-5 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {items.map((tst, i) => {
        const showStat = statCard && i === Math.floor(testimonials.length / 2);
        return (
          <div key={`${tst.name}-${i}`} className="flex gap-5 shrink-0">
            {showStat && (
              <div className="w-[240px] shrink-0 rounded-2xl bg-primary p-8 flex flex-col items-center justify-center text-center shadow-elevated">
                <p className="text-4xl font-black text-primary-foreground">{statCard.value}</p>
                <p className="text-sm text-primary-foreground/70 mt-1 font-medium">{statCard.label}</p>
              </div>
            )}
            <div className={cn(
              'w-[300px] sm:w-[340px] shrink-0 bg-card rounded-2xl border border-border p-6 space-y-3 relative',
              'hover:border-primary/20 transition-colors shadow-card'
            )}>
              <Quote className="h-5 w-5 text-primary/15 absolute top-5 right-5" />
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>
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
