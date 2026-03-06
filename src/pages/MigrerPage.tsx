import { lazy, Suspense } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';

const MigrateWizard = lazy(() => import('@/components/migrate/MigrateWizard'));

export default function MigrerPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Importe ton contenu et vends-le — SiteViral"
        description="Tu as déjà un ebook, un PDF, une formation ? Importe-le en 2 minutes, active des ambassadeurs, et vends dans le monde entier."
        canonicalUrl="https://siteviral.com/migrer"
        keywords="importer ebook, migrer contenu, vendre PDF, alternative Gumroad Afrique"
      />
      <LandingNav />
      <Suspense fallback={
        <div className="min-h-[60dvh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Chargement…</div>
        </div>
      }>
        <MigrateWizard />
      </Suspense>
    </div>
  );
}
