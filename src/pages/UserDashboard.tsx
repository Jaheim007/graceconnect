import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Donation, ProductPurchase, AffiliateLink } from '@/types/database';
import { ArrowLeft, Heart, ShoppingBag, Link2, TrendingUp, Copy, ExternalLink, CheckCircle, AlertTriangle, DollarSign, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { requestAffiliatePayout } from '@/lib/api';
import { useOrg } from '@/contexts/OrgContext';

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
  const { toast } = useToast();
  const { userOrgs } = useOrg();
  const qc = useQueryClient();
  const [requestingPayout, setRequestingPayout] = useState<string | null>(null);
  const [requestingAffiliate, setRequestingAffiliate] = useState<string | null>(null);

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

  // KYC status for each org the user belongs to
  const { data: kycStatuses = {} } = useQuery({
    queryKey: ['user-kyc-statuses', user?.id],
    queryFn: async () => {
      if (!user || !userOrgs.length) return {};
      const map: Record<string, string> = {};
      for (const org of userOrgs) {
        map[org.id] = org.kyc_status || 'none';
      }
      return map;
    },
    enabled: !!user && userOrgs.length > 0,
  });

  const totalDonated = donations.filter(d => d.status === 'completed').reduce((s, d) => s + d.amount, 0);
  const totalEarned = affiliateLinks.reduce((s, l) => s + (l.total_earned || 0), 0);
  const payableCommission = affiliateSales
    .filter((s: { status: string }) => s.status === 'payable')
    .reduce((sum: number, s: { commission_amount: number }) => sum + s.commission_amount, 0);
  const pendingCommission = affiliateSales
    .filter((s: { status: string }) => s.status === 'pending')
    .reduce((sum: number, s: { commission_amount: number }) => sum + s.commission_amount, 0);

  const baseUrl = window.location.origin;

  const handleRequestPayout = async (orgId: string, orgKycStatus: string) => {
    // KYC gate at payout time
    if (orgKycStatus === 'none' || orgKycStatus === 'pending') {
      toast({
        title: 'KYC Required for Payout',
        description: 'Please complete KYC verification for your organization before requesting a payout. You can keep earning commissions in the meantime!',
      });
      navigate('/admin/kyc');
      return;
    }

    setRequestingPayout(orgId);
    try {
      const result = await requestAffiliatePayout(orgId);
      toast({
        title: '✅ Payout Requested',
        description: `${result.amount?.toLocaleString()} XOF payout request submitted. You'll be notified when processed.`,
      });
      qc.invalidateQueries({ queryKey: ['user-affiliate-sales', user?.id] });
    } catch (err: unknown) {
      toast({
        title: 'Payout Request Failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRequestingPayout(null);
    }
  };

  // Self-service: request affiliate role for an org
  const requestAffiliateRole = useMutation({
    mutationFn: async ({ orgId, orgSlug }: { orgId: string; orgSlug: string }) => {
      if (!user) throw new Error('Not authenticated');
      // Find the member row for this user + org
      const { data: memberRow } = await db
        .from('organization_members')
        .select('id, role')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single();
      if (!memberRow) throw new Error('You must be a member of this organization first.');
      if (memberRow.role === 'affiliate') throw new Error('Already an affiliate');

      // Update role
      const { error: roleErr } = await db
        .from('organization_members')
        .update({ role: 'affiliate' })
        .eq('id', memberRow.id);
      if (roleErr) throw roleErr;

      // Create affiliate link
      const code = `${orgSlug.slice(0, 6).toUpperCase()}-${user.id.slice(0, 6).toUpperCase()}`;
      const { data: existingLink } = await db
        .from('affiliate_links')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (!existingLink) {
        await db.from('affiliate_links').insert({
          user_id: user.id,
          organization_id: orgId,
          code,
          link_type: 'org',
        });
      }
    },
    onSuccess: () => {
      toast({ title: '🎉 You\'re now an affiliate!', description: 'Your referral link is ready. Share it to start earning.' });
      qc.invalidateQueries({ queryKey: ['user-affiliate-links', user?.id] });
      qc.invalidateQueries({ queryKey: ['user-memberships', user?.id] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Orgs with affiliation enabled where user is a member but NOT yet an affiliate
  const affiliateLinkOrgIds = new Set(affiliateLinks.map(l => l.organization_id));
  const orgsEligibleForAffiliate = userOrgs.filter(
    o => o.affiliation_enabled && !affiliateLinkOrgIds.has(o.id)
  );

  // Group payable sales by org
  const payableByOrg: Record<string, { orgId: string; amount: number; currency: string }> = {};
  for (const s of affiliateSales) {
    const sale = s as { status: string; organization_id: string; commission_amount: number; currency?: string };
    if (sale.status === 'payable') {
      if (!payableByOrg[sale.organization_id]) {
        payableByOrg[sale.organization_id] = { orgId: sale.organization_id, amount: 0, currency: sale.currency || 'XOF' };
      }
      payableByOrg[sale.organization_id].amount += sale.commission_amount;
    }
  }

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

        {/* Affiliate Links Section */}
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
            <div className="flex flex-col items-end gap-1">
            {payableCommission > 0 && (
                <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-0 text-xs">
                  {fmt(payableCommission)} payable
                </Badge>
              )}
              {pendingCommission > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-xs">
                  {fmt(pendingCommission)} pending
                </Badge>
              )}
            </div>
          </div>

          {aLoading ? (
            <SkeletonRow count={2} />
          ) : affiliateLinks.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No affiliate links yet.</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Join an organization that has the affiliate program enabled, then click "Become Affiliate" below.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {affiliateLinks.map((l) => {
                const shareUrl = `${baseUrl}/org/${l.organizations?.slug}?ref=${l.code}`;
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
                        onClick={() => window.open(shareUrl, '_blank')}
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

        {/* Self-service: Become an Affiliate */}
        {orgsEligibleForAffiliate.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Become an Affiliate
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                These organizations have affiliate programs open to members. Join to earn commissions on every sale or donation.
              </p>
            </div>
            <div className="space-y-2">
              {orgsEligibleForAffiliate.map((org) => (
                <div key={org.id} className="border border-primary/20 bg-primary/5 rounded-xl p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xs font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                    <p className="text-xs text-primary font-semibold">
                      Earn {org.affiliation_commission_percent}% commission per referral
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs gold-gradient text-primary-foreground border-0 shadow-gold shrink-0"
                    disabled={requestingAffiliate === org.id || requestAffiliateRole.isPending}
                    onClick={async () => {
                      setRequestingAffiliate(org.id);
                      await requestAffiliateRole.mutateAsync({ orgId: org.id, orgSlug: org.slug });
                      setRequestingAffiliate(null);
                    }}
                  >
                    {requestingAffiliate === org.id ? 'Joining...' : 'Become Affiliate'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Payout Section */}
        {Object.keys(payableByOrg).length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Request Payout
            </h2>
            <p className="text-xs text-muted-foreground">KYC verification is required before requesting a payout.</p>
            <div className="space-y-2">
              {Object.values(payableByOrg).map(({ orgId, amount, currency }) => {
                const org = userOrgs.find(o => o.id === orgId);
                const kycStatus = kycStatuses[orgId] || 'none';
                const kycApproved = kycStatus === 'level1' || kycStatus === 'level2';
                return (
                  <div key={orgId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{org?.name || orgId}</p>
                      <p className="text-xs text-primary font-semibold">{fmt(amount, currency)} payable</p>
                    </div>
                    {!kycApproved && (
                      <div className="flex items-center gap-1 text-[10px] text-primary">
                        <AlertTriangle className="h-3 w-3" />
                        <span>KYC required</span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="h-7 text-xs gold-gradient text-primary-foreground border-0 shadow-gold"
                      disabled={requestingPayout === orgId}
                      onClick={() => handleRequestPayout(orgId, kycStatus)}
                    >
                      {requestingPayout === orgId ? 'Requesting...' : kycApproved ? 'Request Payout' : 'Submit KYC First'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
