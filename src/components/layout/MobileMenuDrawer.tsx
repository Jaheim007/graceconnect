import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Plus, X, ChevronDown, Check } from 'lucide-react';

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
      borderClass: '', iconBg: 'bg-violet-500/12', iconColor: 'text-violet-500' },
    { id: 'acc-purchases', icon: ShoppingBag, emoji: '', titleFr: 'Ma bibliothèque', titleEn: 'My library',
      descFr: '', descEn: '', route: '/my-purchases',
      borderClass: '', iconBg: 'bg-primary/12', iconColor: 'text-primary' },
    ...(showServiceSurfaces() ? [{
      id: 'acc-messages', icon: MessageSquare, emoji: '', titleFr: 'Messages', titleEn: 'Messages',
      descFr: '', descEn: '', route: '/dashboard/messages',
      borderClass: '', iconBg: 'bg-cyan-500/12', iconColor: 'text-cyan-500' }] : []),

    { id: 'acc-earn', icon: HandCoins, emoji: '', titleFr: 'Gagner', titleEn: 'Earn',
      descFr: '', descEn: '', route: '/gagner',
      borderClass: '', iconBg: 'bg-amber-500/12', iconColor: 'text-amber-500' },
    ...(isSuperadmin ? [{ id: 'acc-affiliation', icon: Share2, emoji: '', titleFr: 'Parrainage', titleEn: 'Affiliate',
      descFr: '', descEn: '', route: '/affiliation',
      borderClass: '', iconBg: 'bg-emerald-500/12', iconColor: 'text-emerald-500' }] : []),
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
        className="flex-1 overflow-y-auto overscroll-contain px-2 py-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* ONE unified nav — no groups */}
        <ul className="space-y-0.5 mb-3">
          {unifiedNav.map((item) => {
            const Icon = item.icon; const active = isActive(item.route);
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNav(item.route)}
                  className={cn(
                    'w-full min-h-[48px] flex items-center gap-3 px-3 rounded-xl text-left',
                    'active:scale-[0.98] transition',
                    active ? 'bg-primary/8 text-foreground' : 'text-foreground/90 hover:bg-muted/50',
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-lg grid place-items-center shrink-0', item.iconBg)}>
                    <Icon className={cn('h-4 w-4', item.iconColor)} />
                  </div>
                  <span className="text-[14px] font-medium truncate flex-1">
                    {isFr ? item.titleFr : item.titleEn}
                  </span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ul>




        <div className="mb-3">
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {isFr ? 'RÉGLAGES' : 'SETTINGS'}
          </div>
          <ul className="space-y-0.5">
            {isSuperadmin && (
              <li>
                <button
                  onClick={() => handleNav('/superadmin')}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 rounded-xl text-left text-amber-500 hover:bg-amber-500/10 active:scale-[0.98] transition"
                >
                  <div className="h-8 w-8 rounded-lg bg-amber-500/12 grid place-items-center shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-[14px] font-semibold">Super admin</span>
                </button>
              </li>
            )}
            <li>

              <button
                onClick={() => handleNav('/create-org')}
                className="w-full min-h-[48px] flex items-center gap-3 px-3 rounded-xl text-left text-primary hover:bg-primary/5 active:scale-[0.98] transition"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <Plus className="h-4 w-4" />
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
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 rounded-xl text-left text-foreground/90 hover:bg-muted/50"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center shrink-0">
                    <Settings className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-[14px] font-medium">{isFr ? 'Paramètres' : 'Settings'}</span>
                </Link>
              </li>
            )}
            <li>
              <button
                onClick={() => { onClose(); signOut(); }}
                className="w-full min-h-[48px] flex items-center gap-3 px-3 rounded-xl text-left text-destructive hover:bg-destructive/10 active:scale-[0.98] transition"
              >
                <div className="h-8 w-8 rounded-lg bg-destructive/10 grid place-items-center shrink-0">
                  <LogOut className="h-4 w-4 text-destructive" />
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
