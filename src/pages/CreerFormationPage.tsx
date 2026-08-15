import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { GraduationCap } from 'lucide-react';
import { GuestGate } from '@/components/auth/GuestGate';
import { Navigate } from 'react-router-dom';
import { PlatformOnboardingScreen } from '@/components/platform/PlatformOnboardingScreen';

export default function CreerFormationPage() {
  const { user } = useAuth();
  const { userOrgs, canManage, isLoadingOrgs } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (user) {
    // Already managing a platform? Go straight to the tool — never ask them to
    // create a second platform.
    if (isLoadingOrgs) return null;
    const manageable = userOrgs.find((o) => canManage(o.id));
    if (manageable) return <Navigate to="/admin/programs" replace />;
    return (
      <PlatformOnboardingScreen
        redirectTo="/admin/programs"
        defaultIdentity="creator"
        title={isFr ? 'Crée ton école en ligne' : 'Create your online school'}
        subtitle={isFr ? 'Trois questions, puis on passe à ta formation.' : 'Three quick questions, then we build your course.'}
      />
    );
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
