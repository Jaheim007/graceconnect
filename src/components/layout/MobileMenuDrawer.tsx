import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from '@/lib/router-compat';
import { LogOut, Plus, X, ChevronDown, Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { unifyNavIcon } from '@/components/icons/nav-icons';

import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { buildFeatureNavItems } from '@/lib/navigation/featureNavBuilder';
import { getActionNavItems, type ActionNavItem } from '@/lib/navigation/actionNavItems';
import { applyNavOverride } from '@/lib/navigation/actionNavItemOverrides';
import {
  Compass, ShoppingBag, GraduationCap, MessageSquare, Share2, Settings, ShieldCheck, HandCoins,
} from 'lucide-react';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import { brandUrl } from '@/lib/storageUrl';
import { showServiceSurfaces } from '@/lib/siteviral/visibility';

interface Props {
  onClose: () => void;
}

/**
 * Purpose-built native mobile menu drawer. Renders inside a Sheet.
 * Compact list rows (~48px), safe-area padding, sticky workspace header,
 * scrolling body, no oversized bordered "desktop nav cards".
 */
export function MobileMenuDrawer({ onClose }: Props) {
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, userOrgs, canManage, setCurrentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { hasPurchases, hasOrgs } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);



  const { has, org: featureOrg, type: siteviralType } = useOrgFeatures();
  const typeConfirmed = !!featureOrg?.type_confirmed_at;
  const enabledFeatures = (featureOrg?.enabled_features ?? []) as SiteviralFeatureKey[];
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;
  const manageableOrgs = userOrgs.filter((o) => canManage(o.id));

  const workspaceNav: ActionNavItem[] = useMemo(() => {
    if (!currentOrg || !canManageCurrentOrg) return [];
    const built = buildFeatureNavItems(
      {
        isAuthenticated: !!user,
        hasPurchases,
        hasManageableOrg: manageableOrgs.length > 0,
        hasOrgs,
        isSuperadmin,
      },
      enabledFeatures,
      siteviralType as SiteviralType | null,
    );
    if (built && built.length > 0) return built;
    return getActionNavItems({
      isAuthenticated: !!user,
      hasPurchases,
      hasManageableOrg: manageableOrgs.length > 0,
      hasOrgs,
      isSuperadmin,
    })
      .filter((it) => !['purchases', 'discover', 'claim'].includes(it.id))
      .filter((it) => {
        if (!it.featureKey) return true;
        if (!typeConfirmed) return true;
        return has(it.featureKey);
      })
      .map((it) => applyNavOverride(it, siteviralType));
  }, [
    currentOrg, canManageCurrentOrg, user, hasPurchases, manageableOrgs.length,
    hasOrgs, isSuperadmin, enabledFeatures, siteviralType, has, typeConfirmed,
  ]);

  const accountNav: ActionNavItem[] = user ? [
    { id: 'acc-explore', icon: Compass, emoji: '', titleFr: 'Explorer', titleEn: 'Explore',
      descFr: '', descEn: '', route: '/dashboard/explore',
      borderClass: '', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { id: 'acc-purchases', icon: ShoppingBag, emoji: '', titleFr: 'Ma bibliothèque', titleEn: 'My library',
      descFr: '', descEn: '', route: '/my-purchases',
      borderClass: '', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    ...(showServiceSurfaces() ? [{
      id: 'acc-messages', icon: MessageSquare, emoji: '', titleFr: 'Messages', titleEn: 'Messages',
      descFr: '', descEn: '', route: '/dashboard/messages',
      borderClass: '', iconBg: 'bg-primary/10', iconColor: 'text-primary' }] : []),

    { id: 'acc-earn', icon: HandCoins, emoji: '', titleFr: 'Gagner', titleEn: 'Earn',
      descFr: '', descEn: '', route: '/gagner',
      borderClass: '', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    ...(isSuperadmin ? [{ id: 'acc-affiliation', icon: Share2, emoji: '', titleFr: 'Parrainage', titleEn: 'Affiliate',
      descFr: '', descEn: '', route: '/affiliation',
      borderClass: '', iconBg: 'bg-primary/10', iconColor: 'text-primary' }] : []),
  ] : [];


  /** ONE dashboard nav: overview, then what you own, then what you sell. */
  const unifiedNav: ActionNavItem[] = (() => {
    const overview = workspaceNav.filter((it) => it.route.split('?')[0] === '/dashboard');
    const rest = workspaceNav.filter((it) => it.route.split('?')[0] !== '/dashboard');
    const seen = new Set<string>();
    return [...overview, ...accountNav, ...rest].filter((it) => {
      const key = it.route.split('?')[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const isActive = (route: string) => {
    const clean = route.split('?')[0];
    if (clean === '/dashboard') return location.pathname === '/dashboard';
    if (clean === '/my-purchases') return location.pathname === '/my-purchases';
    if (clean === '/affiliation') return location.pathname === '/affiliation';
    if (clean === '/gagner') return location.pathname === '/gagner';
    return location.pathname === clean || location.pathname.startsWith(clean + '/');
  };

  const handleNav = (route: string) => { onClose(); navigate(route); };

  const orgInitials = currentOrg?.name?.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'W';
  const orgLogo = brandUrl(currentOrg?.logo_url);
  const displayOrgName = currentOrg?.name ?? manageableOrgs[0]?.name ?? (isFr ? 'Compte' : 'Account');

  // Guests never see workspace/account controls — they get a sign-in prompt.
  if (!user) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background">
        <div
          className="shrink-0 flex items-center justify-end px-3 border-b border-border/60"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)', paddingBottom: 10 }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-11 w-11 rounded-xl border border-border bg-card grid place-items-center active:scale-95 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-xl font-semibold">
            {isFr ? 'Connecte-toi pour continuer' : 'Sign in to continue'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isFr
              ? 'Crée ton compte pour accéder à ton espace, tes achats et tes revenus.'
              : 'Create your account to access your space, purchases and earnings.'}
          </p>
          <button
            onClick={() => handleNav('/auth')}
            className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 active:scale-[0.98] transition"
          >
            {isFr ? 'Se connecter' : 'Sign in'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Sticky header — workspace chip (opens switcher) + close */}
      <div
        className="shrink-0 px-3 border-b border-border/60 bg-background/95 backdrop-blur"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)', paddingBottom: 10 }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-expanded={switcherOpen}
            className={cn(
              'flex-1 min-w-0 flex items-center gap-2.5 px-2.5 h-11 rounded-xl border border-border bg-card',
              'active:scale-[0.98] transition',
            )}
          >
            <div className="h-7 w-7 rounded-lg overflow-hidden bg-primary/10 grid place-items-center shrink-0">
              {orgLogo ? <img src={orgLogo} alt="" className="h-full w-full object-cover" />
                : <span className="text-[10px] font-bold text-primary">{orgInitials}</span>}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                {isFr ? 'Espace' : 'Workspace'}
              </div>
              <div className="text-[13px] font-semibold truncate leading-tight">
                {displayOrgName}
              </div>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform', switcherOpen && 'rotate-180')} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-11 w-11 rounded-xl border border-border bg-card grid place-items-center active:scale-95 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {switcherOpen && (
          <div className="mt-2 rounded-xl border border-border bg-card overflow-hidden">
            {manageableOrgs.length > 0 && (
              <ul className="p-1">
                {manageableOrgs.map((org) => {
                  const isCur = currentOrg?.id === org.id;
                  const logo = brandUrl(org.logo_url);
                  const initials = org.name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <li key={org.id}>
                      <button
                        onClick={() => { setCurrentOrg(org); setSwitcherOpen(false); onClose(); navigate('/admin'); }}
                        className={cn(
                          'w-full min-h-[46px] flex items-center gap-3 px-2.5 rounded-lg text-left active:scale-[0.98] transition',
                          isCur ? 'bg-primary/10' : 'hover:bg-muted/50',
                        )}
                      >
                        <div className="h-7 w-7 rounded-lg overflow-hidden bg-primary/10 grid place-items-center shrink-0">
                          {logo ? <img src={logo} alt="" className="h-full w-full object-cover" />
                            : <span className="text-[10px] font-bold text-primary">{initials}</span>}
                        </div>
                        <span className="text-[13px] font-medium truncate flex-1">{org.name}</span>
                        {isCur && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              onClick={() => { setSwitcherOpen(false); handleNav('/create-org'); }}
              className="w-full min-h-[46px] flex items-center gap-3 px-3 border-t border-border/60 text-primary active:scale-[0.98] transition"
            >
              <Plus className="h-4 w-4" />
              <span className="text-[13px] font-semibold">
                {isFr ? 'Créer une plateforme' : 'Create a platform'}
              </span>
            </button>
          </div>
        )}
      </div>


      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-5 lg:px-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)' }}
      >
        {/* ONE unified nav — no groups */}
        <ul className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6">
          {unifiedNav.map((item, i) => {
            const Icon = unifyNavIcon(item.icon); const active = isActive(item.route);
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.028, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  onClick={() => handleNav(item.route)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group w-full min-h-[54px] sm:min-h-[58px] flex items-center gap-3.5 sm:gap-4 px-3 sm:px-3.5 rounded-2xl text-left',
                    'active:scale-[0.98] transition-colors duration-150',
                    active ? 'bg-primary/10 text-foreground' : 'text-foreground/90 hover:bg-muted/60',
                  )}
                >
                  <span
                    className={cn(
                      'h-10 w-10 sm:h-11 sm:w-11 rounded-full grid place-items-center shrink-0 transition-colors border',
                      active
                        ? 'bg-primary text-primary-foreground border-transparent'
                        : 'bg-muted text-foreground border-border/60',
                    )}
                  >
                    <Icon className="h-[19px] w-[19px]" strokeWidth={2} />
                  </span>
                  <span className="text-[15px] sm:text-base font-medium truncate flex-1 leading-tight">
                    {isFr ? item.titleFr : item.titleEn}
                  </span>
                  {active
                    ? <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </motion.li>
            );
          })}
        </ul>




        <div className="mb-4">
          <div className="px-3 pt-4 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {isFr ? 'RÉGLAGES' : 'SETTINGS'}
          </div>
          <ul className="space-y-1.5 sm:space-y-2">
            {isSuperadmin && (
              <li>
                <button
                  onClick={() => handleNav('/superadmin')}
                  className="w-full min-h-[54px] sm:min-h-[58px] flex items-center gap-3.5 sm:gap-4 px-3 sm:px-3.5 rounded-2xl text-left text-primary hover:bg-primary/10 active:scale-[0.98] transition"
                >
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-primary/[0.08] grid place-items-center shrink-0">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </div>
                  <span className="text-[14px] font-semibold">Super admin</span>
                </button>
              </li>
            )}
            <li>

              <button
                onClick={() => handleNav('/create-org')}
                className="w-full min-h-[54px] sm:min-h-[58px] flex items-center gap-3.5 sm:gap-4 px-3 sm:px-3.5 rounded-2xl text-left text-primary hover:bg-primary/10 active:scale-[0.98] transition"
              >
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-primary/[0.08] grid place-items-center shrink-0">
                  <Plus className="h-[18px] w-[18px]" />
                </div>
                <span className="text-[14px] font-semibold">
                  {isFr ? 'Créer une plateforme' : 'Create a platform'}
                </span>
              </button>
            </li>
            {canManageCurrentOrg && (
              <li>
                <Link
                  to="/admin/settings"
                  onClick={onClose}
                  className="w-full min-h-[54px] sm:min-h-[58px] flex items-center gap-3.5 sm:gap-4 px-3 sm:px-3.5 rounded-2xl text-left text-foreground/90 hover:bg-muted/60"
                >
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-primary/[0.08] grid place-items-center shrink-0">
                    <Settings className="h-[18px] w-[18px] text-primary" />
                  </div>
                  <span className="text-[14px] font-medium">{isFr ? 'Paramètres' : 'Settings'}</span>
                </Link>
              </li>
            )}
            <li>
              <button
                onClick={() => { onClose(); signOut(); }}
                className="w-full min-h-[54px] sm:min-h-[58px] flex items-center gap-3.5 sm:gap-4 px-3 sm:px-3.5 rounded-2xl text-left text-destructive hover:bg-destructive/10 active:scale-[0.98] transition"
              >
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-destructive/10 grid place-items-center shrink-0">
                  <LogOut className="h-[18px] w-[18px] text-destructive" />
                </div>
                <span className="text-[14px] font-medium">
                  {isFr ? 'Déconnexion' : 'Sign out'}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
