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

  const approvedKycStatuses = ['level1', 'level2', 'approved'];
  const hasPayoutDestination = (kyc?: any) => Boolean(
    (kyc?.payout_phone && kyc?.payout_provider) ||
    (kyc?.bank_name && kyc?.bank_account_name && kyc?.bank_account_number)
  );

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
      const { data: requests, error: requestsError } = await db
        .from('payout_requests')
        .select('*')
        .in('status', ['pending', 'requested'])
        .order('requested_at', { ascending: true });

      if (requestsError) throw requestsError;
      if (!requests?.length) return [];

      const orgIds = [...new Set(requests.map((req: any) => req.organization_id).filter(Boolean))];
      const userIds = [...new Set(requests.map((req: any) => req.user_id).filter(Boolean))];

      const [{ data: orgs }, { data: profiles }, { data: kycSubmissions }] = await Promise.all([
        db.from('organizations').select('id, name, slug, kyc_status, currency').in('id', orgIds),
        db.from('profiles').select('id, display_name, avatar_url').in('id', userIds),
        db.from('kyc_submissions')
          .select('organization_id, id_document_type, verification_type, payout_method, payout_phone, payout_provider, bank_account_name, bank_account_number, bank_name, kyc_level, status, submitted_at')
          .in('organization_id', orgIds)
          .in('status', approvedKycStatuses)
          .order('submitted_at', { ascending: false }),
      ]);

      const orgById = new Map((orgs || []).map((org: any) => [org.id, org]));
      const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      const kycByOrg = new Map<string, any>();
      for (const kyc of kycSubmissions || []) {
        if (kyc.organization_id && !kycByOrg.has(kyc.organization_id)) kycByOrg.set(kyc.organization_id, kyc);
      }

      return requests.map((req: any) => ({
        ...req,
        organization: orgById.get(req.organization_id) || null,
        profile: profileById.get(req.user_id) || null,
        kyc: kycByOrg.get(req.organization_id) || null,
      }));
    },
  });

  const handleCreateManualPayout = async (request: any) => {
    const { data: kyc } = await db
      .from('kyc_submissions')
      .select('payout_method, payout_phone, payout_provider, bank_account_name, bank_account_number, bank_name, status, submitted_at')
      .eq('organization_id', request.organization_id)
      .in('status', approvedKycStatuses)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!hasPayoutDestination(kyc)) {
      toast.error('Informations de paiement KYC incomplètes — traitement bloqué');
      return;
    }

    const recipientMethod = kyc?.payout_method || 'mobile_money';
    const recipientAccount = kyc?.payout_phone || kyc?.bank_account_number || 'N/A';
    const recipientProvider = kyc?.payout_provider || kyc?.bank_name || 'N/A';
    const recipientName = kyc?.bank_account_name || request.organization?.name || 'N/A';

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
      await db.from('payout_requests').update({ status: 'processing' }).eq('id', request.id);

      // Email 1: Notify user that payout is being processed
      if (request.organization_id) {
        const { onPayoutProcessing } = await import('@/lib/notifications');
        const { data: org } = await db.from('organizations').select('name').eq('id', request.organization_id).maybeSingle();
        onPayoutProcessing(request.organization_id, org?.name || '', request.amount, request.currency || 'XOF');
      }

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

      if (selectedPayout.source_request_id) {
        await db.from('payout_requests').update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        }).eq('id', selectedPayout.source_request_id);
      }

      // Email 2: Notify user that payout has been completed/sent
      if (selectedPayout.organization_id) {
        const { onPayoutCompleted } = await import('@/lib/notifications');
        const { data: org } = await db.from('organizations').select('name').eq('id', selectedPayout.organization_id).maybeSingle();
        onPayoutCompleted(selectedPayout.organization_id, org?.name || '', selectedPayout.amount, selectedPayout.currency || 'XOF');
      }

      toast.success('Payout marqué comme effectué ✅');
      setSelectedPayout(null);
      setProofUrl('');
      setAdminNotes('');
      qc.invalidateQueries({ queryKey: ['sa-manual-payouts'] });
      qc.invalidateQueries({ queryKey: ['sa-payout-requests-pending'] });
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

    try {
      const { error: payoutError } = await db.from('manual_payouts').update({
        status: 'failed',
        processed_at: new Date().toISOString(),
        admin_notes: reason,
      }).eq('id', selectedPayout.id);
      if (payoutError) throw payoutError;

      if (selectedPayout.source_request_id) {
        const { data: sourceRequest, error: sourceRequestError } = await db.from('payout_requests')
          .select('payout_type, metadata')
          .eq('id', selectedPayout.source_request_id)
          .maybeSingle();
        if (sourceRequestError) throw sourceRequestError;

        const { error: requestError } = await db.from('payout_requests')
          .update({ status: 'rejected', reject_reason: reason } as any)
          .eq('id', selectedPayout.source_request_id);
        if (requestError) throw requestError;

        const saleIds = Array.isArray((sourceRequest as any)?.metadata?.sale_ids)
          ? (sourceRequest as any).metadata.sale_ids.filter((id: unknown): id is string => typeof id === 'string')
          : [];

        if (sourceRequest?.payout_type === 'affiliate' && saleIds.length) {
          const { error: rollbackError } = await db.from('affiliate_sales')
            .update({ status: 'payable', paid_at: null })
            .in('id', saleIds);
          if (rollbackError) throw rollbackError;
        }
      }

      if (selectedPayout.organization_id) {
        const { onPayoutRejected } = await import('@/lib/notifications');
        const { data: org } = await db.from('organizations').select('name').eq('id', selectedPayout.organization_id).maybeSingle();
        onPayoutRejected(selectedPayout.organization_id, org?.name || '', reason);
      }

      toast.success('Payout marqué comme échoué');
      setSelectedPayout(null);
      qc.invalidateQueries({ queryKey: ['sa-manual-payouts'] });
      qc.invalidateQueries({ queryKey: ['sa-payout-requests-pending'] });
    } catch (err: any) {
      toast.error(err.message);
    }
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
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        {req.organization?.name || 'Organisation'}
                      </p>
                      {req.profile?.display_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" /> Demandeur : <strong>{req.profile.display_name}</strong>
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary mt-1">{formatAmount(req.amount, req.currency)}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{req.payout_type}</Badge>
                        <Badge
                          variant={req.organization?.kyc_status === 'level1' || req.organization?.kyc_status === 'level2' ? 'default' : 'destructive'}
                          className="text-[10px]"
                        >
                          KYC: {req.organization?.kyc_status || 'none'}
                        </Badge>
                        {req.requested_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(req.requested_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCreateManualPayout(req)}
                      disabled={
                        (req.organization?.kyc_status !== 'level1' && req.organization?.kyc_status !== 'level2') ||
                        !hasPayoutDestination(req.kyc)
                      }
                    >
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      Traiter
                    </Button>
                  </div>

                  {/* Payment / identity details from KYC */}
                  {req.kyc && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1.5 text-xs">
                      <p className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">Infos de paiement (KYC)</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {req.kyc.verification_type && (
                          <p><span className="text-muted-foreground">Type :</span> <strong>{req.kyc.verification_type}</strong></p>
                        )}
                        {req.kyc.id_document_type && (
                          <p><span className="text-muted-foreground">Pièce :</span> <strong>{req.kyc.id_document_type}</strong></p>
                        )}
                        {req.kyc.payout_method && (
                          <p className="flex items-center gap-1">
                            {req.kyc.payout_method === 'mobile_money' ? <Phone className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                            <span className="text-muted-foreground">Méthode :</span> <strong>{req.kyc.payout_method === 'mobile_money' ? 'Mobile Money' : 'Virement bancaire'}</strong>
                          </p>
                        )}
                        {req.kyc.payout_provider && (
                          <p><span className="text-muted-foreground">Opérateur :</span> <strong>{req.kyc.payout_provider}</strong></p>
                        )}
                        {req.kyc.payout_phone && (
                          <p><span className="text-muted-foreground">Tél :</span> <strong className="font-mono">{req.kyc.payout_phone}</strong></p>
                        )}
                        {req.kyc.bank_name && (
                          <p><span className="text-muted-foreground">Banque :</span> <strong>{req.kyc.bank_name}</strong></p>
                        )}
                        {req.kyc.bank_account_name && (
                          <p><span className="text-muted-foreground">Nom compte :</span> <strong>{req.kyc.bank_account_name}</strong></p>
                        )}
                        {req.kyc.bank_account_number && (
                          <p><span className="text-muted-foreground">N° compte :</span> <strong className="font-mono">{req.kyc.bank_account_number}</strong></p>
                        )}
                      </div>
                      {!hasPayoutDestination(req.kyc) && (
                        <p className="text-destructive text-[10px]">⚠️ Méthode de paiement KYC incomplète</p>
                      )}
                    </div>
                  )}
                  {!req.kyc && (
                    <p className="text-destructive text-[10px]">⚠️ Aucune soumission KYC trouvée pour cette organisation</p>
                  )}
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
