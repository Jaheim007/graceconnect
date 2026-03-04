import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAllPartners, useManagePartner, useSetPartnerRate, useAllPartnerPayouts, useProcessPartnerPayout, useReviewPartnerKYC, useAllPartnerReferrals, type Partner } from '@/hooks/usePartner';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Handshake, CheckCircle, XCircle, Pause, Play, Percent, Wallet, Shield, Eye, Globe, Briefcase, Phone, Mail, MapPin, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const LEVEL_LABELS: Record<number, string> = { 1: 'Bronze', 2: 'Argent', 3: 'Or', 4: 'Platine', 5: 'Diamant' };

export default function SuperadminPartners() {
  const { data: partners = [], isLoading } = useAllPartners();
  const { data: payoutRequests = [] } = useAllPartnerPayouts();
  const { data: allReferrals = [], isLoading: isLoadingRefs } = useAllPartnerReferrals();
  const managePartner = useManagePartner();
  const setRate = useSetPartnerRate();
  const processPayout = useProcessPartnerPayout();
  const reviewKYC = useReviewPartnerKYC();
  const qc = useQueryClient();

  const [actionDialog, setActionDialog] = useState<{ partner: Partner; action: string } | null>(null);
  const [reason, setReason] = useState('');
  const [rateDialog, setRateDialog] = useState<Partner | null>(null);
  const [newRate, setNewRate] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [newPartner, setNewPartner] = useState({ full_name: '', email: '', phone: '', country: 'CI', invite_code: '' });
  const [detailDialog, setDetailDialog] = useState<Partner | null>(null);

  const handleAction = () => {
    if (!actionDialog) return;
    managePartner.mutate(
      { partnerId: actionDialog.partner.id, action: actionDialog.action, reason },
      { onSuccess: () => { setActionDialog(null); setReason(''); } }
    );
  };

  const handleSetRate = () => {
    if (!rateDialog || !newRate) return;
    setRate.mutate(
      { partnerId: rateDialog.id, rate: parseFloat(newRate) },
      { onSuccess: () => { setRateDialog(null); setNewRate(''); } }
    );
  };

  const handleCreate = async () => {
    if (!newPartner.full_name || !newPartner.email) return;
    try {
      const code = newPartner.invite_code || ('SV-' + newPartner.full_name.substring(0, 4).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase());
      const slug = code.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const { error } = await db.from('partners').insert({
        full_name: newPartner.full_name,
        email: newPartner.email,
        phone: newPartner.phone || null,
        country: newPartner.country,
        invite_code: code.toUpperCase(),
        invite_link_slug: slug,
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Partenaire créé');
      qc.invalidateQueries({ queryKey: ['all-partners'] });
      setCreateDialog(false);
      setNewPartner({ full_name: '', email: '', phone: '', country: 'CI', invite_code: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const pendingPayouts = payoutRequests.filter(pr => pr.status === 'requested').length;

  const statusCounts = {
    pending: partners.filter(p => p.status === 'pending').length,
    approved: partners.filter(p => p.status === 'approved').length,
    suspended: partners.filter(p => p.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake className="h-6 w-6 text-primary" /> Partenaires</h1>
          <p className="text-sm text-muted-foreground">{partners.length} partenaires — {statusCounts.pending} en attente, {statusCounts.approved} actifs</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>+ Ajouter un partenaire</Button>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">
            Partenaires
            {statusCounts.pending > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{statusCounts.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            KYC
            {partners.filter(p => (p as any).kyc_status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">
                {partners.filter(p => (p as any).kyc_status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Versements
            {pendingPayouts > 0 && <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{pendingPayouts}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Referrals
            {allReferrals.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">
                {allReferrals.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partenaire</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map(p => {
                      const pa = p as any;
                      return (
                        <TableRow key={p.id} className={p.status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{p.full_name}</p>
                              <p className="text-xs text-muted-foreground">{p.email}</p>
                              {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{pa.profession || '—'}</TableCell>
                          <TableCell className="text-sm">{p.country}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'approved' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{LEVEL_LABELS[p.level] || `L${p.level}`}</TableCell>
                          <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.invite_code || '—'}</code></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => setDetailDialog(p)} title="Voir détails">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {p.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => setActionDialog({ partner: p, action: 'approve' })} title="Approuver">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setActionDialog({ partner: p, action: 'reject' })} title="Rejeter">
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                              {p.status === 'approved' && (
                                <Button size="sm" variant="ghost" onClick={() => setActionDialog({ partner: p, action: 'suspend' })} title="Suspendre">
                                  <Pause className="h-4 w-4 text-amber-600" />
                                </Button>
                              )}
                              {p.status === 'suspended' && (
                                <Button size="sm" variant="ghost" onClick={() => setActionDialog({ partner: p, action: 'unsuspend' })} title="Réactiver">
                                  <Play className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => { setRateDialog(p); setNewRate(String(p.custom_rate_override ?? p.rate_percent)); }} title="Modifier taux">
                                <Percent className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── KYC Tab ── */}
        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle>Vérifications KYC partenaires</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const kycPartners = partners.filter(p => (p as any).kyc_status && (p as any).kyc_status !== 'none');
                if (kycPartners.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">Aucune soumission KYC.</p>;
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partenaire</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kycPartners.map(p => {
                        const pa = p as any;
                        return (
                          <TableRow key={p.id}>
                            <TableCell>
                              <p className="font-medium text-sm">{p.full_name}</p>
                              <p className="text-xs text-muted-foreground">{p.email}</p>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-xs">{pa.id_document_type || '—'}</p>
                                {pa.id_document_url && (
                                  <a href={pa.id_document_url} target="_blank" rel="noopener" className="text-xs text-primary underline">Voir document</a>
                                )}
                                {pa.selfie_url && (
                                  <a href={pa.selfie_url} target="_blank" rel="noopener" className="text-xs text-primary underline block">Voir selfie</a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={pa.kyc_status === 'approved' ? 'default' : pa.kyc_status === 'rejected' ? 'destructive' : 'secondary'}>
                                {pa.kyc_status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{pa.kyc_submitted_at ? new Date(pa.kyc_submitted_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
                            <TableCell className="text-right">
                              {pa.kyc_status === 'pending' && (
                                <div className="flex items-center gap-1 justify-end">
                                  <Button size="sm" variant="default" onClick={() => reviewKYC.mutate({ partnerId: p.id, action: 'approve' })} disabled={reviewKYC.isPending}>
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />Approuver
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => {
                                    const reason = prompt('Raison du rejet (optionnel):');
                                    reviewKYC.mutate({ partnerId: p.id, action: 'reject', reason: reason || undefined });
                                  }} disabled={reviewKYC.isPending}>
                                    <XCircle className="h-3.5 w-3.5 mr-1" />Rejeter
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payouts Tab ── */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de versement partenaires</CardTitle>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune demande de versement.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Partenaire</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutRequests.map(pr => (
                      <TableRow key={pr.id}>
                        <TableCell className="text-xs">{new Date(pr.requested_at).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{(pr as any).partner?.full_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{(pr as any).partner?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(pr.amount, pr.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={pr.status === 'paid' ? 'default' : pr.status === 'rejected' || pr.status === 'failed' ? 'destructive' : 'secondary'}>
                            {pr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {pr.status === 'requested' && (
                            <div className="flex items-center gap-1 justify-end">
                              <Button size="sm" variant="default" onClick={() => processPayout.mutate({ payoutRequestId: pr.id, action: 'approve' })} disabled={processPayout.isPending}>
                                {processPayout.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                Approuver
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => processPayout.mutate({ payoutRequestId: pr.id, action: 'reject' })} disabled={processPayout.isPending}>
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Referrals Tab (read-only monitoring — activation is automatic on first payment) ── */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Organisations référées par les partenaires</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                ⚡ Les referrals passent automatiquement de « En attente » à « Active » dès le premier paiement reçu par l'organisation. Les commissions sont créées et libérées automatiquement après 15 jours.
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingRefs ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : allReferrals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun referral pour le moment.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partenaire</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReferrals.map(ref => (
                      <TableRow key={ref.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{(ref as any).partner?.full_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{(ref as any).partner?.invite_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{ref.organization?.name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{ref.organization?.slug}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ref.status === 'active' ? 'default' : ref.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {ref.status === 'active' ? 'Active' : ref.status === 'rejected' ? 'Rejetée' : 'En attente (1er paiement)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(ref.attributed_at).toLocaleDateString('fr-FR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Détails du candidat
            </DialogTitle>
          </DialogHeader>
          {detailDialog && (() => {
            const p = detailDialog as any;
            return (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  {/* Identity */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Identité</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2"><span className="text-muted-foreground">Nom:</span><strong>{p.full_name}</strong></div>
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{p.email}</span></div>
                      {p.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{p.phone}</span></div>}
                      <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{p.country}{p.city ? `, ${p.city}` : ''}</span></div>
                      {p.profession && <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /><span>{p.profession}</span></div>}
                    </div>
                  </div>

                  {/* Network */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Réseau</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {p.organization_name && <div><span className="text-muted-foreground">Organisation:</span> {p.organization_name}</div>}
                      {p.organization_type && <div><span className="text-muted-foreground">Type ciblé:</span> {p.organization_type}</div>}
                      {p.network_size && <div><span className="text-muted-foreground">Taille réseau:</span> {p.network_size}</div>}
                      {p.target_audience && <div><span className="text-muted-foreground">Audience:</span> {p.target_audience}</div>}
                    </div>
                  </div>

                  {/* Online */}
                  {(p.website_url || p.social_media_url) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Présence en ligne</h4>
                      <div className="space-y-1 text-sm">
                        {p.website_url && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <a href={p.website_url} target="_blank" rel="noopener" className="text-primary underline truncate">{p.website_url}</a>
                          </div>
                        )}
                        {p.social_media_url && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <a href={p.social_media_url} target="_blank" rel="noopener" className="text-primary underline truncate">{p.social_media_url}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Motivation */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Motivation</h4>
                    {p.how_heard_about_us && <p className="text-sm"><span className="text-muted-foreground">Source:</span> {p.how_heard_about_us}</p>}
                    {p.experience_description && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Expérience:</p>
                        <p className="text-sm bg-muted/50 rounded-lg p-3">{p.experience_description}</p>
                      </div>
                    )}
                    {p.motivation && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Motivation:</p>
                        <p className="text-sm bg-muted/50 rounded-lg p-3">{p.motivation}</p>
                      </div>
                    )}
                    {p.notes && !p.motivation && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm bg-muted/50 rounded-lg p-3">{p.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
                    <p>Candidature le {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>Statut: <Badge variant={p.status === 'approved' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] ml-1">{p.status}</Badge></p>
                    {p.invite_code && <p>Code: <code className="bg-muted px-1 rounded">{p.invite_code}</code></p>}
                  </div>
                </div>
              </ScrollArea>
            );
          })()}
          <DialogFooter>
            {detailDialog?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => { setActionDialog({ partner: detailDialog!, action: 'reject' }); setDetailDialog(null); }}>
                  <XCircle className="h-4 w-4 mr-2" />Rejeter
                </Button>
                <Button onClick={() => { setActionDialog({ partner: detailDialog!, action: 'approve' }); setDetailDialog(null); }}>
                  <CheckCircle className="h-4 w-4 mr-2" />Approuver
                </Button>
              </>
            )}
            {detailDialog?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setDetailDialog(null)}>Fermer</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'approve' && 'Approuver le partenaire'}
              {actionDialog?.action === 'reject' && 'Rejeter le partenaire'}
              {actionDialog?.action === 'suspend' && 'Suspendre le partenaire'}
              {actionDialog?.action === 'unsuspend' && 'Réactiver le partenaire'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{actionDialog?.partner.full_name} ({actionDialog?.partner.email})</p>
          {(actionDialog?.action === 'reject' || actionDialog?.action === 'suspend') && (
            <Textarea placeholder="Raison (optionnel)" value={reason} onChange={e => setReason(e.target.value)} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button onClick={handleAction} disabled={managePartner.isPending}
              variant={actionDialog?.action === 'reject' || actionDialog?.action === 'suspend' ? 'destructive' : 'default'}>
              {managePartner.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={!!rateDialog} onOpenChange={() => setRateDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le taux — {rateDialog?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Taux personnalisé (%)</Label>
            <Input type="number" min={0} max={50} step={0.5} value={newRate} onChange={e => setNewRate(e.target.value)} />
            <p className="text-xs text-muted-foreground">Ce taux remplace le taux automatique basé sur le niveau.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialog(null)}>Annuler</Button>
            <Button onClick={handleSetRate} disabled={setRate.isPending}>
              {setRate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un partenaire</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom complet *</Label><Input value={newPartner.full_name} onChange={e => setNewPartner(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={newPartner.email} onChange={e => setNewPartner(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Téléphone</Label><Input value={newPartner.phone} onChange={e => setNewPartner(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Pays</Label><Input value={newPartner.country} onChange={e => setNewPartner(p => ({ ...p, country: e.target.value }))} /></div>
            <div><Label>Code invitation (auto si vide)</Label><Input value={newPartner.invite_code} onChange={e => setNewPartner(p => ({ ...p, invite_code: e.target.value }))} placeholder="Ex: BISHOP-2026" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!newPartner.full_name || !newPartner.email}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
