import { lazy, Suspense } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHeroSplit } from '@/components/landing/LandingHeroSplit';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingExitPopup } from '@/components/landing/LandingExitPopup';

const LandingHowItWorksSimple = lazy(() => import('@/components/landing/LandingHowItWorksSimple').then(m => ({ default: m.LandingHowItWorksSimple })));
const LandingFirstWin = lazy(() => import('@/components/landing/LandingFirstWin').then(m => ({ default: m.LandingFirstWin })));
const LandingSocialProof = lazy(() => import('@/components/landing/LandingSocialProof').then(m => ({ default: m.LandingSocialProof })));
const LandingPricing = lazy(() => import('@/components/landing/LandingPricing').then(m => ({ default: m.LandingPricing })));
const LandingFinalCTA = lazy(() => import('@/components/landing/LandingFinalCTA').then(m => ({ default: m.LandingFinalCTA })));
const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="Siteviral — Gagnez en partageant. Vendez avec une armée."
        description="Siteviral transforme chaque ressource digitale en opportunité de commission. Ambassadeurs : partagez et gagnez. Créateurs : vendez avec une armée d'ambassadeurs."
        canonicalUrl="https://siteviral.com"
        keywords="gagner argent en partageant, vendre ebook Afrique, programme ambassadeur, commission Mobile Money, produits numériques, Siteviral"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Siteviral',
            url: 'https://siteviral.com',
            logo: 'https://siteviral.com/logo-s.png',
            description: 'Gagnez en partageant. Vendez avec une armée d\'ambassadeurs.',
            foundingDate: '2024',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Siteviral',
            url: 'https://siteviral.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://siteviral.com/marketplace?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <LandingNav />
      <LandingHeroSplit />

      <Suspense fallback={null}>
        <LandingHowItWorksSimple />
        <LandingFirstWin />
        <LandingSocialProof />
        <LandingPricing />
        <LandingFinalCTA />
        <LandingFooterCompact />
      </Suspense>
      <LandingExitPopup />
    </div>
  );
}
