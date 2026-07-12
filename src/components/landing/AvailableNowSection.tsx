import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';

interface Row {
  id: string;
  title: string | null;
  slug: string | null;
  cover_url: string | null;
  price: number | null;
  currency: string | null;
  org_id: string | null;
  organizations?: { name: string | null; slug: string | null } | null;
}

/**
 * Real live digital products, from the current database. No fabricated cards.
 */
export function AvailableNowSection() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const { data, isLoading } = useQuery({
    queryKey: ['landing-available-now'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db
        .from('digital_products')
        .select('id,title,slug,cover_url,price,currency,org_id,organizations(name,slug)')
        .eq('is_published', true)
        .not('cover_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data as unknown as Row[]) || [];
    },
    staleTime: 5 * 60_000,
  });

  const items = data || [];

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-2">
            {fr ? 'Disponible maintenant' : 'Available now'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Explorez ce qui est disponible maintenant' : 'Explore what’s available now'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            {fr
              ? 'Ebooks, guides, templates et cours publiés par de vrais créateurs de la plateforme.'
              : 'Ebooks, guides, templates and courses published by real creators on the platform.'}
          </p>
        </div>
        <Link
          to="/discover?type=digital"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-foreground/80 hover:text-foreground"
        >
          {fr ? 'Voir tout' : 'See all'}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden">
              <div className="aspect-[4/5] bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <ShoppingBag className="h-6 w-6 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {fr ? 'Les premiers produits digitaux arrivent bientôt.' : 'The first digital products are coming soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map(p => {
            const orgSlug = p.organizations?.slug;
            const to = orgSlug && p.slug ? `/${orgSlug}/p/${p.slug}` : `/discover?type=digital`;
            return (
              <Link
                key={p.id}
                to={to}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-[4/5] bg-muted overflow-hidden">
                  {p.cover_url && (
                    <img
                      src={p.cover_url}
                      alt={p.title || ''}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[13px] font-bold leading-tight line-clamp-2">{p.title}</div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground truncate">
                      {p.organizations?.name}
                    </span>
                    {typeof p.price === 'number' && p.price > 0 && (
                      <span className="text-xs font-bold text-foreground shrink-0">
                        {formatCurrency(p.price, p.currency || 'USD')}
                      </span>
                    )}
                    {p.price === 0 && (
                      <span className="text-xs font-bold text-emerald-600">{fr ? 'Gratuit' : 'Free'}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
