import { useEffect } from 'react';
import { Link, Navigate } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, HandHeart, Loader2, Wallet, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';

const GIVING_LABEL: Record<string, { fr: string; en: string }> = {
  tithe: { fr: 'Dîme', en: 'Tithe' },
  offering: { fr: 'Offrande', en: 'Offering' },
  donation: { fr: 'Don', en: 'Donation' },
  campaign: { fr: 'Campagne', en: 'Campaign' },
};

export default function ChurchProGiving() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  useEffect(() => { document.title = fr ? 'Dîmes & offrandes — SiteViral Church' : 'Tithes & offerings — SiteViral Church'; }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-give', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id, slug, name, payout_verified, currency').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-donations', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_donations')
        .select('id, amount, currency, giving_type, donor_name, donor_email, is_anonymous, status, message, created_at, completed_at')
        .eq('church_id', church!.id)
        .order('created_at', { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  if (loading) return <Spin />;
  if (!user) return <Navigate to="/auth?returnTo=/church/pro/giving" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  const completed = rows.filter((r) => r.status === 'completed');
  const totals = completed.reduce<Record<string, number>>((acc, r) => {
    acc[r.currency] = (acc[r.currency] || 0) + Number(r.amount);
    return acc;
  }, {});
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = completed.filter((r) => new Date(r.completed_at || r.created_at) >= monthStart);
  const monthTotals = thisMonth.reduce<Record<string, number>>((acc, r) => {
    acc[r.currency] = (acc[r.currency] || 0) + Number(r.amount);
    return acc;
  }, {});
  const uniqueDonors = new Set(completed.map((r) => r.donor_email || `anon-${r.id}`)).size;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church</p>
              <h1 className="text-xl font-bold flex items-center gap-2"><HandHeart className="h-5 w-5 text-primary" /> {fr ? 'Dîmes & offrandes' : 'Tithes & offerings'}</h1>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/church/${church.slug}/give`} target="_blank" rel="noopener">{fr ? 'Voir la page de don' : 'View give page'}</Link>
          </Button>
        </div>

        {/* Balance / payout banner */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{fr ? 'Solde disponible' : 'Available balance'}</p>
                <p className="text-2xl font-bold">
                  {Object.keys(totals).length === 0
                    ? `0 ${church.currency || 'XOF'}`
                    : Object.entries(totals).map(([c, v]) => `${v.toLocaleString()} ${c}`).join(' · ')}
                </p>
              </div>
            </div>
            <Button disabled={!church.payout_verified} size="sm" variant={church.payout_verified ? 'default' : 'outline'}>
              {fr ? 'Retirer' : 'Withdraw'}
            </Button>
          </div>
          {!church.payout_verified && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-amber-900 dark:text-amber-100">
                <p className="font-semibold">{fr ? 'Vérification de paiement à compléter' : 'Complete payout verification'}</p>
                <p>{fr ? 'Complétez la vérification de paiement pour retirer vos fonds.' : 'Complete payout verification to withdraw your funds.'}</p>
              </div>
              <Button asChild size="sm" variant="outline"><Link to="/admin/church/kyc">{fr ? 'Vérifier' : 'Verify'}</Link></Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={TrendingUp} label={fr ? 'Ce mois' : 'This month'} value={Object.keys(monthTotals).length ? Object.entries(monthTotals).map(([c, v]) => `${v.toLocaleString()} ${c}`).join(' · ') : '—'} />
          <StatCard icon={HandHeart} label={fr ? 'Dons complétés' : 'Completed gifts'} value={String(completed.length)} />
          <StatCard icon={Users} label={fr ? 'Donateurs uniques' : 'Unique givers'} value={String(uniqueDonors)} />
        </div>

        {/* Table */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{fr ? 'Transactions récentes' : 'Recent transactions'}</h2>
          {isLoading ? <Spin /> : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {fr ? 'Aucun don pour le moment. Partagez votre page de don pour commencer à recevoir.' : 'No gifts yet. Share your give page to start receiving.'}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 text-[10px] uppercase text-muted-foreground px-4 py-2 border-b border-border">
                <div>{fr ? 'Donateur' : 'Giver'}</div>
                <div>{fr ? 'Type' : 'Type'}</div>
                <div>{fr ? 'Montant' : 'Amount'}</div>
                <div>{fr ? 'Statut' : 'Status'}</div>
                <div>{fr ? 'Date' : 'Date'}</div>
              </div>
              {rows.map((r) => (
                <div key={r.id} className="grid grid-cols-2 md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-border last:border-b-0 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.is_anonymous ? (fr ? 'Anonyme' : 'Anonymous') : (r.donor_name || r.donor_email || '—')}</p>
                    {!r.is_anonymous && r.donor_email && <p className="text-[10px] text-muted-foreground truncate">{r.donor_email}</p>}
                    {r.message && <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate">"{r.message}"</p>}
                  </div>
                  <span className="text-[10px] rounded-full bg-muted text-muted-foreground px-2 py-0.5 justify-self-end md:justify-self-auto">
                    {(GIVING_LABEL[r.giving_type] || { fr: r.giving_type, en: r.giving_type })[fr ? 'fr' : 'en']}
                  </span>
                  <span className="font-semibold text-right md:text-left">{Number(r.amount).toLocaleString()} {r.currency}</span>
                  <StatusBadge status={r.status} fr={fr} />
                  <span className="text-[10px] text-muted-foreground text-right">{new Date(r.created_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spin() {
  return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-4 w-4 text-muted-foreground mb-2" />
      <p className="text-lg font-bold truncate">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusBadge({ status, fr }: { status: string; fr: boolean }) {
  const map: Record<string, { cls: string; label: string }> = {
    completed: { cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', label: fr ? 'Reçu' : 'Received' },
    pending: { cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', label: fr ? 'En attente' : 'Pending' },
    failed: { cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300', label: fr ? 'Échoué' : 'Failed' },
    refunded: { cls: 'bg-muted text-muted-foreground', label: fr ? 'Remboursé' : 'Refunded' },
  };
  const m = map[status] || map.pending;
  return <span className={`text-[10px] rounded-full px-2 py-0.5 ${m.cls}`}>{m.label}</span>;
}
