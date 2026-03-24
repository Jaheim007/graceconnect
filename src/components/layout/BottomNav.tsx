import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Plus, Wallet, Store, MoreHorizontal, Shield, Bell, Settings,
  Heart, HelpCircle, Award, User, Building2, ShieldCheck, FileText,
  Package, BarChart3, Eye, Users, Zap, UserPlus, Share2, Star, Sparkles,
  Rss, Bookmark, GraduationCap, Coins, ArrowLeftRight, LogOut
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
import { useUserMode, MODE_LABELS } from '@/contexts/UserModeContext';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;
  const hasManagedOrgs = userOrgs.some((org) => canManage(org.id));
  const [moreOpen, setMoreOpen] = useState(false);
  const { mode } = useUserMode();
  const isFr = locale === 'fr';

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
  const guestItems = [
    { to: '/', icon: Home, label: isFr ? 'Accueil' : 'Home' },
    { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
    { to: '/gagner', icon: Wallet, label: isFr ? 'Gagner' : 'Earn' },
    { to: '/auth?mode=signup', icon: UserPlus, label: isFr ? 'Inscription' : 'Sign up' },
  ];

  // ═══ MODE-SPECIFIC BOTTOM NAV ═══
  const getModeBottomItems = () => {
    switch (mode) {
      case 'purchases':
        return [
          { to: '/dashboard', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: '/resources', icon: Package, label: isFr ? 'Achats' : 'Purchases' },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '/my-programs', icon: GraduationCap, label: isFr ? 'Cours' : 'Courses' },
          { to: '__more__', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
      case 'sell':
        return [
          { to: '/dashboard', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: '/admin/create', icon: Plus, label: isFr ? 'Créer' : 'Create', accent: true },
          { to: '/admin/sales', icon: Wallet, label: isFr ? 'Ventes' : 'Sales' },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '__more__', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
      case 'earn':
        return [
          { to: '/spotlight', icon: Star, label: 'Spotlight' },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '/affiliation', icon: Share2, label: isFr ? 'Liens' : 'Links' },
          { to: '/feed', icon: Rss, label: isFr ? 'Réseau' : 'Network' },
          { to: '__more__', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
      case 'create':
        return [
          { to: '/dashboard', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: '/admin/create', icon: Sparkles, label: 'Studio', accent: true },
          { to: '/admin/sales', icon: Wallet, label: isFr ? 'Ventes' : 'Sales' },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '__more__', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
      default:
        return [
          { to: '/dashboard', icon: Home, label: isFr ? 'Accueil' : 'Home' },
          { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
          { to: '/resources', icon: Package, label: isFr ? 'Achats' : 'Purchases' },
          { to: '__more__', icon: MoreHorizontal, label: isFr ? 'Plus' : 'More' },
        ];
    }
  };

  // ═══ MORE MENU ═══
  const getMoreSections = () => {
    const sections = [
      {
        label: isFr ? 'Mon espace' : 'My Space',
        items: [
          { to: '/profile', icon: User, label: isFr ? 'Profil' : 'Profile' },
          { to: '/notifications', icon: Bell, label: isFr ? 'Notifications' : 'Notifications' },
          { to: '/resources', icon: Package, label: isFr ? 'Mes achats' : 'My Purchases' },
          { to: '/my-programs', icon: GraduationCap, label: isFr ? 'Mes cours' : 'My Courses' },
          { to: '/credits', icon: Coins, label: isFr ? 'Crédits' : 'Credits' },
        ],
      },
    ];

    // Creator/AI sections
    if (mode === 'sell' || mode === 'create') {
      sections.push({
        label: isFr ? 'Ma plateforme' : 'My Platform',
        items: [
          ...(currentOrg ? [{ to: `/org/${currentOrg.slug}/store`, icon: Eye, label: isFr ? 'Ma page' : 'My Page' }] : []),
          { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/admin/people', icon: Users, label: isFr ? 'Membres' : 'Members' },
          { to: '/admin/viral-tools', icon: Zap, label: 'Viral Tools' },
          ...(hasManagedOrgs
            ? []
            : [{ to: '/create-org', icon: Plus, label: isFr ? 'Créer plateforme' : 'Create Platform' }]),
        ],
      });
    }

    // Earn section
    if (mode === 'earn') {
      sections.push({
        label: isFr ? 'Gagner' : 'Earn',
        items: [
          { to: '/affiliation', icon: Share2, label: isFr ? 'Mes liens' : 'My Links' },
          { to: '/bookmarks', icon: Bookmark, label: isFr ? 'Favoris' : 'Bookmarks' },
        ],
      });
    }

    // Management
    sections.push({
      label: isFr ? 'Gestion' : 'Management',
      items: [
        { to: getShortcutRoute('kyc', shortcutContext), icon: ShieldCheck, label: isFr ? 'Vérification' : 'Verification' },
        { to: getShortcutRoute('settings', shortcutContext), icon: Settings, label: isFr ? 'Paramètres' : 'Settings' },
        ...(isSuperadmin ? [{ to: '/superadmin', icon: Shield, label: 'Superadmin' }] : []),
      ],
    });

    return sections;
  };

  const navItems = !user ? guestItems : getModeBottomItems();
  const moreSections = getMoreSections();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label, ...rest }) => {
            const isMore = to === '__more__';
            const active = isMore
              ? false
              : to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to.split('?')[0]);
            const isAccent = 'accent' in rest && (rest as any).accent;

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  aria-label={label}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] min-w-[48px] transition-colors text-muted-foreground relative"
                >
                  <Icon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-[calc(50%-2px)] h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                  )}
                  <span className="text-[10px] font-medium leading-none">{label}</span>
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
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] min-w-[48px] transition-colors relative',
                  isAccent ? 'text-primary' : active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isAccent ? (
                  <div className="h-9 w-9 -mt-4 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                )}
                <span className={cn('text-[10px] font-medium leading-none', isAccent && 'font-bold text-primary')}>{label}</span>
                {active && !isAccent && <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More sheet */}
      {user && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-3 pb-10 pt-3 max-h-[75vh]">
            <SheetHeader className="pb-3">
              <SheetTitle className="text-sm font-bold">
                {mode ? `${MODE_LABELS[mode].emoji} ${isFr ? MODE_LABELS[mode].fr : MODE_LABELS[mode].en}` : (isFr ? 'Plus' : 'More')}
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

              {/* Switch mode + Logout */}
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setMoreOpen(false); navigate('/welcome'); }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-muted hover:bg-accent transition-colors"
                >
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">{isFr ? 'Mon Espace' : 'My Space'}</span>
                </button>
                <button
                  onClick={() => { setMoreOpen(false); signOut(); }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-xs font-medium">{isFr ? 'Déconnexion' : 'Sign out'}</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
