import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { useI18n } from '@/i18n/I18nContext';
import { LAUNCH_WINDOW_DAYS } from '@/lib/firstSale';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

/**
 * First-sale guarantee: every newly published product gets a guaranteed
 * placement window on Discover, whether or not it has sales yet.
 */
export function JustLaunchedSection() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: products = [] } = useQuery({
    queryKey: ['discover-just-launched'],
    queryFn: async () => {
      const since = new Date(Date.now() - LAUNCH_WINDOW_DAYS * 86_400_000).toISOString();
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(8);
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
        org_kyc_status: p.organizations?.kyc_status,
        org_category: p.organizations?.category,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (products.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold">{isFr ? 'Tout juste lancé' : 'Just launched'}</h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        {isFr
          ? `Chaque nouveauté est mise en avant ici pendant ${LAUNCH_WINDOW_DAYS} jours.`
          : `Every new release is featured here for ${LAUNCH_WINDOW_DAYS} days.`}
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p: any, i: number) => (
          <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <ProductCard product={p} hideCommission hideShare />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
