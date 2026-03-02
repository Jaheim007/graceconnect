import { Link } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const mainLinks = [
  { to: '/features', label: 'Fonctionnalités' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/ambassador-program', label: 'Ambassadeur' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/terms', label: 'CGU' },
  { to: '/privacy', label: 'Confidentialité' },
  { to: '/contact', label: 'Contact' },
  { to: '/help', label: 'Aide' },
  { to: '/status', label: 'Statut' },
];

const moreLinks = [
  { to: '/about', label: 'À propos' },
  { to: '/pour/influenceurs', label: 'Influenceurs' },
  { to: '/pour/eglises', label: 'Églises' },
  { to: '/pour/ong', label: 'ONG' },
  { to: '/pour/coachs', label: 'Coachs' },
  { to: '/guide/vendre-ebook', label: 'Guides' },
  { to: '/calculateur', label: 'Calculateur' },
  { to: '/etudes-de-cas', label: 'Études de cas' },
  { to: '/temoignages', label: 'Témoignages' },
  { to: '/comparer', label: 'Comparer' },
  { to: '/aml', label: 'AML' },
  { to: '/refund-policy', label: 'Remboursement' },
  { to: '/security', label: 'Sécurité' },
  { to: '/compliance', label: 'Conformité' },
  { to: '/presse', label: 'Presse' },
  { to: '/partenaires', label: 'Partenaires' },
  { to: '/changelog', label: 'Changelog' },
];

export function LandingFooterCompact() {
  const [showMore, setShowMore] = useState(false);

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container px-4 py-10">
        <div className="flex flex-col items-center gap-6">
          <SiteLogo size="md" linked={false} />
          
          {/* Main 10 links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {mainLinks.map(link => (
              <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Collapsible "Plus" */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Plus <ChevronDown className={`h-3 w-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>

          {showMore && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 animate-in fade-in-0 slide-in-from-top-2">
              {moreLinks.map(link => (
                <Link key={link.to} to={link.to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Hacktualiz Inc. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
