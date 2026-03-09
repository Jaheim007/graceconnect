import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Mail, Search, Filter } from 'lucide-react';

const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  Auth: ['welcome'],
  Donations: ['donation_receipt', 'new_donation_received'],
  Purchases: ['purchase_confirmation', 'new_purchase_received', 'download_ready'],
  KYC: ['kyc_submitted', 'kyc_approved', 'kyc_rejected'],
  Org: ['org_created', 'org_deleted', 'org_suspended', 'org_unsuspended'],
  Members: ['new_member_joined', 'member_left', 'invite_to_org', 'role_changed'],
  Payouts: ['payout_requested', 'payout_approved', 'payout_rejected', 'payouts_frozen'],
  Affiliate: ['affiliate_sale', 'affiliate_payout_requested', 'affiliate_payout_completed'],
  Directory: ['directory_approved', 'directory_rejected'],
  Support: ['ticket_created', 'ticket_replied', 'ticket_resolved'],
  Refunds: ['refund_initiated', 'refund_completed'],
  Moderation: ['content_report_resolved'],
};

function getCategoryForTemplate(template: string): string {
  for (const [cat, templates] of Object.entries(TEMPLATE_CATEGORIES)) {
    if (templates.includes(template)) return cat;
  }
  return 'Other';
}

const statusColors: Record<string, string> = {
  sent: 'bg-green-500/15 text-green-600',
  failed: 'bg-red-500/15 text-red-600',
  pending: 'bg-yellow-500/15 text-yellow-600',
};

export default function SuperadminEmailLogs() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['sa-email-logs'],
    queryFn: async () => {
      const { data } = await db
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const filtered = logs.filter((l: any) => {
    if (search && !l.recipient.toLowerCase().includes(search.toLowerCase()) && !l.template.toLowerCase().includes(search.toLowerCase()) && !l.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all') {
      const templates = TEMPLATE_CATEGORIES[categoryFilter] || [];
      if (!templates.includes(l.template)) return false;
    }
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  const totalSent = logs.filter((l: any) => l.status === 'sent').length;
  const totalFailed = logs.filter((l: any) => l.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">📧 Journaux d'emails</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-2xl font-bold">{logs.length}</p>
          <p className="text-xs text-muted-foreground">Total emails</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-2xl font-bold text-emerald-500">{totalSent}</p>
          <p className="text-xs text-muted-foreground">Envoyés</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-2xl font-bold text-destructive">{totalFailed}</p>
          <p className="text-xs text-muted-foreground">Échoués</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par destinataire, template, sujet..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {Object.keys(TEMPLATE_CATEGORIES).map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs list */}
      {isLoading ? <SkeletonRow count={8} /> : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No email logs found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium truncate">{l.recipient}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">{getCategoryForTemplate(l.template)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{l.subject || l.template}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(l.created_at).toLocaleString('fr-FR')} · <code className="text-[10px]">{l.template}</code>
                  {l.resend_message_id && <> · <code className="text-[10px]">{l.resend_message_id}</code></>}
                </p>
              </div>
              <Badge className={`text-[10px] border-0 shrink-0 ${statusColors[l.status] || ''}`}>
                {l.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
