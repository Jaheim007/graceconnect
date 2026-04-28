import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { db, supabase } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminMarketplaceModeration() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['superadmin-marketplace-pending'],
    queryFn: async () => {
      const { data } = await db.from('marketplace_templates')
        .select('*, organizations:author_org_id(name, slug)')
        .in('status', ['pending_review', 'approved'])
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const moderate = useMutation({
    mutationFn: async ({ template_id, decision, rejection_reason }: any) => {
      const { data, error } = await supabase.functions.invoke('marketplace-templates', {
        body: { action: 'moderate', template_id, decision, rejection_reason },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Decision recorded');
      qc.invalidateQueries({ queryKey: ['superadmin-marketplace-pending'] });
      setRejectId(null);
      setReason('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace — Moderation</h1>
        <p className="text-sm text-muted-foreground">Approve or reject templates submitted by creators.</p>
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-muted-foreground">Loading...</p>
      ) : !pending.length ? (
        <Card className="p-12 text-center text-muted-foreground">No templates to moderate.</Card>
      ) : (
        <div className="grid gap-3">
          {pending.map((t: any) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {t.cover_image_url && (
                  <img src={t.cover_image_url} alt="" className="w-24 h-24 object-cover rounded" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{t.title}</h3>
                    <Badge variant={t.status === 'approved' ? 'default' : 'secondary'}>{t.status}</Badge>
                    <Badge variant="outline">{t.kind}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    By {t.organizations?.name} · {t.clone_price} {t.currency} · {t.author_commission_percent}% commission
                  </p>
                  <p className="text-sm text-foreground/80 line-clamp-3">{t.description}</p>
                </div>
                <div className="flex sm:flex-col gap-2">
                  {t.status !== 'approved' && (
                    <Button size="sm" onClick={() => moderate.mutate({ template_id: t.id, decision: 'approved' })}>
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => setRejectId(t.id)}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject template</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (will be shown to author)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => moderate.mutate({ template_id: rejectId, decision: 'rejected', rejection_reason: reason })}
              disabled={!reason || moderate.isPending}
            >
              {moderate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
