import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import {
  Search, Users, Download, ShoppingBag, Heart, Link2,
  UserCheck, UserPlus, TrendingUp, Crown, Filter, ChevronDown,
  Mail, Phone, Globe, Calendar, Building2, Shield,
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';

type FilterTab = 'all' | 'active' | 'creators' | 'affiliates' | 'new';

export default function SuperadminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { fmt } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['sa-users-v2'],
    queryFn: async () => {
      const [profiles, members, roles, purchases, donations, affiliateLinks] = await Promise.all([
        db.from('profiles').select('*').order('created_at', { ascending: false }),
        db.from('organization_members').select('user_id, organization_id, role, organizations(name)'),
        db.from('user_platform_roles').select('user_id, role'),
        db.from('product_purchases').select('user_id, amount, status').eq('status', 'completed'),
        db.from('donations').select('user_id, amount, status').eq('status', 'completed'),
        db.from('affiliate_links').select('user_id, total_earned, clicks, conversions, is_active'),
      ]);

      const memberMap: Record<string, any[]> = {};
      (members.data || []).forEach((m: any) => {
        if (!memberMap[m.user_id]) memberMap[m.user_id] = [];
        memberMap[m.user_id].push(m);
      });

      const roleMap: Record<string, string> = {};
      (roles.data || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

      const purchaseMap: Record<string, { count: number; total: number }> = {};
      (purchases.data || []).forEach((p: any) => {
        if (!purchaseMap[p.user_id]) purchaseMap[p.user_id] = { count: 0, total: 0 };
        purchaseMap[p.user_id].count++;
        purchaseMap[p.user_id].total += p.amount || 0;
      });

      const donationMap: Record<string, { count: number; total: number }> = {};
      (donations.data || []).forEach((d: any) => {
        if (!d.user_id) return;
        if (!donationMap[d.user_id]) donationMap[d.user_id] = { count: 0, total: 0 };
        donationMap[d.user_id].count++;
        donationMap[d.user_id].total += d.amount || 0;
      });

      const affiliateMap: Record<string, { links: number; earned: number; clicks: number }> = {};
      (affiliateLinks.data || []).forEach((a: any) => {
        if (!affiliateMap[a.user_id]) affiliateMap[a.user_id] = { links: 0, earned: 0, clicks: 0 };
        affiliateMap[a.user_id].links++;
        affiliateMap[a.user_id].earned += a.total_earned || 0;
        affiliateMap[a.user_id].clicks += a.clicks || 0;
      });

      return (profiles.data || []).map((p: any) => ({
        ...p,
        memberships: memberMap[p.id] || [],
        platformRole: roleMap[p.id] || null,
        purchases: purchaseMap[p.id] || { count: 0, total: 0 },
        donations: donationMap[p.id] || { count: 0, total: 0 },
        affiliate: affiliateMap[p.id] || { links: 0, earned: 0, clicks: 0 },
      }));
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const last7 = subDays(now, 7);
    const last30 = subDays(now, 30);
    const newThisWeek = users.filter((u: any) => u.created_at && isAfter(new Date(u.created_at), last7)).length;
    const newThisMonth = users.filter((u: any) => u.created_at && isAfter(new Date(u.created_at), last30)).length;
    const creators = users.filter((u: any) => u.memberships.some((m: any) => m.role === 'owner')).length;
    const affiliates = users.filter((u: any) => u.affiliate.links > 0).length;
    return { total: users.length, newThisWeek, newThisMonth, creators, affiliates };
  }, [users]);

  const filtered = useMemo(() => {
    let list = users;

    // Tab filter
    if (activeTab === 'active') {
      const last30 = subDays(new Date(), 30);
      list = list.filter((u: any) => u.purchases.count > 0 || u.donations.count > 0);
    } else if (activeTab === 'creators') {
      list = list.filter((u: any) => u.memberships.some((m: any) => m.role === 'owner'));
    } else if (activeTab === 'affiliates') {
      list = list.filter((u: any) => u.affiliate.links > 0);
    } else if (activeTab === 'new') {
      const last7 = subDays(new Date(), 7);
      list = list.filter((u: any) => u.created_at && isAfter(new Date(u.created_at), last7));
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u: any) =>
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        u.id.includes(q)
      );
    }
    return list;
  }, [users, search, activeTab]);

  const exportCSV = () => {
    const headers = ['ID', 'Nom', 'Email', 'Pays', 'Téléphone', 'Orgs', 'Rôle plateforme', 'Achats', 'Total achats', 'Dons', 'Total dons', 'Liens affil.', 'Gains affil.', 'Inscrit le'];
    const rows = filtered.map((u: any) => [
      u.id, u.display_name || '', u.email || '', u.country || '', u.phone || '',
      u.memberships.map((m: any) => m.organizations?.name).filter(Boolean).join('; '),
      u.platformRole || '',
      u.purchases.count, u.purchases.total,
      u.donations.count, u.donations.total,
      u.affiliate.links, u.affiliate.earned,
      u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((c: any) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export téléchargé ✅' });
  };

  const statCards = [
    { label: isFr ? 'Total utilisateurs' : 'Total users', value: stats.total, icon: Users, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
    { label: isFr ? 'Nouveaux (7j)' : 'New (7d)', value: stats.newThisWeek, icon: UserPlus, gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-500' },
    { label: isFr ? 'Créateurs' : 'Creators', value: stats.creators, icon: Crown, gradient: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-500' },
    { label: isFr ? 'Ambassadeurs' : 'Ambassadors', value: stats.affiliates, icon: TrendingUp, gradient: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-500' },
  ];

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: isFr ? 'Tous' : 'All', count: users.length },
    { key: 'new', label: isFr ? 'Nouveaux' : 'New', count: stats.newThisWeek },
    { key: 'creators', label: isFr ? 'Créateurs' : 'Creators', count: stats.creators },
    { key: 'affiliates', label: isFr ? 'Ambassadeurs' : 'Ambassadors', count: stats.affiliates },
    { key: 'active', label: isFr ? 'Acheteurs' : 'Buyers', count: users.filter((u: any) => u.purchases.count > 0 || u.donations.count > 0).length },
  ];

  const getUserTotalSpent = (u: any) => u.purchases.total + u.donations.total + u.affiliate.earned;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            {isFr ? 'Gestion des utilisateurs' : 'User management'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.newThisMonth} {isFr ? 'nouveaux ce mois' : 'new this month'} · {stats.total} {isFr ? 'au total' : 'total'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5" /> {isFr ? 'Export CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'rounded-xl border border-border bg-gradient-to-br p-4 relative overflow-hidden',
              s.gradient
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value.toLocaleString()}</p>
              </div>
              <div className={cn('h-10 w-10 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center', s.iconColor)}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                activeTab === t.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              <span className={cn(
                'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full',
                activeTab === t.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone ou ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          {search && <span className="ml-1">pour « {search} »</span>}
        </p>
      </div>

      {/* User list */}
      {isLoading ? <SkeletonRow count={8} /> : (
        <div className="space-y-2">
            {filtered.map((u: any, idx: number) => {
              const totalValue = getUserTotalSpent(u);
              const isHighValue = totalValue > 10000;
              const isCreator = u.memberships.some((m: any) => m.role === 'owner');

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  className={cn(
                    'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                    'bg-card hover:bg-muted/30 hover:shadow-sm',
                    isHighValue && 'border-amber-500/20 bg-amber-500/[0.02]',
                    !isHighValue && 'border-border'
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-9 w-9 shrink-0">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.display_name} />}
                    <AvatarFallback className={cn(
                      'text-sm font-bold',
                      isCreator
                        ? 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {(u.display_name || '?')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{u.display_name || 'Sans nom'}</p>
                      {u.platformRole && (
                        <Badge className="text-[9px] bg-primary/10 text-primary border-0 capitalize gap-0.5">
                          <Shield className="h-2.5 w-2.5" />
                          {u.platformRole}
                        </Badge>
                      )}
                      {isCreator && (
                        <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-0 gap-0.5">
                          <Crown className="h-2.5 w-2.5" />
                          Créateur
                        </Badge>
                      )}
                      {isHighValue && (
                        <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-0">
                          💎 VIP
                        </Badge>
                      )}
                    </div>

                    {/* Contact info */}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {u.email && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                          <Mail className="h-3 w-3 shrink-0" /> {u.email}
                        </span>
                      )}
                      {u.phone && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" /> {u.phone}
                        </span>
                      )}
                      {u.country && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3 shrink-0" /> {u.country}
                        </span>
                      )}
                      {u.created_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" /> {format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>

                    {/* Memberships */}
                    {u.memberships.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {u.memberships.slice(0, 3).map((m: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 font-normal">
                            <Building2 className="h-2.5 w-2.5" />
                            {m.organizations?.name || '?'}
                            <span className="text-muted-foreground">({m.role})</span>
                          </Badge>
                        ))}
                        {u.memberships.length > 3 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{u.memberships.length - 3}</Badge>
                        )}
                      </div>
                    )}

                    {/* Activity stats */}
                    {(u.purchases.count > 0 || u.donations.count > 0 || u.affiliate.links > 0) && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                        {u.purchases.count > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 rounded-md px-2 py-0.5">
                            <ShoppingBag className="h-3 w-3 text-primary" />
                            <span className="font-medium text-foreground">{u.purchases.count}</span> {isFr ? 'achats' : 'purchases'}
                            <span className="text-foreground font-medium">({fmt(u.purchases.total, 'XOF')})</span>
                          </span>
                        )}
                        {u.donations.count > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 rounded-md px-2 py-0.5">
                            <Heart className="h-3 w-3 text-rose-500" />
                            <span className="font-medium text-foreground">{u.donations.count}</span> {isFr ? 'dons' : 'donations'}
                            <span className="text-foreground font-medium">({fmt(u.donations.total, 'XOF')})</span>
                          </span>
                        )}
                        {u.affiliate.links > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 rounded-md px-2 py-0.5">
                            <Link2 className="h-3 w-3 text-violet-500" />
                            <span className="font-medium text-foreground">{u.affiliate.links}</span> {isFr ? 'liens' : 'links'}
                            <span className="text-foreground font-medium">({fmt(u.affiliate.earned, 'XOF')})</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ID */}
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                    {u.id.slice(0, 8)}…
                  </span>
                </motion.div>
              );
            })}

            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
      )}
    </div>
  );
}
