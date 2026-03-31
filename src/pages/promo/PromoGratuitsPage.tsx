import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { PromoLayout } from './PromoLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Loader2, Gift } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';

export default function PromoGratuitsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: products, isLoading } = useQuery({
    queryKey: ['promo-gratuits'],
    queryFn: async () => {
      const { data } = await db.from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .eq('is_free', true)
        .order('sales_count', { ascending: false })
        .limit(100);
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

  return (
    <PromoLayout
      title={isFr ? 'Ressources Gratuites' : 'Free Resources'}
      description={isFr ? 'Télécharge gratuitement des ebooks, guides, templates et plus encore' : 'Download free ebooks, guides, templates and more'}
      seoTitle={isFr ? 'Ressources gratuites à télécharger - SiteViral' : 'Free resources to download - SiteViral'}
      seoDesc={isFr ? 'Accède à des dizaines de ressources gratuites créées par des experts' : 'Access dozens of free resources created by experts'}
      emoji="🎁"
      ctaText={isFr ? 'Créer un compte gratuit' : 'Create free account'}
      ctaHref="/auth"
    >
      {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

      {/* Stats banner */}
      {products && products.length > 0 && (
        <div className="flex items-center gap-2 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <Gift className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {isFr ? `${products.length} ressources gratuites disponibles` : `${products.length} free resources available`}
          </span>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products?.map((p: any, i: number) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <ProductCard product={p} hideCommission hideShare />
          </motion.div>
        ))}
      </div>

      {products?.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-12">
          {isFr ? 'Aucune ressource gratuite pour le moment.' : 'No free resources yet.'}
        </p>
      )}
    </PromoLayout>
  );
}
