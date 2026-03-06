import { lazy, Suspense } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';

const WriteWizard = lazy(() => import('@/components/write/WriteWizard'));

export default function EcrirePage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Écris ton livre en 5 minutes — SiteViral"
        description="Écris ton livre avec l'IA en 5 minutes. Publie-le, vends-le, fais-le distribuer par des ambassadeurs. Gratuit."
        canonicalUrl="https://siteviral.com/ecrire"
        keywords="écrire un livre IA, créer ebook, publier livre numérique, vendre ebook Afrique"
      />
      <LandingNav />
      <Suspense fallback={
        <div className="min-h-[60dvh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Chargement du studio…</div>
        </div>
      }>
        <WriteWizard />
      </Suspense>
    </div>
  );
}
