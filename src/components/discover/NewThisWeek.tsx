import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/products/ProductCard';
import { Layers } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export function NewThisWeek() {
  const { locale } = useI18n();

  const { data: others = [] } = useQuery({
    queryKey: ['discover-others'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('created_at', { ascending: false })
        .range(8, 24);
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (others.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold">
          {locale === 'fr' ? '📦 Autres produits' : '📦 More Products'}
        </h2>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((p: any, i: number) => (
          <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <ProductCard product={p} hideCommission hideShare />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
