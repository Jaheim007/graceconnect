import { useSearchParams } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { PromoLayout } from './PromoLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { useState } from 'react';

const CATEGORIES = [
  { key: 'all', labelFr: 'Tout', labelEn: 'All', emoji: '' },
  { key: 'spirituality', labelFr: 'Spiritualité', labelEn: 'Spirituality', emoji: '🙏', regex: /bible|church|église|pray|spirit|god|dieu|faith|worship|sermon|psaume|gospel|christ|pasteur|pastor|prophè/i },
  { key: 'tech', labelFr: 'Technologie & IA', labelEn: 'Tech & AI', emoji: '💻', regex: /\b(tech|coding|code|dev|software|data\s?scien|machine.?learn|prompt|chatgpt|gpt|saas|programm|python|javascript|cybersec|blockchain|crypto)\b/i },
  { key: 'business', labelFr: 'Business & Marketing', labelEn: 'Business & Marketing', emoji: '📈', regex: /\b(business|market|vend|sell|money|argent|entrep|freelan|profit|revenue|copywrite|brand|commerce|prospect|funnel|startup|stratégi)\b/i },
  { key: 'family', labelFr: 'Famille & Éducation', labelEn: 'Family & Education', emoji: '👨‍👩‍👧‍👦', regex: /\b(family|famil|enfant|child|kid|parent|éducat|educat|school|teacher|math|étude)\b/i },
  { key: 'health', labelFr: 'Santé & Bien-être', labelEn: 'Health & Wellness', emoji: '🧘', regex: /\b(health|santé|bien.?être|wellness|fitness|yoga|méditat|nutrit|diet|mental|thérap|coach.?vie)\b/i },
  { key: 'creative', labelFr: 'Créatif & Art', labelEn: 'Creative & Art', emoji: '🎨', regex: /\b(art|design|photo|music|musique|dessin|illustr|graphic|film|cinema|paint|peinture)\b/i },
  { key: 'finance', labelFr: 'Finance & Investissement', labelEn: 'Finance & Investment', emoji: '💰', regex: /\b(financ|invest|trading|crypto|bourse|stock|budget|comptab|immob|real.?estate)\b/i },
];

function categorizeProduct(p: any): string {
  const text = `${p.title} ${p.description || ''}`;
  // Try all categories, secular overrides checked first to prevent spirituality false positives
  const secularKeys = ['tech', 'business', 'finance'];
  for (const cat of CATEGORIES.slice(1)) {
    if (secularKeys.includes(cat.key) && cat.regex?.test(text)) return cat.key;
  }
  for (const cat of CATEGORIES.slice(1)) {
    if (!secularKeys.includes(cat.key) && cat.regex?.test(text)) return cat.key;
  }
  return 'all';
}

export default function PromoCataloguePage() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';
  const [activeCat, setActiveCat] = useState(initialCat);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: products, isLoading } = useQuery({
    queryKey: ['promo-catalogue'],
    queryFn: async () => {
      const { data } = await db.from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('featured_score', { ascending: false })
        .limit(200);
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
        _category: categorizeProduct(p),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  const filtered = activeCat === 'all' ? products : products?.filter((p: any) => p._category === activeCat);

  return (
    <PromoLayout
      title={isFr ? 'Catalogue Complet' : 'Full Catalogue'}
      description={isFr ? 'Explore des centaines de ressources numériques par catégorie' : 'Explore hundreds of digital resources by category'}
      seoTitle={isFr ? 'Catalogue numérique - SiteViral' : 'Digital Catalogue - SiteViral'}
      seoDesc={isFr ? 'Découvre des ebooks, formations, audio et plus classés par thématique' : 'Discover ebooks, courses, audio and more organized by theme'}
      emoji="📚"
      ctaText={isFr ? 'Créer & Vendre aussi' : 'Create & Sell too'}
      ctaHref="/auth"
    >
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <Badge
            key={cat.key}
            variant={activeCat === cat.key ? 'default' : 'outline'}
            className="cursor-pointer text-sm px-3 py-1.5 transition-all hover:scale-105"
            onClick={() => setActiveCat(cat.key)}
          >
            {cat.emoji} {isFr ? cat.labelFr : cat.labelEn}
            {products && (
              <span className="ml-1 text-xs opacity-70">
                ({cat.key === 'all' ? products.length : products.filter((p: any) => p._category === cat.key).length})
              </span>
            )}
          </Badge>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered?.map((p: any, i: number) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <ProductCard product={p} hideCommission hideShare />
          </motion.div>
        ))}
      </div>

      {filtered?.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-12">
          {isFr ? 'Aucun produit dans cette catégorie pour le moment.' : 'No products in this category yet.'}
        </p>
      )}
    </PromoLayout>
  );
}
