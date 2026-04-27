import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sv_founder_banner_dismissed_v1';

/**
 * Slim banner advertising the lifetime "Founder" offer.
 * - Auto-fetches remaining slots via the public RPC `founders_remaining`.
 * - Hides itself when no slots remain or when the user dismissed it.
 */
export function FounderBanner({ className }: { className?: string }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
    }
    let active = true;
    const fetchRemaining = async () => {
      const { data } = await supabase.rpc('founders_remaining');
      if (active && typeof data === 'number') setRemaining(data);
    };
    fetchRemaining();
    const id = setInterval(fetchRemaining, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  };

  if (dismissed || remaining === null || remaining <= 0) return null;

  return (
    <div
      role="region"
      aria-label="Founder lifetime offer"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-amber-500/30',
        'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10',
        'p-3 sm:p-4 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm sm:text-base">
              {isFr ? 'Offre Founder à vie' : 'Lifetime Founder offer'}
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5">
              {remaining}/50 {isFr ? 'restants' : 'left'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-1">
            {isFr
              ? 'Pro à vie pour 49 000 XOF — un seul paiement, plus jamais d’abonnement.'
              : 'Lifetime Pro for 49,000 XOF — one-time payment, never billed again.'}
            {' · '}
            <Link to="/founders" className="underline hover:text-foreground">
              {isFr ? 'Voir le mur' : 'See the wall'}
            </Link>
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30"
        >
          <Link to="/pricing?plan=pro_lifetime#founder">
            {isFr ? 'Réserver' : 'Claim'}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
        <button
          onClick={dismiss}
          aria-label={isFr ? 'Fermer' : 'Dismiss'}
          className="shrink-0 h-8 w-8 -mr-1 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
