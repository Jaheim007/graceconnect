import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from 'cmdk';
import {
  Home, Play, Bell, User, Store, Settings, BarChart3, Users, ShoppingBag,
  Heart, Link2, Megaphone, CalendarDays, Camera, FileCheck, Wallet,
  CreditCard, Clock, GraduationCap, Shield, Sparkles, BookOpen, Search,
  Building2, Package, UserPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useMode } from '@/contexts/ModeContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CmdItem {
  label: string;
  to: string;
  icon: typeof Home;
  group: string;
  keywords?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, isSuperadmin } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { hasAmbassadorAccess } = useMode();

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
      { label: 'Tableau de bord', to: '/dashboard', icon: Home, group: 'Mon espace', keywords: 'dashboard accueil' },
      { label: 'Mes achats', to: '/resources', icon: Package, group: 'Mon espace', keywords: 'purchases resources' },
      { label: 'Mes dons', to: '/my-donations', icon: Heart, group: 'Mon espace', keywords: 'donations' },
      { label: 'Découvrir', to: '/marketplace', icon: Store, group: 'Mon espace', keywords: 'marketplace explore shop' },
      { label: 'Notifications', to: '/notifications', icon: Bell, group: 'Mon espace' },
      { label: 'Profil', to: '/profile', icon: User, group: 'Mon espace', keywords: 'account settings' },
    ];

    if (hasAmbassadorAccess) {
      list.push({ label: 'Mes liens d\'affiliation', to: '/affiliation', icon: Link2, group: 'Gagner', keywords: 'affiliate ambassador' });
    }

    if (hasOrgs && canManageOrg) {
      list.push(
        { label: 'Vue d\'ensemble admin', to: '/admin', icon: BarChart3, group: 'Ma plateforme', keywords: 'overview admin' },
        { label: 'Studio IA (Bientôt)', to: '/admin/studio', icon: Sparkles, group: 'Ma plateforme', keywords: 'ai studio content', disabled: true },
        { label: 'Projets IA (Bientôt)', to: '/admin/studio/projects', icon: BookOpen, group: 'Ma plateforme', keywords: 'projects', disabled: true },
        { label: 'Médias', to: '/admin/media', icon: Play, group: 'Ma plateforme', keywords: 'media video audio' },
        { label: 'Photos', to: '/admin/photos', icon: Camera, group: 'Ma plateforme' },
        { label: 'Annonces', to: '/admin/announcements', icon: Megaphone, group: 'Ma plateforme', keywords: 'announcements' },
        { label: 'Événements', to: '/admin/events', icon: CalendarDays, group: 'Ma plateforme', keywords: 'events' },
        { label: 'Produits', to: '/admin/products', icon: ShoppingBag, group: 'Ma plateforme', keywords: 'products digital' },
        { label: 'Campagnes dons', to: '/admin/campaigns', icon: Heart, group: 'Ma plateforme', keywords: 'campaigns donation' },
        { label: 'Ambassadeurs', to: '/admin/affiliation', icon: Link2, group: 'Ma plateforme', keywords: 'affiliates' },
        { label: 'Codes promo', to: '/admin/promo-codes', icon: FileCheck, group: 'Ma plateforme', keywords: 'promo codes' },
        { label: 'Abonnements', to: '/admin/subscriptions', icon: CreditCard, group: 'Ma plateforme', keywords: 'subscriptions' },
        { label: 'Ventes', to: '/admin/sales', icon: Wallet, group: 'Ma plateforme', keywords: 'sales revenue' },
        { label: 'Membres', to: '/admin/members', icon: Users, group: 'Ma plateforme', keywords: 'members team' },
        { label: 'CRM / Contacts', to: '/admin/crm', icon: UserPlus, group: 'Ma plateforme', keywords: 'crm contacts' },
        { label: 'Versements', to: '/admin/payouts', icon: Wallet, group: 'Ma plateforme', keywords: 'payouts' },
        { label: 'Analytiques', to: '/admin/analytics', icon: BarChart3, group: 'Ma plateforme', keywords: 'analytics stats' },
        { label: 'Paramètres', to: '/admin/settings', icon: Settings, group: 'Ma plateforme', keywords: 'settings config' },
        { label: 'Programmes', to: '/admin/programs', icon: GraduationCap, group: 'Ma plateforme', keywords: 'programs courses' },
        { label: 'Listes d\'attente', to: '/admin/waitlists', icon: Clock, group: 'Ma plateforme', keywords: 'waitlists' },
      );
    }

    if (isSuperadmin) {
      list.push(
        { label: 'Superadmin', to: '/superadmin', icon: Shield, group: 'Superadmin' },
        { label: 'Organisations (SA)', to: '/superadmin/orgs', icon: Building2, group: 'Superadmin' },
        { label: 'KYC (SA)', to: '/superadmin/kyc', icon: FileCheck, group: 'Superadmin' },
        { label: 'Transactions (SA)', to: '/superadmin/transactions', icon: BarChart3, group: 'Superadmin' },
      );
    }

    return list;
  }, [hasAmbassadorAccess, hasOrgs, canManageOrg, isSuperadmin]);

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
            placeholder="Rechercher une page ou action..."
            className="flex-1 bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun résultat</p>
          )}
          {Array.from(groups.entries()).map(([group, groupItems]) => (
            <div key={group} className="px-1">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group}</p>
              {groupItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => handleSelect(item.to)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-left',
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-3 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>↑↓ naviguer</span>
          <span>↵ ouvrir</span>
          <span>esc fermer</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
