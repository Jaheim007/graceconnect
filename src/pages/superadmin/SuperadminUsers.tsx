import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Search, Users, Download, ShoppingBag, Heart, Link2, UserPlus, TrendingUp, Crown, Mail, Phone, Globe, Calendar, Building2, Shield, ArrowUpDown, Zap } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type FilterTab = 'all' | 'active' | 'creators' | 'affiliates' | 'new';
type SortKey = 'recent' | 'top_spend' | 'most_orgs' | 'name';

export default function SuperadminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const { fmt } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateFnsLocale = isFr ? fr : enUS;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['sa-users-v2'],
    queryFn: async () => {
      const [profiles, members, roles, purchases, donations, affiliateLinks] = await Promise.all([
        db.from('profiles').select('*').order('created_at', { ascending: false }),
        db.from('organization_members').select('user_id, organization_id, role, organizations(name)'),
        db.from('user_platform_roles').select('user_id, role'),
        db.from('product_purchases').select('user_id, amount, status, buyer_email').eq('status', 'completed'),
        db.from('donations').select('user_id, amount, status, donor_email').eq('status', 'completed'),
        db.from('affiliate_links').select('user_id, total_earned, clicks, conversions, is_active'),
      ]);

      const memberMap: Record<string, any[]> = {};
      (members.data || []).forEach((m: any) => {
        if (!memberMap[m.user_id]) memberMap[m.user_id] = [];
        memberMap[m.user_id].push(m);
      });

      const roleMap: Record<string, string> = {};
      (roles.data || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

      const emailMap: Record<string, string> = {};
      const purchaseMap: Record<string, { count: number; total: number }> = {};
      (purchases.data || []).forEach((p: any) => {
        if (!purchaseMap[p.user_id]) purchaseMap[p.user_id] = { count: 0, total: 0 };
        purchaseMap[p.user_id].count++;
        purchaseMap[p.user_id].total += p.amount || 0;
        if (p.buyer_email && p.user_id) emailMap[p.user_id] = p.buyer_email;
      });

      const donationMap: Record<string, { count: number; total: number }> = {};
      (donations.data || []).forEach((d: any) => {
        if (!d.user_id) return;
        if (!donationMap[d.user_id]) donationMap[d.user_id] = { count: 0, total: 0 };
        donationMap[d.user_id].count++;
        donationMap[d.user_id].total += d.amount || 0;
        if (d.donor_email && d.user_id) emailMap[d.user_id] = d.donor_email;
      });

      const affiliateMap: Record<string, { links: number; earned: number; clicks: number }> = {};
      (affiliateLinks.data || []).forEach((a: any) => {
        if (!affiliateMap[a.user_id]) affiliateMap[a.user_id] = { links: 0, earned: 0, clicks: 0 };
        affiliateMap[a.user_id].links++;
        affiliateMap[a.user_id].earned += a.total_earned || 0;
        affiliateMap[a.user_id].clicks += a.clicks || 0;
      });

      const deriveName = (email: string) =>
        email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      return (profiles.data || []).map((p: any) => {
        const resolvedName = (p.display_name && p.display_name.trim())
          ? p.display_name
          : emailMap[p.id] ? deriveName(emailMap[p.id]) : null;
        return {
          ...p,
          display_name: resolvedName || p.display_name,
          _resolved_email: emailMap[p.id] || null,
          memberships: memberMap[p.id] || [],
          platformRole: roleMap[p.id] || null,
          purchases: purchaseMap[p.id] || { count: 0, total: 0 },
          donations: donationMap[p.id] || { count: 0, total: 0 },
          affiliate: affiliateMap[p.id] || { links: 0, earned: 0, clicks: 0 },
        };
      });
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
    const buyers = users.filter((u: any) => u.purchases.count > 0 || u.donations.count > 0).length;
    return { total: users.length, newThisWeek, newThisMonth, creators, affiliates, buyers };
  }, [users]);

  const getUserTotalSpent = (u: any) => u.purchases.total + u.donations.total + u.affiliate.earned;

  const filtered = useMemo(() => {
    let list = users;
    if (activeTab === 'active') {
      list = list.filter((u: any) => u.purchases.count > 0 || u.donations.count > 0);
    } else if (activeTab === 'creators') {
      list = list.filter((u: any) => u.memberships.some((m: any) => m.role === 'owner'));
    } else if (activeTab === 'affiliates') {
      list = list.filter((u: any) => u.affiliate.links > 0);
    } else if (activeTab === 'new') {
      const last7 = subDays(new Date(), 7);
      list = list.filter((u: any) => u.created_at && isAfter(new Date(u.created_at), last7));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u: any) =>
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u._resolved_email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        u.id.includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === 'recent') {
      sorted.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'top_spend') {
      sorted.sort((a: any, b: any) => getUserTotalSpent(b) - getUserTotalSpent(a));
    } else if (sortBy === 'most_orgs') {
      sorted.sort((a: any, b: any) => b.memberships.length - a.memberships.length);
    } else if (sortBy === 'name') {
      sorted.sort((a: any, b: any) => (a.display_name || '').localeCompare(b.display_name || ''));
    }
    return sorted;
  }, [users, search, activeTab, sortBy]);

  const exportCSV = () => {
    const headers = ['ID','Nom','Email','Pays','Téléphone','Orgs','Rôle plateforme','Achats','Total achats','Dons','Total dons','Liens affil.','Gains affil.','Inscrit le'];
    const rows = filtered.map((u: any) => [
      u.id, u.display_name || '', u.email || u._resolved_email || '', u.country || '', u.phone || '',
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
    toast({ title: isFr ? 'Export téléchargé ✅' : 'Export downloaded ✅' });
  };

  const statCards = [
    { label: isFr ? 'Total utilisateurs' : 'Total users', value: stats.total, icon: Users, tone: 'primary' },
    { label: isFr ? 'Nouveaux (7j)' : 'New (7d)', value: stats.newThisWeek, icon: UserPlus, tone: 'emerald' },
    { label: isFr ? 'Créateurs' : 'Creators', value: stats.creators, icon: Crown, tone: 'amber' },
    { label: isFr ? 'Ambassadeurs' : 'Ambassadors', value: stats.affiliates, icon: TrendingUp, tone: 'violet' },
  ] as const;

  const toneClasses: Record<string, string> = {
    primary: 'from-primary/10 to-primary/[0.02] text-primary ring-primary/20',
    emerald: 'from-emerald-500/10 to-emerald-500/[0.02] text-emerald-500 ring-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/[0.02] text-amber-500 ring-amber-500/20',
    violet: 'from-violet-500/10 to-violet-500/[0.02] text-violet-500 ring-violet-500/20',
  };

  const tabs: { key: FilterTab; label: string; count: number; icon: any }[] = [
    { key: 'all', label: isFr ? 'Tous' : 'All', count: stats.total, icon: Users },
    { key: 'new', label: isFr ? 'Nouveaux' : 'New', count: stats.newThisWeek, icon: Zap },
    { key: 'creators', label: isFr ? 'Créateurs' : 'Creators', count: stats.creators, icon: Crown },
    { key: 'affiliates', label: isFr ? 'Ambassadeurs' : 'Ambassadors', count: stats.affiliates, icon: TrendingUp },
    { key: 'active', label: isFr ? 'Acheteurs' : 'Buyers', count: stats.buyers, icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6 tabular-nums">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xs ring-1 ring-primary/20">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isFr ? 'Gestion des utilisateurs' : 'User management'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.newThisMonth} {isFr ? 'nouveaux ce mois' : 'new this month'} · {stats.total.toLocaleString()} {isFr ? 'au total' : 'total'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5" /> {isFr ? 'Export CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              'rounded-2xl border border-border/60 bg-gradient-to-br p-4 relative overflow-hidden ring-1',
              toneClasses[s.tone]
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                <p className="text-2xl font-bold mt-1.5 text-foreground truncate">{s.value.toLocaleString()}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-background/70 backdrop-blur flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-3 space-y-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 scrollbar-none">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  active
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-md font-semibold',
                  active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {t.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={isFr ? 'Rechercher par nom, email, téléphone ou ID…' : 'Search by name, email, phone or ID…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{isFr ? 'Plus récents' : 'Most recent'}</SelectItem>
              <SelectItem value="top_spend">{isFr ? 'Plus gros dépensiers' : 'Top spenders'}</SelectItem>
              <SelectItem value="most_orgs">{isFr ? "Plus d'organisations" : 'Most orgs'}</SelectItem>
              <SelectItem value="name">{isFr ? 'Nom (A-Z)' : 'Name (A-Z)'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span> {isFr ? 'résultat' : 'result'}{filtered.length !== 1 ? 's' : ''}
          {search && <span className="ml-1">{isFr ? 'pour' : 'for'} « {search} »</span>}
        </p>
      </div>

      {/* User list */}
      {isLoading ? <SkeletonRow count={8} /> : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-14 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">{isFr ? 'Aucun utilisateur trouvé' : 'No users found'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFr ? 'Ajustez la recherche ou les filtres.' : 'Adjust your search or filters.'}
          </p>
          {(search || activeTab !== 'all') && (
            <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={() => { setSearch(''); setActiveTab('all'); }}>
              {isFr ? 'Réinitialiser' : 'Reset filters'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any, idx: number) => {
            const totalValue = getUserTotalSpent(u);
            const isHighValue = totalValue >= 10000;
            const isCreator = u.memberships.some((m: any) => m.role === 'owner');
            const displayName = u.display_name || u._resolved_email?.split('@')[0] || u.id.slice(0, 8);

            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.015, 0.25) }}
                className={cn(
                  'group grid grid-cols-[auto_1fr_auto] gap-4 p-4 rounded-2xl border transition-all',
                  'bg-card hover:bg-muted/30 hover:shadow-xs hover:border-border',
                  isHighValue ? 'border-amber-500/25 bg-amber-500/[0.015]' : 'border-border/60'
                )}
              >
                {/* Avatar */}
                <Avatar className="h-11 w-11 shrink-0 ring-1 ring-border/60">
                  {u.avatar_url && <AvatarImage src={u.avatar_url} alt={displayName} />}
                  <AvatarFallback className={cn(
                    'text-sm font-bold',
                    isCreator
                      ? 'bg-gradient-to-br from-primary/25 to-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    {u.platformRole && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-0 capitalize gap-0.5 font-medium">
                        <Shield className="h-2.5 w-2.5" />
                        {u.platformRole}
                      </Badge>
                    )}
                    {isCreator && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 gap-0.5 font-medium">
                        <Crown className="h-2.5 w-2.5" />
                        {isFr ? 'Créateur' : 'Creator'}
                      </Badge>
                    )}
                    {u.affiliate.links > 0 && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0 gap-0.5 font-medium">
                        <TrendingUp className="h-2.5 w-2.5" />
                        {isFr ? 'Ambassadeur' : 'Ambassador'}
                      </Badge>
                    )}
                    {isHighValue && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 font-medium">
                        VIP
                      </Badge>
                    )}
                  </div>

                  {/* Contact chips */}
                  <div className="flex items-center gap-x-3 gap-y-1 mt-1 flex-wrap text-[11px] text-muted-foreground">
                    {(u.email || u._resolved_email) && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[240px]">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{u.email || u._resolved_email}</span>
                      </span>
                    )}
                    {u.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" /> {u.phone}
                      </span>
                    )}
                    {u.country && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3 shrink-0" /> {u.country}
                      </span>
                    )}
                    {u.created_at && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {format(new Date(u.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                      </span>
                    )}
                  </div>

                  {/* Memberships */}
                  {u.memberships.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {u.memberships.slice(0, 3).map((m: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 font-normal bg-background">
                          <Building2 className="h-2.5 w-2.5" />
                          {m.organizations?.name || '?'}
                          <span className="text-muted-foreground">· {m.role}</span>
                        </Badge>
                      ))}
                      {u.memberships.length > 3 && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-background">+{u.memberships.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  {/* Activity chips */}
                  {(u.purchases.count > 0 || u.donations.count > 0 || u.affiliate.links > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-border/40">
                      {u.purchases.count > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-cyan-500/8 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/15 rounded-md px-1.5 py-0.5">
                          <ShoppingBag className="h-3 w-3" />
                          <span className="font-semibold">{u.purchases.count}</span>
                          <span className="opacity-70">·</span>
                          <span className="font-semibold">{fmt(u.purchases.total, 'XOF')}</span>
                        </span>
                      )}
                      {u.donations.count > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/8 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/15 rounded-md px-1.5 py-0.5">
                          <Heart className="h-3 w-3" />
                          <span className="font-semibold">{u.donations.count}</span>
                          <span className="opacity-70">·</span>
                          <span className="font-semibold">{fmt(u.donations.total, 'XOF')}</span>
                        </span>
                      )}
                      {u.affiliate.links > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-violet-500/8 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/15 rounded-md px-1.5 py-0.5">
                          <Link2 className="h-3 w-3" />
                          <span className="font-semibold">{u.affiliate.links}</span>
                          <span className="opacity-70">·</span>
                          <span className="font-semibold">{fmt(u.affiliate.earned, 'XOF')}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right rail: value + id */}
                <div className="flex flex-col items-end justify-between gap-2 text-right shrink-0">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {isFr ? 'Valeur' : 'Value'}
                    </p>
                    <p className={cn(
                      'text-sm font-bold mt-0.5',
                      isHighValue ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                    )}>
                      {fmt(totalValue, 'XOF')}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono opacity-40 group-hover:opacity-90 transition-opacity">
                    {u.id.slice(0, 8)}…
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
