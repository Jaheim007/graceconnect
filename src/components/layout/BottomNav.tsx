import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Plus, Wallet, Store, MoreHorizontal, Shield, Bell, Settings,
  User, UserPlus, Package, BarChart3, Share2, Sparkles,
  Bookmark, Coins, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { getShortcutRoute } from '@/lib/navigation/shortcutRoutes';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdaptiveLabels } from '@/hooks/useAdaptiveLabels';

interface NavItemDef {
  to: string;
  icon: typeof Home;
  label: string;
  center?: boolean;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;
  const hasManagedOrgs = userOrgs.some((org) => canManage(org.id));
  const [moreOpen, setMoreOpen] = useState(false);
  const isFr = locale === 'fr';
  const { profile } = useUserProfile();
  const labels = useAdaptiveLabels();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await db.from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const shortcutContext = {
    canManageCurrentOrg,
    hasOrganizations: userOrgs.length > 0,
    isSuperadmin,
  };

  // ═══ GUEST NAV ═══
  const guestItems: NavItemDef[] = [
    { to: '/', icon: Home, label: isFr ? 'Accueil' : 'Home' },
    { to: '/ecrire', icon: Sparkles, label: isFr ? 'Créer' : 'Create', center: true },
    { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
    { to: '/auth?mode=signup', icon: UserPlus, label: isFr ? 'Inscription' : 'Sign up' },
  ];

  // ═══ ADAPTIVE BOTTOM NAV ═══
  const getBottomItems = (): NavItemDef[] => {
    switch (profile) {
      case 'buyer':
        return [
          { to: '/', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '/resources', icon: Package, label: isFr ? 'Bibliothèque' : 'Library' },
          { to: '#more', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
      case 'ambassador':
        return [
          { to: '/', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: '/discover', icon: Store, label: isFr ? 'Catalogue' : 'Catalog' },
          { to: '/gagner', icon: Share2, label: isFr ? 'Gagner' : 'Earn' },
          { to: '/resources', icon: Package, label: isFr ? 'Achats' : 'Purchases' },
          { to: '#more', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
      case 'org-religious':
        return [
          { to: '/', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: hasManagedOrgs ? '/admin/create' : '/create-org', icon: Plus, label: isFr ? 'Créer' : 'Create', center: true },
          { to: '/admin/sales', icon: BarChart3, label: labels.activity },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '#more', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
      case 'creator':
      default:
        return [
          { to: '/', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: hasManagedOrgs ? '/admin/create' : '/create-org', icon: Plus, label: isFr ? 'Créer' : 'Create', center: true },
          { to: '/admin/sales', icon: Wallet, label: labels.sales },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '#more', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
    }
  };

  // ═══ MORE MENU — simplified, max 6 items per section ═══
  const getMoreSections = () => {
    const sections = [
      {
        label: isFr ? 'Mon espace' : 'My Space',
        items: [
          { to: '/notifications', icon: Bell, label: 'Notifications' },
          { to: '/resources', icon: Package, label: isFr ? 'Mes achats' : 'My Purchases' },
          { to: '/bookmarks', icon: Bookmark, label: isFr ? 'Favoris' : 'Bookmarks' },
          { to: '/profile', icon: User, label: isFr ? 'Profil' : 'Profile' },
        ],
      },
    ];

    // Creator/Org tools — flat, no nesting
    if (hasManagedOrgs) {
      sections.push({
        label: isFr ? 'Outils' : 'Tools',
        items: [
          { to: '/admin/content', icon: Package, label: isFr ? 'Contenus' : 'Content' },
          { to: '/admin/sales', icon: Wallet, label: labels.sales },
          { to: '/gagner', icon: Share2, label: isFr ? 'Gagner' : 'Earn' },
          { to: '/credits', icon: Coins, label: isFr ? 'Crédits' : 'Credits' },
          { to: getShortcutRoute('settings', shortcutContext), icon: Settings, label: isFr ? 'Paramètres' : 'Settings' },
          ...(isSuperadmin ? [{ to: '/superadmin', icon: Shield, label: 'Superadmin' }] : []),
        ],
      });
    } else {
      // Non-creators: simpler
      sections.push({
        label: isFr ? 'Plus' : 'More',
        items: [
          { to: '/gagner', icon: Share2, label: isFr ? 'Gagner' : 'Earn' },
          { to: '/credits', icon: Coins, label: isFr ? 'Crédits' : 'Credits' },
          { to: getShortcutRoute('settings', shortcutContext), icon: Settings, label: isFr ? 'Paramètres' : 'Settings' },
          ...(isSuperadmin ? [{ to: '/superadmin', icon: Shield, label: 'Superadmin' }] : []),
        ],
      });
    }

    return sections;
  };

  const navItems = !user ? guestItems : getBottomItems();
  const moreSections = getMoreSections();

  return (
    <>
      {/* ═══ BOTTOM NAV BAR ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="mx-3 mb-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-lg shadow-black/10">
          <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto relative">
            {navItems.map(({ to, icon: Icon, label, center }) => {
              const active = to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to.split('?')[0]);

              if (center) {
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    aria-label={label}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] min-w-[48px] -mt-5 relative"
                  >
                    <div className={cn(
                      'h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
                      active
                        ? 'bg-primary shadow-primary/40 scale-105'
                        : 'bg-primary/90 shadow-primary/25 hover:scale-105'
                    )}>
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold leading-none mt-0.5',
                      active ? 'text-primary' : 'text-foreground'
                    )}>{label}</span>
                  </Link>
                );
              }

              if (to === '#more') {
                return (
                  <button
                    key="more"
                    onClick={() => setMoreOpen(true)}
                    aria-label={label}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] min-w-[48px] transition-all duration-200 relative',
                      moreOpen ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', moreOpen && 'stroke-[2.5]')} />
                    <span className={cn(
                      'text-[10px] font-medium leading-none',
                      moreOpen && 'font-bold'
                    )}>{label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] min-w-[48px] transition-all duration-200 relative',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                  <span className={cn(
                    'text-[10px] font-medium leading-none',
                    active && 'font-bold'
                  )}>{label}</span>
                  {active && <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="h-safe-area-inset-bottom bg-transparent" />
      </nav>

      {/* ═══ MORE SHEET ═══ */}
      {user && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-3 pb-10 pt-3 max-h-[75vh]">
            <SheetHeader className="pb-3">
              <SheetTitle className="text-sm font-bold">
                {isFr ? 'Plus' : 'More'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4 overflow-y-auto">
              {moreSections.map((section, idx) => (
                <div key={idx}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1.5">
                    {section.label}
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {section.items.map(({ to, icon: Icon, label }) => {
                      const active = location.pathname.startsWith(to);
                      return (
                        <button
                          key={to}
                          onClick={() => { setMoreOpen(false); navigate(to); }}
                          className={cn(
                            'flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-colors min-h-[68px]',
                            active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                          )}
                        >
                          <div className={cn(
                            'h-9 w-9 rounded-xl flex items-center justify-center',
                            active ? 'bg-primary/15' : 'bg-muted'
                          )}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <span className="text-[10px] font-medium leading-tight text-center line-clamp-2">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {idx < moreSections.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}

              {/* Logout */}
              <Separator />
              <button
                onClick={() => { setMoreOpen(false); signOut(); }}
                className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-medium">{isFr ? 'Déconnexion' : 'Sign out'}</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
