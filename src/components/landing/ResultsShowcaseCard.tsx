import { Quote, Star, TrendingUp } from 'lucide-react';

import type { ResultSlide } from '@/components/landing/resultsShowcaseData';

interface ResultsShowcaseCardProps {
  slide: ResultSlide;
  priority?: boolean;
}

export function ResultsShowcaseCard({ slide }: ResultsShowcaseCardProps) {
  return (
    <article className="relative min-w-[80vw] max-w-[80vw] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl sm:min-w-[360px] sm:max-w-[360px] lg:min-w-[400px] lg:max-w-[400px]">
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: org name + rating */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black leading-tight text-foreground sm:text-lg">
            {slide.orgName}
          </h3>
          <div className="flex items-center gap-1 shrink-0 rounded-lg bg-primary/10 px-2.5 py-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-black text-primary">{slide.rating}</span>
          </div>
        </div>

        {/* Highlight stat */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 border border-border/40">
          <TrendingUp className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-lg font-black text-foreground sm:text-xl tracking-tight">{slide.highlight}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{slide.context}</p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative">
          <Quote className="absolute -left-1 -top-1 h-4 w-4 text-primary/20" />
          <p className="pl-5 text-sm leading-relaxed text-muted-foreground italic line-clamp-3">
            {slide.testimonial}
          </p>
        </div>

        {/* Author */}
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
          — {slide.personName}
        </p>
      </div>
    </article>
  );
}
