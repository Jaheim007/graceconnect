import { lazy, Suspense } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { MarketplaceHero } from '@/components/landing/MarketplaceHero';
import { MarketplaceCategories } from '@/components/landing/MarketplaceCategories';
import { MarketplaceHowItWorks } from '@/components/landing/MarketplaceHowItWorks';
import { GrowingServicesSection } from '@/components/landing/GrowingServicesSection';
import { ChurchCallout } from '@/components/landing/ChurchCallout';
import { SEOHead } from '@/components/seo/SEOHead';

const LandingTrustShield = lazy(() => import('@/components/landing/LandingTrustShield').then(m => ({ default: m.LandingTrustShield })));
const LandingFinalCTA = lazy(() => import('@/components/landing/LandingFinalCTA').then(m => ({ default: m.LandingFinalCTA })));
const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="SiteViral — Trouvez un produit, un service ou un professionnel"
        description="Achetez des produits digitaux et découvrez un réseau grandissant d'artisans, professionnels de la beauté, tuteurs, coachs, musiciens et créateurs. Paiement sécurisé."
        canonicalUrl="https://siteviral.com"
        keywords="marketplace, produits digitaux, artisans, beauté, tuteurs, coaching, ebooks, SiteViral"
      />
      <LandingNav />
      <main id="main-content">
        <MarketplaceHero />
        <MarketplaceCategories />
        <MarketplaceHowItWorks />
        <Suspense fallback={null}>
          <LandingTrustShield />
        </Suspense>
        <ChurchCallout />
        <GrowingServicesSection />
        <Suspense fallback={null}>
          <LandingFinalCTA />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <LandingFooterCompact />
      </Suspense>
    </div>
  );
}
