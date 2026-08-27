import { useLocation, Link } from "@/lib/router-compat";
import { useEffect } from "react";
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Search, Home, ShoppingBag, HelpCircle, LayoutDashboard } from 'lucide-react';
import { GlobalSearch } from '@/components/search/GlobalSearch';

const NotFound = () => {
  const location = useLocation();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const isFr = locale === 'fr';
  const isLoggedIn = !!user;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="sv-nav-clearance flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SEOHead title="404 — Page introuvable | Siteviral" noindex />
      <div className="text-center max-w-md mx-auto space-y-6">
        <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground font-medium">
            {isFr ? 'Cette page n\'existe pas ou a été déplacée.' : 'This page doesn\'t exist or has been moved.'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">
            {isFr ? 'Essayez de rechercher ce que vous cherchez :' : 'Try searching for what you need:'}
          </p>
          <GlobalSearch />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {isLoggedIn ? (
            <>
              <Button asChild variant="default" className="gap-2">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> {isFr ? 'Mon tableau de bord' : 'My Dashboard'}</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/marketplace"><ShoppingBag className="h-4 w-4" /> {isFr ? 'Explorer' : 'Explore'}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="default" className="gap-2">
                <Link to="/"><Home className="h-4 w-4" /> {isFr ? 'Accueil' : 'Home'}</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/marketplace"><ShoppingBag className="h-4 w-4" /> {isFr ? 'Explorer' : 'Explore'}</Link>
              </Button>
            </>
          )}
          <Button asChild variant="outline" className="gap-2 col-span-2">
            <Link to="/support"><HelpCircle className="h-4 w-4" /> {isFr ? 'Aide & Support' : 'Help & Support'}</Link>
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {isFr ? 'URL demandée : ' : 'Requested URL: '}
          <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
