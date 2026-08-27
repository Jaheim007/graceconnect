import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import {
  Activity, Heart, ShoppingBag, Users, Shield, UserPlus, FileText, Coins, RefreshCw,
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useMemo, useState } from 'react';

type FilterKey = 'all' | 'purchase' | 'donation' | 'signup' | 'kyc' | 'member' | 'report' | 'credit_purchase';

export default function SuperadminActivityFeed() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateFnsLocale = isFr ? fr : enUS;
  const { fmt } = useDisplayCurrency();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: activities = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['sa-activity-feed'],
    queryFn: async () => {
      const [donations, purchases, profiles, kyc, members, reports, creditPurchases] = await Promise.all([
        db.from('donations').select('id, donor_name, donor_email, user_id, amount, status, created_at, currency').order('created_at', { ascending: false }).limit(30),
        db.from('product_purchases').select('id, amount, status, created_at, currency, buyer_name, buyer_email, user_id, digital_products(title)').order('created_at', { ascending: false }).limit(30),
        db.from('profiles').select('id, display_name, created_at').order('created_at', { ascending: false }).limit(20),
        db.from('kyc_submissions').select('id, status, submitted_at, organization_id').order('submitted_at', { ascending: false }).limit(20),
        db.from('organization_members').select('id, role, joined_at, user_id, organizations(name), profiles(display_name)').order('joined_at', { ascending: false }).limit(20),
        db.from('content_reports').select('id, content_type, reason, status, created_at').order('created_at', { ascending: false }).limit(20),
        db.from('credit_purchases').select('id, user_id, pack_key, credits_amount, price_amount, price_currency, payment_gateway, status, created_at').order('created_at', { ascending: false }).limit(30),
      ]);

      const allUserIds = new Set<string>();
      (purchases.data || []).forEach((p: any) => { if (p.user_id) allUserIds.add(p.user_id); });
      (donations.data || []).forEach((d: any) => { if (d.user_id) allUserIds.add(d.user_id); });
      (profiles.data || []).forEach((p: any) => allUserIds.add(p.id));
      (members.data || []).forEach((m: any) => { if (m.user_id) allUserIds.add(m.user_id); });
      (creditPurchases.data || []).forEach((c: any) => { if (c.user_id) allUserIds.add(c.user_id); });

      const globalNameMap: Record<string, string> = {};
      if (allUserIds.size > 0) {
        const ids = [...allUserIds];
        const { data: allProfiles } = await db.from('profiles').select('id, display_name').in('id', ids);
        (allProfiles || []).forEach((p: any) => {
          if (p.display_name && p.display_name.trim()) globalNameMap[p.id] = p.display_name.trim();
        });
        const missingIds = ids.filter(id => !globalNameMap[id]);
        if (missingIds.length > 0) {
          const [pe, de, emailsRes] = await Promise.all([
            db.from('product_purchases').select('user_id, buyer_email, buyer_name').in('user_id', missingIds).limit(200),
            db.from('donations').select('user_id, donor_email, donor_name').in('user_id', missingIds).limit(200),
            db.rpc('get_user_emails', { user_ids: missingIds }),
          ]);
          (emailsRes.data || []).forEach((r: any) => {
            if (!globalNameMap[r.id] && r.email) globalNameMap[r.id] = r.email.split('@')[0];
          });
          (pe.data || []).forEach((r: any) => {
            if (r.buyer_name && r.buyer_name.trim() && r.buyer_name.trim().toLowerCase() !== 'acheteur') {
              globalNameMap[r.user_id] = r.buyer_name.trim();
            } else if (r.buyer_email && !globalNameMap[r.user_id]) {
              globalNameMap[r.user_id] = r.buyer_email.split('@')[0];
            }
          });
          (de.data || []).forEach((r: any) => {
            if (r.donor_name && r.donor_name.trim()) {
              globalNameMap[r.user_id] = r.donor_name.trim();
            } else if (r.donor_email && !globalNameMap[r.user_id]) {
              globalNameMap[r.user_id] = r.donor_email.split('@')[0];
            }
          });
        }
      }

      interface ActivityItem {
        id: string;
        type: FilterKey;
        title: string;
        subtitle: string;
        amount?: number;
        amountLabel?: string;
        status?: string;
        timestamp: string;
      }

      const items: ActivityItem[] = [];
      const resolveName = (name?: string | null, email?: string | null, userId?: string | null): string => {
        if (name && name.trim() && name.trim().toLowerCase() !== 'acheteur' && name.trim().toLowerCase() !== 'buyer') return name.trim();
        if (userId && globalNameMap[userId]) return globalNameMap[userId];
        if (email) return email.split('@')[0];
        if (userId) return userId.slice(0, 8);
        return isFr ? 'Utilisateur' : 'User';
      };

      (donations.data || []).forEach((d: any) => items.push({
        id: `don-${d.id}`, type: 'donation',
        title: isFr ? `Don de ${resolveName(d.donor_name, d.donor_email, d.user_id)}` : `Donation from ${resolveName(d.donor_name, d.donor_email, d.user_id)}`,
        subtitle: isFr ? 'Campagne de dons' : 'Donation campaign',
        amount: d.amount, amountLabel: fmt(d.amount, d.currency || 'XOF'),
        status: d.status, timestamp: d.created_at,
      }));

      (purchases.data || []).forEach((p: any) => {
        const buyerName = resolveName(p.buyer_name, p.buyer_email, p.user_id);
        items.push({
          id: `pur-${p.id}`, type: 'purchase',
          title: isFr ? `Achat de ${buyerName}` : `Purchase by ${buyerName}`,
          subtitle: p.digital_products?.title || (isFr ? 'Produit numérique' : 'Digital product'),
          amount: p.amount, amountLabel: fmt(p.amount, p.currency || 'XOF'),
          status: p.status, timestamp: p.created_at,
        });
      });

      (profiles.data || []).forEach((p: any) => {
        items.push({
          id: `sig-${p.id}`, type: 'signup',
          title: isFr ? 'Nouvel utilisateur' : 'New user',
          subtitle: resolveName(p.display_name, null, p.id),
          timestamp: p.created_at,
        });
      });

      (kyc.data || []).forEach((k: any) => items.push({
        id: `kyc-${k.id}`, type: 'kyc',
        title: isFr ? "Vérification d'identité" : 'ID verification',
        subtitle: `${isFr ? 'Statut' : 'Status'}: ${k.status}`,
        status: k.status, timestamp: k.submitted_at,
      }));

      (members.data || []).forEach((m: any) => {
        const memberName = resolveName(m.profiles?.display_name, null, m.user_id);
        items.push({
          id: `mem-${m.id}`, type: 'member',
          title: isFr ? 'Nouveau membre' : 'New member',
          subtitle: `${memberName} → ${m.organizations?.name || '?'} · ${m.role}`,
          timestamp: m.joined_at,
        });
      });

      (reports.data || []).forEach((r: any) => items.push({
        id: `rep-${r.id}`, type: 'report',
        title: isFr ? 'Signalement' : 'Report',
        subtitle: `${r.content_type} · ${(r.reason || '').slice(0, 60)}`,
        status: r.status, timestamp: r.created_at,
      }));

      (creditPurchases.data || []).forEach((c: any) => {
        const userName = resolveName(null, null, c.user_id);
        const gateway = c.payment_gateway === 'stripe' ? 'Stripe' : c.payment_gateway === 'geniuspay' ? 'GeniusPay' : 'Paystack';
        items.push({
          id: `crd-${c.id}`, type: 'credit_purchase',
          title: isFr ? `Achat de crédits · ${userName}` : `Credit purchase · ${userName}`,
          subtitle: `${c.credits_amount} ${isFr ? 'crédits' : 'credits'} · ${gateway}`,
          amount: c.price_amount, amountLabel: fmt(c.price_amount, c.price_currency || 'XOF'),
          status: c.status, timestamp: c.created_at,
        });
      });

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    refetchInterval: 30000,
  });

  const typeConfig: Record<FilterKey, { icon: any; color: string; bg: string; ring: string; label: string }> = {
    all:             { icon: Activity,  color: 'text-foreground',                     bg: 'bg-muted',                ring: 'ring-border',           label: isFr ? 'Tout' : 'All' },
    purchase:        { icon: ShoppingBag,color: 'text-cyan-600 dark:text-cyan-400',   bg: 'bg-cyan-500/10',          ring: 'ring-cyan-500/25',      label: isFr ? 'Achats' : 'Purchases' },
    donation:        { icon: Heart,     color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-500/10',          ring: 'ring-rose-500/25',      label: isFr ? 'Dons' : 'Donations' },
    signup:          { icon: UserPlus,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10',    ring: 'ring-emerald-500/25',   label: isFr ? 'Inscriptions' : 'Signups' },
    kyc:             { icon: Shield,    color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-500/10',         ring: 'ring-amber-500/25',     label: 'KYC' },
    member:          { icon: Users,     color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10',          ring: 'ring-blue-500/25',      label: isFr ? 'Membres' : 'Members' },
    report:          { icon: FileText,  color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-500/10',           ring: 'ring-red-500/25',       label: isFr ? 'Signalements' : 'Reports' },
    credit_purchase: { icon: Coins,     color: 'text-yellow-600 dark:text-yellow-400',bg: 'bg-yellow-500/10',        ring: 'ring-yellow-500/25',    label: isFr ? 'Crédits' : 'Credits' },
  };

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: activities.length, purchase: 0, donation: 0, signup: 0, kyc: 0, member: 0, report: 0, credit_purchase: 0 };
    activities.forEach((a: any) => { c[a.type as FilterKey] = (c[a.type as FilterKey] || 0) + 1; });
    return c;
  }, [activities]);

  const filtered = filter === 'all' ? activities : activities.filter((a: any) => a.type === filter);

  // Group by day bucket
  const grouped = useMemo(() => {
    const buckets: { key: string; label: string; items: any[] }[] = [];
    const map: Record<string, { label: string; items: any[] }> = {};
    filtered.forEach((item: any) => {
      const d = new Date(item.timestamp);
      let key: string;
      let label: string;
      if (isToday(d)) { key = 'today'; label = isFr ? "Aujourd'hui" : 'Today'; }
      else if (isYesterday(d)) { key = 'yesterday'; label = isFr ? 'Hier' : 'Yesterday'; }
      else {
        key = format(d, 'yyyy-MM-dd');
        label = format(d, 'EEEE d MMMM', { locale: dateFnsLocale });
      }
      if (!map[key]) { map[key] = { label, items: [] }; buckets.push({ key, label, items: map[key].items }); }
      map[key].items.push(item);
    });
    return buckets;
  }, [filtered, isFr, dateFnsLocale]);

  const relativeTime = (ts: string) => {
    const d = new Date(ts);
    const mins = differenceInMinutes(new Date(), d);
    if (mins < 1) return isFr ? "à l'instant" : 'just now';
    if (mins < 60) return isFr ? `il y a ${mins}m` : `${mins}m ago`;
    if (mins < 60 * 24) return format(d, 'HH:mm');
    return format(d, 'dd MMM HH:mm', { locale: dateFnsLocale });
  };

  const statusTone = (status?: string) => {
    if (!status) return '';
    if (['completed', 'approved', 'resolved'].includes(status)) return 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5';
    if (['pending', 'reviewed'].includes(status)) return 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5';
    if (['abandoned', 'dismissed', 'rejected', 'failed'].includes(status)) return 'border-muted-foreground/30 text-muted-foreground bg-muted/40';
    return 'border-border text-foreground';
  };

  const chipOrder: FilterKey[] = ['all', 'purchase', 'donation', 'signup', 'kyc', 'member', 'credit_purchase', 'report'];

  return (
    <div className="space-y-5 tabular-nums">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xs ring-1 ring-primary/20">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{isFr ? "Flux d'activité" : 'Activity Feed'}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activities.length.toLocaleString()} {isFr ? 'événements récents' : 'recent events'} · {isFr ? 'rafraîchissement 30s' : 'refresh 30s'}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted transition-colors',
            isFetching && 'opacity-60'
          )}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          {isFr ? 'Actualiser' : 'Refresh'}
        </button>
      </div>

      {/* Filter chips */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {chipOrder.map(key => {
            const cfg = typeConfig[key];
            const Icon = cfg.icon;
            const active = filter === key;
            const count = counts[key] || 0;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  active
                    ? cn(cfg.bg, cfg.color, 'ring-1', cfg.ring)
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-md font-semibold',
                  active ? 'bg-background/60' : 'bg-muted text-muted-foreground'
                )}>
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      {isLoading ? <SkeletonRow count={10} /> : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-14 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">{isFr ? 'Aucun événement' : 'No events'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFr ? 'Essayez un autre filtre.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-260px)] pr-3">
          <div className="space-y-6">
            {grouped.map(bucket => (
              <div key={bucket.key}>
                <div className="sticky top-0 z-10 -mx-2 px-2 py-1.5 bg-background/85 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    {bucket.label} · <span className="text-foreground/70">{bucket.items.length}</span>
                  </p>
                </div>

                <div className="relative pl-6 mt-2">
                  {/* Rail */}
                  <div className="absolute left-[13px] top-1 bottom-1 w-px bg-gradient-to-b from-border via-border to-transparent" />

                  <div className="space-y-1">
                    {bucket.items.map((item: any, i: number) => {
                      const cfg = typeConfig[item.type as FilterKey];
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.25) }}
                          className="group relative flex items-start gap-3 py-2 pr-2 rounded-lg hover:bg-muted/40 transition-colors"
                        >
                          {/* Node dot */}
                          <div className={cn(
                            'absolute -left-6 top-3 h-3 w-3 rounded-full ring-2 ring-background',
                            cfg.bg
                          )}>
                            <span className={cn('block h-full w-full rounded-full', cfg.color, 'bg-current opacity-70')} />
                          </div>

                          {/* Icon block */}
                          <div className={cn(
                            'shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ring-1',
                            cfg.bg, cfg.ring
                          )}>
                            <Icon className={cn('h-4 w-4', cfg.color)} />
                          </div>

                          {/* Body */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          </div>

                          {/* Right rail */}
                          <div className="flex items-center gap-2 shrink-0">
                            {item.amountLabel && (
                              <span className="text-sm font-semibold">{item.amountLabel}</span>
                            )}
                            {item.status && (
                              <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5 font-medium capitalize', statusTone(item.status))}>
                                {item.status}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {relativeTime(item.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
