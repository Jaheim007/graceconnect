import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrgCategoryLabel } from '@/lib/categoryLabels';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { onDirectoryDecision } from '@/lib/notifications';

export default function SuperadminDirectory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['sa-directory-apps'],
    queryFn: async () => {
      const { data } = await db
        .from('directory_applications')
        .select('*, organizations(name, slug, logo_url, category, is_verified)')
        .order('submitted_at', { ascending: true });
      return data || [];
    },
  });

  const pending = applications.filter((a: any) => a.status === 'pending');
  const reviewed = applications.filter((a: any) => a.status !== 'pending');

  const reviewMutation = useMutation({
    mutationFn: async ({ id, orgId, action, reason }: { id: string; orgId: string; action: 'approved' | 'rejected'; reason?: string }) => {
      await db.from('directory_applications').update({
        status: action,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        decision_reason: reason || null,
      }).eq('id', id);

      if (action === 'approved') {
        await db.from('organizations').update({
          is_verified: true,
        }).eq('id', orgId);
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.action === 'approved' ? '✅ Approved & verified' : '❌ Rejected' });
      queryClient.invalidateQueries({ queryKey: ['sa-directory-apps'] });
      // Find org name from the applications list
      const app = applications.find((a: any) => a.id === vars.id);
      const orgName = app?.organizations?.name || 'Organization';
      onDirectoryDecision(vars.orgId, orgName, vars.action, vars.reason);
      setRejectId(null);
      setRejectReason('');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Directory Applications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review organizations applying to be listed in the curated directory.
        </p>
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Pending ({pending.length})
        </h2>
        {isLoading ? <SkeletonRow count={3} /> : pending.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm rounded-2xl border border-border bg-card">
            No pending applications 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((app: any) => {
              const org = app.organizations;
              return (
                <div key={app.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-3">
                    {org?.logo_url ? (
                      <img src={org.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{org?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">/{org?.slug} · {getOrgCategoryLabel(org?.category)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </p>
                  </div>

                  {rejectId === app.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setRejectId(null); setRejectReason(''); }}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground border-0"
                          onClick={() => reviewMutation.mutate({ id: app.id, orgId: app.organization_id, action: 'rejected', reason: rejectReason })}
                          disabled={!rejectReason.trim()}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
                        onClick={() => reviewMutation.mutate({ id: app.id, orgId: app.organization_id, action: 'approved' })}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve & Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive border-destructive/30"
                        onClick={() => setRejectId(app.id)}
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Previously Reviewed ({reviewed.length})</h2>
          <div className="space-y-2">
            {reviewed.map((app: any) => {
              const org = app.organizations;
              return (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">/{org?.slug}</p>
                    {app.decision_reason && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{app.decision_reason}"</p>
                    )}
                  </div>
                  <Badge className={`text-[10px] border-0 ${app.status === 'approved' ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600'}`}>
                    {app.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground">
                    {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
