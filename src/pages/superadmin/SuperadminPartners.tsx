import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAllPartners, useManagePartner, useSetPartnerRate, useDeletePartner, useAllPartnerPayouts, useProcessPartnerPayout, useReviewPartnerKYC, useAllPartnerReferrals, type Partner } from '@/hooks/usePartner';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Handshake, CheckCircle, XCircle, Pause, Play, Percent, Wallet, Shield, Eye, Globe, Briefcase, Phone, Mail, MapPin, Users, Trash2, Building2, ArrowRight, CircleDollarSign } from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const LEVEL_LABELS: Record<number, string> = { 1: 'Bronze', 2: 'Argent', 3: 'Or', 4: 'Platine', 5: 'Diamant' };

export default function SuperadminPartners() {
  const { data: partners = [], isLoading } = useAllPartners();
  const { data: payoutRequests = [] } = useAllPartnerPayouts();
  const { data: allReferrals = [], isLoading: isLoadingRefs } = useAllPartnerReferrals();
  const managePartner = useManagePartner();
  const setRate = useSetPartnerRate();
  const processPayout = useProcessPartnerPayout();
  const reviewKYC = useReviewPartnerKYC();
  const deletePartner = useDeletePartner();
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Handshake className="h-5 w-5 text-primary" /> Partenaires</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{partners.length} partenaires — {statusCounts.pending} en attente, {statusCounts.approved} actifs</p>
        </div>
        <Button size="sm" onClick={() => setCreateDialog(true)} className="gap-1.5 text-xs">
          + Ajouter
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniKPI label="Total" value={partners.length} icon={Users} />
        <MiniKPI label="En attente" value={statusCounts.pending} icon={Loader2} accent={statusCounts.pending > 0} />
        <MiniKPI label="Actifs" value={statusCounts.approved} icon={CheckCircle} />
        <MiniKPI label="Versements en attente" value={pendingPayouts} icon={Wallet} accent={pendingPayouts > 0} />
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList className="bg-muted/40 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="partners" className="rounded-lg text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" /> Partenaires
            {statusCounts.pending > 0 && <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{statusCounts.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="referrals" className="rounded-lg text-xs gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Organisations référées
          </TabsTrigger>
          <TabsTrigger value="kyc" className="rounded-lg text-xs gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Vérification
          </TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-lg text-xs gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Versements
            {pendingPayouts > 0 && <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{pendingPayouts}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── Partners Tab ── */}
        <TabsContent value="partners">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : partners.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Aucun partenaire.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {partners.map(p => {
                const pa = p as any;
                return (
                  <Card key={p.id} className={`border-border/40 hover:border-border/80 transition-colors ${p.status === 'pending' ? 'border-amber-500/30 bg-amber-500/[0.02]' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {p.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold truncate">{p.full_name}</p>
                              <Badge variant={p.status === 'approved' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                                {p.status === 'approved' ? 'Actif' : p.status === 'pending' ? 'En attente' : p.status}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-5">{LEVEL_LABELS[p.level] || `L${p.level}`}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span>{p.email}</span>
                              <span>{p.country}</span>
                              {pa.profession && <span>{pa.profession}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{p.invite_code || '—'}</code>
                              <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDetailDialog(p)} title="Détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {p.status === 'pending' && (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActionDialog({ partner: p, action: 'approve' })} title="Approuver">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActionDialog({ partner: p, action: 'reject' })} title="Rejeter">
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActionDialog({ partner: p, action: 'suspend' })} title="Suspendre">
                              <Pause className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                          {p.status === 'suspended' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActionDialog({ partner: p, action: 'unsuspend' })} title="Réactiver">
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setRateDialog(p); setNewRate(String(p.custom_rate_override ?? p.rate_percent)); }} title="Taux">
                            <Percent className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                            if (confirm(`Supprimer définitivement ${p.full_name} ? Cette action est irréversible.`)) {
                              deletePartner.mutate(p.id);
                            }
                          }} title="Supprimer">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Referrals Tab ── */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organisations référées par les partenaires</CardTitle>
              <CardDescription className="text-xs">
                ⚡ Le statut passe automatiquement de « En attente » à « Active » au 1er paiement. Les commissions sont créées et libérées automatiquement après 15 jours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRefs ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : allReferrals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucun referral pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {allReferrals.map(ref => (
                    <div key={ref.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                      {/* Partner */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {((ref as any).partner?.full_name || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{(ref as any).partner?.full_name || '—'}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{(ref as any).partner?.invite_code}</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />

                      {/* Organization */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ref.organization?.name || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{ref.organization?.slug}</p>
                        </div>
                      </div>

                      {/* Status + Date */}
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={ref.status === 'active' ? 'default' : ref.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {ref.status === 'active' ? '✓ Active' : ref.status === 'rejected' ? 'Rejetée' : '⏳ En attente'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(ref.attributed_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── KYC Tab ── */}
        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vérifications KYC</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const kycPartners = partners.filter(p => (p as any).kyc_status && (p as any).kyc_status !== 'none');
                if (kycPartners.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Aucune soumission KYC.</p>;
                return (
                  <div className="space-y-2">
                    {kycPartners.map(p => {
                      const pa = p as any;
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{p.full_name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-medium">{p.full_name}</p>
                              <p className="text-xs text-muted-foreground">{pa.id_document_type || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={pa.kyc_status === 'approved' ? 'default' : pa.kyc_status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {pa.kyc_status}
                            </Badge>
                            {pa.kyc_status === 'pending' && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => reviewKYC.mutate({ partnerId: p.id, action: 'approve' })} disabled={reviewKYC.isPending}>
                                  <CheckCircle className="h-3 w-3 mr-1" />OK
                                </Button>
                                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => {
                                  const r = prompt('Raison du rejet:');
                                  reviewKYC.mutate({ partnerId: p.id, action: 'reject', reason: r || undefined });
                                }} disabled={reviewKYC.isPending}>
                                  <XCircle className="h-3 w-3 mr-1" />Non
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payouts Tab ── */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Demandes de versement</CardTitle>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune demande.</p>
              ) : (
                <div className="space-y-2">
                  {payoutRequests.map(pr => (
                    <div key={pr.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{(pr as any).partner?.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{(pr as any).partner?.email} • {new Date(pr.requested_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold">{formatCurrency(pr.amount, pr.currency)}</p>
                        <Badge variant={pr.status === 'paid' ? 'default' : pr.status === 'rejected' || pr.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {pr.status}
                        </Badge>
                        {pr.status === 'requested' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => processPayout.mutate({ payoutRequestId: pr.id, action: 'approve' })} disabled={processPayout.isPending}>
                              {processPayout.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                              Payer
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => processPayout.mutate({ payoutRequestId: pr.id, action: 'reject' })} disabled={processPayout.isPending}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Detail Dialog ── */}
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
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Identité</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Nom:</span> <strong>{p.full_name}</strong></div>
                      <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{p.email}</div>
                      {p.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{p.phone}</div>}
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{p.country}{p.city ? `, ${p.city}` : ''}</div>
                      {p.profession && <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" />{p.profession}</div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Réseau</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {p.organization_name && <div><span className="text-muted-foreground">Organisation:</span> {p.organization_name}</div>}
                      {p.organization_type && <div><span className="text-muted-foreground">Type:</span> {p.organization_type}</div>}
                      {p.network_size && <div><span className="text-muted-foreground">Réseau:</span> {p.network_size}</div>}
                      {p.target_audience && <div><span className="text-muted-foreground">Audience:</span> {p.target_audience}</div>}
                    </div>
                  </div>
                  {(p.website_url || p.social_media_url) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wide">En ligne</h4>
                      <div className="space-y-1 text-sm">
                        {p.website_url && <a href={p.website_url} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-primary underline"><Globe className="h-3.5 w-3.5" />{p.website_url}</a>}
                        {p.social_media_url && <a href={p.social_media_url} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-primary underline"><Globe className="h-3.5 w-3.5" />{p.social_media_url}</a>}
                      </div>
                    </div>
                  )}
                  {(p.experience_description || p.motivation) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Motivation</h4>
                      {p.experience_description && <p className="text-sm bg-muted/50 rounded-lg p-3">{p.experience_description}</p>}
                      {p.motivation && <p className="text-sm bg-muted/50 rounded-lg p-3">{p.motivation}</p>}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                    <p>Candidature le {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>Code: <code className="bg-muted px-1 rounded">{p.invite_code || '—'}</code></p>
                  </div>
                </div>
              </ScrollArea>
            );
          })()}
          <DialogFooter>
            {detailDialog?.status === 'pending' ? (
              <>
                <Button variant="destructive" size="sm" onClick={() => { setActionDialog({ partner: detailDialog!, action: 'reject' }); setDetailDialog(null); }}>
                  <XCircle className="h-4 w-4 mr-1" />Rejeter
                </Button>
                <Button size="sm" onClick={() => { setActionDialog({ partner: detailDialog!, action: 'approve' }); setDetailDialog(null); }}>
                  <CheckCircle className="h-4 w-4 mr-1" />Approuver
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setDetailDialog(null)}>Fermer</Button>
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
            <Button variant="outline" size="sm" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button size="sm" onClick={handleAction} disabled={managePartner.isPending}
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
            <p className="text-xs text-muted-foreground">Remplace le taux automatique basé sur le niveau.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRateDialog(null)}>Annuler</Button>
            <Button size="sm" onClick={handleSetRate} disabled={setRate.isPending}>
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
            <Button variant="outline" size="sm" onClick={() => setCreateDialog(false)}>Annuler</Button>
            <Button size="sm" onClick={handleCreate} disabled={!newPartner.full_name || !newPartner.email}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function MiniKPI({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Users; accent?: boolean }) {
  return (
    <Card className={`border-border/40 ${accent ? 'border-amber-500/30' : ''}`}>
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent ? 'bg-amber-500/10' : 'bg-muted/60'}`}>
          <Icon className={`h-4 w-4 ${accent ? 'text-amber-500' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
