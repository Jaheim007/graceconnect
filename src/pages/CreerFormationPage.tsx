import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from 'lucide-react';
import { GuestGate } from '@/components/auth/GuestGate';
import { Navigate } from 'react-router-dom';

export default function CreerFormationPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (user) {
    return <Navigate to="/create-org" replace />;
  }

  return (
    <>
      <SEOHead
        title={isFr ? 'Crée ta formation en ligne — SiteViral' : 'Create your online course — SiteViral'}
        description={isFr ? "Crée ta formation avec l'IA en quelques minutes. Gratuit." : 'Create your course with AI in minutes. Free.'}
        canonicalUrl="https://siteviral.com/creer-formation"
      />
      <GuestGate
        icon={GraduationCap}
        iconBg="bg-sky-500/10"
        iconColor="text-sky-500"
        title={isFr ? 'Crée ta formation en quelques minutes' : 'Create your course in minutes'}
        subtitle={isFr ? "L'IA t'aide à créer ta formation. Publie-la et vends-la. Gratuit pour commencer." : 'AI helps you create your course. Publish and sell it. Free to start.'}
        nextUrl="/create-org"
      />
    </>
  );
}
