import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  Menu, X, ArrowRight, User, LogOut, CreditCard, Sparkles, Gift,
  BarChart3, Package, Settings, ShieldCheck, MessageSquare, Church,
} from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const { user, profile, signOut, isSuperadmin } = useAuth();
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
        {/* Left cluster: logo only — the crowded link row was removed */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center shrink-0" aria-label="SiteViral">
            <SiteLogo size="md" animate linked={false} />
          </Link>
        </div>


        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {user && <PlanBadge compact />}
          <div className="hidden sm:block">
            <GlobalPreferencesSelector />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted/60 transition-colors">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {isFr ? 'Mon compte' : 'My account'}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-sm gap-2"><User className="h-4 w-4" /> Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-programs')} className="text-sm gap-2"><Package className="h-4 w-4" /> {isFr ? 'Mes achats' : 'My purchases'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')} className="text-sm gap-2"><CreditCard className="h-4 w-4" /> {isFr ? 'Mon abonnement' : 'Subscription'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-reviews')} className="text-sm gap-2"><MessageSquare className="h-4 w-4" /> {isFr ? 'Mes avis' : 'My reviews'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/referrals')} className="text-sm gap-2"><Gift className="h-4 w-4" /> {isFr ? 'Parrainage' : 'Referrals'}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/create-org')} className="text-sm gap-2"><Sparkles className="h-4 w-4" /> {isFr ? 'Créer ma plateforme' : 'Create my platform'}</DropdownMenuItem>
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
                onClick={() => navigate('/create-org')}
                className="hidden md:inline-flex text-sm font-semibold h-10 px-4"
              >
                {isFr ? 'Créer ma plateforme' : 'Create my platform'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/auth?mode=signin')}
                className="hidden sm:inline-flex text-sm font-semibold h-10 px-4"
              >
                {isFr ? 'Se connecter' : 'Sign in'}
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=signup')}
                className="h-10 px-4 sm:px-5 text-sm font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                {isFr ? 'Créer un compte' : 'Create account'}
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
            <nav className="container px-4 py-4 space-y-1">
              {primaryLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                  {l.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between px-1">
                <GlobalPreferencesSelector />
                <Link to="/churches" onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold text-foreground/80 inline-flex items-center gap-1.5">
                  <Church className="h-4 w-4" /> {isFr ? 'Pour les églises' : 'For churches'}
                </Link>
              </div>
              {!user && (
                <div className="pt-3 border-t border-border/60 mt-2 space-y-2">
                  <Button variant="outline" className="w-full h-11 font-semibold" onClick={() => { navigate('/create-org'); setMenuOpen(false); }}>
                    {isFr ? 'Créer ma plateforme' : 'Create my platform'}
                  </Button>
                  <Button variant="ghost" className="w-full h-11 font-semibold" onClick={() => { navigate('/auth?mode=signin'); setMenuOpen(false); }}>
                    {isFr ? 'Se connecter' : 'Sign in'}
                  </Button>
                  <Button className="w-full h-11 font-semibold gap-1.5" onClick={() => { navigate('/auth?mode=signup'); setMenuOpen(false); }}>
                    {isFr ? 'Créer un compte' : 'Create account'} <ArrowRight className="h-3.5 w-3.5" />
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
