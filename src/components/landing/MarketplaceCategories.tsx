import { Link } from '@/lib/router-compat';
import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { EXPLORE_CATEGORIES } from '@/lib/exploreCategories';
import { AutoScrollRail } from './AutoScrollRail';

export function MarketplaceCategories() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  return (
    <section id="categories" className="py-16 sm:py-20">
      <div className="container max-w-6xl px-4 sm:px-6 mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          {fr ? 'Explorez par catégorie' : 'Explore by category'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
          {fr
            ? 'Huit catégories actives, chacune avec ses propres pros et listings.'
            : 'Eight active categories, each with its own pros and listings.'}
        </p>
      </div>

      <AutoScrollRail
        items={EXPLORE_CATEGORIES}
        cycleSeconds={30}
        ariaLabel={fr ? 'Catégories de la marketplace' : 'Marketplace categories'}
        labels={{ prev: fr ? 'Précédent' : 'Previous', next: fr ? 'Suivant' : 'Next' }}
        renderItem={(c, i) => (
          <Link
            key={`${c.slug}-${i}`}
            to={c.route}
            onDragStart={(e) => e.preventDefault()}
            className="group relative shrink-0 w-[75vw] xs:w-[64vw] sm:w-[300px] lg:w-[280px] rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25 hover:shadow-xl hover:shadow-foreground/5 active:scale-[0.98]"
          >
            <div className={`h-11 w-11 rounded-xl grid place-items-center transition-transform duration-300 group-hover:scale-110 ${c.tint}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold leading-tight">{fr ? c.fr : c.en}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                {fr ? c.descFr : c.descEn}
              </p>
            </div>
          </Link>
        )}
      />
    </section>
  );
}
