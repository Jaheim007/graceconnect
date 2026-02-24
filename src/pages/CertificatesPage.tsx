import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { GraduationCap, Clock } from 'lucide-react';

export default function CertificatesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <>
      <SEOHead title={isFr ? 'Mes Certificats' : 'My Certificates'} />
      <div className="container max-w-2xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{isFr ? 'Mes Certificats' : 'My Certificates'}</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold">{isFr ? 'Bientôt disponible' : 'Coming Soon'}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {isFr
              ? 'La fonctionnalité de certificats est en cours de développement. Revenez bientôt !'
              : 'The certificates feature is under development. Check back soon!'}
          </p>
        </div>
      </div>
    </>
  );
}
