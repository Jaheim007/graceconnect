import { lazy, Suspense } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { useI18n } from '@/i18n/I18nContext';

const MigrateWizard = lazy(() => import('@/components/migrate/MigrateWizard'));

export default function MigrerPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <AdaptiveLayout>
      <SEOHead
        title={isFr ? 'Importe ton contenu et vends-le — SiteViral' : 'Import your content and sell it — SiteViral'}
        description={isFr ? 'Tu as déjà un ebook, un PDF, une formation ? Importe-le en 2 minutes, active des ambassadeurs, et vends dans le monde entier.' : 'Already have an ebook, PDF, or course? Import it in 2 minutes, activate ambassadors, and sell worldwide.'}
        canonicalUrl="https://siteviral.com/migrer"
      />
      <Suspense fallback={
        <div className="min-h-[60dvh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">{isFr ? 'Chargement…' : 'Loading…'}</div>
        </div>
      }>
        <MigrateWizard />
      </Suspense>
    </AdaptiveLayout>
  );
}
