import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Play, Bell, User, Store, Settings, BarChart3, Users, ShoppingBag, Heart, Link2, Megaphone, CalendarDays, Camera, FileCheck, Wallet, CreditCard, Clock, GraduationCap, Shield, Zap, BookOpen, Search, Building2, Package, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface CmdItem {
  label: string;
  to: string;
  icon: typeof Home;
  group: string;
  keywords?: string;
  disabled?: boolean;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, isSuperadmin } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t } = useI18n();
  const hasAmbassadorAccess = true;

  const hasOrgs = userOrgs.length > 0;
  const canManageOrg = currentOrg ? canManage(currentOrg.id) : false;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const items = useMemo(() => {
    const list: CmdItem[] = [
      { label: t('cmd.dashboard'), to: '/dashboard', icon: Home, group: t('cmd.my_space'), keywords: 'dashboard accueil home' },
      { label: t('cmd.my_purchases'), to: '/my-purchases', icon: Package, group: t('cmd.my_space'), keywords: 'purchases resources achats' },
      { label: t('cmd.my_donations'), to: '/my-purchases?tab=giving', icon: Heart, group: t('cmd.my_space'), keywords: 'donations dons' },
      { label: t('cmd.discover'), to: '/marketplace', icon: Store, group: t('cmd.my_space'), keywords: 'marketplace explore shop découvrir' },
      { label: t('cmd.notifications'), to: '/notifications', icon: Bell, group: t('cmd.my_space') },
      { label: t('cmd.profile'), to: '/profile', icon: User, group: t('cmd.my_space'), keywords: 'account settings profil' },
    ];

    if (hasAmbassadorAccess) {
      list.push({ label: t('cmd.affiliate_links'), to: '/gagner', icon: Link2, group: t('cmd.earn'), keywords: 'affiliate ambassador affiliation' });
    }

    if (hasOrgs && canManageOrg) {
      list.push(
        { label: t('cmd.admin_overview'), to: '/admin', icon: BarChart3, group: t('cmd.my_platform'), keywords: 'overview admin' },
        { label: t('cmd.ai_studio'), to: '/ecrire', icon: Zap, group: t('cmd.my_platform'), keywords: 'ai studio content viral' },
        { label: t('cmd.media'), to: '/admin/media', icon: Play, group: t('cmd.my_platform'), keywords: 'media video audio' },
        { label: t('cmd.photos'), to: '/admin/photos', icon: Camera, group: t('cmd.my_platform') },
        { label: t('cmd.announcements'), to: '/admin/announcements', icon: Megaphone, group: t('cmd.my_platform'), keywords: 'announcements annonces' },
        { label: t('cmd.events'), to: '/admin/events', icon: CalendarDays, group: t('cmd.my_platform'), keywords: 'events événements' },
        { label: t('cmd.products'), to: '/admin/products', icon: ShoppingBag, group: t('cmd.my_platform'), keywords: 'products produits digital' },
        { label: t('cmd.donation_campaigns'), to: '/admin/campaigns', icon: Heart, group: t('cmd.my_platform'), keywords: 'campaigns donation campagnes' },
        { label: t('cmd.ambassadors'), to: '/admin/affiliation', icon: Link2, group: t('cmd.my_platform'), keywords: 'affiliates ambassadeurs' },
        { label: t('cmd.promo_codes'), to: '/admin/promo-codes', icon: FileCheck, group: t('cmd.my_platform'), keywords: 'promo codes' },
        { label: t('cmd.subscriptions'), to: '/admin/subscriptions', icon: CreditCard, group: t('cmd.my_platform'), keywords: 'subscriptions abonnements' },
        { label: t('cmd.sales'), to: '/admin/sales', icon: Wallet, group: t('cmd.my_platform'), keywords: 'sales revenue ventes' },
        { label: t('cmd.members'), to: '/admin/members', icon: Users, group: t('cmd.my_platform'), keywords: 'members team membres' },
        { label: t('cmd.crm_contacts'), to: '/admin/crm', icon: UserPlus, group: t('cmd.my_platform'), keywords: 'crm contacts' },
        { label: t('cmd.payouts'), to: '/admin/payouts', icon: Wallet, group: t('cmd.my_platform'), keywords: 'payouts versements' },
        { label: t('cmd.analytics'), to: '/admin/analytics', icon: BarChart3, group: t('cmd.my_platform'), keywords: 'analytics stats analytiques' },
        { label: t('cmd.settings'), to: '/admin/settings', icon: Settings, group: t('cmd.my_platform'), keywords: 'settings config paramètres' },
        { label: t('cmd.programs'), to: '/admin/programs', icon: GraduationCap, group: t('cmd.my_platform'), keywords: 'programs courses programmes' },
        { label: t('cmd.waitlists'), to: '/admin/waitlists', icon: Clock, group: t('cmd.my_platform'), keywords: 'waitlists' },
      );
    }

    if (isSuperadmin) {
      list.push(
        { label: 'Superadmin', to: '/superadmin', icon: Shield, group: 'Superadmin' },
        { label: 'Organizations (SA)', to: '/superadmin/orgs', icon: Building2, group: 'Superadmin' },
        { label: 'Vérification ID (SA)', to: '/superadmin/kyc', icon: FileCheck, group: 'Superadmin' },
        { label: 'Transactions (SA)', to: '/superadmin/transactions', icon: BarChart3, group: 'Superadmin' },
      );
    }

    return list;
  }, [hasAmbassadorAccess, hasOrgs, canManageOrg, isSuperadmin, t]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      i.label.toLowerCase().includes(q) ||
      i.group.toLowerCase().includes(q) ||
      i.keywords?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const groups = useMemo(() => {
    const map = new Map<string, CmdItem[]>();
    filtered.forEach(i => {
      const arr = map.get(i.group) || [];
      arr.push(i);
      map.set(i.group, arr);
    });
    return map;
  }, [filtered]);

  const handleSelect = (to: string) => {
    setOpen(false);
    setSearch('');
    navigate(to);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden border-border/60 shadow-2xl">
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('cmd.search_placeholder')}
            className="flex-1 bg-transparent py-3 px-3 text-sm outline-hidden placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('cmd.no_results')}</p>
          )}
          {Array.from(groups.entries()).map(([group, groupItems]) => (
            <div key={group} className="px-1">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group}</p>
              {groupItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => !item.disabled && handleSelect(item.to)}
                    disabled={item.disabled}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-left',
                      item.disabled
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                      'transition-colors focus:outline-hidden'
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                    {item.disabled && (
                      <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t('sidebar.coming_soon')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-3 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>↑↓ {t('cmd.navigate')}</span>
          <span>↵ {t('cmd.open')}</span>
          <span>esc {t('cmd.close')}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}