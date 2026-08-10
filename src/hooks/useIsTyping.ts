import { useEffect, useState } from 'react';

const TEXTUAL = /^(input|textarea)$/i;

/**
 * True while the user is typing in a text field on a small screen.
 * Used to temporarily hide floating widgets (assistant / help bubbles) so they
 * never sit on top of a form the user is filling in — critical on small,
 * low-end Android screens where the keyboard eats most of the viewport.
 */
export function useIsTyping() {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const isSmall = () => window.innerWidth < 1024;

    const check = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || !isSmall()) return setTyping(false);
      const tag = el.tagName;
      const textual =
        (TEXTUAL.test(tag) && !['checkbox', 'radio', 'button', 'submit', 'range'].includes((el as HTMLInputElement).type)) ||
        el.isContentEditable;
      setTyping(!!textual);
    };

    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    window.addEventListener('resize', check);
    return () => {
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return typing;
}
