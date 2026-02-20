import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Megaphone, CalendarDays, Heart, ShoppingBag, Users, Plus, ExternalLink, AlertTriangle } from 'lucide-react';

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
    { label: 'Media', value: media.length, published: media.filter(m => m.is_published).length, icon: Play, to: '/admin/media', color: 'text-blue-500' },
    { label: 'Announcements', value: announcements.length, published: announcements.filter(a => a.is_published).length, icon: Megaphone, to: '/admin/announcements', color: 'text-yellow-500' },
    { label: 'Events', value: events.length, published: events.filter(e => e.is_published).length, icon: CalendarDays, to: '/admin/events', color: 'text-green-500' },
    { label: 'Members', value: members.length, published: members.length, icon: Users, to: '/admin/members', color: 'text-purple-500' },
    { label: 'Campaigns', value: campaigns.length, published: campaigns.filter(c => c.is_published).length, icon: Heart, to: '/admin/campaigns', color: 'text-red-500' },
    { label: 'Products', value: products.length, published: products.filter(p => p.is_published).length, icon: ShoppingBag, to: '/admin/products', color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Overview for {currentOrg?.name}</p>
        </div>
        <Button size="sm" onClick={() => navigate(`/org/${currentOrg?.slug}`)} variant="outline" className="gap-1.5 text-xs h-8">
          <ExternalLink className="h-3.5 w-3.5" /> View Public Page
        </Button>
      </div>

      {/* KYC notice */}
      {!currentOrg?.monetization_enabled && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Monetization not enabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">Complete KYC to enable donations, products, and affiliate programs.</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/kyc')} className="mt-2 h-7 text-xs">
              Submit KYC →
            </Button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.to)}
            className="bg-card border border-border rounded-2xl p-4 shadow-card text-left hover:shadow-elevated transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-[10px] text-primary mt-0.5">{s.published} published</p>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'New Media', to: '/admin/media/new', icon: Play },
            { label: 'New Announcement', to: '/admin/announcements/new', icon: Megaphone },
            { label: 'New Event', to: '/admin/events/new', icon: CalendarDays },
            { label: 'New Campaign', to: '/admin/campaigns/new', icon: Heart },
            { label: 'New Product', to: '/admin/products/new', icon: ShoppingBag },
            { label: 'Manage Members', to: '/admin/members', icon: Users },
          ].map((a) => (
            <Button key={a.label} variant="outline" size="sm" onClick={() => navigate(a.to)} className="gap-1.5 text-xs h-8 justify-start">
              <a.icon className="h-3.5 w-3.5" /> {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
