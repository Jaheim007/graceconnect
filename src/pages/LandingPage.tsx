import { lazy, Suspense } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { CoreHero } from '@/components/landing/CoreHero';
import { CorePillars } from '@/components/landing/CorePillars';
import { ChurchCallout } from '@/components/landing/ChurchCallout';
import { SEOHead } from '@/components/seo/SEOHead';

// NOTE: the service-marketplace landing sections (MarketplaceHero,
// MarketplaceCategories, MarketplaceHowItWorks, GrowingServicesSection,
// AvailableNowSection) are intentionally left in the codebase but are no longer
// mounted on the main homepage. See src/lib/siteviral/visibility.ts.
const LandingTrustShield = lazy(() => import('@/components/landing/LandingTrustShield').then(m => ({ default: m.LandingTrustShield })));
const CoreFinalCTA = lazy(() => import('@/components/landing/CoreFinalCTA').then(m => ({ default: m.CoreFinalCTA })));
const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="SiteViral — Crée, vends et gagne avec tes contenus digitaux"
        description="Écris des livres et des formations avec l'IA, vends tes produits digitaux, bâtis ta plateforme publique et gagne grâce à l'affiliation. Paiement mobile inclus."
        canonicalUrl="https://siteviral.com"
        keywords="créer un livre IA, vendre formation en ligne, produits digitaux, affiliation, plateforme créateur, SiteViral"
      />
      <LandingNav />
      <main id="main-content">
        <CoreHero />
        <CorePillars />
        <Suspense fallback={null}>
          <LandingTrustShield />
        </Suspense>
        <ChurchCallout />
        <Suspense fallback={null}>
          <CoreFinalCTA />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <LandingFooterCompact />
      </Suspense>
    </div>
  );
}
