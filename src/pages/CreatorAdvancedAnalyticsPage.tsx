import { ArrowLeft, TrendingDown, Users, AlertTriangle, Crown, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  useBuyerCohorts,
  useChurnMetrics,
  useTopCustomers,
  useRevenueBreakdown,
} from '@/hooks/useAdvancedAnalytics';

export default function CreatorAdvancedAnalyticsPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const { fmt } = useDisplayCurrency();
  const isFr = locale === 'fr';

  const { data: cohorts, isLoading: loadingCohorts } = useBuyerCohorts(currentOrg?.id);
  const { data: churn, isLoading: loadingChurn } = useChurnMetrics(currentOrg?.id);
  const { data: topCustomers, isLoading: loadingTop } = useTopCustomers(currentOrg?.id, 10);
  const { data: revenue, isLoading: loadingRevenue } = useRevenueBreakdown(currentOrg?.id, 90);

  if (!currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground" />
            <p>{isFr ? 'Sélectionnez une organisation pour voir les analyses.' : 'Select an organization to view analytics.'}</p>
            <Button onClick={() => navigate('/dashboard')}>{isFr ? 'Retour' : 'Back'}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fmtPct = (n: number) => `${Number(n).toFixed(1)}%`;
  const cohortPct = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Analytics avancé créateur' : 'Advanced creator analytics'}
        description={isFr ? 'Cohortes, churn et top clients de votre organisation.' : 'Cohorts, churn and top customers for your organization.'}
      />

      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isFr ? 'Analytics avancé' : 'Advanced analytics'}</h1>
            <p className="text-sm text-muted-foreground">{currentOrg.name}</p>
          </div>
        </div>

        {/* Churn KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<Users className="w-4 h-4" />}
            label={isFr ? 'Acheteurs totaux' : 'Total buyers'}
            value={loadingChurn ? '…' : String(churn?.total_buyers ?? 0)}
          />
          <KpiCard
            icon={<TrendingDown className="w-4 h-4 text-emerald-500" />}
            label={isFr ? 'Actifs (30 j)' : 'Active (30d)'}
            value={loadingChurn ? '…' : String(churn?.active_buyers ?? 0)}
          />
          <KpiCard
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            label={isFr ? 'À risque' : 'At risk'}
            value={loadingChurn ? '…' : String(churn?.at_risk_buyers ?? 0)}
          />
          <KpiCard
            icon={<TrendingDown className="w-4 h-4 text-rose-500" />}
            label={isFr ? 'Taux de churn' : 'Churn rate'}
            value={loadingChurn ? '…' : fmtPct(churn?.churn_rate ?? 0)}
          />
        </div>

        {/* Cohorts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isFr ? 'Cohortes mensuelles (rétention)' : 'Monthly cohorts (retention)'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCohorts ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : !cohorts || cohorts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isFr ? 'Pas encore de données.' : 'No data yet.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-2">{isFr ? 'Mois' : 'Month'}</th>
                      <th className="py-2 px-2">{isFr ? 'Acheteurs' : 'Buyers'}</th>
                      <th className="py-2 px-2">M+1</th>
                      <th className="py-2 px-2">M+2</th>
                      <th className="py-2 px-2">M+3</th>
                      <th className="py-2 px-2">M+6</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map(c => (
                      <tr key={c.cohort_month} className="border-b last:border-0">
                        <td className="py-2 pr-2 font-medium">
                          {new Date(c.cohort_month).toLocaleDateString(locale, { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2 px-2">{c.buyers_count}</td>
                        <CohortCell pct={cohortPct(c.m1_retained, c.buyers_count)} />
                        <CohortCell pct={cohortPct(c.m2_retained, c.buyers_count)} />
                        <CohortCell pct={cohortPct(c.m3_retained, c.buyers_count)} />
                        <CohortCell pct={cohortPct(c.m6_retained, c.buyers_count)} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              {isFr ? 'Top 10 clients (LTV)' : 'Top 10 customers (LTV)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTop ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !topCustomers || topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isFr ? 'Aucun client.' : 'No customers.'}</p>
            ) : (
              <ul className="divide-y">
                {topCustomers.map((c, idx) => (
                  <li key={c.user_id || idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.buyer_name || c.buyer_email || `Client #${idx + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.purchase_count} {isFr ? 'achats' : 'purchases'} · {isFr ? 'dernier' : 'last'} {new Date(c.last_purchase_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{fmt(Number(c.total_spent), currentOrg.currency || 'XOF')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Revenue breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isFr ? 'Revenus par produit (90 j)' : 'Revenue by product (90d)'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !revenue || revenue.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isFr ? 'Aucune vente sur la période.' : 'No sales in period.'}</p>
            ) : (
              <ul className="divide-y">
                {revenue.filter(r => r.revenue > 0).slice(0, 10).map(r => (
                  <li key={r.product_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.product_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.units_sold} {isFr ? 'ventes' : 'sales'} · {r.unique_buyers} {isFr ? 'acheteurs uniques' : 'unique buyers'}
                      </p>
                    </div>
                    <p className="font-semibold">{fmt(Number(r.revenue), currentOrg.currency || 'XOF')}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function CohortCell({ pct }: { pct: number }) {
  const intensity = Math.min(pct / 100, 1);
  return (
    <td className="py-2 px-2">
      <span
        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
        style={{
          backgroundColor: `hsl(var(--primary) / ${0.1 + intensity * 0.5})`,
          color: pct > 40 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
        }}
      >
        {pct}%
      </span>
    </td>
  );
}
