// Generic stub for remaining admin pages
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgAnnouncements, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useOrgEvents, useDeleteEvent } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Link2, Copy, CheckCircle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

function useOrgAffiliateLinks(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-affiliate-links', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('affiliate_links')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });
}

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
      {currentOrg?.kyc_status === 'none' && (
        <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-xs text-foreground mb-3 flex items-center gap-2">
          <span>💡</span>
          <span className="text-muted-foreground">Submit KYC before requesting a payout. Accepting donations is available now.</span>
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
  const { toast } = useToast();
  const [copiedInvite, setCopiedInvite] = useState(false);

  const inviteUrl = currentOrg ? `${window.location.origin}/org/${currentOrg.slug}` : '';

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    toast({ title: 'Invite link copied!' });
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <AdminPageShell title="Members" backRoute="/admin">
      <div className="space-y-4">
        {/* How members join explanation */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">How members join</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share your organization's public page link. Users who visit and click "Join" will appear here automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-xs font-mono text-muted-foreground flex-1 truncate">{inviteUrl}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyInvite}>
              {copiedInvite ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Members list */}
        {isLoading ? <SkeletonRow /> : members.length === 0 ? (
          <EmptyState variant="members" title="No members yet" description="Share your invite link above to grow your community." />
        ) : (
          <div className="space-y-2">
            {(members as any[]).map((m) => (
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
      </div>
    </AdminPageShell>
  );
}

function AffiliateCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopy}>
      {copied ? <CheckCircle className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

export function AdminAffiliation() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useOrgMembers(currentOrg?.id);

  // Fetch existing affiliate links for this org
  const { data: existingLinks = [] } = useOrgAffiliateLinks(currentOrg?.id);

  const assignAffiliate = useMutation({
    mutationFn: async ({ memberId, memberUserId, memberName }: { memberId: string; memberUserId: string; memberName: string }) => {
      // 1. Update role to affiliate
      const { error: roleErr } = await db
        .from('organization_members')
        .update({ role: 'affiliate' })
        .eq('id', memberId);
      if (roleErr) throw roleErr;

      // 2. Check if link already exists
      const { data: existing } = await db
        .from('affiliate_links')
        .select('id')
        .eq('user_id', memberUserId)
        .eq('organization_id', currentOrg!.id)
        .maybeSingle();
      if (existing) return;

      // 3. Generate unique affiliate code: SLUG6-USERID6
      const code = `${currentOrg!.slug.slice(0, 6).toUpperCase()}-${memberUserId.slice(0, 6).toUpperCase()}`;
      const { error: linkErr } = await db.from('affiliate_links').insert({
        user_id: memberUserId,
        organization_id: currentOrg!.id,
        code,
        link_type: 'org',
      });
      if (linkErr) throw linkErr;
    },
    onSuccess: (_, variables) => {
      toast({ title: '✅ Affiliate assigned', description: `${variables.memberName} now has a unique referral link.` });
      qc.invalidateQueries({ queryKey: ['org-members', currentOrg?.id] });
      qc.invalidateQueries({ queryKey: ['org-affiliate-links', currentOrg?.id] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const revokeAffiliate = useMutation({
    mutationFn: async ({ memberId, memberUserId }: { memberId: string; memberUserId: string }) => {
      await db.from('organization_members').update({ role: 'member' }).eq('id', memberId);
      await db.from('affiliate_links')
        .update({ is_active: false })
        .eq('user_id', memberUserId)
        .eq('organization_id', currentOrg!.id);
    },
    onSuccess: () => {
      toast({ title: 'Affiliate role revoked' });
      qc.invalidateQueries({ queryKey: ['org-members', currentOrg?.id] });
      qc.invalidateQueries({ queryKey: ['org-affiliate-links', currentOrg?.id] });
    },
  });

  const baseUrl = window.location.origin;

  if (!currentOrg?.affiliation_enabled) {
    return (
      <AdminPageShell title="Affiliation Program" backRoute="/admin">
        <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Link2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">Affiliation not enabled</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Go to Settings to enable the affiliation program and set a commission rate for your members.
          </p>
          <Button size="sm" className="gold-gradient text-primary-foreground border-0" onClick={() => navigate('/admin/settings')}>
            Enable in Settings →
          </Button>
        </div>
      </AdminPageShell>
    );
  }

  // All members except the current admin/owner
  const allOtherMembers = (members as any[]).filter(m => m.user_id !== user?.id);
  // A member is an "active affiliate" if their role is 'affiliate' OR they already have an affiliate link
  const affiliateUserIds = new Set((existingLinks as any[]).map(l => l.user_id));
  const activeAffiliates = allOtherMembers.filter(m => m.role === 'affiliate' || affiliateUserIds.has(m.user_id));
  const activeAffiliateUserIds = new Set(activeAffiliates.map((m: any) => m.user_id));
  const regularMembers = allOtherMembers.filter(m => !activeAffiliateUserIds.has(m.user_id));

  // Helper: get member display name with fallback
  const getMemberName = (m: any) =>
    m.profiles?.display_name?.trim() || `Member ${m.user_id.slice(0, 6).toUpperCase()}`;

  return (
    <AdminPageShell title="Affiliation Program" backRoute="/admin">
      <div className="space-y-4">
        {/* How it works */}
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4 space-y-2">
          <p className="font-semibold text-sm">💡 How the Affiliation System Works</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">1.</span>Members join via the public page. They can also <strong>self-request</strong> the affiliate role from their dashboard.</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">2.</span>You approve them here — they instantly get a unique referral link.</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">3.</span>They share their link. When someone donates or buys through it, they earn <strong>{currentOrg.affiliation_commission_percent}%</strong>.</li>
            <li className="flex gap-2"><span className="text-primary font-bold shrink-0">4.</span>After 72h commissions become payable. They withdraw from their dashboard (KYC required).</li>
          </ol>
        </div>

        {/* Commission rate + stats bar */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Commission Rate</p>
            <p className="text-2xl font-bold text-primary">{currentOrg.affiliation_commission_percent}%</p>
            <p className="text-xs text-muted-foreground">per sale/donation via affiliate link</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="text-[10px]">{activeAffiliates.length} active affiliate{activeAffiliates.length !== 1 ? 's' : ''}</Badge>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/admin/settings')}>
              Change Rate
            </Button>
          </div>
        </div>

        {/* Active affiliates */}
        {activeAffiliates.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Active Affiliates ({activeAffiliates.length})</h2>
            <div className="space-y-2">
              {activeAffiliates.map((m) => {
                const existingLink = (existingLinks as any[]).find(l => l.user_id === m.user_id && l.is_active !== false);
                const shareUrl = existingLink
                  ? `${baseUrl}/org/${currentOrg.slug}?ref=${existingLink.code}`
                  : null;
                const name = getMemberName(m);
                return (
                  <div key={m.id} className="border border-primary/30 bg-primary/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center text-xs font-bold shrink-0 text-primary-foreground">
                          {name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-tight">{name}</p>
                          <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary mt-0.5">Affiliate</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive border-destructive/30 shrink-0"
                        disabled={revokeAffiliate.isPending}
                        onClick={() => revokeAffiliate.mutate({ memberId: m.id, memberUserId: m.user_id })}
                      >
                        Revoke
                      </Button>
                    </div>
                    {shareUrl ? (
                      <>
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
                          <p className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{shareUrl}</p>
                          <AffiliateCopyButton text={shareUrl} />
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-0.5">
                          <span>👆 {existingLink?.clicks || 0} clicks</span>
                          <span>✅ {existingLink?.conversions || 0} conversions</span>
                          <span className="text-primary font-semibold ml-auto">
                            {(existingLink?.total_earned || 0).toLocaleString('fr-FR')} {currentOrg.currency} earned
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">Generating link…</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Members to assign */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-sm">Members — Assign Affiliate Role</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click "Make Affiliate" to generate a unique referral link for any member.
            </p>
          </div>

          {isLoading ? (
            <SkeletonRow count={3} />
          ) : allOtherMembers.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <UserPlus className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">No members yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Share your organization's public link so people can join. Once they join, you can make them affiliates here.
              </p>
              <Button size="sm" variant="outline" className="text-xs mt-2" onClick={() => navigate('/admin/members')}>
                Go to Members →
              </Button>
            </div>
          ) : regularMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              All members are already affiliates. ✅
            </p>
          ) : (
            <div className="space-y-2">
              {regularMembers.map((m) => {
                const name = getMemberName(m);
                return (
                  <div key={m.id} className="border border-border rounded-xl p-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{name}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize mt-0.5">{m.role}</Badge>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs gold-gradient text-primary-foreground border-0 shrink-0"
                      disabled={assignAffiliate.isPending}
                      onClick={() => assignAffiliate.mutate({ memberId: m.id, memberUserId: m.user_id, memberName: name })}
                    >
                      Make Affiliate
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
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
        {/* Info banner */}
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/8">
          <p className="font-semibold text-sm mb-1">💡 KYC is only required for payouts</p>
          <p className="text-xs text-muted-foreground">
            You can accept donations, sell products, and run affiliate programs without completing KYC.
            KYC verification is only needed when you want to withdraw your earnings.
          </p>
        </div>

        <div className={cn(
          'p-4 rounded-2xl border',
          isApproved ? 'border-accent/30 bg-accent/8' : isPending ? 'border-primary/20 bg-primary/8' : 'border-border bg-muted/40'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <span>{isApproved ? '✅' : isPending ? '⏳' : '📋'}</span>
            <p className="font-semibold text-sm">KYC Status: <span className="capitalize">{currentOrg?.kyc_status || 'none'}</span></p>
          </div>
          <p className="text-xs text-muted-foreground">
            {isApproved
              ? 'KYC approved. You can now request payouts to your bank account.'
              : isPending
              ? 'Your submission is under review. We typically respond within 48 hours.'
              : 'Submit your KYC documents to enable payout withdrawals.'}
          </p>
        </div>

        {!isApproved && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm">Required Documents for Payout</h2>
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
  const { currentOrg, refetchOrgs } = useOrg();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [affiliationEnabled, setAffiliationEnabled] = useState(currentOrg?.affiliation_enabled ?? false);
  const [commissionPercent, setCommissionPercent] = useState(
    String(currentOrg?.affiliation_commission_percent ?? 10)
  );
  const [saving, setSaving] = useState(false);

  const handleSaveAffiliation = async () => {
    if (!currentOrg) return;
    const pct = parseFloat(commissionPercent);
    if (isNaN(pct) || pct < 1 || pct > 80) {
      toast({ title: 'Invalid commission', description: 'Enter a value between 1 and 80.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('organizations')
      .update({ affiliation_enabled: affiliationEnabled, affiliation_commission_percent: pct })
      .eq('id', currentOrg.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Affiliation settings saved' });
      refetchOrgs();
      qc.invalidateQueries({ queryKey: ['user-memberships'] });
    }
  };

  return (
    <AdminPageShell title="Organization Settings" backRoute="/admin">
      <div className="space-y-4">
        {/* General info */}
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
          </div>
        </div>

        {/* Affiliation settings — editable */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">Affiliation Program</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow members to earn commissions by sharing referral links for products and campaigns.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="affiliation-toggle" className="text-xs font-medium">Enable Affiliation</Label>
            <Switch
              id="affiliation-toggle"
              checked={affiliationEnabled}
              onCheckedChange={setAffiliationEnabled}
            />
          </div>

          {affiliationEnabled && (
            <div className="space-y-2">
              <Label htmlFor="commission-pct" className="text-xs font-medium">
                Commission Rate (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="commission-pct"
                  type="number"
                  min={1}
                  max={80}
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  className="h-8 text-xs w-24"
                />
                <span className="text-xs text-muted-foreground">% per sale/donation via affiliate link</span>
              </div>
            </div>
          )}

          <Button
            size="sm"
            className="gold-gradient text-primary-foreground border-0 shadow-gold"
            onClick={handleSaveAffiliation}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Affiliation Settings'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">Contact support to update plan or other organization details.</p>
      </div>
    </AdminPageShell>
  );
}

