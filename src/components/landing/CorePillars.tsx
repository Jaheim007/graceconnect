import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Store, HandCoins, Globe2, Compass } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * SiteViral Core pillars — the restored digital creation & monetization story.
 */
export function CorePillars() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const pillars = [
    {
      icon: BookOpen,
      to: '/ecrire',
      titleFr: 'Écrire un livre avec l\'IA',
      titleEn: 'Write a book with AI',
      descFr: 'De l\'idée au livre prêt à vendre en quelques minutes.',
      descEn: 'From idea to a sellable book in minutes.',
    },
    {
      icon: GraduationCap,
      to: '/creer-formation',
      titleFr: 'Créer une formation',
      titleEn: 'Create a formation',
      descFr: 'Modules, leçons, quiz et certificats générés pour toi.',
      descEn: 'Modules, lessons, quizzes and certificates generated for you.',
    },
    {
      icon: Store,
      to: '/create-org',
      titleFr: 'Vendre tes produits digitaux',
      titleEn: 'Sell your digital products',
      descFr: 'Ebooks, PDF, formations et ressources — paiements inclus.',
      descEn: 'Ebooks, PDFs, formations and resources — payments included.',
    },
    {
      icon: Globe2,
      to: '/create-org',
      titleFr: 'Bâtir ta plateforme publique',
      titleEn: 'Build your public platform',
      descFr: 'Créateur, organisation, ONG, communauté ou église.',
      descEn: 'Creator, organization, NGO, community or church.',
    },
    {
      icon: HandCoins,
      to: '/gagner',
      titleFr: 'Gagner avec l\'affiliation',
      titleEn: 'Earn through affiliation',
      descFr: 'Partage les produits des autres et touche des commissions.',
      descEn: 'Share other creators\' products and earn commissions.',
    },
    {
      icon: Compass,
      to: '/discover',
      titleFr: 'Découvrir des produits digitaux',
      titleEn: 'Discover digital products',
      descFr: 'Livres, formations et ressources publiés sur SiteViral.',
      descEn: 'Books, formations and resources published on SiteViral.',
    },
  ];

  return (
    <section id="how" className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <Reveal>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center">
          {fr ? 'Tout ce dont tu as besoin pour monétiser ton savoir.' : 'Everything you need to monetize your knowledge.'}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base text-muted-foreground leading-relaxed">
          {fr
            ? 'Créer → Vendre → Gagner → Découvrir. Une seule plateforme, du premier chapitre au premier paiement.'
            : 'Create → Sell → Earn → Discover. One platform, from first chapter to first payout.'}
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p, i) => (
          <Reveal key={p.titleEn} delay={i * 0.05}>
            <Link
              to={p.to}
              className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </span>
              <span className="text-base font-bold">{fr ? p.titleFr : p.titleEn}</span>
              <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{fr ? p.descFr : p.descEn}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
