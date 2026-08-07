import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPartner, usePartnerReferrals, usePartnerCommissions, usePartnerPayouts, usePartnerStats, useRequestPartnerPayout } from '@/hooks/usePartner';
import { formatCurrency } from '@/lib/currency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Copy, Users, TrendingUp, Wallet, Clock, CheckCircle, XCircle, AlertTriangle, Handshake, Link2, Building2, CircleDollarSign, ArrowUpRight, Shield, CreditCard, Gift, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import PartnerPayoutConfig from '@/components/partner/PartnerPayoutConfig';
import IdentityVerificationWizard from '@/components/verification/IdentityVerificationWizard';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

const LEVEL_LABELS: Record<number, string> = { 1: 'Bronze', 2: 'Argent', 3: 'Or', 4: 'Platine', 5: 'Diamant' };
const LEVEL_LABELS_EN: Record<number, string> = { 1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Platinum', 5: 'Diamond' };
const LEVEL_COLORS: Record<number, string> = {
  1: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  2: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  3: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  4: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  5: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
};
const STATUS_MAP_FR: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  approved: { label: 'Actif', variant: 'default' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  suspended: { label: 'Suspendu', variant: 'destructive' },
};
const STATUS_MAP_EN: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  approved: { label: 'Active', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  suspended: { label: 'Suspended', variant: 'destructive' },
};

export default function PartnerPortalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateLoc = isFr ? 'fr-FR' : 'en-US';
  const {
    data: partner,
    isLoading,
    refetch: refetchPartner,
    isFetching: isFetchingPartner,
  } = useMyPartner();
  const referralsQuery = usePartnerReferrals(partner?.id);
  const commissionsQuery = usePartnerCommissions(partner?.id);
  const payoutsQuery = usePartnerPayouts(partner?.id);
  const referrals = referralsQuery.data || [];
  const commissions = commissionsQuery.data || [];
  const payouts = payoutsQuery.data || [];
  const stats = usePartnerStats(partner?.id);
  const requestPayout = useRequestPartnerPayout();
  const [isForceSyncing, setIsForceSyncing] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!partner) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <SEOHead title={isFr ? 'Programme Partenaires' : 'Partner Program'} description={isFr ? 'Programme Partenaires Officiel Siteviral' : 'Siteviral Official Partner Program'} />
        <Handshake className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">{isFr ? 'Programme Partenaires' : 'Partner Program'}</h1>
        <p className="text-muted-foreground">{isFr ? 'Vous n\'êtes pas encore inscrit au Programme Partenaires.' : 'You are not yet enrolled in the Partner Program.'}</p>
        <Button variant="outline" onClick={() => navigate('/devenir-partenaire')}>{isFr ? 'Postuler' : 'Apply'}</Button>
      </div>
    );
  }

  if (partner.status !== 'approved') {
    const statusMap = isFr ? STATUS_MAP_FR : STATUS_MAP_EN;
    const s = statusMap[partner.status] || statusMap.pending;
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <SEOHead title={isFr ? 'Partenaire — En attente' : 'Partner — Pending'} />
        <Handshake className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">{isFr ? 'Programme Partenaires' : 'Partner Program'}</h1>
        <Badge variant={s.variant} className="text-sm">{s.label}</Badge>
        {partner.status === 'pending' && <p className="text-muted-foreground">{isFr ? 'Votre candidature est en cours d\'examen.' : 'Your application is under review.'}</p>}
        {partner.status === 'suspended' && <p className="text-muted-foreground">{isFr ? 'Votre compte a été suspendu.' : 'Your account has been suspended.'} {partner.suspension_reason && (isFr ? `Raison : ${partner.suspension_reason}` : `Reason: ${partner.suspension_reason}`)}</p>}
        {partner.status === 'rejected' && <p className="text-muted-foreground">{isFr ? 'Votre candidature n\'a pas été retenue.' : 'Your application was not accepted.'}</p>}
      </div>
    );
  }

  const inviteLink = partner.invite_code
    ? `${window.location.origin}/create-org?partner=${partner.invite_code}`
    : null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isFr ? `${label} copié !` : `${label} copied!`);
  };

  const handleForceSync = async () => {
    setIsForceSyncing(true);
    try {
      const results = await Promise.all([
        refetchPartner(),
        referralsQuery.refetch(),
        commissionsQuery.refetch(),
        payoutsQuery.refetch(),
      ]);

      const hasError = results.some(result => !!result.error);
      if (hasError) {
        toast.error(isFr ? 'Synchronisation incomplète. Réessayez dans quelques secondes.' : 'Incomplete sync. Try again in a few seconds.');
      } else {
        toast.success(isFr ? 'Synchronisation forcée terminée.' : 'Forced sync complete.');
      }
    } finally {
      setIsForceSyncing(false);
    }
  };

  const effectiveRate = partner.custom_rate_override ?? partner.rate_percent;
  const currency = commissions[0]?.currency || 'XOF';
  const levelColor = LEVEL_COLORS[partner.level] || LEVEL_COLORS[1];
  const isSyncing = isForceSyncing || isFetchingPartner || referralsQuery.isFetching || commissionsQuery.isFetching || payoutsQuery.isFetching;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <SEOHead title={isFr ? 'Espace Partenaire' : 'Partner Portal'} />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{isFr ? 'Espace Partenaire' : 'Partner Portal'}</h1>
              <p className="text-xs text-muted-foreground">{partner.full_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleForceSync} disabled={isSyncing} className="gap-2">
            {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {isFr ? 'Forcer sync' : 'Force sync'}
          </Button>
          <Badge className={`${levelColor} border text-xs font-semibold px-3 py-1`}>
            {(isFr ? LEVEL_LABELS : LEVEL_LABELS_EN)[partner.level] || `L${partner.level}`} — {effectiveRate}%
          </Badge>
          <Badge variant="outline" className="text-xs px-2.5 py-1 border-primary/30 text-primary">
            {isFr ? 'Partenaire Officiel' : 'Official Partner'}
          </Badge>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Building2} label={isFr ? 'Organisations' : 'Organizations'} value={`${stats.activeOrgs} / ${stats.totalOrgs}`} sub={isFr ? 'actives / total' : 'active / total'} />
        <KPICard icon={Clock} label={isFr ? 'En attente' : 'Pending'} value={formatCurrency(stats.held, currency)} sub={isFr ? 'retenue 15 jours' : '15-day hold'} />
        <KPICard icon={CircleDollarSign} label={isFr ? 'Disponible' : 'Available'} value={formatCurrency(stats.payable, currency)} sub={isFr ? 'prêt à retirer' : 'ready to withdraw'} accent />
        <KPICard icon={Wallet} label={isFr ? 'Total versé' : 'Total paid'} value={formatCurrency(stats.paid, currency)} sub={isFr ? 'historique' : 'history'} />
      </div>

      {(referralsQuery.isError || commissionsQuery.isError) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>{isFr ? 'Les données partenaires ne sont pas encore synchronisées. Cliquez pour forcer la mise à jour.' : 'Partner data not yet synced. Click to force update.'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleForceSync} disabled={isSyncing}>
              {isFr ? 'Réessayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full sm:w-auto bg-muted/40 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="overview" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
            <Zap className="h-3.5 w-3.5" /> {isFr ? 'Vue d\'ensemble' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="orgs" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
            <Building2 className="h-3.5 w-3.5" /> {isFr ? 'Organisations' : 'Organizations'}
            {referrals.length > 0 && <span className="ml-1 text-[10px] bg-muted rounded-full px-1.5">{referrals.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="gains" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
            <CircleDollarSign className="h-3.5 w-3.5" /> {isFr ? 'Commissions' : 'Commissions'}
            {commissions.length > 0 && <span className="ml-1 text-[10px] bg-muted rounded-full px-1.5">{commissions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="kyc" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
            <Shield className="h-3.5 w-3.5" /> KYC
          </TabsTrigger>
          <TabsTrigger value="payout" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
            <CreditCard className="h-3.5 w-3.5" /> {isFr ? 'Retrait' : 'Payout'}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Invite link card */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">{isFr ? 'Votre lien d\'invitation' : 'Your invite link'}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isFr ? 'Partagez ce lien pour inviter des organisations. Vos commissions sont générées automatiquement.' : 'Share this link to invite organizations. Commissions are generated automatically.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {partner.invite_code ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted/80 px-3 py-2.5 rounded-lg text-sm font-mono truncate border border-border/50">{partner.invite_code}</code>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => copyText(partner.invite_code!, 'Code')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {inviteLink && (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted/80 px-3 py-2.5 rounded-lg text-xs truncate border border-border/50">{inviteLink}</code>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => copyText(inviteLink, 'Lien')}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {partner.invite_uses_count} {isFr ? `utilisation${partner.invite_uses_count !== 1 ? 's' : ''}` : `use${partner.invite_uses_count !== 1 ? 's' : ''}`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{isFr ? 'Code d\'invitation en cours de génération...' : 'Invite code being generated...'}</p>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                {isFr ? 'Comment ça fonctionne' : 'How it works'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { step: '1', title: isFr ? 'Invitez' : 'Invite', desc: isFr ? 'Partagez votre lien avec des créateurs ou organisations.' : 'Share your link with creators or organizations.' },
                  { step: '2', title: isFr ? 'Ils vendent' : 'They sell', desc: isFr ? "L'organisation vend ses produits/reçoit des dons sur SiteViral." : "The organization sells products/receives donations on SiteViral." },
                  { step: '3', title: isFr ? 'Vous gagnez' : 'You earn', desc: `${effectiveRate}% ${isFr ? 'des frais de plateforme, automatiquement.' : 'of platform fees, automatically.'}` },
                ].map(s => (
                  <div key={s.step} className="flex gap-3 items-start">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{s.step}</div>
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent commissions preview */}
          {commissions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{isFr ? 'Dernières commissions' : 'Recent commissions'}</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-7" onClick={() => {
                    document.querySelector<HTMLButtonElement>('[data-value="gains"]')?.click();
                  }}>
                    {isFr ? 'Tout voir' : 'View all'} <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commissions.slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.organization?.name || '—'}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString(dateLoc)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(c.commission_amount, c.currency)}</p>
                        <CommissionStatusBadge status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Organisations ── */}
        <TabsContent value="orgs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isFr ? 'Organisations référées' : 'Referred organizations'}</CardTitle>
              <CardDescription>
                {isFr ? 'Les organisations que vous avez invitées via votre lien partenaire. Le statut passe automatiquement à « Active » au premier paiement reçu.' : 'Organizations you invited via your partner link. Status changes to "Active" on first payment received.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Building2 className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{isFr ? 'Aucune organisation référée pour le moment.' : 'No referred organizations yet.'}</p>
                  <p className="text-xs text-muted-foreground">{isFr ? 'Partagez votre lien d\'invitation pour commencer.' : 'Share your invite link to get started.'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {r.organization?.logo_url ? (
                          <img src={r.organization.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{r.organization?.name || '—'}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(r.attributed_at).toLocaleDateString(dateLoc)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={r.status === 'active' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {r.status === 'active' ? (isFr ? '✓ Active' : '✓ Active') : r.status === 'rejected' ? (isFr ? 'Rejetée' : 'Rejected') : (isFr ? '⏳ En attente' : '⏳ Pending')}
                        </Badge>
                        {r.status === 'pending' && (
                          <span className="text-[10px] text-muted-foreground">{isFr ? '1er paiement requis' : '1st payment required'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Commissions ── */}
        <TabsContent value="gains">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isFr ? 'Historique des commissions' : 'Commission history'}</CardTitle>
              <CardDescription>
                {isFr ? 'Commissions générées automatiquement sur chaque transaction de vos organisations. Retenue de 15 jours puis disponible.' : 'Commissions automatically generated on each transaction from your organizations. 15-day hold then available.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <CircleDollarSign className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  {commissionsQuery.isFetching ? (
                    <>
                      <p className="text-sm text-muted-foreground">{isFr ? 'Synchronisation des commissions en cours...' : 'Syncing commissions...'}</p>
                      <p className="text-xs text-muted-foreground">{isFr ? 'Patientez quelques secondes.' : 'Please wait a few seconds.'}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">{isFr ? 'Aucune commission visible pour le moment.' : 'No commissions visible yet.'}</p>
                      <p className="text-xs text-muted-foreground">{isFr ? 'Cliquez sur « Forcer sync » pour recharger immédiatement depuis le serveur.' : 'Click "Force sync" to reload immediately from server.'}</p>
                    </>
                  )}
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={handleForceSync} disabled={isSyncing} className="gap-2">
                      {isSyncing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isFr ? 'Forcer sync' : 'Force sync'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">{isFr ? 'Date' : 'Date'}</TableHead>
                        <TableHead className="text-xs">{isFr ? 'Organisation' : 'Organization'}</TableHead>
                        <TableHead className="text-xs text-right">{isFr ? 'Fee plateforme' : 'Platform fee'}</TableHead>
                        <TableHead className="text-xs text-center">{isFr ? 'Taux' : 'Rate'}</TableHead>
                        <TableHead className="text-xs text-right">{isFr ? 'Commission' : 'Commission'}</TableHead>
                        <TableHead className="text-xs text-center">{isFr ? 'Statut' : 'Status'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(c.created_at).toLocaleDateString(dateLoc)}</TableCell>
                          <TableCell className="text-sm font-medium">{c.organization?.name || '—'}</TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground">{formatCurrency(c.platform_fee_amount, c.currency)}</TableCell>
                          <TableCell className="text-xs text-center">{c.commission_percent}%</TableCell>
                          <TableCell className="text-sm font-semibold text-right">{formatCurrency(c.commission_amount, c.currency)}</TableCell>
                          <TableCell className="text-center">
                            <CommissionStatusBadge status={c.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Summary */}
              {commissions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.held, currency)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isFr ? 'En attente' : 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(stats.payable, currency)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isFr ? 'Disponible' : 'Available'}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.paid, currency)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isFr ? 'Versé' : 'Paid'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── KYC ── */}
        <TabsContent value="kyc">
          <IdentityVerificationWizard
            mode="partner"
            entityId={partner.id}
            status={(partner as any).kyc_status || 'none'}
            rejectionReason={(partner as any).kyc_rejection_reason}
          />
        </TabsContent>

        {/* ── Payout ── */}
        <TabsContent value="payout" className="space-y-4">
          <PartnerPayoutConfig
            hasRecipient={!!partner.paystack_recipient_code}
            currentMethod={partner.payout_method}
            currentCountry={partner.payout_country}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{isFr ? 'Demander un retrait' : 'Request payout'}</CardTitle>
              <CardDescription className="text-xs">
                {isFr ? 'Disponible' : 'Available'}: <span className="font-bold text-foreground">{formatCurrency(stats.payable, currency)}</span>
                {' '}— Min.: {formatCurrency(partner.min_payout_threshold, currency)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!partner.paystack_recipient_code ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  {isFr ? 'Configurez d\'abord votre méthode de paiement ci-dessus.' : 'First configure your payment method above.'}
                </div>
              ) : stats.payable < partner.min_payout_threshold ? (
                <p className="text-sm text-muted-foreground">
                  {isFr ? `Le seuil minimum de ${formatCurrency(partner.min_payout_threshold, currency)} n'est pas encore atteint.` : `Minimum threshold of ${formatCurrency(partner.min_payout_threshold, currency)} not yet reached.`}
                </p>
              ) : (
                <Button onClick={() => requestPayout.mutate(partner.id)} disabled={requestPayout.isPending} className="gap-2">
                  {requestPayout.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Wallet className="h-4 w-4" />
                  {isFr ? 'Demander' : 'Request'} {formatCurrency(stats.payable, currency)}
                </Button>
              )}
            </CardContent>
          </Card>

          {payouts.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{isFr ? 'Historique des retraits' : 'Payout history'}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payouts.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(p.amount, p.currency)}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(p.requested_at).toLocaleDateString(dateLoc)}</p>
                      </div>
                      <Badge variant={p.status === 'paid' ? 'default' : p.status === 'failed' || p.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {p.status === 'paid' ? (isFr ? '✓ Versé' : '✓ Paid') : p.status === 'failed' ? (isFr ? '✗ Échoué' : '✗ Failed') : p.status === 'rejected' ? (isFr ? '✗ Rejeté' : '✗ Rejected') : '⏳ ' + p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function KPICard({ icon: Icon, label, value, sub, accent }: { icon: typeof Users; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <Card className={`border-border/40 transition-colors ${accent ? 'border-primary/30 bg-primary/[0.02]' : ''}`}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${accent ? 'bg-primary/10' : 'bg-muted/60'}`}>
            <Icon className={`h-3.5 w-3.5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <p className={`text-lg font-bold tracking-tight ${accent ? 'text-primary' : ''}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function CommissionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
    held: { label: 'Held', variant: 'secondary', icon: Clock },
    payable: { label: 'Available', variant: 'default', icon: TrendingUp },
    paid: { label: 'Paid', variant: 'outline', icon: CheckCircle },
    reversed: { label: 'Reversed', variant: 'destructive', icon: XCircle },
  };
  const s = map[status] || map.held;
  const Icon = s.icon;
  return (
    <Badge variant={s.variant} className="gap-1 text-[10px] font-normal">
      <Icon className="h-2.5 w-2.5" />{s.label}
    </Badge>
  );
}
