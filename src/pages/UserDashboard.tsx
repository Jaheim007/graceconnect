import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import { ArrowLeft, Heart, ShoppingBag, Link2, TrendingUp, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const fmt = (n: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
  pending: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
};

const saleStatusColor: Record<string, string> = {
  pending: 'bg-primary/10 text-primary',
  payable: 'bg-green-500/15 text-green-600 dark:text-green-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Link copied!', description: 'Share it to earn commissions.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

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

  const { data: affiliateLinks = [], isLoading: aLoading } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('affiliate_links')
        .select('*, organizations(name, slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as (AffiliateLink & { organizations: { name: string; slug: string } | null })[];
    },
    enabled: !!user,
  });

  const { data: affiliateSales = [] } = useQuery({
    queryKey: ['user-affiliate-sales', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('affiliate_sales')
        .select('*')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const totalDonated = donations.filter(d => d.status === 'completed').reduce((s, d) => s + d.amount, 0);
  const totalEarned = affiliateLinks.reduce((s, l) => s + (l.total_earned || 0), 0);
  const pendingCommission = affiliateSales.filter((s: { status: string }) => s.status === 'pending').reduce((sum: number, s: { commission_amount: number }) => sum + s.commission_amount, 0);

  const baseUrl = window.location.origin;

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

        {/* Affiliate Links Section — always shown */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                My Affiliate Links
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share these links to earn commissions on donations and product sales.
              </p>
            </div>
            {pendingCommission > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-xs shrink-0">
                {fmt(pendingCommission)} pending
              </Badge>
            )}
          </div>

          {aLoading ? (
            <SkeletonRow count={2} />
          ) : affiliateLinks.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No affiliate links yet.</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Join an organization that has affiliate programs enabled. Once approved as an affiliate, your links will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {affiliateLinks.map((l) => {
                const shareUrl = l.link_type === 'product'
                  ? `${baseUrl}/org/${l.organizations?.slug}?ref=${l.code}`
                  : `${baseUrl}/org/${l.organizations?.slug}?ref=${l.code}`;
                return (
                  <div key={l.id} className="border border-border rounded-xl p-3 space-y-2">
                    {/* Org name + type */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{l.organizations?.name || 'Unknown org'}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {l.link_type} affiliate · code: <span className="font-mono">{l.code}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', l.is_active ? 'bg-accent/10 text-accent-foreground' : 'bg-muted text-muted-foreground')}>
                        {l.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{l.clicks || 0} clicks</span>
                      <span>{l.conversions || 0} conversions</span>
                      <span className="text-primary font-semibold">{fmt(l.total_earned || 0)} earned</span>
                    </div>

                    {/* Shareable link */}
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-[11px] font-mono text-muted-foreground flex-1 truncate">{shareUrl}</p>
                      <CopyButton text={shareUrl} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => window.open(`/org/${l.organizations?.slug}?ref=${l.code}`, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Affiliate Sales / Commission history */}
        {affiliateSales.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Commission History</h2>
            <p className="text-xs text-muted-foreground">Commissions become payable 72h after the transaction.</p>
            <div className="space-y-1">
              {affiliateSales.map((s: { id: string; transaction_type: string; gross_amount: number; commission_amount: number; commission_percent: number; currency?: string; status: string; created_at: string; payable_at?: string }) => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{s.transaction_type} sale</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('fr-FR')} ·
                      {s.commission_percent}% commission ·
                      gross {fmt(s.gross_amount, s.currency || 'XOF')}
                    </p>
                    {s.status === 'pending' && s.payable_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Payable after {new Date(s.payable_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-sm text-primary">+{fmt(s.commission_amount, s.currency || 'XOF')}</span>
                  <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', saleStatusColor[s.status] || '')}>
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
