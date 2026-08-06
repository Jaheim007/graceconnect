import { Link } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useI18n } from '@/i18n/I18nContext';

export function LandingFooterCompact() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const columns: { title: string; links: { to: string; label: string }[] }[] = [
    {
      title: isFr ? 'Découvrir' : 'Discover',
      links: [
        { to: '/discover',                 label: isFr ? 'Explorer'          : 'Explore' },
        { to: '/discover?type=digital',    label: isFr ? 'Produits digitaux' : 'Digital products' },
        { to: '/discover?type=ebook',      label: isFr ? 'Livres'            : 'Books' },
        { to: '/discover?type=course',     label: isFr ? 'Formations'        : 'Formations' },
      ],
    },
    {
      title: isFr ? 'Pour les clients' : 'For customers',
      links: [
        { to: '/#how',            label: isFr ? 'Comment ça marche' : 'How it works' },
        { to: '/dashboard',       label: isFr ? 'Mon activité'      : 'Activity' },
        { to: '/bookmarks',       label: isFr ? 'Enregistrés'       : 'Saved' },
        { to: '/contact',         label: isFr ? 'Aide'              : 'Help' },
        { to: '/refund-policy',   label: isFr ? 'Remboursement'     : 'Refund policy' },
      ],
    },
    {
      title: isFr ? 'Pour les créateurs' : 'For creators',
      links: [
        { to: '/create-org',      label: isFr ? 'Créer ma plateforme'      : 'Create my platform' },
        { to: '/ecrire',          label: isFr ? 'Écrire un livre'          : 'Write a book' },
        { to: '/creer-formation', label: isFr ? 'Créer une formation'      : 'Create a formation' },
        { to: '/referrals',       label: isFr ? 'Programme d\'affiliation' : 'Earn / affiliation' },
      ],
    },

    {
      title: isFr ? 'Pour les églises' : 'For churches',
      links: [
        { to: '/churches',                label: isFr ? 'SiteViral pour les églises' : 'SiteViral for churches' },
        { to: '/church/pro/onboarding',   label: isFr ? 'Créer un espace église'    : 'Create a church space' },
      ],
    },
    {
      title: isFr ? 'Entreprise' : 'Company',
      links: [
        { to: '/about',    label: isFr ? 'À propos'        : 'About' },
        { to: '/contact',  label: 'Contact' },
        { to: '/terms',    label: isFr ? 'CGU'             : 'Terms' },
        { to: '/privacy',  label: isFr ? 'Confidentialité' : 'Privacy' },
        { to: '/security', label: isFr ? 'Sécurité'        : 'Security' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container px-4 sm:px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1 space-y-4">
            <SiteLogo size="md" linked={false} />
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              {isFr
                ? 'Trouvez un produit, un service ou un professionnel — ou proposez le vôtre.'
                : 'Find a product, a service or a professional — or offer your own.'}
            </p>
          </div>

          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
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
            <Link to="/refund-policy" className="text-muted-foreground hover:text-foreground">{isFr ? 'Remboursement' : 'Refund'}</Link>
            <Link to="/security" className="text-muted-foreground hover:text-foreground">{isFr ? 'Sécurité' : 'Security'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
