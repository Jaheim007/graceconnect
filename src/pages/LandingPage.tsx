import { lazy, Suspense, useState, useCallback } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHeroManifesto } from '@/components/landing/LandingHeroManifesto';
import { SEOHead } from '@/components/seo/SEOHead';
import { LiveAuthorsCounter } from '@/components/growth/LiveAuthorsCounter';
import { CommunityProgressBar } from '@/components/growth/CommunityProgressBar';
import { SplashScreen, wasSplashShown } from '@/components/splash/SplashScreen';

const LandingHowItWorks = lazy(() => import('@/components/landing/LandingHowItWorksSimple').then(m => ({ default: m.LandingHowItWorksSimple })));
const LandingInteractiveDemo = lazy(() => import('@/components/landing/LandingInteractiveDemo').then(m => ({ default: m.LandingInteractiveDemo })));
const LandingLiveStats = lazy(() => import('@/components/landing/LandingLiveStats').then(m => ({ default: m.LandingLiveStats })));
const LandingAmbassadorLoop = lazy(() => import('@/components/landing/LandingAmbassadorLoop').then(m => ({ default: m.LandingAmbassadorLoop })));
const LandingSourcesSection = lazy(() => import('@/components/landing/LandingSourcesSection').then(m => ({ default: m.LandingSourcesSection })));
const LandingMobileMoney = lazy(() => import('@/components/landing/LandingMobileMoney').then(m => ({ default: m.LandingMobileMoney })));
const LandingTrustShield = lazy(() => import('@/components/landing/LandingTrustShield').then(m => ({ default: m.LandingTrustShield })));
const LandingPricingSimple = lazy(() => import('@/components/landing/LandingPricingSimple').then(m => ({ default: m.LandingPricingSimple })));
const LandingSocialProof = lazy(() => import('@/components/landing/LandingSocialProof').then(m => ({ default: m.LandingSocialProof })));
const LandingMigration = lazy(() => import('@/components/landing/LandingMigration').then(m => ({ default: m.LandingMigration })));
const LandingFinalCTA = lazy(() => import('@/components/landing/LandingFinalCTA').then(m => ({ default: m.LandingFinalCTA })));
const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(() => !wasSplashShown());
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    <div className={`min-h-screen bg-background overflow-x-hidden ${showSplash ? 'opacity-0' : 'animate-fade-in'}`}>
      <SEOHead
        title="SiteViral — Écris. Vends. Gagne."
        description="Écris ton livre en 5 minutes avec l'IA. Vends-le. Fais-le distribuer par des ambassadeurs. Mobile Money inclus. Gratuit."
        canonicalUrl="https://siteviral.com"
        keywords="écrire un livre IA, vendre ebook Afrique, gagner argent en partageant, programme ambassadeur, Mobile Money, produits numériques, Siteviral"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SiteViral',
            url: 'https://siteviral.com',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'Écris ton livre en 5 minutes avec l\'IA. Vends-le. Fais-le distribuer par des ambassadeurs.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'XOF',
              description: 'Gratuit. Commission de 10% sur les ventes uniquement.',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'SiteViral',
            url: 'https://siteviral.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://siteviral.com/discover?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <LandingNav />
      <LandingHeroManifesto />

      <LiveAuthorsCounter />

      <Suspense fallback={null}>
        <LandingHowItWorks />
        <LandingInteractiveDemo />
        <LandingLiveStats />
        <CommunityProgressBar />
        <LandingAmbassadorLoop />
        <LandingSourcesSection />
        <LandingMobileMoney />
        <LandingTrustShield />
        <LandingPricingSimple />
        <LandingSocialProof />
        <LandingMigration />
        <LandingFinalCTA />
        <LandingFooterCompact />
      </Suspense>
    </div>
    </>
  );
}
