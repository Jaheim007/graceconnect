import { lazy, Suspense } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil } from 'lucide-react';
import { GuestGate } from '@/components/auth/GuestGate';

const WriteWizard = lazy(() => import('@/components/write/WriteWizard'));

export default function EcrirePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (!user) {
    return (
      <>
        <SEOHead
          title={t('write.seo_title')}
          description={t('write.seo_desc')}
          canonicalUrl="https://siteviral.com/ecrire"
          keywords="écrire un livre IA, créer ebook, publier livre numérique, vendre ebook Afrique, write book AI"
        />
        <GuestGate
          icon={Pencil}
          title={isFr ? 'Écris ton livre en 5 minutes' : 'Write your book in 5 minutes'}
          subtitle={isFr ? "L'IA écrit ton livre, tu le publies, tu le vends. Gratuit pour commencer." : 'AI writes your book, you publish it, you sell it. Free to start.'}
          nextUrl="/ecrire"
        />
      </>
    );
  }

  return (
    <AdaptiveLayout>
      <SEOHead
        title={t('write.seo_title')}
        description={t('write.seo_desc')}
        canonicalUrl="https://siteviral.com/ecrire"
        keywords="écrire un livre IA, créer ebook, publier livre numérique, vendre ebook Afrique, write book AI"
      />
      <Suspense fallback={
        <div className="min-h-[60dvh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">{t('write.loading_studio')}</div>
        </div>
      }>
        <WriteWizard />
      </Suspense>
    </AdaptiveLayout>
  );
}
