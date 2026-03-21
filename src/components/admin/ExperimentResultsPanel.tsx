import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Eye, MousePointerClick, ShoppingCart, Trophy, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  experimentId: string;
  experimentName: string;
  variants: Record<string, any>;
}

interface VariantMetrics {
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

export function ExperimentResultsPanel({ experimentId, experimentName, variants }: Props) {
  const variantKeys = Object.keys(variants || {});
  const vA = variantKeys[0] || 'a';
  const vB = variantKeys[1] || 'b';
  const labelA = variants?.[vA]?.label || variants?.[vA]?.content || 'Version A';
  const labelB = variants?.[vB]?.label || variants?.[vB]?.content || 'Version B';

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['experiment-results', experimentName],
    queryFn: async () => {
      // Fetch all events for this experiment
      const { data: events } = await db
        .from('client_events')
        .select('event_name, event_data')
        .in('event_name', ['experiment_exposure', 'experiment_click', 'experiment_conversion'])
        .order('created_at', { ascending: false })
        .limit(5000);

      const filtered = (events || []).filter(
        (e: any) => e.event_data?.experimentId === experimentName
      );

      const calcMetrics = (variant: string): VariantMetrics => {
        const views = filtered.filter(
          (e: any) => e.event_name === 'experiment_exposure' && e.event_data?.variant === variant
        ).length;
        const clicks = filtered.filter(
          (e: any) => e.event_name === 'experiment_click' && e.event_data?.variant === variant
        ).length;
        const conversions = filtered.filter(
          (e: any) => e.event_name === 'experiment_conversion' && e.event_data?.variant === variant
        ).length;
        return {
          views,
          clicks,
          conversions,
          conversionRate: views > 0 ? (conversions / views) * 100 : 0,
        };
      };

      return { a: calcMetrics(vA), b: calcMetrics(vB) };
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {[0, 1].map(i => (
          <div key={i} className="h-40 rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  const a = metrics?.a || { views: 0, clicks: 0, conversions: 0, conversionRate: 0 };
  const b = metrics?.b || { views: 0, clicks: 0, conversions: 0, conversionRate: 0 };
  const totalViews = a.views + b.views;

  // Determine winner
  const uplift = a.conversionRate > 0
    ? ((b.conversionRate - a.conversionRate) / a.conversionRate) * 100
    : b.conversionRate > 0 ? 100 : 0;
  const hasEnoughData = totalViews >= 20;
  const winner = hasEnoughData
    ? (b.conversionRate > a.conversionRate ? 'b' : a.conversionRate > b.conversionRate ? 'a' : null)
    : null;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">
          <strong className="text-foreground">{totalViews.toLocaleString()}</strong> total visitors
        </span>
        {hasEnoughData && winner && (
          <Badge className={cn(
            'ml-auto text-xs gap-1',
            winner === 'b' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'
          )} variant="outline">
            <Trophy className="h-3 w-3" />
            {winner === 'a' ? labelA : labelB} wins
            {Math.abs(uplift) > 0 && ` (+${Math.abs(uplift).toFixed(0)}%)`}
          </Badge>
        )}
        {!hasEnoughData && totalViews > 0 && (
          <Badge variant="outline" className="ml-auto text-xs text-muted-foreground">
            Need more data
          </Badge>
        )}
      </div>

      {/* Variant cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <VariantCard
          label={labelA}
          tag="A"
          metrics={a}
          isWinner={winner === 'a'}
          color="primary"
        />
        <VariantCard
          label={labelB}
          tag="B"
          metrics={b}
          isWinner={winner === 'b'}
          color="emerald"
          uplift={hasEnoughData ? uplift : undefined}
        />
      </div>
    </div>
  );
}

function VariantCard({
  label,
  tag,
  metrics,
  isWinner,
  color,
  uplift,
}: {
  label: string;
  tag: string;
  metrics: VariantMetrics;
  isWinner: boolean;
  color: 'primary' | 'emerald';
  uplift?: number;
}) {
  const borderColor = isWinner
    ? color === 'emerald' ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-primary/40 ring-1 ring-primary/20'
    : 'border-border';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border p-4 bg-card relative', borderColor)}
    >
      {isWinner && (
        <div className="absolute -top-2.5 right-3">
          <Badge className="text-[10px] bg-emerald-500 text-white gap-0.5 shadow-sm">
            <Trophy className="h-2.5 w-2.5" /> Winner
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-bold',
          tag === 'A' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'
        )}>
          {tag}
        </span>
        <span className="text-sm font-medium truncate">{label}</span>
      </div>

      <div className="space-y-2.5">
        <MetricRow icon={Eye} label="Views" value={metrics.views} />
        <MetricRow icon={MousePointerClick} label="Clicks" value={metrics.clicks} />
        <MetricRow icon={ShoppingCart} label="Conversions" value={metrics.conversions} />

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Conversion Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold">{metrics.conversionRate.toFixed(1)}%</span>
              {uplift !== undefined && uplift !== 0 && (
                <span className={cn(
                  'text-[10px] font-medium flex items-center gap-0.5',
                  uplift > 0 ? 'text-emerald-600' : 'text-destructive'
                )}>
                  {uplift > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {uplift > 0 ? '+' : ''}{uplift.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <Progress
            value={Math.min(metrics.conversionRate, 100)}
            className="h-1.5 mt-1.5"
          />
        </div>
      </div>
    </motion.div>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <span className="text-sm font-semibold">{value.toLocaleString()}</span>
    </div>
  );
}
