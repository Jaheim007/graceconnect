import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Menu, X, ArrowRight, User, LogOut, CreditCard, Sparkles, Gift, BarChart3, Package, Settings, ShieldCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { PlanBadge } from '@/components/billing/PlanBadge';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/capacitor';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LandingNav() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const { user, profile, signOut, isSuperadmin } = useAuth();
  const nativeApp = isNativePlatform();

  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const initials = displayName ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const verticals = [
    { to: '/beauty',   label: isFr ? 'Beauté'            : 'Beauty' },
    { to: '/education',label: isFr ? 'Cours & tuteurs'   : 'Tutoring' },
    { to: '/home',     label: isFr ? 'Artisans'          : 'Artisans' },
    { to: '/events',   label: isFr ? 'Événements'        : 'Events' },
    { to: '/church',   label: isFr ? 'Églises'           : 'Churches' },
    { to: '/discover?type=digital', label: isFr ? 'Produits digitaux' : 'Digital products' },
    { to: '/discover?type=music',   label: isFr ? 'Musique'      : 'Music' },
    { to: '/discover?type=influencer', label: isFr ? 'Influenceurs' : 'Influencers' },
    { to: '/discover', label: isFr ? 'Tous les services' : 'All services' },
  ];

  const navItems = [
    { to: '/discover',     label: isFr ? 'Explorer'   : 'Explore' },
    { to: '/start-selling',label: isFr ? 'Proposer un service' : 'Offer a service' },
    { to: '/pricing',      label: t('landing_nav.pricing') },
  ];

  return (
    <header className={cn(
      'fixed top-0 z-50 w-full border-b border-border/40',
      nativeApp ? 'native-landing-topbar bg-background/95' : 'glass'
    )}>
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <SiteLogo size="md" animate />
          {nativeApp && <span className="text-sm font-semibold tracking-tight text-foreground">SiteViral</span>}
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button key={item.label} variant="ghost" size="sm" asChild className="text-xs">
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                {isFr ? 'Catégories' : 'Categories'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {isFr ? 'Univers SiteViral' : 'SiteViral universes'}
              </DropdownMenuLabel>
              {verticals.map((v) => (
                <DropdownMenuItem key={v.to} onClick={() => navigate(v.to)} className="text-xs">
                  {v.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {user && <PlanBadge compact />}
          <GlobalPreferencesSelector />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label={theme === 'dark' ? (isFr ? 'Activer le thème clair' : 'Switch to light theme') : (isFr ? 'Activer le thème sombre' : 'Switch to dark theme')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            /* ── Logged-in: show avatar dropdown ── */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-muted/60 transition-colors">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:block text-xs font-medium text-foreground max-w-[100px] truncate">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {isFr ? 'Mon compte' : 'My account'}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-xs gap-2">
                  <User className="h-3.5 w-3.5" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-programs')} className="text-xs gap-2">
                  <Package className="h-3.5 w-3.5" /> {isFr ? 'Mes achats' : 'My purchases'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')} className="text-xs gap-2">
                  <CreditCard className="h-3.5 w-3.5" /> {isFr ? 'Mon abonnement' : 'My subscription'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing/usage')} className="text-xs gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> {isFr ? 'Mon usage du mois' : 'Monthly usage'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-reviews')} className="text-xs gap-2">
                  <MessageSquare className="h-3.5 w-3.5" /> {isFr ? 'Mes avis' : 'My reviews'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/referrals')} className="text-xs gap-2">
                  <Gift className="h-3.5 w-3.5" /> {isFr ? 'Parrainage' : 'Referrals'}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {isFr ? 'Créateur' : 'Creator'}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/admin')} className="text-xs gap-2">
                  <Settings className="h-3.5 w-3.5" /> {isFr ? 'Espace admin' : 'Admin panel'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/creator/analytics')} className="text-xs gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> {isFr ? 'Analytics avancées' : 'Advanced analytics'}
                </DropdownMenuItem>

                {isSuperadmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/superadmin')} className="text-xs gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> Superadmin
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-xs gap-2 text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> {t('sidebar.sign_out') || (isFr ? 'Déconnexion' : 'Sign out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* ── Not logged in ── */
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/start-selling')} className="hidden md:inline-flex text-xs px-3 font-semibold">
                {isFr ? 'Proposer mes services' : 'Offer my services'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=signin')} className="hidden sm:inline-flex text-xs px-3">
                {t('landing_nav.sign_in')}
              </Button>
              <Button size="sm" className="text-xs px-4 gap-1.5 bg-foreground text-background hover:bg-foreground/90" onClick={() => navigate('/auth?mode=signup')}>
                {isFr ? 'Rejoindre' : 'Join'} <ArrowRight className="h-3 w-3 hidden sm:block" />
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? (isFr ? 'Fermer le menu' : 'Close menu') : (isFr ? 'Ouvrir le menu' : 'Open menu')} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-sm overflow-hidden"
          >
            <nav className="container px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-border/40">
                <div className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {isFr ? 'Catégories' : 'Categories'}
                </div>
                {verticals.map((v) => (
                  <Link key={v.to} to={v.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                    {v.label}
                  </Link>
                ))}
              </div>
              {user ? (
                <div className="pt-2 border-t border-border/40 mt-2 space-y-1">
                  {[
                    { to: '/dashboard', icon: User, label: 'Dashboard' },
                    { to: '/my-programs', icon: Package, label: isFr ? 'Mes achats' : 'My purchases' },
                    { to: '/billing', icon: CreditCard, label: isFr ? 'Mon abonnement' : 'My subscription' },
                    { to: '/billing/usage', icon: Sparkles, label: isFr ? 'Mon usage du mois' : 'Monthly usage' },
                    { to: '/my-reviews', icon: MessageSquare, label: isFr ? 'Mes avis' : 'My reviews' },
                    { to: '/referrals', icon: Gift, label: isFr ? 'Parrainage' : 'Referrals' },
                    { to: '/admin', icon: Settings, label: isFr ? 'Espace admin' : 'Admin panel' },
                    { to: '/creator/analytics', icon: BarChart3, label: isFr ? 'Analytics avancées' : 'Advanced analytics' },
                  ].map((it) => (
                    <button
                      key={it.to}
                      onClick={() => { navigate(it.to); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <it.icon className="h-4 w-4 text-muted-foreground" /> {it.label}
                    </button>
                  ))}
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" /> {isFr ? 'Déconnexion' : 'Sign out'}
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-border/40 mt-2 space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => { navigate('/auth?mode=signin'); setMenuOpen(false); }}>
                    {t('landing_nav.sign_in')}
                  </Button>
                  <Button className="w-full gap-1.5" onClick={() => { navigate('/auth?mode=signup'); setMenuOpen(false); }}>
                    {t('landing_nav.get_started')} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}