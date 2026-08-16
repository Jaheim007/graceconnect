import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Menu, X, ArrowRight, User, LogOut, CreditCard, BarChart3, Package, Settings, ShieldCheck, MessageSquare, Gift, Church, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { PlanBadge } from '@/components/billing/PlanBadge';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/capacitor';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LandingNav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const { user, profile, signOut, isSuperadmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nativeApp = isNativePlatform();

  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const initials = displayName ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b border-border/60 backdrop-blur',
      nativeApp ? 'native-landing-topbar bg-background/95' : 'bg-background/85'
    )}>
      <div className="container flex items-center justify-between h-16 sm:h-[72px] px-4 sm:px-6">
        {/* Left cluster: logo + resource links */}
        <div className="flex items-center gap-7">
          <Link to="/" className="flex h-10 items-center shrink-0" aria-label="SiteViral">
            <SiteLogo size="md" animate linked={false} />
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { to: '/developers', label: isFr ? 'Développeurs' : 'Developers' },
              { to: '/docs', label: isFr ? 'Documentation' : 'Docs' },
              { to: '/integrations', label: isFr ? 'Intégrations' : 'Integrations' },
              { to: '/help', label: isFr ? 'Aide' : 'Support' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex h-10 items-center rounded-full px-3 text-sm font-semibold leading-none text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>


        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {user && <PlanBadge compact />}
          <div className="flex items-center">
            <GlobalPreferencesSelector className="h-10 px-2 sm:px-2.5 rounded-full border border-border/60" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hidden sm:inline-flex rounded-full hover:bg-muted/60"
            onClick={toggleTheme}
            aria-label={isFr ? 'Changer de thème' : 'Toggle theme'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-10 px-2 rounded-full hover:bg-muted/60 transition-colors">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium leading-none text-foreground max-w-[120px] truncate">{displayName}</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {isFr ? 'Mon compte' : 'My account'}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-sm gap-2"><User className="h-4 w-4" /> Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-purchases?tab=courses')} className="text-sm gap-2"><Package className="h-4 w-4" /> {isFr ? 'Mes achats' : 'My purchases'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')} className="text-sm gap-2"><CreditCard className="h-4 w-4" /> {isFr ? 'Mon abonnement' : 'Subscription'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-reviews')} className="text-sm gap-2"><MessageSquare className="h-4 w-4" /> {isFr ? 'Mes avis' : 'My reviews'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/referrals')} className="text-sm gap-2"><Gift className="h-4 w-4" /> {isFr ? 'Parrainage' : 'Referrals'}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/create-org')} className="text-sm gap-2"> {isFr ? 'Créer ma plateforme' : 'Create my platform'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin')} className="text-sm gap-2"><Settings className="h-4 w-4" /> {isFr ? 'Espace admin' : 'Admin panel'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/creator/analytics')} className="text-sm gap-2"><BarChart3 className="h-4 w-4" /> Analytics</DropdownMenuItem>
                {isSuperadmin && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => navigate('/superadmin')} className="text-sm gap-2"><ShieldCheck className="h-4 w-4" /> Superadmin</DropdownMenuItem></>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-sm gap-2 text-destructive"><LogOut className="h-4 w-4" /> {t('sidebar.sign_out') || (isFr ? 'Déconnexion' : 'Sign out')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/auth?mode=signin')}
                className="hidden sm:inline-flex text-sm font-semibold h-10 px-4"
              >
                {isFr ? 'Se connecter' : 'Sign in'}
              </Button>
              <Button
                onClick={() => navigate('/create-org')}
                className="h-10 px-4 sm:px-5 text-sm font-semibold gap-1.5"
              >
                {isFr ? 'Créer ma plateforme' : 'Create my platform'}
                <ArrowRight className="h-3.5 w-3.5 hidden sm:block" />
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="h-10 w-10 lg:hidden" onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? (isFr ? 'Fermer le menu' : 'Close menu') : (isFr ? 'Ouvrir le menu' : 'Open menu')}
            aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/60 bg-background overflow-hidden"
          >
            <nav className="container px-4 py-4">
              <Link
                to="/churches"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3.5 transition-colors hover:bg-muted/70"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Church className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight">{isFr ? 'Pour les églises' : 'For churches'}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {isFr ? 'Sermons, dons, membres' : 'Sermons, giving, members'}
                  </span>
                </span>
              </Link>

              <p className="px-1 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {isFr ? 'Ressources' : 'Resources'}
              </p>
              <div className="overflow-hidden rounded-2xl border border-border/60 divide-y divide-border/60">
                {[
                  { to: '/developers', label: isFr ? 'Développeurs' : 'Developers' },
                  { to: '/docs', label: isFr ? 'Documentation' : 'Docs' },
                  { to: '/integrations', label: isFr ? 'Intégrations' : 'Integrations' },
                  { to: '/help', label: isFr ? 'Aide' : 'Support' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground/85 transition-colors hover:bg-muted/50"
                  >
                    {item.label}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>

              {!user && (
                <div className="mt-5 space-y-2">
                  <Button className="w-full h-12 text-sm font-bold gap-1.5" onClick={() => { navigate('/create-org'); setMenuOpen(false); }}>
                    {isFr ? 'Créer ma plateforme' : 'Create my platform'} <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full h-12 text-sm font-semibold" onClick={() => { navigate('/auth?mode=signin'); setMenuOpen(false); }}>
                    {isFr ? 'Se connecter' : 'Sign in'}
                  </Button>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                <GlobalPreferencesSelector className="h-10 px-3 rounded-full border border-border/60" />
                <Button
                  variant="ghost"
                  className="h-10 gap-2 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={toggleTheme}
                  aria-label={isFr ? 'Changer de thème' : 'Toggle theme'}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {theme === 'dark' ? (isFr ? 'Clair' : 'Light') : (isFr ? 'Sombre' : 'Dark')}
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
