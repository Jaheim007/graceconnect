import { useState } from 'react';
import { Link } from '@/lib/router-compat';
import { ArrowRight, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const KEY = 'sv_announce_dismissed_v1';

/**
 * Single-line announcement strip at the very top of the public landing.
 * One message, one link, dismissible.
 */
export function AnnouncementStrip() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  if (hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch { /* ignore */ }
    setHidden(true);
  };

  const long = fr
    ? "Écris ton livre avec l'IA et vends-le en Mobile Money — 10 % tout compris."
    : 'Write your book with AI and sell it via Mobile Money — 10% all-inclusive.';
  const short = fr
    ? "Écris ton livre avec l'IA · 10 % tout compris"
    : 'Write your book with AI · 10% all-inclusive';

  return (
    <div className="relative bg-primary text-primary-foreground">
      <div className="container flex h-10 items-center justify-center gap-2 pl-4 pr-10 sm:px-12">
        <span className="hidden sm:inline-flex shrink-0 items-center rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none">
          {fr ? 'Nouveau' : 'New'}
        </span>
        <Link
          to="/ecrire"
          className="flex min-w-0 items-center gap-1.5 text-[12.5px] sm:text-sm font-semibold hover:underline"
        >
          <span className="truncate sm:hidden">{short}</span>
          <span className="hidden sm:inline">{long}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={fr ? 'Fermer' : 'Dismiss'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 hover:bg-primary-foreground/15 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
