import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { EXPLORE_CATEGORIES } from '@/lib/exploreCategories';
import { Button } from '@/components/ui/button';

/**
 * Animated horizontal category slider.
 * - Auto-scrolls smoothly on desktop when not reduced-motion.
 * - Pauses on hover, focus, or user interaction (drag / swipe / arrows).
 * - Supports touch swipe (native scroll) + mouse drag + keyboard arrows.
 * - Loops via duplicated rail with a jump-back when reaching the mirror.
 */
export function MarketplaceCategories() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  const items = useMemo(() => [...EXPLORE_CATEGORIES, ...EXPLORE_CATEGORIES], []);
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Pause when tab hidden
  const [tabHidden, setTabHidden] = useState(false);
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Auto-scroll loop — target ~35s for one full cycle of the duplicated rail.
  useEffect(() => {
    if (reduceMotion) return;
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp long frames (tab switch)
      last = now;
      if (!paused && !draggingRef.current && !tabHidden && el) {
        const half = el.scrollWidth / 2 || 1;
        const speed = half / 35; // one full cycle over ~35s regardless of card count
        el.scrollLeft += speed * dt;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduceMotion, tabHidden]);

  const scrollByCards = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-cat-card]');
    const step = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  }, []);

  // Mouse drag
  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = dragStartScrollRef.current - (e.clientX - dragStartXRef.current);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { scrollerRef.current?.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  return (
    <section
      id="categories"
      className="py-16 sm:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container max-w-6xl px-4 sm:px-6 flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Explorez par catégorie' : 'Explore by category'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            {fr
              ? 'Huit catégories actives, chacune avec ses propres pros et listings.'
              : 'Eight active categories, each with its own pros and listings.'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label={fr ? 'Précédent' : 'Previous'} onClick={() => scrollByCards(-1)} className="h-9 w-9 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label={fr ? 'Suivant' : 'Next'} onClick={() => scrollByCards(1)} className="h-9 w-9 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="group/rail flex gap-4 overflow-x-auto scroll-smooth px-4 sm:px-8 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
        role="region"
        aria-label={fr ? 'Catégories de la marketplace' : 'Marketplace categories'}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCards(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCards(-1); }
        }}
      >
        {items.map((c, i) => (
          <Link
            key={`${c.slug}-${i}`}
            to={c.route}
            data-cat-card
            onDragStart={(e) => e.preventDefault()}
            className="group relative shrink-0 w-[75vw] xs:w-[64vw] sm:w-[300px] lg:w-[280px] rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25 hover:shadow-xl hover:shadow-foreground/5 active:scale-[0.98]"
          >
            <div className={`h-11 w-11 rounded-xl grid place-items-center transition-transform duration-300 group-hover:scale-110 ${c.tint}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold leading-tight">{fr ? c.fr : c.en}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                {fr ? c.descFr : c.descEn}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
