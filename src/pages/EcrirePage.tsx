import { lazy, Suspense } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { useI18n } from '@/i18n/I18nContext';

const WriteWizard = lazy(() => import('@/components/write/WriteWizard'));

export default function EcrirePage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t('write.seo_title')}
        description={t('write.seo_desc')}
        canonicalUrl="https://siteviral.com/ecrire"
        keywords="écrire un livre IA, créer ebook, publier livre numérique, vendre ebook Afrique, write book AI"
      />
      <LandingNav />
      <Suspense fallback={
        <div className="min-h-[60dvh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">{t('write.loading_studio')}</div>
        </div>
      }>
        <WriteWizard />
      </Suspense>
    </div>
  );
}