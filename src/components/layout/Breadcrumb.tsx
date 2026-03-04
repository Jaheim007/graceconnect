import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

const ROUTE_LABELS: Record<string, string> = {
  org: 'Organisation',
  product: 'Produit',
  campaign: 'Campagne',
  event: 'Événement',
  admin: 'Administration',
  discover: 'Explorer',
  marketplace: 'Marketplace',
  feed: 'Fil',
  dashboard: 'Tableau de bord',
  media: 'Médias',
  products: 'Produits',
  campaigns: 'Campagnes',
  events: 'Événements',
  announcements: 'Annonces',
  members: 'Membres',
  analytics: 'Tableau de bord',
  settings: 'Paramètres',
  kyc: 'Vérification',
  payouts: 'Versements',
  sales: 'Ventes',
  programs: 'Programmes',
  notifications: 'Notifications',
  profile: 'Profil',
  bookmarks: 'Favoris',
  ambassador: 'Ambassadeur',
  affiliation: 'Affiliation',
};

interface BreadcrumbProps {
  /** Override crumbs instead of auto-generating from path */
  items?: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { pathname } = useLocation();

  const crumbs = items || (() => {
    const parts = pathname.split('/').filter(Boolean);
    const result: { label: string; href: string }[] = [];
    let path = '';
    for (const part of parts) {
      path += `/${part}`;
      // Skip UUID-like segments as labels
      if (/^[0-9a-f]{8}-/.test(part)) continue;
      // Skip 'p' shorthand
      if (part === 'p' || part === 'new') continue;
      result.push({ label: ROUTE_LABELS[part] || decodeURIComponent(part), href: path });
    }
    return result;
  })();

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-xs text-muted-foreground mb-4 overflow-x-auto">
      <Link to="/" className="hover:text-foreground transition-colors shrink-0">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <Fragment key={i}>
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
          {i === crumbs.length - 1 || !crumb.href ? (
            <span className="text-foreground font-medium truncate max-w-[200px]">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-foreground transition-colors truncate max-w-[200px]">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
