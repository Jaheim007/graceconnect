import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, Plus, ExternalLink, AlertTriangle, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { data: media = [] } = useOrgMedia(currentOrg?.id, false);
  const { data: announcements = [] } = useOrgAnnouncements(currentOrg?.id, false);
  const { data: events = [] } = useOrgEvents(currentOrg?.id, false);
  const { data: campaigns = [] } = useOrgCampaigns(currentOrg?.id, false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: members = [] } = useOrgMembers(currentOrg?.id);

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

      {/* KYC banner */}
      {!currentOrg?.monetization_enabled && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Monetization not enabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">Complete KYC verification to enable donations, products &amp; affiliate programs.</p>
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
