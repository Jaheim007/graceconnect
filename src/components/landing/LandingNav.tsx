import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon, Menu, X, ArrowRight, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LandingNav() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();
  const { user, profile, signOut } = useAuth();

  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const initials = displayName ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const navItems = [
    { to: '/ecrire', label: t('landing_nav.write') },
    { to: '/gagner', label: t('landing_nav.earn') },
    { to: '/discover', label: t('landing_nav.explore') },
    { to: '#pricing', label: t('landing_nav.pricing'), isAnchor: true },
  ];

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
      <div className="container flex items-center justify-between h-14 px-4">
        <SiteLogo size="md" animate />
        
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            item.isAnchor ? (
              <Button key={item.label} variant="ghost" size="sm" asChild className="text-xs">
                <a href={item.to}>{item.label}</a>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" size="sm" asChild className="text-xs">
                <Link to={item.to}>{item.label}</Link>
              </Button>
            )
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-xs gap-2">
                  <User className="h-3.5 w-3.5" /> {t('sidebar.home') || 'Mon espace'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-xs gap-2 text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> {t('sidebar.sign_out') || 'Déconnexion'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* ── Not logged in: show sign-in / get started ── */
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=signin')} className="hidden sm:inline-flex text-xs px-3">
                {t('landing_nav.sign_in')}
              </Button>
              <Button size="sm" className="text-xs px-4 gap-1.5" onClick={() => navigate('/auth?mode=signup')}>
                {t('landing_nav.get_started')} <ArrowRight className="h-3 w-3 hidden sm:block" />
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
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
                item.isAnchor ? (
                  <a key={item.label} href={item.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    {item.label}
                  </Link>
                )
              ))}
              {user ? (
                <div className="pt-2 border-t border-border/40 mt-2 space-y-2">
                  <Button variant="outline" className="w-full gap-2" onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
                    <User className="h-3.5 w-3.5" /> {t('sidebar.home') || 'Mon espace'}
                  </Button>
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