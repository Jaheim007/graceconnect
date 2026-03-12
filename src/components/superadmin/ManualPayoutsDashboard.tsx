import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/ui/FileUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, CheckCircle, XCircle, Clock, DollarSign,
  Eye, Upload, ArrowRight, User, Building, Phone, CreditCard, Image
} from 'lucide-react';

export default function ManualPayoutsDashboard() {
  const qc = useQueryClient();
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // ── Fetch pending payouts ──
  const { data: pendingPayouts = [], isLoading: loadingPending } = useQuery({
    queryKey: ['sa-manual-payouts', 'pending'],
    queryFn: async () => {
      const { data } = await db
        .from('manual_payouts')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  // ── Fetch completed payouts ──
  const { data: completedPayouts = [], isLoading: loadingCompleted } = useQuery({
    queryKey: ['sa-manual-payouts', 'completed'],
    queryFn: async () => {
      const { data } = await db
        .from('manual_payouts')
        .select('*')
        .in('status', ['completed', 'failed'])
        .order('processed_at', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // ── Fetch verified orgs/partners needing payouts ──
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['sa-payout-requests-pending'],
    queryFn: async () => {
      const { data } = await db
        .from('payout_requests')
        .select('*, organizations(name, kyc_status)')
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });
      return data || [];
    },
  });

  const handleCreateManualPayout = async (request: any) => {
    // Get org's KYC submission for payout details
    const { data: kyc } = await db
      .from('kyc_submissions')
      .select('*')
      .eq('organization_id', request.organization_id)
      .maybeSingle();

    const recipientMethod = kyc?.payout_method || 'mobile_money';
    const recipientAccount = kyc?.payout_phone || kyc?.bank_account_number || 'N/A';
    const recipientProvider = kyc?.payout_provider || kyc?.bank_name || 'N/A';
    const recipientName = kyc?.bank_account_name || request.organizations?.name || 'N/A';

    const { error } = await db.from('manual_payouts').insert({
      user_id: request.user_id,
      organization_id: request.organization_id,
      payout_type: request.payout_type || 'organization',
      amount: request.amount,
      currency: request.currency || 'XOF',
      recipient_name: recipientName,
      recipient_method: recipientMethod,
      recipient_account: recipientAccount,
      recipient_provider: recipientProvider,
      source_request_id: request.id,
      status: 'pending',
    });

    if (error) {
      toast.error(error.message);
    } else {
      // Update source request to 'processing'
      await db.from('payout_requests').update({ status: 'processing' }).eq('id', request.id);
      toast.success('Payout créé en file d\'attente');
      qc.invalidateQueries({ queryKey: ['sa-manual-payouts'] });
      qc.invalidateQueries({ queryKey: ['sa-payout-requests-pending'] });
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedPayout || !proofUrl) {
      toast.error('Veuillez uploader la preuve de transfert');
      return;
    }
    setProcessing(true);
    try {
      const { error } = await db.from('manual_payouts').update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        proof_url: proofUrl,
        admin_notes: adminNotes || null,
      }).eq('id', selectedPayout.id);

      if (error) throw error;

      // Update source request if linked
      if (selectedPayout.source_request_id) {
        await db.from('payout_requests').update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        }).eq('id', selectedPayout.source_request_id);
      }

      // Send notifications
      if (selectedPayout.organization_id) {
        const { onPayoutApproved } = await import('@/lib/notifications');
        // Get org name
        const { data: org } = await db.from('organizations').select('name').eq('id', selectedPayout.organization_id).maybeSingle();
        onPayoutApproved(selectedPayout.organization_id, org?.name || '', selectedPayout.amount, selectedPayout.currency || 'XOF');
      }

      toast.success('Payout marqué comme effectué ✅');
      setSelectedPayout(null);
      setProofUrl('');
      setAdminNotes('');
      qc.invalidateQueries({ queryKey: ['sa-manual-payouts'] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkFailed = async () => {
    if (!selectedPayout) return;
    const reason = prompt('Raison de l\'échec :');
    if (!reason) return;

    await db.from('manual_payouts').update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      admin_notes: reason,
    }).eq('id', selectedPayout.id);

    if (selectedPayout.source_request_id) {
      await db.from('payout_requests').update({ status: 'rejected', reject_reason: reason } as any).eq('id', selectedPayout.source_request_id);
    }

    // Send rejection notification
    if (selectedPayout.organization_id) {
      const { onPayoutRejected } = await import('@/lib/notifications');
      const { data: org } = await db.from('organizations').select('name').eq('id', selectedPayout.organization_id).maybeSingle();
      onPayoutRejected(selectedPayout.organization_id, org?.name || '', reason);
    }

    toast.success('Payout marqué comme échoué');
    setSelectedPayout(null);
    qc.invalidateQueries({ queryKey: ['sa-manual-payouts'] });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Versements manuels
        </h1>
        <p className="text-sm text-muted-foreground">Gérez les payouts manuels après vérification d'identité</p>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="requests">
            Demandes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="queue">
            File d'attente ({pendingPayouts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historique
          </TabsTrigger>
        </TabsList>

        {/* ── Payout Requests ── */}
        <TabsContent value="requests" className="space-y-3 mt-4">
          {loadingRequests ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Aucune demande en attente 🎉</div>
          ) : (
            pendingRequests.map((req: any) => (
              <Card key={req.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        {req.organizations?.name || 'Organisation'}
                      </p>
                      <p className="text-lg font-bold text-primary">{formatAmount(req.amount, req.currency)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{req.payout_type}</Badge>
                        <Badge
                          variant={req.organizations?.kyc_status === 'level1' || req.organizations?.kyc_status === 'level2' ? 'default' : 'destructive'}
                          className="text-[10px]"
                        >
                          KYC: {req.organizations?.kyc_status || 'none'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCreateManualPayout(req)}
                      disabled={req.organizations?.kyc_status !== 'level1' && req.organizations?.kyc_status !== 'level2'}
                    >
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      Traiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Processing Queue ── */}
        <TabsContent value="queue" className="space-y-3 mt-4">
          {loadingPending ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : pendingPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Aucun versement en attente</div>
          ) : (
            pendingPayouts.map((payout: any) => (
              <Card key={payout.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setSelectedPayout(payout); setProofUrl(''); setAdminNotes(''); }}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {payout.recipient_name}
                      </p>
                      <p className="text-lg font-bold text-primary">{formatAmount(payout.amount, payout.currency)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {payout.recipient_method === 'mobile_money' ? (
                          <><Phone className="h-3 w-3" /> {payout.recipient_provider} · {payout.recipient_account}</>
                        ) : (
                          <><CreditCard className="h-3 w-3" /> {payout.recipient_provider} · {payout.recipient_account}</>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={payout.status === 'processing' ? 'secondary' : 'outline'} className="text-[10px]">
                        {payout.status === 'pending' ? '⏳ En attente' : '🔄 En cours'}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history" className="space-y-3 mt-4">
          {loadingCompleted ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : completedPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Aucun historique</div>
          ) : (
            completedPayouts.map((payout: any) => (
              <Card key={payout.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{payout.recipient_name}</p>
                      <p className="text-sm font-bold">{formatAmount(payout.amount, payout.currency)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {payout.recipient_method === 'mobile_money' ? '📱' : '🏦'} {payout.recipient_account}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={payout.status === 'completed' ? 'default' : 'destructive'}
                        className="text-[10px]"
                      >
                        {payout.status === 'completed' ? '✅ Effectué' : '❌ Échoué'}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">
                        {payout.processed_at && new Date(payout.processed_at).toLocaleDateString()}
                      </p>
                      {payout.proof_url && (
                        <a
                          href={payout.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary flex items-center gap-0.5"
                        >
                          <Image className="h-3 w-3" /> Preuve
                        </a>
                      )}
                    </div>
                  </div>
                  {payout.admin_notes && (
                    <p className="text-[10px] text-muted-foreground mt-2 italic">Note : {payout.admin_notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── Process Payout Dialog ── */}
      <Dialog open={!!selectedPayout} onOpenChange={(open) => { if (!open) setSelectedPayout(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Traiter le versement</DialogTitle>
            <DialogDescription>
              Effectuez le transfert puis uploadez la preuve
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              {/* Recipient info */}
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Bénéficiaire</span>
                  <span className="text-sm font-medium">{selectedPayout.recipient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Montant</span>
                  <span className="text-sm font-bold text-primary">{formatAmount(selectedPayout.amount, selectedPayout.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Méthode</span>
                  <span className="text-sm">{selectedPayout.recipient_method === 'mobile_money' ? '📱 Mobile Money' : '🏦 Virement'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Compte</span>
                  <span className="text-sm font-mono">{selectedPayout.recipient_account}</span>
                </div>
                {selectedPayout.recipient_provider && (
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Opérateur/Banque</span>
                    <span className="text-sm">{selectedPayout.recipient_provider}</span>
                  </div>
                )}
              </div>

              {/* Proof upload */}
              <div>
                <Label className="text-sm font-semibold">Preuve de transfert *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Screenshot ou reçu du transfert effectué
                </p>
                <FileUploader
                  value={proofUrl}
                  onChange={setProofUrl}
                  folder={`payout-proofs/${selectedPayout.id}`}
                  bucket="org-uploads"
                  accept="image/*,.pdf"
                  label="Preuve de paiement"
                  hint="Capture d'écran ou reçu PDF"
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notes (optionnel)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Référence de transaction, remarques..."
                  className="h-20"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="destructive" size="sm" onClick={handleMarkFailed}>
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Échoué
            </Button>
            <Button onClick={handleMarkCompleted} disabled={processing || !proofUrl}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Marquer comme effectué
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
