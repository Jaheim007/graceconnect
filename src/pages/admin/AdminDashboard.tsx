import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, Plus, ExternalLink, AlertTriangle, ChevronRight,
  TrendingUp, DollarSign, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (n: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { data: media = [] } = useOrgMedia(currentOrg?.id, false);
  const { data: announcements = [] } = useOrgAnnouncements(currentOrg?.id, false);
  const { data: events = [] } = useOrgEvents(currentOrg?.id, false);
  const { data: campaigns = [] } = useOrgCampaigns(currentOrg?.id, false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: members = [] } = useOrgMembers(currentOrg?.id);

  // Revenue data
  const { data: donationTxns = [] } = useQuery({
    queryKey: ['admin-donations-rev', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('donations').select('amount, organization_amount, affiliate_commission, platform_fee').eq('organization_id', currentOrg.id).eq('status', 'completed');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const { data: purchaseTxns = [] } = useQuery({
    queryKey: ['admin-purchases-rev', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('product_purchases').select('amount, organization_amount, affiliate_commission, platform_fee').eq('organization_id', currentOrg.id).eq('status', 'completed');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const allTxns = [...donationTxns, ...purchaseTxns];
  const totalRevenue = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalOrgReceived = allTxns.reduce((s, t) => s + (t.organization_amount || 0), 0);
  const totalAffiliateCommission = allTxns.reduce((s, t) => s + (t.affiliate_commission || 0), 0);
  const totalPlatformFee = allTxns.reduce((s, t) => s + (t.platform_fee || 0), 0);
  const commissionRate = currentOrg?.affiliation_commission_percent ?? 10;

  const stats = [
    { label: 'Media', value: media.length, published: media.filter(m => m.is_published).length, icon: Play, to: '/admin/media', colorClass: 'text-accent bg-accent/10' },
    { label: 'Announcements', value: announcements.length, published: announcements.filter(a => a.is_published).length, icon: Megaphone, to: '/admin/announcements', colorClass: 'text-primary bg-primary/10' },
    { label: 'Events', value: events.length, published: events.filter(e => e.is_published).length, icon: CalendarDays, to: '/admin/events', colorClass: 'text-accent bg-accent/10' },
    { label: 'Members', value: members.length, published: members.length, icon: Users, to: '/admin/members', colorClass: 'text-primary bg-primary/10' },
    { label: 'Campaigns', value: campaigns.length, published: campaigns.filter(c => c.is_published).length, icon: Heart, to: '/admin/campaigns', colorClass: 'text-destructive bg-destructive/10' },
    { label: 'Products', value: products.length, published: products.filter(p => p.is_published).length, icon: ShoppingBag, to: '/admin/products', colorClass: 'text-primary bg-primary/10' },
  ];

  const quickActions = [
    { label: 'New Media', to: '/admin/media/new', icon: Play },
    { label: 'New Announcement', to: '/admin/announcements/new', icon: Megaphone },
    { label: 'New Event', to: '/admin/events/new', icon: CalendarDays },
    { label: 'New Campaign', to: '/admin/campaigns/new', icon: Heart },
    { label: 'New Product', to: '/admin/products/new', icon: ShoppingBag },
    { label: 'Manage Members', to: '/admin/members', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overview for <span className="font-medium text-foreground">{currentOrg?.name}</span></p>
        </div>
        <Button size="sm" onClick={() => navigate(`/org/${currentOrg?.slug}`)} variant="outline" className="gap-1.5 text-xs h-8">
          <ExternalLink className="h-3.5 w-3.5" /> Public Page
        </Button>
      </div>

      {/* KYC banner — only for payout readiness */}
      {currentOrg?.kyc_status === 'none' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Submit KYC to enable payouts</p>
            <p className="text-xs text-muted-foreground mt-0.5">You can accept payments &amp; run affiliate programs right away. KYC is only required when requesting a payout.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/kyc')} className="h-7 text-xs shrink-0">
            Submit KYC
          </Button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.to)}
            className="group bg-card border border-border rounded-2xl p-4 shadow-card text-left hover:shadow-elevated transition-all hover:-translate-y-0.5 hover:border-border/80"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', s.colorClass)}>
                <s.icon className="h-4 w-4" />
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[10px] text-primary font-medium mt-1">{s.published} published</p>
          </button>
        ))}
      </div>

      {/* Revenue & Commission summary */}
      {allTxns.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Revenue &amp; Commissions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Sales</span>
              </div>
              <p className="text-lg font-bold">{fmt(totalRevenue)}</p>
              <p className="text-[10px] text-muted-foreground">{allTxns.length} transaction{allTxns.length > 1 ? 's' : ''}</p>
            </div>
            <div className="rounded-xl bg-primary/5 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Org Received</span>
              </div>
              <p className="text-lg font-bold text-primary">{fmt(totalOrgReceived)}</p>
              <p className="text-[10px] text-muted-foreground">After fees &amp; commissions</p>
            </div>
            <div className="rounded-xl bg-accent/10 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Percent className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Affiliate Commissions</span>
              </div>
              <p className="text-lg font-bold">{fmt(totalAffiliateCommission)}</p>
              <p className="text-[10px] text-muted-foreground">Rate: {commissionRate}%</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Platform Fees</span>
              </div>
              <p className="text-lg font-bold">{fmt(totalPlatformFee)}</p>
              <p className="text-[10px] text-muted-foreground">{currentOrg?.platform_fee_percent ?? 10}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickActions.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              onClick={() => navigate(a.to)}
              className="gap-1.5 text-xs h-9 justify-start hover:bg-muted"
            >
              <a.icon className="h-3.5 w-3.5 text-primary" />
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
