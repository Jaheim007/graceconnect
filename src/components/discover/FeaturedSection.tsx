import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { OrgCard } from '@/components/org/OrgCard';
import { Sparkles, Heart, Users } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export function FeaturedSection() {
  const { locale } = useI18n();

  const { data: featured } = useQuery({
    queryKey: ['discover-featured'],
    queryFn: async () => {
      const [prods, camps, orgs] = await Promise.all([
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency)')
          .eq('is_published', true)
          .eq('is_featured', true)
          .order('featured_score', { ascending: false })
          .limit(4),
        db.from('donation_campaigns')
          .select('*, organizations(name, slug, logo_url, currency)')
          .eq('is_published', true)
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('current_amount', { ascending: false })
          .limit(2),
        db.from('organizations')
          .select('*')
          .eq('is_active', true)
          .eq('is_verified', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      return {
        products: (prods.data || []).map((p: any) => ({
          ...p,
          organization_name: p.organizations?.name,
          organization_slug: p.organizations?.slug,
          organization_logo: p.organizations?.logo_url,
        })),
        campaigns: (camps.data || []).map((c: any) => ({
          ...c,
          organization_name: c.organizations?.name,
          organization_slug: c.organizations?.slug,
        })),
        orgs: orgs.data || [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const hasProducts = (featured?.products?.length || 0) > 0;
  const hasCampaigns = (featured?.campaigns?.length || 0) > 0;
  const hasOrgs = (featured?.orgs?.length || 0) > 0;

  if (!hasProducts && !hasCampaigns && !hasOrgs) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* Featured products */}
      {hasProducts && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold">
              {locale === 'fr' ? 'En vedette' : 'Featured'}
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {featured!.products.map((p: any, i: number) => (
              <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Featured campaigns */}
      {hasCampaigns && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-bold">
              {locale === 'fr' ? 'Campagnes actives' : 'Active campaigns'}
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {featured!.campaigns.map((c: any, i: number) => (
              <motion.div key={c.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
                <CampaignCard campaign={c} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Verified orgs */}
      {hasOrgs && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">
              {locale === 'fr' ? 'Plateformes vérifiées' : 'Verified platforms'}
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {featured!.orgs.map((o: any, i: number) => (
              <motion.div key={o.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
                <OrgCard org={o} index={i} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
