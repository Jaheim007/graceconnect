import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, FileCheck, BarChart3, Megaphone, Sparkles, LayoutDashboard, Activity, Settings, Download,
  UserCircle, Target, ShieldAlert, Mail, ChevronLeft, ChevronRight, ArrowLeft, Bell, HelpCircle, Wallet, Handshake, ShieldCheck, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const links = [
  { to: '/superadmin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/superadmin/command-center', label: 'Command Center', icon: Shield },
  { to: '/superadmin/health', label: 'Health', icon: Activity },
  { to: '/superadmin/orgs', label: 'Organizations', icon: Users },
  { to: '/superadmin/users', label: 'Users', icon: UserCircle },
  { to: '/superadmin/activity', label: 'Activity', icon: Activity },
  { to: '/superadmin/kyc', label: 'Vérification ID', icon: FileCheck },
  { to: '/superadmin/ai-history', label: 'Historique IA', icon: Brain },
  { to: '/superadmin/transactions', label: 'Transactions', icon: BarChart3 },
  { to: '/superadmin/reports', label: 'Reports', icon: Megaphone },
  { to: '/superadmin/moderation', label: 'Modération', icon: ShieldCheck },
  { to: '/superadmin/metrics', label: 'Metrics', icon: BarChart3 },
  { to: '/superadmin/exports', label: 'Exports', icon: Download },
  { to: '/superadmin/investor', label: 'Investor', icon: Target },
  { to: '/superadmin/risk', label: 'Risk & AML', icon: ShieldAlert },
  { to: '/superadmin/emails', label: 'Emails', icon: Mail },
  { to: '/superadmin/push', label: 'Push Notifs', icon: Bell },
  { to: '/superadmin/settlements', label: 'Settlements', icon: Wallet },
  { to: '/superadmin/partners', label: 'Partners', icon: Handshake },
  { to: '/superadmin/support', label: 'Support', icon: HelpCircle },
  { to: '/superadmin/settings', label: 'Settings', icon: Settings },
  { to: '/superadmin/ai', label: 'AI Insights', icon: Sparkles },
];

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

export default function SuperadminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-all duration-300 shrink-0 sticky top-0 h-screen',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}>
        {/* Logo header */}
        <div className={cn('p-4 border-b border-border/40 flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold tracking-tight text-foreground">SiteViral</p>
              <p className="text-[10px] text-muted-foreground font-medium">Superadmin</p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-2">
            {links.map(({ to, label, icon: Icon, end }) => {
              const linkEl = (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                    collapsed && 'justify-center px-2.5'
                  )}>
                  <Icon className={cn('h-4 w-4 shrink-0', collapsed ? '' : 'mr-0')} />
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
          </nav>
        </ScrollArea>

        {/* Collapse toggle + Back to app */}
        <div className="p-3 border-t border-border/40 space-y-1">
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
        <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
              <Icon className="h-3.5 w-3.5" />{label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 min-w-0 lg:max-h-screen lg:overflow-y-auto">
        <div className="pt-14 lg:pt-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
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
