import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { Link } from 'react-router-dom';

export default function SiteMapPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const sections: { title: string; links: { to: string; label: string }[] }[] = [
    {
      title: isFr ? 'Créer & vendre' : 'Create & sell',
      links: [
        { to: '/ecrire', label: isFr ? 'Écrire un livre' : 'Write a book' },
        { to: '/creer-formation', label: isFr ? 'Créer une formation' : 'Create a course' },
        { to: '/create-org', label: isFr ? 'Créer ma plateforme' : 'Create my platform' },
        { to: '/pricing', label: isFr ? 'Tarifs' : 'Pricing' },
        { to: '/gagner', label: isFr ? 'Vendre les produits des autres' : "Sell other people's products" },
        { to: '/referrals', label: isFr ? 'Programme d’affiliation' : 'Affiliate program' },
        { to: '/partenaires', label: isFr ? 'Devenir partenaire' : 'Become a partner' },
      ],
    },
    {
      title: isFr ? 'Découvrir' : 'Discover',
      links: [
        { to: '/discover', label: isFr ? 'Explorer le catalogue' : 'Explore the catalogue' },
        { to: '/discover?type=ebook', label: isFr ? 'Livres' : 'Books' },
        { to: '/discover?type=course', label: isFr ? 'Formations' : 'Courses' },
        { to: '/my-purchases', label: isFr ? 'Mes achats' : 'My purchases' },
        { to: '/churches', label: isFr ? 'Églises & ONG' : 'Churches & NGOs' },
      ],
    },
    {
      title: isFr ? 'Développeurs' : 'Developers',
      links: [
        { to: '/developers', label: isFr ? 'Vue d’ensemble' : 'Overview' },
        { to: '/docs', label: 'Documentation' },
        { to: '/docs/api', label: isFr ? 'Référence des outils' : 'Tool reference' },
        { to: '/integrations', label: isFr ? 'Intégrations' : 'Integrations' },
        { to: '/status', label: isFr ? 'Statut du service' : 'Service status' },
      ],
    },
    {
      title: isFr ? 'Ressources' : 'Resources',
      links: [
        { to: '/help', label: isFr ? 'Centre d’aide' : 'Help center' },
        { to: '/support', label: 'Support' },
        { to: '/faq', label: 'FAQ' },
        { to: '/tutoriels', label: isFr ? 'Tutoriels interactifs' : 'Interactive tutorials' },
        { to: '/blog', label: 'Blog' },
        { to: '/glossary', label: isFr ? 'Glossaire' : 'Glossary' },
        { to: '/etudes-de-cas', label: isFr ? 'Études de cas' : 'Case studies' },
        { to: '/comparer', label: isFr ? 'Comparaison' : 'Comparison' },
      ],
    },
    {
      title: isFr ? 'Entreprise' : 'Company',
      links: [
        { to: '/about', label: isFr ? 'À propos' : 'About' },
        { to: '/founders', label: isFr ? 'Fondateurs' : 'Founders' },
        { to: '/changelog', label: 'Changelog' },
        { to: '/roadmap', label: isFr ? 'Feuille de route' : 'Roadmap' },
        { to: '/newsletter', label: 'Newsletter' },
        { to: '/brand', label: isFr ? 'Marque & presse' : 'Brand & press' },
        { to: '/presse', label: isFr ? 'Presse' : 'Press' },
        { to: '/contact', label: 'Contact' },
      ],
    },
    {
      title: isFr ? 'Confiance & légal' : 'Trust & legal',
      links: [
        { to: '/terms', label: isFr ? 'Conditions d’utilisation' : 'Terms of service' },
        { to: '/privacy', label: isFr ? 'Confidentialité' : 'Privacy' },
        { to: '/cookies', label: 'Cookies' },
        { to: '/dpa', label: 'DPA' },
        { to: '/security', label: isFr ? 'Sécurité' : 'Security' },
        { to: '/compliance', label: isFr ? 'Conformité' : 'Compliance' },
        { to: '/subprocessors', label: isFr ? 'Sous-traitants' : 'Subprocessors' },
        { to: '/aml', label: isFr ? 'Lutte anti-blanchiment' : 'AML' },
        { to: '/acceptable-use', label: isFr ? 'Usage acceptable' : 'Acceptable use' },
        { to: '/refund-policy', label: isFr ? 'Remboursements' : 'Refunds' },
        { to: '/payout-policy', label: isFr ? 'Versements' : 'Payouts' },
        { to: '/copyright', label: isFr ? 'Droits d’auteur' : 'Copyright' },
        { to: '/legal-notices', label: isFr ? 'Mentions légales' : 'Legal notices' },
        { to: '/data-deletion', label: isFr ? 'Suppression des données' : 'Data deletion' },
        { to: '/report', label: isFr ? 'Signaler un abus' : 'Report abuse' },
      ],
    },
  ];

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Plan du site — Siteviral' : 'Site map — Siteviral'}
        description={isFr
          ? 'Toutes les pages publiques de Siteviral en un seul endroit : créer, vendre, découvrir, développeurs, ressources, entreprise et légal.'
          : 'Every public Siteviral page in one place: create, sell, discover, developers, resources, company and legal.'}
        canonicalUrl="https://siteviral.com/plan-du-site"
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Plan du site' : 'Site map'}
      </h1>
      <p className="text-sm text-muted-foreground mb-10 font-medium max-w-xl">
        {isFr
          ? 'Toutes les pages publiques de Siteviral, regroupées par usage.'
          : 'Every public Siteviral page, grouped by purpose.'}
      </p>

      <div className="grid gap-8 sm:grid-cols-2">
        {sections.map(s => (
          <section key={s.title}>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-3 text-foreground">{s.title}</h2>
            <ul className="space-y-2">
              {s.links.map(l => (
                <li key={l.to + l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </LegalPageShell>
  );
}
