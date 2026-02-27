import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon, Menu, X, ArrowRight, ChevronDown, BookOpen, GraduationCap, Calculator, Award, BarChart3, Users, Church, Heart, Briefcase, PenTool, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

interface DropdownItem {
  to: string;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
}

function NavDropdown({ label, items, columns = 1, onNavigate }: { label: string; items: DropdownItem[]; columns?: number; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-popover border border-border rounded-xl shadow-xl p-3 z-50 ${columns > 1 ? 'w-[420px]' : 'w-[240px]'}`}
          >
            <div className={columns > 1 ? 'grid grid-cols-2 gap-1' : 'space-y-0.5'}>
              {items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => { setOpen(false); onNavigate?.(); }}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors group"
                >
                  {item.icon && <span className="mt-0.5 text-primary/70 group-hover:text-primary transition-colors">{item.icon}</span>}
                  <div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    {item.desc && <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.desc}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingNav() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const { t } = useI18n();

  const solutionItems: DropdownItem[] = [
    { to: '/pour/influenceurs', label: t('nav.persona_influencers'), icon: <Users className="h-4 w-4" /> },
    { to: '/pour/eglises', label: t('nav.persona_churches'), icon: <Church className="h-4 w-4" /> },
    { to: '/pour/ong', label: t('nav.persona_ngos'), icon: <Heart className="h-4 w-4" /> },
    { to: '/pour/coachs', label: t('nav.persona_coaches'), icon: <GraduationCap className="h-4 w-4" /> },
    { to: '/pour/auteurs', label: t('nav.persona_authors'), icon: <PenTool className="h-4 w-4" /> },
    { to: '/pour/entrepreneurs', label: t('nav.persona_entrepreneurs'), icon: <Rocket className="h-4 w-4" /> },
    { to: '/features', label: t('nav.persona_all'), icon: <Briefcase className="h-4 w-4" /> },
  ];

  const resourceItems: DropdownItem[] = [
    { to: '/blog', label: t('nav.res_blog'), desc: t('nav.res_blog_desc'), icon: <BookOpen className="h-4 w-4" /> },
    { to: '/guide/vendre-ebook', label: t('nav.res_guides'), desc: t('nav.res_guides_desc'), icon: <GraduationCap className="h-4 w-4" /> },
    { to: '/calculateur', label: t('nav.res_calculator'), desc: t('nav.res_calculator_desc'), icon: <Calculator className="h-4 w-4" /> },
    { to: '/etudes-de-cas', label: t('nav.res_case_studies'), desc: t('nav.res_case_studies_desc'), icon: <Award className="h-4 w-4" /> },
    { to: '/temoignages', label: t('nav.res_testimonials'), desc: t('nav.res_testimonials_desc'), icon: <Users className="h-4 w-4" /> },
    { to: '/comparer', label: t('nav.res_compare'), desc: t('nav.res_compare_desc'), icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const toggleMobileSection = (section: string) => {
    setMobileExpanded(prev => prev === section ? null : section);
  };

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
      <div className="container flex items-center justify-between h-14 px-4">
        <SiteLogo size="md" animate />
        
        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-0.5">
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link to="/features">{t('landing.footer_features')}</Link>
          </Button>
          <NavDropdown label={t('nav.solutions')} items={solutionItems} columns={2} />
          <NavDropdown label={t('nav.resources')} items={resourceItems} columns={2} />
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link to="/ambassador-program">{t('landing.footer_ambassadors')}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <a href="#pricing">{t('nav.pricing')}</a>
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=signin')} className="hidden sm:inline-flex text-xs px-3">
            {t('nav.sign_in')}
          </Button>
          <Button size="sm" className="text-xs px-4 gap-1.5" onClick={() => navigate('/auth?mode=signup')}>
            {t('nav.get_started')} <ArrowRight className="h-3 w-3 hidden sm:block" />
          </Button>
          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-sm overflow-hidden"
          >
            <nav className="container px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
              <Link to="/features" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                {t('landing.footer_features')}
              </Link>

              {/* Solutions accordion */}
              <div>
                <button onClick={() => toggleMobileSection('solutions')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  {t('nav.solutions')}
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileExpanded === 'solutions' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {mobileExpanded === 'solutions' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="pl-4 space-y-0.5 py-1">
                        {solutionItems.map(item => (
                          <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            {item.icon} {item.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources accordion */}
              <div>
                <button onClick={() => toggleMobileSection('resources')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  {t('nav.resources')}
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileExpanded === 'resources' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {mobileExpanded === 'resources' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="pl-4 space-y-0.5 py-1">
                        {resourceItems.map(item => (
                          <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            {item.icon}
                            <div>
                              <span>{item.label}</span>
                              {item.desc && <p className="text-[11px] text-muted-foreground/70">{item.desc}</p>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/ambassador-program" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                {t('landing.footer_ambassadors')}
              </Link>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                {t('nav.pricing')}
              </a>

              <div className="pt-2 border-t border-border/40 mt-2 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => { navigate('/auth?mode=signin'); setMenuOpen(false); }}>
                  {t('nav.sign_in')}
                </Button>
                <Button className="w-full gap-1.5" onClick={() => { navigate('/auth?mode=signup'); setMenuOpen(false); }}>
                  {t('nav.get_started')} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
