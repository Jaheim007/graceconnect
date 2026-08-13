import { useState } from 'react';
import { Link } from 'react-router-dom';
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

  return (
    <div className="relative bg-primary text-primary-foreground">
      <div className="container flex items-center justify-center gap-2 px-10 py-2 text-center">
        <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          {fr ? 'Nouveau' : 'New'}
        </span>
        <Link to="/ecrire" className="text-[12px] sm:text-sm font-semibold hover:underline inline-flex items-center gap-1.5">
          {fr
            ? "Écris ton livre avec l'IA et vends-le en Mobile Money — 10 % tout compris, rien d'autre."
            : 'Write your book with AI and sell it via Mobile Money — 10% all-inclusive, nothing else.'}
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={fr ? 'Fermer' : 'Dismiss'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 hover:bg-primary-foreground/15 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
