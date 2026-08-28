import { useEffect, useRef, useState } from 'react';

/**
 * Instagram-style nav behaviour: the bar shrinks/fades away while the user
 * scrolls down and springs back as soon as they scroll up (or stop).
 */
export function useNavAutoHide(threshold = 12) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;

      if (Math.abs(dy) > threshold) {
        setHidden(dy > 0 && y > 80);
        lastY.current = y;
      }

      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setHidden(false), 900);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [threshold]);

  return hidden;
}
