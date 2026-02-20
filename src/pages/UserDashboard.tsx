import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import { ArrowLeft, Heart, ShoppingBag, Link2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const fmt = (n: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
  pending: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
};

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
  const totalEarned = affiliateLinks.reduce((s, l) => s + (l.total_earned || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">My Dashboard</span>
      </div>

      <div className="container max-w-4xl py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Donations', value: donations.length, icon: Heart, colorClass: 'text-destructive bg-destructive/10' },
            { label: 'Donated', value: fmt(totalDonated), icon: TrendingUp, colorClass: 'text-primary bg-primary/10' },
            { label: 'Purchases', value: purchases.length, icon: ShoppingBag, colorClass: 'text-accent bg-accent/10' },
            { label: 'Affiliate Earned', value: fmt(totalEarned), icon: Link2, colorClass: 'text-primary bg-primary/10' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-2', s.colorClass)}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Donations */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">Donation History</h2>
          {dLoading ? <SkeletonRow count={3} /> : donations.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No donations yet.</p>
          ) : (
            <div className="space-y-1">
              {donations.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.donor_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="font-semibold text-sm">{fmt(d.amount, d.currency)}</span>
                  <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[d.status] || '')}>{d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchases */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">Purchase History</h2>
          {pLoading ? <SkeletonRow count={3} /> : purchases.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No purchases yet.</p>
          ) : (
            <div className="space-y-1">
              {purchases.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Product purchase</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="font-semibold text-sm">{fmt(p.amount, p.currency)}</span>
                  <Badge variant="outline" className={cn('text-[10px] border-0', statusColor[p.status] || '')}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Affiliate links */}
        {affiliateLinks.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Affiliate Links</h2>
            <div className="space-y-1">
              {affiliateLinks.map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">{l.code}</p>
                    <p className="text-[10px] text-muted-foreground">{l.link_type} · {l.clicks || 0} clicks · {l.conversions || 0} conv.</p>
                  </div>
                  <span className="font-semibold text-sm text-primary">{fmt(l.total_earned || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
