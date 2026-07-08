import { Link } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useI18n } from '@/i18n/I18nContext';

export function LandingFooterCompact() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const columns: { title: string; links: { to: string; label: string }[] }[] = [
    {
      title: isFr ? 'Catégories' : 'Categories',
      links: [
        { to: '/beauty',                   label: isFr ? 'Beauté'            : 'Beauty' },
        { to: '/education',                label: isFr ? 'Cours & tuteurs'   : 'Tutoring' },
        { to: '/home',                     label: isFr ? 'Artisans'          : 'Home & artisans' },
        { to: '/events',                   label: isFr ? 'Événements'        : 'Events' },
        { to: '/church',                   label: isFr ? 'Églises'           : 'Churches' },
        { to: '/discover?type=digital',    label: isFr ? 'Produits digitaux' : 'Digital products' },
        { to: '/discover?type=music',      label: isFr ? 'Musique'           : 'Music' },
        { to: '/discover?type=influencer', label: isFr ? 'Influenceurs'      : 'Influencers' },
      ],
    },
    {
      title: isFr ? 'Pour les clients' : 'For clients',
      links: [
        { to: '/looking-for', label: isFr ? 'Trouver un service' : 'Find a service' },
        { to: '/discover',    label: isFr ? 'Explorer'           : 'Explore' },
        { to: '/how-it-works',label: isFr ? 'Comment ça marche'  : 'How it works' },
        { to: '/temoignages', label: isFr ? 'Témoignages'        : 'Testimonials' },
        { to: '/faq',         label: 'FAQ' },
        { to: '/help',        label: isFr ? 'Aide'               : 'Help center' },
      ],
    },
    {
      title: isFr ? 'Pour les pros' : 'For pros',
      links: [
        { to: '/start-selling',      label: isFr ? 'Devenir vendeur'      : 'Become a seller' },
        { to: '/start',              label: isFr ? 'Créer mon espace'     : 'Create my space' },
        { to: '/pricing',            label: isFr ? 'Tarifs'               : 'Pricing' },
        { to: '/ambassador-program', label: isFr ? 'Programme ambassadeur': 'Ambassador program' },
        { to: '/guide/vendre-ebook-afrique', label: 'Guides' },
        { to: '/calculateur',        label: isFr ? 'Calculateur revenus'  : 'Earnings calculator' },
      ],
    },
    {
      title: isFr ? 'Entreprise' : 'Company',
      links: [
        { to: '/about',    label: isFr ? 'À propos'      : 'About' },
        { to: '/blog',     label: 'Blog' },
        { to: '/presse',   label: isFr ? 'Presse'        : 'Press' },
        { to: '/partenaires', label: isFr ? 'Partenaires' : 'Partners' },
        { to: '/contact',  label: 'Contact' },
        { to: '/terms',    label: isFr ? 'CGU'           : 'Terms' },
        { to: '/privacy',  label: isFr ? 'Confidentialité' : 'Privacy' },
        { to: '/security', label: isFr ? 'Sécurité'      : 'Security' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1 space-y-4">
            <SiteLogo size="md" linked={false} />
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              {isFr
                ? 'La marketplace panafricaine des services et produits digitaux.'
                : 'The pan-African marketplace for services and digital products.'}
            </p>
            <div className="flex items-center gap-1 text-base">
              🇬🇭 🇰🇪 🇨🇮 🇳🇬 🇿🇦 🇺🇸 🇬🇧 🇫🇷
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hacktualiz Inc. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/status" className="text-muted-foreground hover:text-foreground">{isFr ? 'Statut' : 'Status'}</Link>
            <Link to="/changelog" className="text-muted-foreground hover:text-foreground">Changelog</Link>
            <Link to="/refund-policy" className="text-muted-foreground hover:text-foreground">{isFr ? 'Remboursement' : 'Refund'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
