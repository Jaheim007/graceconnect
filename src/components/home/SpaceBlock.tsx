import { Link } from 'react-router-dom';
import { Store, ArrowRight, Plus, ShoppingCart, Heart, Wallet } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { markSurfaceVisit } from '@/lib/siteviral/lastSurface';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useCreatorSalesEarnings } from '@/hooks/useCreatorSalesEarnings';

/**
 * "Mon espace" — creator capability entry point. Never a forced redirect:
 * the space is a destination among the user's other capabilities.
 */
export function SpaceBlock({ spaceName, spaceCount }: { spaceName: string | null; spaceCount: number }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {isFr ? 'Mon espace' : 'My space'}
      </h2>
      <div className="rounded-3xl border border-amber-500/25 glass-premium p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15">
            <Store className="h-5 w-5 text-amber-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold leading-tight">
              {spaceName || (isFr ? 'Mon espace' : 'My space')}
            </p>
            <p className="text-xs text-muted-foreground">
              {spaceCount > 1
                ? isFr ? `${spaceCount} espaces` : `${spaceCount} spaces`
                : isFr ? 'Ventes, contenus et paiements' : 'Sales, content and payouts'}
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            to="/admin/settings"
            onClick={() => markSurfaceVisit('create')}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-amber-500/40"
          >
            <ArrowRight className="h-4 w-4 text-amber-500" />
            {isFr ? 'Gérer ma plateforme' : 'Manage my platform'}
          </Link>
          <Link
            to="/admin/create"
            onClick={() => markSurfaceVisit('create')}
            className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold transition hover:border-amber-500/60"
          >
            <Plus className="h-4 w-4 text-amber-500" />
            {isFr ? 'Créer du contenu' : 'Create content'}
          </Link>
        </div>
      </div>
    </section>
  );
}
