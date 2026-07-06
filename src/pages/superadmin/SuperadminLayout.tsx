import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, FileCheck, BarChart3, Megaphone, Sparkles, LayoutDashboard, Activity, Settings, Download,
  UserCircle, Target, ShieldAlert, Mail, ChevronLeft, ChevronRight, ArrowLeft, Bell, HelpCircle, Wallet, Handshake, ShieldCheck, Brain, Menu, Sun, Moon, Church, Home, PartyPopper, GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import logoSiteViral from '@/assets/logo-siteviral-mark.png';



const linkGroups = [
  {
    label: 'Core',
    items: [
      { to: '/superadmin', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/superadmin/command-center', label: 'Command Center', icon: Shield },
      { to: '/superadmin/health', label: 'Health', icon: Activity },
    ],
  },
  {
    label: 'Users & Orgs',
    items: [
      { to: '/superadmin/orgs', label: 'Organizations', icon: Users },
      { to: '/superadmin/users', label: 'Users', icon: UserCircle },
      { to: '/superadmin/activity', label: 'Activity', icon: Activity },
      { to: '/superadmin/kyc', label: 'Vérification ID', icon: FileCheck },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/superadmin/ai-history', label: 'Historique IA', icon: Brain },
      { to: '/superadmin/reports', label: 'Reports', icon: Megaphone },
      { to: '/superadmin/moderation', label: 'Modération', icon: ShieldCheck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/superadmin/transactions', label: 'Transactions', icon: BarChart3 },
      { to: '/superadmin/settlements', label: 'Settlements', icon: Wallet },
      { to: '/superadmin/risk', label: 'Risk & AML', icon: ShieldAlert },
      { to: '/superadmin/investor', label: 'Investor', icon: Target },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { to: '/superadmin/emails', label: 'Emails', icon: Mail },
      { to: '/superadmin/push', label: 'Push Notifs', icon: Bell },
      { to: '/superadmin/ads', label: 'Publicité', icon: Target },
      { to: '/superadmin/partners', label: 'Partners', icon: Handshake },
    ],
  },
  {
    label: 'Verticals',
    items: [
      { to: '/superadmin/beauty', label: 'Beauty', icon: Sparkles },
      { to: '/superadmin/church', label: 'Church', icon: Church },
      { to: '/superadmin/home', label: 'Home', icon: Home },
      { to: '/superadmin/events', label: 'Events', icon: PartyPopper },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/superadmin/metrics', label: 'Metrics', icon: BarChart3 },
      { to: '/superadmin/exports', label: 'Exports', icon: Download },
      { to: '/superadmin/support', label: 'Support', icon: HelpCircle },
      { to: '/superadmin/settings', label: 'Settings', icon: Settings },
      { to: '/superadmin/ai', label: 'AI Insights', icon: Sparkles },
    ],
  },
];

const allLinks = linkGroups.flatMap(g => g.items);

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

export default function SuperadminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-background">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-all duration-300 shrink-0 sticky top-0 h-screen',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}>
        {/* Logo header */}
        <div className={cn('p-4 border-b border-border/40 flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 shadow-md ring-1 ring-border/40">
            <img src={logoSiteViral} alt="SiteViral" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold tracking-tight text-foreground leading-tight">SiteViral</p>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Shield className="h-2.5 w-2.5" /> Superadmin
              </p>
            </div>
          )}
        </div>


        {/* Nav links — grouped */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-4">
            {linkGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group.label}</p>
                )}
                <div className="space-y-0.5">
                  {group.items.map(({ to, label, icon: Icon, end }) => {
                    const linkEl = (
                      <NavLink key={to} to={to} end={end}
                        className={({ isActive }) => cn(
                          'relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group',
                          isActive
                            ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r-full before:bg-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          collapsed && 'justify-center px-2.5'
                        )}>
                        <Icon className={cn('h-4 w-4 shrink-0')} />
                        {!collapsed && <span>{label}</span>}
                      </NavLink>
                    );
                    if (collapsed) {
                      return (
                        <Tooltip key={to} delayDuration={0}>
                          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
                        </Tooltip>
                      );
                    }
                    return linkEl;
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Theme toggle + Collapse + Back to app */}
        <div className="p-3 border-t border-border/40 space-y-1">
          <button onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors w-full', collapsed && 'justify-center')}>
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 shrink-0" /> : <Moon className="h-3.5 w-3.5 shrink-0" />}
            {!collapsed && <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
          </button>
          <NavLink to="/feed"
            className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors', collapsed && 'justify-center')}>
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Retour à l'app</span>}
          </NavLink>
          <button onClick={() => setCollapsed(!collapsed)}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors w-full', collapsed && 'justify-center')}>
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <><ChevronLeft className="h-3.5 w-3.5" /><span>Réduire</span></>}
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE TOP BAR ═══ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-xl">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 -ml-1">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <div className="p-4 border-b border-border/40 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl overflow-hidden ring-1 ring-border/40">
                  <img src={logoSiteViral} alt="SiteViral" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold">SiteViral</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Superadmin</p>
                </div>
              </div>
              <ScrollArea className="flex-1 py-3">
                <nav className="px-2 space-y-4">
                  {linkGroups.map((group) => (
                    <div key={group.label}>
                      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group.label}</p>
                      <div className="space-y-0.5">
                        {group.items.map(({ to, label, icon: Icon, end }) => (
                          <NavLink key={to} to={to} end={end}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => cn(
                              'relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r-full before:bg-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}>
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </ScrollArea>
              <div className="p-3 border-t border-border/40 space-y-1">
                <button onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full">
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
                </button>
                <NavLink to="/feed" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'app
                </NavLink>
              </div>
            </SheetContent>
          </Sheet>

          <div className="h-8 w-8 rounded-lg overflow-hidden ring-1 ring-border/40">
            <img src={logoSiteViral} alt="SiteViral" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight truncate">SiteViral</p>
            <p className="text-[10px] text-muted-foreground leading-tight truncate">
              {allLinks.find(l => l.to === location.pathname)?.label || 'Superadmin'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 min-w-0 lg:max-h-screen lg:overflow-y-auto">
        <div className="pt-14 lg:pt-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 tabular-nums">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} {...pageTransition}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
