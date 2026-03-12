import { Link } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function LandingFooterCompact() {
  const [showMore, setShowMore] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const mainLinks = [
    { to: '/features', label: isFr ? 'Fonctionnalités' : 'Features' },
    { to: '/discover', label: isFr ? 'Explorer' : 'Explore' },
    { to: '/ambassador-program', label: isFr ? 'Ambassadeur' : 'Ambassador' },
    { to: '/blog', label: 'Blog' },
    { to: '/faq', label: 'FAQ' },
    { to: '/terms', label: isFr ? 'CGU' : 'Terms' },
    { to: '/privacy', label: isFr ? 'Confidentialité' : 'Privacy' },
    { to: '/contact', label: 'Contact' },
    { to: '/help', label: isFr ? 'Aide' : 'Help' },
    { to: '/status', label: isFr ? 'Statut' : 'Status' },
  ];

  const moreLinks = [
    { to: '/about', label: isFr ? 'À propos' : 'About' },
    { to: '/pour/influenceurs', label: isFr ? 'Influenceurs' : 'Influencers' },
    { to: '/pour/eglises', label: isFr ? 'Églises' : 'Churches' },
    { to: '/pour/ong', label: isFr ? 'ONG' : 'NGOs' },
    { to: '/pour/coaches', label: isFr ? 'Coachs' : 'Coaches' },
    { to: '/guide/vendre-ebook-afrique', label: 'Guides' },
    { to: '/calculateur', label: isFr ? 'Calculateur' : 'Calculator' },
    { to: '/etudes-de-cas', label: isFr ? 'Études de cas' : 'Case studies' },
    { to: '/temoignages', label: isFr ? 'Témoignages' : 'Testimonials' },
    { to: '/comparer', label: isFr ? 'Comparer' : 'Compare' },
    { to: '/aml', label: 'AML' },
    { to: '/refund-policy', label: isFr ? 'Remboursement' : 'Refund' },
    { to: '/security', label: isFr ? 'Sécurité' : 'Security' },
    { to: '/compliance', label: isFr ? 'Conformité' : 'Compliance' },
    { to: '/presse', label: isFr ? 'Presse' : 'Press' },
    { to: '/partenaires', label: isFr ? 'Partenaires' : 'Partners' },
    { to: '/changelog', label: 'Changelog' },
  ];

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container px-4 py-10">
        <div className="flex flex-col items-center gap-6">
          <SiteLogo size="md" linked={false} />
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {mainLinks.map(link => (
              <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isFr ? 'Plus' : 'More'} <ChevronDown className={`h-3 w-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
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

        <div className="mt-8 pt-4 border-t border-border/40 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-sm">
            🇬🇭 🇰🇪 🇨🇮 🇳🇬 🇿🇦 🇺🇸 🇬🇧 🇫🇷
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hacktualiz Inc. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
