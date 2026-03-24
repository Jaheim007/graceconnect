import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, Wallet, Store, PenLine, UserPlus, MoreHorizontal, Shield, Bell, Settings, Heart, BookOpen, HelpCircle, Award, User, Building2, ShieldCheck, FileText, CreditCard } from 'lucide-react';
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

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperadmin } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t } = useI18n();
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;
  const hasManagedOrgs = userOrgs.some((org) => canManage(org.id));
  const [moreOpen, setMoreOpen] = useState(false);

  // Badge: unread notifications count
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

  const guestItems = [
    { to: '/', icon: Home, label: t('bottom.home') },
    { to: '/discover', icon: Store, label: t('bottom.explore') },
    { to: '/ecrire', icon: PenLine, label: t('bottom.write'), accent: true },
    { to: '/gagner', icon: Wallet, label: t('bottom.earn') },
    { to: '/auth?mode=signup', icon: UserPlus, label: t('bottom.signup') },
  ];

  const creatorItems = [
    { to: '/dashboard', icon: Home, label: t('bottom.home') },
    { to: '/admin/create', icon: Plus, label: t('sidebar.create'), accent: true },
    { to: '/admin/sales', icon: Wallet, label: t('sidebar.sales_payouts') || 'Ventes & revenus' },
    { to: '/marketplace', icon: Store, label: t('bottom.discover') },
    { to: '__more__', icon: MoreHorizontal, label: t('bottom.more') },
  ];

  const consumerItems = [
    { to: '/dashboard', icon: Home, label: t('bottom.home') },
    { to: '/marketplace', icon: Store, label: t('bottom.discover') },
    { to: '/resources', icon: Package, label: t('sidebar.purchases') || 'Mes achats' },
    { to: '/ecrire', icon: PenLine, label: t('bottom.write'), accent: true },
    { to: '__more__', icon: MoreHorizontal, label: t('bottom.more') },
  ];

  // ── More menu sections ──
  const moreSections = [
    {
      label: t('sidebar.my_space') || 'Mon espace',
      items: [
        { to: '/profile', icon: User, label: t('bottom.profile') || 'Profil' },
        { to: '/notifications', icon: Bell, label: t('sidebar.notifications') },
        { to: '/resources', icon: Package, label: t('sidebar.purchases') || 'Mes achats' },
        { to: getShortcutRoute('wallet', shortcutContext), icon: Wallet, label: t('sidebar.sales_payouts') || 'Ventes & revenus' },
      ],
    },
    ...(canManageCurrentOrg ? [{
      label: t('sidebar.creator_space') || 'Ma plateforme',
      items: [
        { to: '/admin/analytics', icon: BarChart3, label: t('sidebar.analytics') || 'Analytics' },
        ...(currentOrg ? [{ to: `/org/${currentOrg.slug}/store`, icon: Eye, label: t('sidebar.my_page') || 'Ma page' }] : []),
        { to: '/admin/people', icon: Users, label: t('sidebar.people') || 'Membres' },
        { to: '/admin/viral-tools', icon: Zap, label: 'Viral Tools' },
      ],
    }] : []),
    {
      label: t('sidebar.earn') || 'Gagner',
      items: [
        { to: '/ambassador', icon: Heart, label: t('sidebar.my_affiliations') },
        { to: '/leaderboard', icon: Award, label: t('sidebar.leaderboard') },
      ],
    },
    {
      label: t('sidebar.management') || 'Gestion',
      items: [
        ...(hasManagedOrgs
          ? [{ to: '/admin', icon: Building2, label: t('sidebar.my_platforms') || 'Mes plateformes' }]
          : [{ to: '/create-org', icon: Plus, label: t('topbar.create_org') }]),
        { to: getShortcutRoute('kyc', shortcutContext), icon: ShieldCheck, label: t('sidebar.kyc') || 'Vérification KYC' },
        { to: getShortcutRoute('settings', shortcutContext), icon: Settings, label: t('bottom.settings') || 'Paramètres' },
      ],
    },
    {
      label: t('sidebar.help') || 'Aide',
      items: [
        { to: '/help', icon: HelpCircle, label: t('sidebar.help') },
        { to: '/changelog', icon: FileText, label: 'Changelog' },
        ...(isSuperadmin ? [{ to: '/superadmin', icon: Shield, label: t('sidebar.superadmin') }] : []),
      ],
    },
  ];

  const navItems = !user ? guestItems : canManageCurrentOrg ? creatorItems : consumerItems;

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
              <SheetTitle className="text-sm font-bold">{t('bottom.more') || 'Plus'}</SheetTitle>
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
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
