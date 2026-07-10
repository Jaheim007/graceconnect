import { useNavigate } from 'react-router-dom';
import { Search, Rocket } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { useOrg } from '@/contexts/OrgContext';
import { useBuyerWorld } from '@/hooks/useBuyerWorld';
import { normalizeBuyerWorld } from '@/lib/siteviral/buyerWorlds';

/**
 * Fallback two-choice screen: shown when a logged-in user with no captured
 * intent lands here. Existing providers who pick "offer" skip world creation
 * and go straight to their dashboard.
 */
export default function IntentChooserPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { userOrgs, canManage } = useOrg();
  const { setBuyerWorld } = useBuyerWorld();
  const fr = locale === 'fr';

  const hasWorkspace = userOrgs.some((o) => canManage(o.id));

  const pick = (kind: 'client' | 'provider') => {
    if (kind === 'provider') {
      // Already has a world? Go straight there — never re-ask.
      const route = hasWorkspace ? '/dashboard' : '/start';
      setIntent('provider', route);
      navigate(route);
      return;
    }
    // Client / looker: send to the world picker.
    setIntent('client', '/looking-for');
    // Clear any stale buyer world so the picker leads them fresh.
    try {
      const prev = normalizeBuyerWorld(localStorage.getItem('sv_last_vertical'));
      if (prev) void setBuyerWorld(prev); // keep persisted; picker will overwrite
    } catch {}
    navigate('/looking-for');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <SEOHead
        title={fr ? 'Bienvenue — SiteViral' : 'Welcome — SiteViral'}
        description={fr ? 'Que souhaitez-vous faire ?' : 'What would you like to do?'}
        noindex
      />
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {fr ? 'Que souhaitez-vous faire ?' : 'What would you like to do?'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fr ? 'Choisissez votre chemin — vous pourrez changer plus tard.' : 'Pick your path — you can switch later.'}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => pick('client')}
            className="rounded-2xl border p-6 text-left hover:border-primary/50 transition-all"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-1">
              {fr ? 'Je cherche quelque chose' : 'I\'m looking for something'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {fr
                ? 'Trouvez un pro beauté, un tuteur, un artisan, une église, des produits digitaux, des événements…'
                : 'Find a beauty pro, tutor, artisan, church, digital products, events…'}
            </p>
          </button>

          <button
            onClick={() => pick('provider')}
            className="rounded-2xl border p-6 text-left hover:border-primary/50 transition-all"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-1">
              {fr ? 'Je veux proposer ou vendre' : 'I want to offer or sell'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {fr
                ? 'Services, rendez-vous, produits digitaux, dons, événements, cours avec l\'IA…'
                : 'Services, appointments, digital products, donations, events, AI courses…'}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
