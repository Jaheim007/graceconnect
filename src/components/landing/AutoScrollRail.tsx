import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoScrollRailProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  ariaLabel?: string;
  /** Seconds for one full loop of the duplicated rail. Default 35. */
  cycleSeconds?: number;
  /** Show desktop prev/next controls. Default true. */
  showControls?: boolean;
  /** Optional container className for spacing overrides. */
  className?: string;
  /** Class applied to the scroller (adjust padding if needed). */
  scrollerClassName?: string;
  labels?: { prev?: string; next?: string };
}

/**
 * Reusable horizontal auto-scrolling rail.
 * - Duplicates items and loops seamlessly via scrollLeft wrap.
 * - Pauses on hover / focus / drag / swipe / tab-hidden.
 * - Respects prefers-reduced-motion.
 * - Supports mouse drag, touch swipe (native scroll), arrow keys, and click controls.
 */
export function AutoScrollRail<T>({
  items,
  renderItem,
  ariaLabel,
  cycleSeconds = 35,
  showControls = true,
  className = '',
  scrollerClassName = 'gap-4 px-4 sm:px-8 pb-2',
  labels,
}: AutoScrollRailProps<T>) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  const doubled = useMemo(() => [...items, ...items], [items]);

  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [tabHidden, setTabHidden] = useState(false);
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!pausedRef.current && !draggingRef.current && !tabHidden && el) {
        const half = el.scrollWidth / 2 || 1;
        const speed = half / cycleSeconds;
        el.scrollLeft += speed * dt;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, tabHidden, cycleSeconds]);

  const scrollByCards = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  }, []);

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

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCards(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCards(-1); }
  };

  return (
    <div className={className}>

      {showControls && (
        <div className="hidden sm:flex items-center justify-end gap-2 mb-4 container max-w-6xl px-4 sm:px-6">
          <Button variant="outline" size="icon" aria-label={labels?.prev ?? 'Previous'} onClick={() => scrollByCards(-1)} className="h-9 w-9 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label={labels?.next ?? 'Next'} onClick={() => scrollByCards(1)} className="h-9 w-9 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={`flex overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none ${scrollerClassName}`}
      >
        {doubled.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
}
