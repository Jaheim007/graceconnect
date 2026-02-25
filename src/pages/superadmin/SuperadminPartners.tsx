import { useState } from 'react';
import { useAllPartners, useManagePartner, useSetPartnerRate, useAllPartnerPayouts, useProcessPartnerPayout, type Partner } from '@/hooks/usePartner';
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
import { Loader2, Handshake, CheckCircle, XCircle, Pause, Play, Percent, Wallet } from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const LEVEL_LABELS: Record<number, string> = { 1: 'Bronze', 2: 'Argent', 3: 'Or', 4: 'Platine', 5: 'Diamant' };

export default function SuperadminPartners() {
  const { data: partners = [], isLoading } = useAllPartners();
  const { data: payoutRequests = [] } = useAllPartnerPayouts();
  const managePartner = useManagePartner();
  const setRate = useSetPartnerRate();
  const processPayout = useProcessPartnerPayout();
  const qc = useQueryClient();

  const [actionDialog, setActionDialog] = useState<{ partner: Partner; action: string } | null>(null);
  const [reason, setReason] = useState('');
  const [rateDialog, setRateDialog] = useState<Partner | null>(null);
  const [newRate, setNewRate] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [newPartner, setNewPartner] = useState({ full_name: '', email: '', phone: '', country: 'CI', invite_code: '' });

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
          <TabsTrigger value="partners">Partenaires</TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Versements
            {pendingPayouts > 0 && <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{pendingPayouts}</Badge>}
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
                      <TableHead>Statut</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Taux</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Utilisations</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.full_name}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'approved' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{LEVEL_LABELS[p.level] || `L${p.level}`}</TableCell>
                        <TableCell className="text-sm">
                          {p.custom_rate_override !== null ? (
                            <span className="text-primary font-medium">{p.custom_rate_override}%*</span>
                          ) : (
                            <span>{p.rate_percent}%</span>
                          )}
                        </TableCell>
                        <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.invite_code || '—'}</code></TableCell>
                        <TableCell className="text-sm">{p.invite_uses_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
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
      </Tabs>

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
