import { useMemo } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Users, Crown, AlertTriangle, Heart, ShoppingBag, TrendingUp, Zap, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';

interface Segment {
  key: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  description: string;
}

/**
 * RFM-style buyer segmentation: categorizes contacts/buyers into actionable segments.
 * R = Recency (last purchase), F = Frequency (purchase count), M = Monetary (total spend)
 */
export function SmartCRMInsights() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';

  const { data: purchases = [] } = useQuery({
    queryKey: ['crm-rfm-purchases', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('product_purchases')
        .select('user_id, amount, created_at')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['crm-rfm-donations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('donations')
        .select('user_id, amount, created_at')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['crm-rfm-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('organization_members')
        .select('user_id, joined_at')
        .eq('organization_id', orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const segments = useMemo<Segment[]>(() => {
    const allTxns = [
      ...purchases.map((p: any) => ({ ...p, type: 'purchase' })),
      ...donations.map((d: any) => ({ ...d, type: 'donation' })),
    ];

    // Group by user
    const byUser = new Map<string, { txns: typeof allTxns; total: number; lastDate: Date }>();
    for (const t of allTxns) {
      if (!t.user_id) continue;
      const existing = byUser.get(t.user_id);
      if (existing) {
        existing.txns.push(t);
        existing.total += t.amount || 0;
        const d = new Date(t.created_at);
        if (d > existing.lastDate) existing.lastDate = d;
      } else {
        byUser.set(t.user_id, { txns: [t], total: t.amount || 0, lastDate: new Date(t.created_at) });
      }
    }

    const now = Date.now();
    const dayMs = 86400000;
    const memberIds = new Set(members.map((m: any) => m.user_id));
    const buyerIds = new Set(byUser.keys());

    // Segment counters
    let champions = 0, loyal = 0, recent = 0, atRisk = 0, lost = 0, dormant = 0, donors = 0, window_shoppers = 0;

    for (const [uid, data] of byUser) {
      const daysSince = (now - data.lastDate.getTime()) / dayMs;
      const freq = data.txns.length;

      if (freq >= 5 && daysSince < 30) champions++;
      else if (freq >= 3 && daysSince < 60) loyal++;
      else if (freq >= 1 && daysSince < 14) recent++;
      else if (freq >= 2 && daysSince >= 30 && daysSince < 90) atRisk++;
      else if (daysSince >= 90) lost++;
      else dormant++;

      if (data.txns.some(t => t.type === 'donation')) donors++;
    }

    // Window shoppers = members who never bought
    for (const m of members) {
      if (!buyerIds.has((m as any).user_id)) window_shoppers++;
    }

    return [
      { key: 'champions', label: isFr ? 'Champions' : 'Champions', icon: <Crown className="h-4 w-4" />, count: champions, color: 'text-amber-500 bg-amber-500/10', description: isFr ? '5+ achats, actif < 30j' : '5+ purchases, active < 30d' },
      { key: 'loyal', label: isFr ? 'Fidèles' : 'Loyal', icon: <Heart className="h-4 w-4" />, count: loyal, color: 'text-rose-500 bg-rose-500/10', description: isFr ? '3+ achats, actif < 60j' : '3+ purchases, active < 60d' },
      { key: 'recent', label: isFr ? 'Récents' : 'Recent', icon: <Zap className="h-4 w-4" />, count: recent, color: 'text-emerald-500 bg-emerald-500/10', description: isFr ? 'Achat < 14 jours' : 'Purchased < 14 days' },
      { key: 'donors', label: isFr ? 'Donateurs' : 'Donors', icon: <Heart className="h-4 w-4" />, count: donors, color: 'text-purple-500 bg-purple-500/10', description: isFr ? 'Ont fait un don' : 'Made a donation' },
      { key: 'at_risk', label: isFr ? 'À risque' : 'At Risk', icon: <AlertTriangle className="h-4 w-4" />, count: atRisk, color: 'text-orange-500 bg-orange-500/10', description: isFr ? '30-90j sans activité' : '30-90d inactive' },
      { key: 'lost', label: isFr ? 'Perdus' : 'Lost', icon: <Clock className="h-4 w-4" />, count: lost, color: 'text-destructive bg-destructive/10', description: isFr ? '90j+ sans activité' : '90d+ inactive' },
      { key: 'window_shoppers', label: isFr ? 'Visiteurs' : 'Window Shoppers', icon: <Users className="h-4 w-4" />, count: window_shoppers, color: 'text-muted-foreground bg-muted', description: isFr ? 'Membres sans achat' : 'Members with no purchase' },
    ].filter(s => s.count > 0);
  }, [purchases, donations, members, isFr]);

  const totalBuyers = new Set([
    ...purchases.map((p: any) => p.user_id),
    ...donations.map((d: any) => d.user_id),
  ].filter(Boolean)).size;

  const totalRevenue = [...purchases, ...donations].reduce((s, t: any) => s + (t.amount || 0), 0);

  if (segments.length === 0 && totalBuyers === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">{isFr ? 'Intelligence CRM' : 'CRM Intelligence'}</h3>
          <p className="text-[11px] text-muted-foreground">
            {totalBuyers} {isFr ? 'acheteurs uniques' : 'unique buyers'} · {formatCurrency(totalRevenue, currency, locale)} {isFr ? 'total' : 'total'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {segments.map((seg) => (
          <div key={seg.key} className="border border-border rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${seg.color}`}>
                {seg.icon}
              </div>
              <span className="text-xl font-bold">{seg.count}</span>
            </div>
            <p className="text-xs font-semibold">{seg.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{seg.description}</p>
          </div>
        ))}
      </div>

      {segments.some(s => s.key === 'at_risk') && (
        <div className="mt-3 bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {isFr
              ? 'Des acheteurs risquent de partir. Envoyez une campagne de ré-engagement !'
              : 'Some buyers are at risk. Send a re-engagement campaign!'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
