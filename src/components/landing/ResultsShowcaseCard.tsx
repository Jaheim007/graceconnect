import { Quote, Star, TrendingUp } from 'lucide-react';

import type { ResultSlide } from '@/components/landing/resultsShowcaseData';

interface ResultsShowcaseCardProps {
  slide: ResultSlide;
  priority?: boolean;
}

export function ResultsShowcaseCard({ slide, priority = false }: ResultsShowcaseCardProps) {
  return (
    <article className="relative min-w-[84vw] max-w-[84vw] overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-2xl sm:min-w-[420px] sm:max-w-[420px] lg:min-w-[460px] lg:max-w-[460px]">
      <div className="relative h-[260px] overflow-hidden sm:h-[300px]">
        <img
          src={slide.image}
          alt={`Capture de résultats de ${slide.orgName}`}
          className="h-full w-full object-cover object-top"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-primary-foreground">
          <Star className="h-3 w-3 fill-current" />
          <span className="text-xs font-black">{slide.rating}</span>
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-black text-foreground backdrop-blur-md">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span>{slide.highlight}</span>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black leading-tight text-foreground sm:text-lg">
            {slide.orgName}
          </h3>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground sm:text-[11px]">
            {slide.context}
          </span>
        </div>

        <div className="relative">
          <Quote className="absolute -left-1 -top-1 h-4 w-4 text-primary/25" />
          <p className="pl-4 text-sm leading-relaxed text-muted-foreground italic">
            {slide.testimonial}
          </p>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary sm:text-sm">
          — {slide.personName}
        </p>
      </div>
    </article>
  );
}