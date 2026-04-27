import { lazy, Suspense } from 'react';

import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHeroManifesto } from '@/components/landing/LandingHeroManifesto';
import { SEOHead } from '@/components/seo/SEOHead';
import { FounderBanner } from '@/components/billing/FounderBanner';

const LandingHowItWorks = lazy(() => import('@/components/landing/LandingHowItWorksSimple').then(m => ({ default: m.LandingHowItWorksSimple })));
const LandingResultsShowcase = lazy(() => import('@/components/landing/LandingResultsShowcase'));

const LandingAmbassadorLoop = lazy(() => import('@/components/landing/LandingAmbassadorLoop').then(m => ({ default: m.LandingAmbassadorLoop })));
const LandingMobileMoney = lazy(() => import('@/components/landing/LandingMobileMoney').then(m => ({ default: m.LandingMobileMoney })));
const LandingTrustShield = lazy(() => import('@/components/landing/LandingTrustShield').then(m => ({ default: m.LandingTrustShield })));
const LandingPricingSimple = lazy(() => import('@/components/landing/LandingPricingSimple').then(m => ({ default: m.LandingPricingSimple })));
const LandingThreeTiers = lazy(() => import('@/components/landing/LandingThreeTiers').then(m => ({ default: m.LandingThreeTiers })));
const LandingFinalCTA = lazy(() => import('@/components/landing/LandingFinalCTA').then(m => ({ default: m.LandingFinalCTA })));
const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
      <div className="container max-w-6xl mx-auto px-4 pt-3">
        <FounderBanner />
      </div>
      <LandingHeroManifesto />

      <Suspense fallback={null}>
        {/* 1. Comment ça marche — clarté immédiate */}
        <LandingHowItWorks />
        {/* 2. Preuves sociales — résultats réels */}
        <LandingResultsShowcase />
        {/* Stats supprimées — les preuves sociales suffisent */}
        {/* 4. Programme ambassadeur — gagner en partageant */}
        <LandingAmbassadorLoop />
        {/* 5. Mobile Money — confiance paiement */}
        <LandingMobileMoney />
        {/* 6. Trust & sécurité */}
        <LandingTrustShield />
        {/* 7. Pricing — calculator + 3 tiers */}
        <LandingPricingSimple />
        <LandingThreeTiers />
        {/* 8. CTA final + footer */}
        <LandingFinalCTA />
        <LandingFooterCompact />
      </Suspense>
    </div>
  );
}
