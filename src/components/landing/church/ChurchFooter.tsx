import { Link } from 'react-router-dom';
import { Church } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Compact footer for the standalone church funnel — legal + support only.
 */
export function ChurchFooter() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const links = [
    { to: '/contact', label: fr ? 'Aide' : 'Help' },
    { to: '/payout-policy', label: fr ? 'Versements' : 'Payouts' },
    { to: '/refund-policy', label: fr ? 'Remboursements' : 'Refunds' },
    { to: '/terms', label: fr ? 'CGU' : 'Terms' },
    { to: '/privacy', label: fr ? 'Confidentialité' : 'Privacy' },
    { to: '/security', label: fr ? 'Sécurité' : 'Security' },
    { to: '/landing', label: fr ? 'SiteViral pour les créateurs' : 'SiteViral for creators' },
  ];

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">
              SiteViral <span className="text-primary">{fr ? 'Églises' : 'Churches'}</span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} Hacktualiz Inc. {fr ? 'Tous droits réservés.' : 'All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}
