import { Link } from 'react-router-dom';
import { HandCoins, Share2, MousePointerClick, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { markSurfaceVisit } from '@/lib/siteviral/lastSurface';

/**
 * "Mes gains" — ambassador capability. Shown whenever the user has at least one
 * affiliate link, whatever else they do on the platform.
 */
export function EarningsBlock({
  pendingAmount,
  payableAmount,
  clicks,
  conversions,
}: {
  pendingAmount: number;
  payableAmount: number;
  clicks: number;
  conversions: number;
}) {
  const { locale } = useI18n();
  const { fmt } = useDisplayCurrency();
  const isFr = locale === 'fr';

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {isFr ? 'Mes gains' : 'My earnings'}
      </h2>
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 glass-premium p-4 sm:p-5 space-y-4">
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15">
            <HandCoins className="h-5 w-5 text-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {isFr ? 'Disponible' : 'Available'}
            </p>
            <p className="text-2xl font-black tabular-nums text-emerald-500 leading-none">
              {fmt(payableAmount)}
            </p>
          </div>
          {pendingAmount > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">{isFr ? 'En attente' : 'Pending'}</p>
              <p className="text-sm font-bold tabular-nums">{fmt(pendingAmount)}</p>
            </div>
          )}
        </div>

        <div className="relative grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border bg-card px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MousePointerClick className="h-3.5 w-3.5" /> {isFr ? 'Clics' : 'Clicks'}
            </p>
            <p className="text-base font-bold tabular-nums">{clicks}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5" /> {isFr ? 'Ventes' : 'Sales'}
            </p>
            <p className="text-base font-bold tabular-nums">{conversions}</p>
          </div>
        </div>

        <Link
          to="/gagner"
          onClick={() => markSurfaceVisit('earn')}
          className="relative flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
        >
          <Share2 className="h-4 w-4" />
          {isFr ? 'Partager un produit' : 'Share a product'}
        </Link>
      </div>
    </section>
  );
}
