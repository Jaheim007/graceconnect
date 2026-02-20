// Generic stub for remaining admin pages
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgAnnouncements, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useOrgEvents, useDeleteEvent } from '@/hooks/useEvents';
import { useOrgCampaigns, useUpdateCampaign, useOrgProducts, useUpdateProduct } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function AdminAnnouncements() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useOrgAnnouncements(currentOrg?.id, false);
  const del = useDeleteAnnouncement();
  return (
    <AdminPageShell title="Announcements" newRoute="/admin/announcements/new">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? <EmptyState variant="generic" title="No announcements" action={{ label: 'New', onClick: () => navigate('/admin/announcements/new') }} /> : (
        <div className="space-y-2">
          {items.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{a.body}</p>
              </div>
              <Badge variant={a.is_published ? 'secondary' : 'outline'} className={`text-[10px] shrink-0 ${a.is_published ? 'text-green-600' : ''}`}>{a.is_published ? 'Live' : 'Draft'}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={async () => { await del.mutateAsync({ id: a.id, orgId: currentOrg!.id }); toast({ title: 'Deleted' }); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminEvents() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useOrgEvents(currentOrg?.id, false);
  const del = useDeleteEvent();
  return (
    <AdminPageShell title="Events" newRoute="/admin/events/new">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? <EmptyState variant="generic" title="No events" action={{ label: 'New event', onClick: () => navigate('/admin/events/new') }} /> : (
        <div className="space-y-2">
          {items.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR') : 'TBA'}</p>
              </div>
              <Badge variant={ev.is_published ? 'secondary' : 'outline'} className={`text-[10px] shrink-0 ${ev.is_published ? 'text-green-600' : ''}`}>{ev.is_published ? 'Live' : 'Draft'}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={async () => { await del.mutateAsync({ id: ev.id, orgId: currentOrg!.id }); toast({ title: 'Deleted' }); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminCampaigns() {
  const { currentOrg } = useOrg();
  const { data: items = [], isLoading } = useOrgCampaigns(currentOrg?.id, false);
  const navigate = useNavigate();
  return (
    <AdminPageShell title="Donation Campaigns" newRoute="/admin/campaigns/new">
      {!currentOrg?.monetization_enabled && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-600 mb-3">⚠️ Monetization requires KYC approval.</div>
      )}
      {isLoading ? <SkeletonRow /> : items.length === 0 ? <EmptyState variant="campaigns" action={{ label: 'New campaign', onClick: () => navigate('/admin/campaigns/new') }} /> : (
        <div className="space-y-2">
          {items.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.current_amount.toLocaleString()} / {c.goal_amount?.toLocaleString() || '∞'} {c.currency}</p>
              </div>
              <Badge variant={c.is_active ? 'secondary' : 'outline'} className={`text-[10px] ${c.is_active ? 'text-green-600' : ''}`}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/campaigns/${c.id}/edit`)}><Pencil className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminProducts() {
  const { currentOrg } = useOrg();
  const { data: items = [], isLoading } = useOrgProducts(currentOrg?.id, false);
  const navigate = useNavigate();
  return (
    <AdminPageShell title="Digital Store" newRoute="/admin/products/new">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? <EmptyState variant="purchases" title="No products" action={{ label: 'New product', onClick: () => navigate('/admin/products/new') }} /> : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="h-10 w-10 rounded-lg bg-muted shrink-0 overflow-hidden">
                {p.cover_image_url ? <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full gold-gradient" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.is_free ? 'Free' : `${p.price.toLocaleString()} ${p.currency}`} · {p.sales_count} sales</p>
              </div>
              <Badge variant={p.is_published ? 'secondary' : 'outline'} className={`text-[10px] ${p.is_published ? 'text-green-600' : ''}`}>{p.is_published ? 'Live' : 'Draft'}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/products/${p.id}/edit`)}><Pencil className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminMembers() {
  const { currentOrg } = useOrg();
  const { data: members = [], isLoading } = useOrgMembers(currentOrg?.id);
  return (
    <AdminPageShell title="Members">
      {isLoading ? <SkeletonRow /> : members.length === 0 ? <EmptyState variant="members" /> : (
        <div className="space-y-2">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-foreground">{(m.profiles?.display_name || 'U')[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profiles?.display_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{new Date(m.joined_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] capitalize">{m.role}</Badge>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminAffiliation() {
  const { currentOrg } = useOrg();
  return (
    <AdminPageShell title="Affiliation Program">
      {!currentOrg?.affiliation_enabled ? (
        <div className="p-6 rounded-2xl border border-border bg-card text-center space-y-3">
          <p className="font-semibold">Affiliation not enabled</p>
          <p className="text-sm text-muted-foreground">Enable affiliation in Settings to allow members to earn commissions.</p>
          <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/settings'}>Go to Settings</Button>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-border bg-card text-center">
          <p className="text-sm text-muted-foreground">Commission rate: {currentOrg.affiliation_commission_percent}%</p>
          <p className="text-xs text-muted-foreground mt-1">Members can generate affiliate links from their dashboard.</p>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminAnalytics() {
  return (
    <AdminPageShell title="Analytics">
      <div className="grid grid-cols-2 gap-3">
        {['Total Views', 'Total Donations', 'Total Revenue', 'Active Members'].map((label) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Analytics coming soon</p>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}

export function AdminKYC() {
  const { currentOrg } = useOrg();
  return (
    <AdminPageShell title="KYC Verification">
      <div className="space-y-4">
        <div className={`p-4 rounded-2xl border ${currentOrg?.kyc_status === 'level1' ? 'border-green-500/30 bg-green-500/10' : 'border-yellow-500/30 bg-yellow-500/10'}`}>
          <p className="font-semibold text-sm">KYC Status: <span className="capitalize">{currentOrg?.kyc_status || 'none'}</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentOrg?.kyc_status === 'level1' ? '✅ Monetization features are enabled.' : '⚠️ Submit KYC to unlock donations and store.'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">Submit KYC Documents</h2>
          <p className="text-xs text-muted-foreground">Upload your ID document and organization proof to get verified. Our team reviews within 48 hours.</p>
          <Button size="sm" className="gold-gradient text-primary-foreground border-0 shadow-gold" disabled={currentOrg?.kyc_status === 'pending'}>
            {currentOrg?.kyc_status === 'pending' ? 'Under Review...' : 'Submit Documents'}
          </Button>
        </div>
      </div>
    </AdminPageShell>
  );
}

export function AdminSettings() {
  const { currentOrg } = useOrg();
  return (
    <AdminPageShell title="Organization Settings">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-sm">General</h2>
        <div className="grid gap-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="capitalize font-medium">{currentOrg?.plan_type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span>{currentOrg?.country}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span>{currentOrg?.currency}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Monetization</span><span className={currentOrg?.monetization_enabled ? 'text-green-500' : 'text-yellow-500'}>{currentOrg?.monetization_enabled ? 'Enabled' : 'Pending KYC'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Affiliation</span><span>{currentOrg?.affiliation_enabled ? `Enabled (${currentOrg.affiliation_commission_percent}%)` : 'Disabled'}</span></div>
        </div>
        <p className="text-xs text-muted-foreground">Contact support to update plan or organization details.</p>
      </div>
    </AdminPageShell>
  );
}
