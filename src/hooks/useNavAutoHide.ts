import { useEffect, useRef, useState } from 'react';

/**
 * Instagram-style nav behaviour: the bar shrinks ("zooms out") while the user
 * is actively scrolling and springs back to full size as soon as they stop.
 * It never disappears — navigation stays reachable at all times.
 */
export function useNavAutoHide(threshold = 6) {
  const [scrolling, setScrolling] = useState(false);
  const lastY = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY.current) > threshold) {
        setScrolling(true);
        lastY.current = y;
      }

      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setScrolling(false), 450);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [threshold]);

  return scrolling;
}
