import { lazy, Suspense } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { MarketplaceHero, MarketplaceIntentSplit } from '@/components/landing/MarketplaceHero';
import { MarketplaceCategories } from '@/components/landing/MarketplaceCategories';
import { MarketplaceHowItWorks } from '@/components/landing/MarketplaceHowItWorks';
import { SEOHead } from '@/components/seo/SEOHead';

const LandingTrustShield = lazy(() => import('@/components/landing/LandingTrustShield').then(m => ({ default: m.LandingTrustShield })));
const LandingFinalCTA = lazy(() => import('@/components/landing/LandingFinalCTA').then(m => ({ default: m.LandingFinalCTA })));
const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="SiteViral — Trouvez un pro ou vendez vos services"
        description="La marketplace panafricaine des services et produits digitaux. Beauté, tuteurs, artisans, événements, ebooks. Paiement sécurisé, Mobile Money inclus."
        canonicalUrl="https://siteviral.com"
        keywords="marketplace Afrique, freelance, services à domicile, tuteurs, coiffure, ebooks, Mobile Money, SiteViral"
      />
      <LandingNav />
      <MarketplaceHero />
      <MarketplaceIntentSplit />
      <MarketplaceCategories />
      <MarketplaceHowItWorks />
      <Suspense fallback={null}>
        <LandingTrustShield />
        <LandingFinalCTA />
        <LandingFooterCompact />
      </Suspense>
    </div>
  );
}
