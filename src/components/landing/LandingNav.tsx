import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function LandingNav() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: '/ecrire', label: '✏️ Écrire' },
    { to: '/gagner', label: '💰 Gagner' },
    { to: '/discover', label: 'Explorer' },
    { to: '#pricing', label: 'Tarifs', isAnchor: true },
  ];

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
      <div className="container flex items-center justify-between h-14 px-4">
        <SiteLogo size="md" animate />
        
        {/* Desktop */}
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=signin')} className="hidden sm:inline-flex text-xs px-3">
            Connexion
          </Button>
          <Button size="sm" className="text-xs px-4 gap-1.5" onClick={() => navigate('/auth?mode=signup')}>
            Commencer <ArrowRight className="h-3 w-3 hidden sm:block" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile */}
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
              <div className="pt-2 border-t border-border/40 mt-2 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => { navigate('/auth?mode=signin'); setMenuOpen(false); }}>
                  Connexion
                </Button>
                <Button className="w-full gap-1.5" onClick={() => { navigate('/auth?mode=signup'); setMenuOpen(false); }}>
                  Commencer <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
