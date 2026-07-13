import { useCallback, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoScrollRailProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  ariaLabel?: string;
  /** Seconds for one full seamless loop. Default 30. */
  cycleSeconds?: number;
  /** Show desktop prev/next controls. Default true. */
  showControls?: boolean;
  className?: string;
  scrollerClassName?: string;
  labels?: { prev?: string; next?: string };
}

/**
 * Reusable horizontal auto-scrolling rail (seamless marquee).
 * - Duplicates items and loops seamlessly via translate3d.
 * - Pauses on hover / keyboard focus / drag / swipe / tab-hidden.
 * - Respects prefers-reduced-motion.
 * - Cloned items are hidden from assistive tech and removed from tab order.
 */
export function AutoScrollRail<T>({
  items,
  renderItem,
  ariaLabel,
  cycleSeconds = 30,
  showControls = true,
  className = '',
  scrollerClassName = 'gap-4 px-4 sm:px-8 pb-2',
  labels,
}: AutoScrollRailProps<T>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(1);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragMovedRef = useRef(false);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  const [tabHidden, setTabHidden] = useState(false);
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const group = groupRef.current;
    if (!track || !group) return;

    const applyTransform = () => {
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    };

    const measure = () => {
      loopWidthRef.current = Math.max(group.scrollWidth, group.getBoundingClientRect().width, 1);
      offsetRef.current = offsetRef.current % loopWidthRef.current;
      applyTransform();
    };

    measure();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null;
    resizeObserver?.observe(group);

    if (reduceMotion) {
      applyTransform();
      return () => resizeObserver?.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const paused = hoverRef.current || focusRef.current || draggingRef.current || tabHidden;
      if (!paused) {
        const loopWidth = loopWidthRef.current || 1;
        const speed = loopWidth / cycleSeconds;
        offsetRef.current = (offsetRef.current + speed * dt) % loopWidth;
        applyTransform();
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
    };
  }, [items.length, reduceMotion, tabHidden, cycleSeconds]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cloneGroup = track.querySelector('[data-rail-clones="true"]');
    cloneGroup
      ?.querySelectorAll<HTMLElement>('a, button, input, textarea, select, [tabindex]')
      .forEach((node) => node.setAttribute('tabindex', '-1'));
  }, [items.length]);

  const scrollByCards = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    const card = groupRef.current?.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 280;
    const loopWidth = loopWidthRef.current || 1;
    offsetRef.current = (offsetRef.current + dir * step * 2 + loopWidth) % loopWidth;
    if (track) track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    draggingRef.current = true;
    dragMovedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    viewport.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 4) dragMovedRef.current = true;
    const loopWidth = loopWidthRef.current || 1;
    offsetRef.current = (dragStartOffsetRef.current - dx + loopWidth) % loopWidth;
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { viewportRef.current?.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };
  // Prevent click after a drag
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      dragMovedRef.current = false;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCards(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCards(-1); }
  };

  return (
    <div
      className={className}
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
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
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onFocusCapture={() => { focusRef.current = true; }}
        onBlurCapture={() => { focusRef.current = false; }}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div ref={trackRef} className="flex w-max will-change-transform">
          <div ref={groupRef} className={`flex shrink-0 ${scrollerClassName}`}>
            {items.map((item, i) => renderItem(item, i))}
          </div>
          <div aria-hidden="true" data-rail-clones="true" className={`flex shrink-0 ${scrollerClassName}`}>
            {items.map((item, i) => renderItem(item, i + items.length))}
          </div>
        </div>
      </div>
    </div>
  );
}
