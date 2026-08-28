import { useMemo } from 'react';
import { LifeBuoy, BookOpen, Keyboard, MessageCircle, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Contextual quick answers, keyed by route prefix. */
const CONTEXTUAL_HELP: Record<string, { q: string; a: string }[]> = {
  '/admin/kyc': [
    { q: 'Pourquoi le KYC est-il obligatoire ?', a: 'Le KYC est requis pour recevoir vos fonds. La vérification prend 48h.' },
  ],
  '/admin/payouts': [
    { q: 'Quand reçois-je mes fonds ?', a: 'Vendeurs après 3 jours, ambassadeurs après 15 jours.' },
  ],
  '/admin/products': [
    { q: 'Comment créer un produit ?', a: 'Cliquez « Nouveau produit », ajoutez titre, fichier et couverture, puis publiez.' },
  ],
  '/gagner': [
    { q: 'Comment devenir ambassadeur ?', a: 'Choisis un produit, clique « Promouvoir » pour obtenir ton lien unique.' },
  ],
};

function getContextualHelp(pathname: string) {
  for (const [path, faqs] of Object.entries(CONTEXTUAL_HELP)) {
    if (pathname.startsWith(path)) return faqs;
  }
  return [];
}

/**
 * HelpMenuButton — the support entry point, now a real icon button living in
 * the header (mobile + desktop) instead of a floating overlay.
 */
export function HelpMenuButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const faqs = useMemo(() => getContextualHelp(location.pathname), [location.pathname]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={isFr ? 'Aide et support' : 'Help and support'}
          className={cn(
            'grid place-items-center rounded-full text-amber-500 dark:text-amber-400',
            'bg-muted/60 hover:bg-muted transition-colors shrink-0',
            className,
          )}
        >
          <LifeBuoy className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">
          {isFr ? 'Besoin d’aide ?' : 'Need help?'}
        </DropdownMenuLabel>
        {faqs.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 space-y-2">
              {faqs.map((f, i) => (
                <div key={i}>
                  <p className="text-[11px] font-semibold flex items-start gap-1.5">
                    <HelpCircle className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                    {f.q}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed pl-4.5">{f.a}</p>
                </div>
              ))}
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/help')}>
          <LifeBuoy className="h-3.5 w-3.5 mr-2" />
          {isFr ? 'Centre d’aide' : 'Help Center'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/tutoriels')}>
          <BookOpen className="h-3.5 w-3.5 mr-2" />
          {isFr ? 'Tutoriels & guides' : 'Tutorials & guides'}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="hidden lg:flex"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        >
          <Keyboard className="h-3.5 w-3.5 mr-2" />
          {isFr ? 'Raccourcis clavier' : 'Keyboard shortcuts'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open('mailto:support@siteviral.com', '_blank')}>
          <MessageCircle className="h-3.5 w-3.5 mr-2" />
          {isFr ? 'Nous contacter' : 'Contact us'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
