import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPartner, usePartnerReferrals, usePartnerCommissions, usePartnerPayouts, usePartnerStats, useRequestPartnerPayout } from '@/hooks/usePartner';
import { formatCurrency } from '@/lib/currency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Copy, Users, TrendingUp, Wallet, Clock, CheckCircle, XCircle, AlertTriangle, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import PartnerPayoutConfig from '@/components/partner/PartnerPayoutConfig';

const LEVEL_LABELS: Record<number, string> = { 1: 'Bronze', 2: 'Argent', 3: 'Or', 4: 'Platine', 5: 'Diamant' };
const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  approved: { label: 'Actif', variant: 'default' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  suspended: { label: 'Suspendu', variant: 'destructive' },
};

export default function PartnerPortalPage() {
  const { user } = useAuth();
  const { data: partner, isLoading } = useMyPartner();
  const { data: referrals = [] } = usePartnerReferrals(partner?.id);
  const { data: commissions = [] } = usePartnerCommissions(partner?.id);
  const { data: payouts = [] } = usePartnerPayouts(partner?.id);
  const stats = usePartnerStats(partner?.id);
  const requestPayout = useRequestPartnerPayout();

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!partner) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <SEOHead title="Programme Partenaires" description="Programme Partenaires Officiel Siteviral" />
        <Handshake className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Programme Partenaires</h1>
        <p className="text-muted-foreground">Vous n'êtes pas encore inscrit au Programme Partenaires. Ce programme est sur invitation uniquement. Contactez-nous pour en savoir plus.</p>
        <Button variant="outline" onClick={() => window.location.href = '/contact'}>Nous contacter</Button>
      </div>
    );
  }

  if (partner.status !== 'approved') {
    const s = STATUS_MAP[partner.status] || STATUS_MAP.pending;
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <SEOHead title="Partenaire — En attente" />
        <Handshake className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Programme Partenaires</h1>
        <Badge variant={s.variant} className="text-sm">{s.label}</Badge>
        {partner.status === 'pending' && <p className="text-muted-foreground">Votre candidature est en cours d'examen. Nous reviendrons vers vous rapidement.</p>}
        {partner.status === 'suspended' && <p className="text-muted-foreground">Votre compte partenaire a été suspendu. {partner.suspension_reason && `Raison : ${partner.suspension_reason}`}</p>}
        {partner.status === 'rejected' && <p className="text-muted-foreground">Votre candidature n'a pas été retenue. {partner.suspension_reason && `Raison : ${partner.suspension_reason}`}</p>}
      </div>
    );
  }

  const inviteLink = partner.invite_link_slug
    ? `${window.location.origin}/create-org?partner=${partner.invite_code}`
    : null;

  const copyInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Lien copié !');
    }
  };

  const effectiveRate = partner.custom_rate_override ?? partner.rate_percent;
  const currency = commissions[0]?.currency || 'XOF';

  return (
    <div className="space-y-6">
      <SEOHead title="Espace Partenaire" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake className="h-6 w-6 text-primary" /> Espace Partenaire</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Niveau {LEVEL_LABELS[partner.level] || partner.level} — {effectiveRate}% de rémunération
            {partner.custom_rate_override !== null && <span className="text-primary ml-1">(taux personnalisé)</span>}
          </p>
        </div>
        <Badge variant="default" className="self-start">Partenaire Officiel</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={Users} label="Organisations" value={`${stats.activeOrgs} / ${stats.totalOrgs}`} sub="actives / total" />
        <KPICard icon={Clock} label="En attente" value={formatCurrency(stats.held, currency)} sub="held (15j)" />
        <KPICard icon={TrendingUp} label="Disponible" value={formatCurrency(stats.payable, currency)} sub="prêt à retirer" accent />
        <KPICard icon={Wallet} label="Total versé" value={formatCurrency(stats.paid, currency)} sub="historique" />
      </div>

      <Tabs defaultValue="invitations" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="orgs">Organisations</TabsTrigger>
          <TabsTrigger value="gains">Gains</TabsTrigger>
          <TabsTrigger value="payout">Paiement</TabsTrigger>
        </TabsList>

        {/* ── Invitations ── */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Votre lien d'invitation</CardTitle>
              <CardDescription>Partagez ce lien avec les responsables d'organisations pour les inviter à rejoindre Siteviral.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner.invite_code ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm font-mono truncate">{partner.invite_code}</code>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(partner.invite_code!); toast.success('Code copié'); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {inviteLink && (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs truncate">{inviteLink}</code>
                      <Button size="sm" variant="outline" onClick={copyInvite}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{partner.invite_uses_count} utilisation{partner.invite_uses_count !== 1 ? 's' : ''}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Votre code d'invitation n'a pas encore été généré. Contactez l'administrateur.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Organisations ── */}
        <TabsContent value="orgs">
          <Card>
            <CardHeader>
              <CardTitle>Organisations référées ({referrals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune organisation référée pour le moment.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.organization?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'active' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {r.status === 'active' ? 'Active' : r.status === 'rejected' ? 'Rejetée' : 'En attente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(r.attributed_at).toLocaleDateString('fr-FR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Gains ── */}
        <TabsContent value="gains">
          <Card>
            <CardHeader>
              <CardTitle>Historique des rémunérations</CardTitle>
              <CardDescription>Commissions sur la part plateforme des ventes générées par vos organisations.</CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune rémunération pour le moment.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Fee plateforme</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-sm">{c.organization?.name || '—'}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(c.platform_fee_amount, c.currency)}</TableCell>
                        <TableCell className="text-xs">{c.commission_percent}%</TableCell>
                        <TableCell className="font-medium">{formatCurrency(c.commission_amount, c.currency)}</TableCell>
                        <TableCell>
                          <CommissionStatusBadge status={c.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payout ── */}
        <TabsContent value="payout">
          <div className="space-y-4">
            {/* Payout method config */}
            <PartnerPayoutConfig
              hasRecipient={!!partner.paystack_recipient_code}
              currentMethod={partner.payout_method}
              currentCountry={partner.payout_country}
            />

            {/* Request payout */}
            <Card>
              <CardHeader>
                <CardTitle>Demander un paiement</CardTitle>
                <CardDescription>
                  Solde disponible : <span className="font-bold text-foreground">{formatCurrency(stats.payable, currency)}</span>
                  {' '} — Seuil minimum : {formatCurrency(partner.min_payout_threshold, currency)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!partner.paystack_recipient_code ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Configurez d'abord votre méthode de paiement ci-dessus.
                  </div>
                ) : stats.payable < partner.min_payout_threshold ? (
                  <p className="text-sm text-muted-foreground">Le seuil minimum de {formatCurrency(partner.min_payout_threshold, currency)} n'est pas encore atteint.</p>
                ) : (
                  <Button onClick={() => requestPayout.mutate(partner.id)} disabled={requestPayout.isPending}>
                    {requestPayout.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Demander le versement ({formatCurrency(stats.payable, currency)})
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payout history */}
            <Card>
              <CardHeader><CardTitle>Historique des versements</CardTitle></CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucun versement pour le moment.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">{new Date(p.requested_at).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(p.amount, p.currency)}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'paid' ? 'default' : p.status === 'failed' || p.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, accent }: { icon: typeof Users; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-lg font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function CommissionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
    held: { label: 'En attente', variant: 'secondary', icon: Clock },
    payable: { label: 'Disponible', variant: 'default', icon: TrendingUp },
    paid: { label: 'Versé', variant: 'outline', icon: CheckCircle },
    reversed: { label: 'Annulé', variant: 'destructive', icon: XCircle },
  };
  const s = map[status] || map.held;
  const Icon = s.icon;
  return (
    <Badge variant={s.variant} className="gap-1 text-[10px]">
      <Icon className="h-3 w-3" />{s.label}
    </Badge>
  );
}
