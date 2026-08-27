import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from '@/lib/router-compat';
import { Loader2, SearchX, Play, GraduationCap } from 'lucide-react';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/products/ProductCard';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

function escapeLike(q: string) {
  return q.replace(/[%,()]/g, ' ').trim();
}

interface Props {
  query: string;
}

/**
 * Real search surface for the Explorer page: searches published digital
 * products, media and programs by title/description.
 */
export function ExploreSearchResults({ query }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const term = escapeLike(query);

  const { data, isLoading } = useQuery({
    queryKey: ['explore-search', term],
    enabled: term.length > 0,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const like = `%${term}%`;
      const [productsRes, mediaRes, programsRes] = await Promise.all([
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency, is_verified)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .or(`title.ilike.${like},description.ilike.${like}`)
          .order('sales_count', { ascending: false })
          .limit(24),
        db.from('media_content')
          .select('id, title, description, thumbnail_url, organizations(name, slug)')
          .eq('is_published', true)
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(8),
        db.from('programs')
          .select('id, title, description, cover_image_url, organizations(name, slug)')
          .eq('is_published', true)
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(8),
      ]);

      const products = (productsRes.data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
      }));

      return {
        products,
        media: mediaRes.data || [],
        programs: programsRes.data || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const total = (data?.products.length || 0) + (data?.media.length || 0) + (data?.programs.length || 0);

  if (!data || total === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-muted grid place-items-center">
          <SearchX className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-heading text-lg font-bold">
          {isFr ? 'Aucun résultat' : 'No results'}
        </p>
        <p className="text-sm text-muted-foreground">
          {isFr
            ? `Rien trouvé pour « ${query} ». Essayez un autre mot-clé.`
            : `Nothing found for "${query}". Try another keyword.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {isFr
          ? `${total} résultat${total > 1 ? 's' : ''} pour « ${query} »`
          : `${total} result${total > 1 ? 's' : ''} for "${query}"`}
      </p>

      {data.products.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.products.map((p: any, i: number) => (
            <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <ProductCard product={p} hideCommission hideShare />
            </motion.div>
          ))}
        </div>
      )}

      {data.media.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Médias' : 'Media'}
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {data.media.map((m: any) => (
              <Link
                key={m.id}
                to={`/watch/${m.id}`}
                className="group rounded-xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Play className="h-3.5 w-3.5 text-primary" />
                  {m.organizations?.name}
                </div>
                <div className="font-bold text-sm line-clamp-2">{m.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.programs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Formations' : 'Courses'}
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {data.programs.map((p: any) => (
              <Link
                key={p.id}
                to={`/program/${p.id}`}
                className="group rounded-xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  {p.organizations?.name}
                </div>
                <div className="font-bold text-sm line-clamp-2">{p.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
