import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle2, Hammer, Lightbulb, MessageSquarePlus } from 'lucide-react';

type Status = 'shipped' | 'building' | 'exploring';

const STATUS_META: Record<Status, { fr: string; en: string; icon: typeof CheckCircle2; cls: string }> = {
  shipped:   { fr: 'Livré',      en: 'Shipped',   icon: CheckCircle2, cls: 'bg-primary/10 text-primary border-primary/20' },
  building:  { fr: 'En cours',   en: 'Building',  icon: Hammer,       cls: 'bg-accent/10 text-accent-foreground border-border' },
  exploring: { fr: 'À l’étude',  en: 'Exploring', icon: Lightbulb,    cls: 'bg-muted text-muted-foreground border-border' },
};

const ITEMS: { status: Status; fr: string; en: string; frD: string; enD: string }[] = [
  { status: 'shipped', fr: 'Studio IA (livres & formations)', en: 'AI Studio (books & courses)',
    frD: 'Génération de chapitres, leçons, quiz et visuels depuis un simple prompt, une dictée ou une photo d’écriture.',
    enD: 'Generate chapters, lessons, quizzes and visuals from a prompt, a dictation or a handwriting photo.' },
  { status: 'shipped', fr: 'Serveur MCP', en: 'MCP server',
    frD: 'Créez vos produits depuis ChatGPT, Claude ou Gemini. Voir la référence des outils.',
    enD: 'Create products straight from ChatGPT, Claude or Gemini. See the tool reference.' },
  { status: 'shipped', fr: 'Paiements Mobile Money & cartes', en: 'Mobile Money & card payments',
    frD: 'Encaissement local, livraison automatique du fichier, versements vers votre numéro.',
    enD: 'Local checkout, automatic file delivery, payouts to your own number.' },
  { status: 'building', fr: 'Tutoriels vidéo réels', en: 'Real video tutorials',
    frD: 'Les démos interactives actuelles seront remplacées par des enregistrements narrés.',
    enD: 'Today’s interactive demos will be replaced by narrated screen recordings.' },
  { status: 'building', fr: 'Analytique créateur avancée', en: 'Advanced creator analytics',
    frD: 'Sources de trafic, taux de conversion par produit et cohortes d’acheteurs.',
    enD: 'Traffic sources, per-product conversion and buyer cohorts.' },
  { status: 'building', fr: 'Application mobile native', en: 'Native mobile app',
    frD: 'Notifications push et lecture hors ligne des formations achetées.',
    enD: 'Push notifications and offline playback for purchased courses.' },
  { status: 'exploring', fr: 'Abonnements récurrents', en: 'Recurring subscriptions',
    frD: 'Accès mensuel à une bibliothèque de contenus plutôt qu’un achat unique.',
    enD: 'Monthly access to a content library instead of a one-off purchase.' },
  { status: 'exploring', fr: 'Places de marché d’ambassadeurs', en: 'Ambassador marketplaces',
    frD: 'Un annuaire public des meilleurs ambassadeurs par catégorie.',
    enD: 'A public directory of top ambassadors per category.' },
  { status: 'exploring', fr: 'Traduction automatique des produits', en: 'Automatic product translation',
    frD: 'Dupliquer un livre ou une formation dans une autre langue en un clic (déjà partiellement disponible).',
    enD: 'Duplicate a book or course into another language in one click (already partly available).' },
];

export default function RoadmapPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const groups: Status[] = ['building', 'exploring', 'shipped'];

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Feuille de route — Siteviral' : 'Roadmap — Siteviral'}
        description={isFr
          ? 'Ce que nous construisons chez Siteviral, ce qui est à l’étude et ce qui est déjà livré. Proposez une fonctionnalité.'
          : 'What we are building at Siteviral, what we are exploring and what already shipped. Suggest a feature.'}
        canonicalUrl="https://siteviral.com/roadmap"
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Feuille de route' : 'Roadmap'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium max-w-xl">
        {isFr
          ? 'Ce sur quoi nous travaillons en ce moment, ce que nous étudions, et ce qui est déjà en ligne. Mis à jour régulièrement — les dates ne sont pas des promesses.'
          : 'What we are working on now, what we are exploring, and what is already live. Updated regularly — dates are not promises.'}
      </p>

      <div className="space-y-10">
        {groups.map(status => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          const items = ITEMS.filter(i => i.status === status);
          return (
            <section key={status}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-extrabold text-foreground">{isFr ? meta.fr : meta.en}</h2>
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map(item => (
                  <div key={item.en} className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xs">
                    <p className="font-bold text-sm text-foreground mb-1">{isFr ? item.fr : item.en}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {isFr ? item.frD : item.enD}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquarePlus className="h-4 w-4 text-primary" />
          <h2 className="text-base font-extrabold text-foreground">
            {isFr ? 'Proposer une fonctionnalité' : 'Suggest a feature'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-medium mb-4">
          {isFr
            ? 'Dites-nous ce qui vous manque pour vendre plus. Les demandes les plus fréquentes passent en priorité.'
            : 'Tell us what is missing for you to sell more. The most requested items move up the list.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link to="/contact">{isFr ? 'Envoyer une idée' : 'Send an idea'}</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/changelog">{isFr ? 'Voir le changelog' : 'View changelog'}</Link></Button>
        </div>
      </div>
    </LegalPageShell>
  );
}
