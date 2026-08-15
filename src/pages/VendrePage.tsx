import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Store } from 'lucide-react';
import { GuestGate } from '@/components/auth/GuestGate';
import { Navigate } from 'react-router-dom';

export default function VendrePage() {
  const { user } = useAuth();
  const { userOrgs, canManage, isLoadingOrgs } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (user) {
    // Already managing a platform? Go straight to the tool — never ask them to
    // create a second platform.
    if (isLoadingOrgs) return null;
    const manageable = userOrgs.find((o) => canManage(o.id));
    return <Navigate to={manageable ? '/admin/products' : '/create-org'} replace />;
  }

  return (
    <>
      <SEOHead
        title={isFr ? 'Vends tes créations en ligne — SiteViral' : 'Sell your creations online — SiteViral'}
        description={isFr ? 'Vends tes livres, formations et plus. Gratuit pour commencer.' : 'Sell your books, courses & more. Free to start.'}
        canonicalUrl="https://siteviral.com/vendre"
      />
      <GuestGate
        icon={Store}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-500"
        title={isFr ? 'Vends tes créations en ligne' : 'Sell your creations online'}
        subtitle={isFr ? 'Publie et monétise tes livres, formations et plus. Gratuit pour commencer.' : 'Publish and monetize your books, courses & more. Free to start.'}
        nextUrl="/create-org"
      />
    </>
  );
}
