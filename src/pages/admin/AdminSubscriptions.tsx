import { useEffect, useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, Users, Clock, AlertTriangle, Zap, Crown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Metrics {
  active_monthly: number;
  active_yearly: number;
  trialing: number;
  past_due: number;
  canceled: number;
  grandfather_active: number;
  pro_total: number;
  org_total: number;
  mrr_xof: number;
  arr_xof: number;
  founders_used: number;
  founders_remaining: number;
}

const fmtXof = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XOF';
const fmtUsd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n / 600);

export default function AdminSubscriptions() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_platform_billing_metrics');
    if (!error && data && data[0]) setM(data[0] as Metrics);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const t = {
    title: isFr ? 'Abonnements & Revenus' : 'Subscriptions & Revenue',
    subtitle: isFr ? 'MRR, ARR, essais, conversions et offre founder' : 'MRR, ARR, trials, conversions & founder offer',
    refresh: isFr ? 'Actualiser' : 'Refresh',
    mrr: 'MRR',
    arr: 'ARR',
    trials: isFr ? 'Essais en cours' : 'Active trials',
    pastDue: isFr ? 'Retards de paiement' : 'Past due',
    pro: isFr ? 'Abonnés Pro' : 'Pro subscribers',
    org: isFr ? 'Abonnés Org' : 'Org subscribers',
    grand: isFr ? 'Période de grâce active' : 'Active grandfather',
    founder: isFr ? 'Slots Founder' : 'Founder slots',
    canceled: isFr ? 'Annulations totales' : 'Total cancellations',
    monthly: isFr ? 'mensuel' : 'monthly',
    yearly: isFr ? 'annuel' : 'yearly',
  };

  return (
    <AdminPageShell
      title={t.title}
      subtitle={t.subtitle}
      backRoute="/admin"
      actions={
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t.refresh}
        </Button>
      }
    >
      {loading && !m ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : m ? (
        <div className="space-y-6">
          {/* Hero KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t.mrr}</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold">{fmtXof(Number(m.mrr_xof))}</div>
              <div className="text-sm text-muted-foreground mt-1">≈ {fmtUsd(Number(m.mrr_xof))}/mo</div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t.arr}</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold">{fmtXof(Number(m.arr_xof))}</div>
              <div className="text-sm text-muted-foreground mt-1">≈ {fmtUsd(Number(m.arr_xof))}/yr</div>
            </Card>
          </div>

          {/* Subscriber breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{t.pro}</span>
              </div>
              <div className="text-2xl font-bold">{m.pro_total}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">{t.org}</span>
              </div>
              <div className="text-2xl font-bold">{m.org_total}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">{t.trials}</span>
              </div>
              <div className="text-2xl font-bold">{m.trialing}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                
                <span className="text-xs text-muted-foreground">{t.grand}</span>
              </div>
              <div className="text-2xl font-bold">{m.grandfather_active}</div>
            </Card>
          </div>

          {/* Health */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{t.monthly}</div>
              <div className="text-xl font-semibold">{m.active_monthly}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{t.yearly}</div>
              <div className="text-xl font-semibold">{m.active_yearly}</div>
            </Card>
            <Card className="p-4 border-orange-500/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs text-muted-foreground">{t.pastDue}</span>
              </div>
              <div className="text-xl font-semibold text-orange-600">{m.past_due}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{t.canceled}</div>
              <div className="text-xl font-semibold text-muted-foreground">{m.canceled}</div>
            </Card>
          </div>

          {/* Founder slots */}
          <Card className="p-6 bg-gradient-to-br from-amber-500/10 via-background to-background border-amber-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">{t.founder}</h3>
              </div>
              <Badge variant="secondary">{m.founders_used} / 50</Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{ width: `${Math.min(100, (m.founders_used / 50) * 100)}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {isFr
                ? `${m.founders_remaining} slots restants — chacun = 49 000 XOF (à vie)`
                : `${m.founders_remaining} slots remaining — each = 49,000 XOF (lifetime)`}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          {isFr ? 'Aucune donnée disponible' : 'No data available'}
        </Card>
      )}
    </AdminPageShell>
  );
}
