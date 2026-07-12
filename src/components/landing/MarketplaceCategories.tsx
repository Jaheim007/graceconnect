import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { EXPLORE_CATEGORIES } from '@/lib/exploreCategories';

/**
 * Eight active marketplace categories. Each card routes to its focused
 * discovery destination — never all to the same unfiltered Explore page.
 */
export function MarketplaceCategories() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  return (
    <section id="categories" className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Explorez par catégorie' : 'Explore by category'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            {fr
              ? 'Huit catégories actives, chacune avec ses propres pros et listings.'
              : 'Eight active categories, each with its own pros and listings.'}
          </p>
        </div>
        <Link
          to="/discover"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-foreground/80 hover:text-foreground"
        >
          {fr ? 'Tout explorer' : 'Explore all'}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {EXPLORE_CATEGORIES.map(c => (
          <Link
            key={c.slug}
            to={c.route}
            className="group relative rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 hover:shadow-lg transition-all"
          >
            <div className={`h-11 w-11 rounded-xl grid place-items-center ${c.tint}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold leading-tight">{fr ? c.fr : c.en}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                {fr ? c.descFr : c.descEn}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
