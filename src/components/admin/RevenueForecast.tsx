import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { TrendingUp, Target, Zap, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function RevenueForecast() {
  const { currentOrg } = useOrg();
  const { fmt } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: metrics = [] } = useQuery({
    queryKey: ['revenue-forecast-data', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('org_daily_metrics')
        .select('metric_date, revenue, transactions_count')
        .eq('organization_id', currentOrg.id)
        .order('metric_date', { ascending: true })
        .limit(90);
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const forecast = useMemo(() => {
    if (metrics.length < 7) return null;
    const last30 = metrics.slice(-30);
    const last7 = metrics.slice(-7);
    const avg30 = last30.reduce((s, m: any) => s + (m.revenue || 0), 0) / last30.length;
    const avg7 = last7.reduce((s, m: any) => s + (m.revenue || 0), 0) / last7.length;
    const dailyRate = avg7 * 0.7 + avg30 * 0.3;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = daysInMonth - dayOfMonth;
    const currentMonthActual = metrics.filter((m: any) => new Date(m.metric_date).getMonth() === now.getMonth())
      .reduce((s, m: any) => s + (m.revenue || 0), 0);
    const projectedTotal = currentMonthActual + dailyRate * daysLeft;
    const trend = avg7 > avg30 ? 'up' : avg7 < avg30 * 0.8 ? 'down' : 'stable';
    const trendPercent = avg30 > 0 ? Math.round(((avg7 - avg30) / avg30) * 100) : 0;

    const dateLocale = isFr ? 'fr-FR' : 'en-US';
    const chartData = last30.map((m: any) => ({
      date: new Date(m.metric_date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' }),
      actual: m.revenue || 0,
      forecast: null as number | null,
    }));
    for (let i = 1; i <= Math.min(daysLeft, 14); i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      chartData.push({
        date: d.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' }),
        actual: null as any,
        forecast: Math.round(dailyRate * (0.9 + Math.random() * 0.2)),
      });
    }
    return { dailyRate: Math.round(dailyRate), projectedTotal: Math.round(projectedTotal), currentMonthActual: Math.round(currentMonthActual), daysLeft, trend, trendPercent, chartData };
  }, [metrics, isFr]);

  if (!forecast) return null;
  const currency = currentOrg?.currency;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">{isFr ? 'Prévision de revenus' : 'Revenue forecast'}</h2>
          <p className="text-[10px] text-muted-foreground">{isFr ? 'Basée sur les 30 derniers jours' : 'Based on the last 30 days'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
          <Target className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
          <p className="text-sm font-bold">{fmt(forecast.projectedTotal, currency)}</p>
          <p className="text-[9px] text-muted-foreground">{isFr ? 'Projection mois' : 'Monthly projection'}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
          <Zap className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
          <p className="text-sm font-bold">{fmt(forecast.dailyRate, currency)}</p>
          <p className="text-[9px] text-muted-foreground">{isFr ? 'Rythme / jour' : 'Daily rate'}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
          <Calendar className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold">{forecast.daysLeft}{isFr ? 'j' : 'd'}</p>
          <p className="text-[9px] text-muted-foreground">{isFr ? 'Restants' : 'Remaining'}</p>
        </div>
      </div>

      <div className={`flex items-center gap-2 p-2 rounded-lg mb-4 text-xs ${
        forecast.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
        forecast.trend === 'down' ? 'bg-red-500/10 text-red-400' :
        'bg-muted text-muted-foreground'
      }`}>
        <TrendingUp className="h-3.5 w-3.5" />
        <span>
          {isFr
            ? (forecast.trend === 'up' ? '📈 Tendance haussière' : forecast.trend === 'down' ? '📉 Tendance baissière' : '➡️ Tendance stable')
            : (forecast.trend === 'up' ? '📈 Upward trend' : forecast.trend === 'down' ? '📉 Downward trend' : '➡️ Stable trend')}
          {' '}({forecast.trendPercent > 0 ? '+' : ''}{forecast.trendPercent}% vs {isFr ? 'moyenne 30j' : '30d avg'})
        </span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecast.chartData}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={40} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }}
              labelStyle={{ color: 'hsl(var(--foreground))' }} />
            <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="url(#actualGrad)" strokeWidth={2} connectNulls={false} />
            <Area type="monotone" dataKey="forecast" stroke="#f59e0b" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 3" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">{isFr ? 'Réel' : 'Actual'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full bg-amber-400 opacity-60" style={{ borderTop: '2px dashed' }} />
          <span className="text-[10px] text-muted-foreground">{isFr ? 'Prévision' : 'Forecast'}</span>
        </div>
      </div>
    </motion.div>
  );
}
