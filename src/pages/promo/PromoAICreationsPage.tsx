import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { PromoLayout } from './PromoLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Loader2, Zap, BookOpen, GraduationCap } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PromoAICreationsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data, isLoading } = useQuery({
    queryKey: ['promo-ai-creations'],
    queryFn: async () => {
      const { data: products } = await db.from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(60);

      return (products || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  const ebooks = data?.filter((p: any) => p.product_type !== 'course') || [];
  const courses = data?.filter((p: any) => p.product_type === 'course') || [];

  return (
    <PromoLayout
      title={isFr ? 'Créé avec Viral AI Studio' : 'Created with Viral AI Studio'}
      description={isFr
        ? 'Tous ces contenus ont été créés en quelques minutes grâce à notre intelligence artificielle'
        : 'All these products were created in minutes using our AI engine'}
      seoTitle={isFr ? 'Créations Viral AI Studio - SiteViral' : 'Viral AI Studio Creations - SiteViral'}
      seoDesc={isFr
        ? 'Découvre tous les livres et formations créés avec Viral AI Studio en quelques minutes'
        : 'Discover all books and courses created with Viral AI Studio in just minutes'}
      emoji="⚡"
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-center py-16 space-y-4">
          
          <p className="text-lg font-medium text-muted-foreground">
            {isFr ? 'Les premières créations arrivent bientôt !' : 'First creations coming soon!'}
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-10">
          {/* Hero stats */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 p-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{data.length}</p>
              <p className="text-xs text-muted-foreground">{isFr ? 'Créations IA' : 'AI Creations'}</p>
            </div>
            {ebooks.length > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">{ebooks.length}</p>
                <p className="text-xs text-muted-foreground">{isFr ? 'Livres' : 'Books'}</p>
              </div>
            )}
            {courses.length > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-500">{courses.length}</p>
                <p className="text-xs text-muted-foreground">{isFr ? 'Formations' : 'Courses'}</p>
              </div>
            )}
          </motion.div>

          {/* Ebooks section */}
          {ebooks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-bold">{isFr ? 'Livres & Ebooks' : 'Books & Ebooks'}</h2>
                <Badge variant="secondary" className="text-xs">{ebooks.length}</Badge>
                <Badge className="text-[9px] bg-primary/20 text-primary border-0 ml-1">
                  <Zap className="h-3 w-3 mr-0.5" /> Viral AI Studio
                </Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ebooks.map((p: any, i: number) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <ProductCard product={p} hideCommission hideShare />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Courses section */}
          {courses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-bold">{isFr ? 'Formations' : 'Courses'}</h2>
                <Badge variant="secondary" className="text-xs">{courses.length}</Badge>
                <Badge className="text-[9px] bg-primary/20 text-primary border-0 ml-1">
                  <Zap className="h-3 w-3 mr-0.5" /> Viral AI Studio
                </Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((p: any, i: number) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <ProductCard product={p} hideCommission hideShare />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <motion.div
            className="text-center py-8 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-lg font-semibold">
              {isFr ? 'Toi aussi, crée ton livre en quelques minutes' : 'You too can create your book in minutes'}
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Zap className="h-4 w-4" />
                {isFr ? 'Commencer avec Viral AI Studio' : 'Start with Viral AI Studio'}
              </Button>
            </Link>
          </motion.div>
        </div>
      )}
    </PromoLayout>
  );
}
