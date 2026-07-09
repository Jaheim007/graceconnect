import { useNavigate } from 'react-router-dom';
import { Search, Rocket } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

/**
 * Fallback two-choice screen: shown only when a logged-in "new" user
 * arrives with no captured intent. Provider/buyer users never reach here.
 */
export default function IntentChooserPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const pick = (kind: 'client' | 'provider') => {
    const route = kind === 'provider' ? '/start' : '/looking-for';
    setIntent(kind, route);
    navigate(route);
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
