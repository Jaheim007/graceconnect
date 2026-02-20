import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import { LayoutDashboard, Heart, ShoppingBag, Link2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function UserDashboard() {
  const { user } = useAuth();

  const { data: donations = [], isLoading: dLoading } = useQuery({
    queryKey: ['user-donations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      return (data || []) as Donation[];
    },
    enabled: !!user,
  });

  const { data: purchases = [], isLoading: pLoading } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('product_purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      return (data || []) as ProductPurchase[];
    },
    enabled: !!user,
  });

  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return (data || []) as AffiliateLink[];
    },
    enabled: !!user,
  });

  const totalDonated = donations.filter(d => d.status === 'completed').reduce((s, d) => s + d.amount, 0);
  const totalEarned = affiliateLinks.reduce((s, l) => s + l.total_earned, 0);

  const fmt = (n: number, currency = 'XOF') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  const statusColor: Record<string, string> = {
    completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
    pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" /> My Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Donations', value: donations.length, icon: Heart, color: 'text-red-500' },
          { label: 'Donated', value: fmt(totalDonated), icon: TrendingUp, color: 'text-primary' },
          { label: 'Purchases', value: purchases.length, icon: ShoppingBag, color: 'text-blue-500' },
          { label: 'Affiliate Earned', value: fmt(totalEarned), icon: Link2, color: 'text-green-500' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <s.icon className={`h-5 w-5 mb-2 ${s.color}`} />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Donations */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <Heart className="h-4 w-4 text-primary" /> Donation History
        </h2>
        {dLoading ? <SkeletonRow count={3} /> : donations.length === 0 ? (
          <EmptyState variant="campaigns" title="No donations yet" description="Support a campaign to see history here." className="py-8" />
        ) : (
          <div className="space-y-2">
            {donations.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{d.donor_name || 'Anonymous'}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="font-semibold text-sm">{fmt(d.amount, d.currency)}</span>
                <Badge className={`text-[10px] border-0 ${statusColor[d.status] || ''}`}>{d.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchases */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <ShoppingBag className="h-4 w-4 text-accent" /> Purchase History
        </h2>
        {pLoading ? <SkeletonRow count={3} /> : purchases.length === 0 ? (
          <EmptyState variant="purchases" className="py-8" />
        ) : (
          <div className="space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Product purchase</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="font-semibold text-sm">{fmt(p.amount, p.currency)}</span>
                <Badge className={`text-[10px] border-0 ${statusColor[p.status] || ''}`}>{p.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affiliate links */}
      {affiliateLinks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-green-500" /> Affiliate Links
          </h2>
          <div className="space-y-2">
            {affiliateLinks.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">{l.code}</p>
                  <p className="text-[10px] text-muted-foreground">{l.link_type} · {l.clicks} clicks · {l.conversions} conv.</p>
                </div>
                <span className="font-semibold text-sm text-green-500">{fmt(l.total_earned)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
