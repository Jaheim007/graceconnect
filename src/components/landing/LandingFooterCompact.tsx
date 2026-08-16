import { Link } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export function LandingFooterCompact() {
  const { locale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isFr = locale === 'fr';

  const columns: { title: string; links: { to: string; label: string }[] }[] = [
    {
      title: isFr ? 'Créer' : 'Create',
      links: [
        { to: '/ecrire',          label: isFr ? 'Écrire un livre'      : 'Write a book' },
        { to: '/creer-formation', label: isFr ? 'Créer une formation'  : 'Create a formation' },
        { to: '/create-org',      label: isFr ? 'Créer ma plateforme'  : 'Create my platform' },
        { to: '/pour/auteurs',    label: isFr ? 'Pour les auteurs'     : 'For authors' },
        { to: '/pour/enseignants',label: isFr ? 'Pour les enseignants' : 'For teachers' },
        { to: '/pour/coaches',    label: isFr ? 'Pour les coachs'      : 'For coaches' },
      ],
    },
    {
      title: isFr ? 'Découvrir' : 'Discover',
      links: [
        { to: '/discover',              label: isFr ? 'Explorer'    : 'Explore' },
        { to: '/discover?type=ebook',   label: isFr ? 'Livres'      : 'Books' },
        { to: '/discover?type=course',  label: isFr ? 'Formations'  : 'Formations' },
        { to: '/my-purchases',          label: isFr ? 'Mes achats'  : 'My purchases' },
      ],
    },
    {
      title: isFr ? 'Gagner' : 'Earn',
      links: [
        { to: '/gagner',    label: isFr ? "Vendre les produits des autres" : "Sell other people's products" },
        { to: '/referrals', label: isFr ? "Programme d'affiliation"        : 'Affiliate program' },
        { to: '/partenaires', label: isFr ? 'Devenir partenaire'           : 'Become a partner' },
      ],
    },
    {
      title: isFr ? 'Églises & ONG' : 'Churches & NGOs',
      links: [
        { to: '/churches',              label: isFr ? 'SiteViral pour les églises' : 'SiteViral for churches' },
        { to: '/church/pro/onboarding', label: isFr ? 'Créer un espace église'     : 'Create a church space' },
        { to: '/pour/eglises',          label: isFr ? 'Pour les pasteurs'          : 'For pastors' },
        { to: '/pour/associations',     label: isFr ? 'Pour les associations'      : 'For associations' },
      ],
    },
    {
      title: isFr ? 'Développeurs' : 'Developers',
      links: [
        { to: '/developers',   label: isFr ? 'Vue d’ensemble'   : 'Overview' },
        { to: '/docs',         label: isFr ? 'Documentation'    : 'Documentation' },
        { to: '/docs/api',     label: isFr ? 'Référence outils' : 'Tool reference' },
        { to: '/integrations', label: isFr ? 'Intégrations'     : 'Integrations' },
      ],
    },
    {
      title: isFr ? 'Entreprise' : 'Company',
      links: [
        { to: '/about',   label: isFr ? 'À propos'       : 'About' },
        { to: '/contact', label: isFr ? 'Aide & contact' : 'Help & contact' },
        { to: '/help',    label: isFr ? "Centre d'aide"  : 'Help center' },
        { to: '/roadmap', label: isFr ? 'Feuille de route' : 'Roadmap' },
        { to: '/newsletter', label: 'Newsletter' },
        { to: '/status',  label: isFr ? 'Statut'         : 'Status' },
        { to: '/founders', label: isFr ? 'Fondateurs'    : 'Founders' },
        { to: '/brand',    label: isFr ? 'Marque & presse' : 'Brand & press' },
        { to: '/glossary', label: isFr ? 'Glossaire'      : 'Glossary' },
        { to: '/plan-du-site', label: isFr ? 'Plan du site' : 'Site map' },
      ],
    },
    {
      title: isFr ? 'Légal' : 'Legal',
      links: [
        { to: '/terms',         label: isFr ? 'CGU'             : 'Terms' },
        { to: '/privacy',       label: isFr ? 'Confidentialité' : 'Privacy' },
        { to: '/refund-policy', label: isFr ? 'Remboursements'  : 'Refunds' },
        { to: '/payout-policy', label: isFr ? 'Versements'      : 'Payouts' },
        { to: '/security',      label: isFr ? 'Sécurité'        : 'Security' },
        { to: '/cookies',       label: isFr ? 'Cookies'         : 'Cookies' },
        { to: '/copyright',     label: isFr ? 'Droits d’auteur' : 'Copyright' },
        { to: '/data-deletion', label: isFr ? 'Suppression données' : 'Data deletion' },
        { to: '/legal-notices', label: isFr ? 'Mentions légales' : 'Legal notices' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container px-4 sm:px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-1 space-y-4">
            <SiteLogo size="md" linked={false} />
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              {isFr
                ? 'Écris ton livre ou ta formation, vends-le sur ta propre page, reçois ton argent en Mobile Money.'
                : 'Write your book or formation, sell it on your own page, get paid by Mobile Money.'}
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
            <Link to="/churches" className="text-muted-foreground hover:text-foreground">{isFr ? 'Églises' : 'Churches'}</Link>
            <Link to="/status" className="text-muted-foreground hover:text-foreground">{isFr ? 'Statut' : 'Status'}</Link>
            <Link to="/security" className="text-muted-foreground hover:text-foreground">{isFr ? 'Sécurité' : 'Security'}</Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={toggleTheme}
              aria-label={isFr ? 'Changer de thème' : 'Toggle theme'}
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {theme === 'dark' ? (isFr ? 'Clair' : 'Light') : (isFr ? 'Sombre' : 'Dark')}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
