// Generic stub for remaining admin pages
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgAnnouncements, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useOrgEvents, useDeleteEvent } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AdminAnnouncements() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useOrgAnnouncements(currentOrg?.id, false);
  const del = useDeleteAnnouncement();
  return (
    <AdminPageShell title="Announcements" newRoute="/admin/announcements/new" backRoute="/admin">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="generic" title="No announcements" action={{ label: 'Create first', onClick: () => navigate('/admin/announcements/new') }} />
      ) : (
        <div className="space-y-2">
          {items.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
              {a.is_pinned && <span className="text-sm shrink-0">📌</span>}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.body}</p>
              </div>
              <Badge
                variant="outline"
                className={cn('text-[10px] shrink-0 border-0', a.is_published ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground')}
              >
                {a.is_published ? 'Live' : 'Draft'}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => navigate(`/admin/announcements/${a.id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive shrink-0"
                onClick={async () => { await del.mutateAsync({ id: a.id, orgId: currentOrg!.id }); toast({ title: 'Deleted' }); }}
              >
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
    <AdminPageShell title="Events" newRoute="/admin/events/new" backRoute="/admin">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="generic" title="No events" action={{ label: 'Create event', onClick: () => navigate('/admin/events/new') }} />
      ) : (
        <div className="space-y-2">
          {items.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
              <div className="h-9 w-9 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  {ev.event_date ? new Date(ev.event_date).getDate() : '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ev.title}</p>
                <p className="text-xs text-muted-foreground">
                  {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                  {ev.location ? ` · ${ev.location}` : ''}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn('text-[10px] shrink-0 border-0', ev.is_published ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground')}
              >
                {ev.is_published ? 'Live' : 'Draft'}
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate(`/admin/events/${ev.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive shrink-0"
                onClick={async () => { await del.mutateAsync({ id: ev.id, orgId: currentOrg!.id }); toast({ title: 'Deleted' }); }}
              >
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
    <AdminPageShell title="Donation Campaigns" newRoute="/admin/campaigns/new" backRoute="/admin">
      {!currentOrg?.monetization_enabled && (
        <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-xs text-foreground mb-3 flex items-center gap-2">
          <span>⚠️</span>
          <span className="text-muted-foreground">Monetization requires KYC approval.</span>
          <Button size="sm" variant="ghost" className="h-6 text-xs ml-auto text-primary" onClick={() => navigate('/admin/kyc')}>
            Submit KYC →
          </Button>
        </div>
      )}
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="campaigns" action={{ label: 'New campaign', onClick: () => navigate('/admin/campaigns/new') }} />
      ) : (
        <div className="space-y-2">
          {items.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 flex-1 max-w-24 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full gold-gradient rounded-full"
                      style={{ width: c.goal_amount ? `${Math.min(100, (c.current_amount / c.goal_amount) * 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.current_amount.toLocaleString()} / {c.goal_amount?.toLocaleString() || '∞'} {c.currency}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn('text-[10px] border-0 shrink-0', c.is_active ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground')}
              >
                {c.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate(`/admin/campaigns/${c.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
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
    <AdminPageShell title="Digital Store" newRoute="/admin/products/new" backRoute="/admin">
      {isLoading ? <SkeletonRow /> : items.length === 0 ? (
        <EmptyState variant="purchases" title="No products" action={{ label: 'New product', onClick: () => navigate('/admin/products/new') }} />
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-muted shrink-0 overflow-hidden">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gold-gradient opacity-60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.is_free ? 'Free' : `${p.price?.toLocaleString()} ${p.currency}`} · {p.sales_count || 0} sales
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn('text-[10px] border-0 shrink-0', p.is_published ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground')}
              >
                {p.is_published ? 'Live' : 'Draft'}
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
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
    <AdminPageShell title="Members" backRoute="/admin">
      {isLoading ? <SkeletonRow /> : members.length === 0 ? (
        <EmptyState variant="members" />
      ) : (
        <div className="space-y-2">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
              <div className="h-9 w-9 rounded-full gold-gradient flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  {(m.profiles?.display_name || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profiles?.display_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(m.joined_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </p>
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
  const navigate = useNavigate();
  return (
    <AdminPageShell title="Affiliation Program" backRoute="/admin">
      {!currentOrg?.affiliation_enabled ? (
        <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <span className="text-2xl">🔗</span>
          </div>
          <p className="font-semibold">Affiliation not enabled</p>
          <p className="text-sm text-muted-foreground">Enable affiliation in Settings to allow members to earn commissions.</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/settings')}>Go to Settings</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="font-semibold text-sm mb-1">Commission Rate</p>
            <p className="text-3xl font-bold text-primary">{currentOrg.affiliation_commission_percent}%</p>
            <p className="text-xs text-muted-foreground mt-1">per sale attributed to an affiliate link</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">Members can generate affiliate links from their dashboard after joining this organization.</p>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminAnalytics() {
  return (
    <AdminPageShell title="Analytics" backRoute="/admin">
      <div className="grid grid-cols-2 gap-3">
        {['Total Views', 'Total Donations', 'Total Revenue', 'Active Members'].map((label) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <p className="text-2xl font-bold text-muted-foreground">—</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Analytics coming soon</p>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}

export function AdminKYC() {
  const { currentOrg } = useOrg();
  const isApproved = currentOrg?.kyc_status === 'level1' || currentOrg?.kyc_status === 'level2';
  const isPending = currentOrg?.kyc_status === 'pending';
  return (
    <AdminPageShell title="KYC Verification" backRoute="/admin">
      <div className="space-y-4">
        <div className={cn(
          'p-4 rounded-2xl border',
          isApproved ? 'border-green-500/30 bg-green-500/8' : isPending ? 'border-primary/20 bg-primary/8' : 'border-border bg-muted/40'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <span>{isApproved ? '✅' : isPending ? '⏳' : '📋'}</span>
            <p className="font-semibold text-sm">KYC Status: <span className="capitalize">{currentOrg?.kyc_status || 'none'}</span></p>
          </div>
          <p className="text-xs text-muted-foreground">
            {isApproved
              ? 'Monetization features are enabled. You can collect donations and sell products.'
              : isPending
              ? 'Your submission is under review. We typically respond within 48 hours.'
              : 'Submit your KYC documents to unlock donations, store, and affiliates.'}
          </p>
        </div>

        {!isApproved && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm">Required Documents</h2>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">1</span> Government-issued ID (passport, national card)</li>
              <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">2</span> Organization registration certificate</li>
              <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">3</span> Bank account details for payouts</li>
            </ul>
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground border-0 shadow-gold"
              disabled={isPending}
            >
              {isPending ? '⏳ Under Review...' : 'Submit Documents'}
            </Button>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}

export function AdminSettings() {
  const { currentOrg } = useOrg();
  return (
    <AdminPageShell title="Organization Settings" backRoute="/admin">
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">General Information</h2>
          <div className="grid gap-2.5 text-sm">
            {[
              { label: 'Name', value: currentOrg?.name },
              { label: 'Slug', value: currentOrg?.slug },
              { label: 'Plan', value: currentOrg?.plan_type, capitalize: true },
              { label: 'Country', value: currentOrg?.country },
              { label: 'Currency', value: currentOrg?.currency },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/60 last:border-0">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className={cn('font-medium text-xs', capitalize && 'capitalize')}>{value || '—'}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted-foreground text-xs">Monetization</span>
              <span className={cn('text-xs font-medium', currentOrg?.monetization_enabled ? 'text-green-500' : 'text-primary')}>
                {currentOrg?.monetization_enabled ? '✅ Enabled' : '⚠️ Pending KYC'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-muted-foreground text-xs">Affiliation</span>
              <span className="text-xs font-medium">
                {currentOrg?.affiliation_enabled ? `✅ ${currentOrg.affiliation_commission_percent}% commission` : '—'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">Contact support to update plan or organization details.</p>
      </div>
    </AdminPageShell>
  );
}
