import { lazy, Suspense } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { AnnouncementStrip } from '@/components/landing/AnnouncementStrip';
import { AuthorHero } from '@/components/landing/AuthorHero';
import { ProductShot } from '@/components/landing/ProductShot';
import { FeeTransparency } from '@/components/landing/FeeTransparency';
import { SEOHead } from '@/components/seo/SEOHead';

// NOTE: the service-marketplace landing sections (MarketplaceHero,
// MarketplaceCategories, MarketplaceHowItWorks, GrowingServicesSection,
// AvailableNowSection) are intentionally left in the codebase but are no longer
// mounted on the main homepage. See src/lib/siteviral/visibility.ts.
// The church block also left this page: churches now have their own standalone
// funnel at /churches, linked from the nav and the footer.
const LandingTrustShield = lazy(() => import('@/components/landing/LandingTrustShield').then(m => ({ default: m.LandingTrustShield })));
const CoreFinalCTA = lazy(() => import('@/components/landing/CoreFinalCTA').then(m => ({ default: m.CoreFinalCTA })));
const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="SiteViral — Écris ton livre avec l'IA, vends-le, sois payé"
        description="Écris ton livre ou ta formation avec l'IA, publie-le sur ta propre page et reçois ton argent par Wave, Orange Money ou MTN. Gratuit pour commencer, 10 % tout compris quand tu vends."
        canonicalUrl="https://siteviral.com"
        keywords="écrire un livre avec l'IA, vendre un ebook, créer une formation en ligne, être payé mobile money, auteur africain, SiteViral"
      />
      <AnnouncementStrip />
      <LandingNav />
      <main id="main-content">
        <AuthorHero />
        <ProductShot />
        <Suspense fallback={null}>
          <LandingTrustShield />
        </Suspense>
        <FeeTransparency />
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
