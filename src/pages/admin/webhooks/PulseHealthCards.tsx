import { Activity, CheckCircle, AlertTriangle, Webhook } from 'lucide-react';

interface PulseHealthCardsProps {
  totalSent: number;
  successRate: number;
  failedCount: number;
  activeEndpoints: number;
  isFr: boolean;
}

export function PulseHealthCards({ totalSent, successRate, failedCount, activeEndpoints, isFr }: PulseHealthCardsProps) {
  const cards = [
    {
      label: isFr ? 'Événements envoyés' : 'Events sent',
      value: totalSent.toLocaleString(),
      icon: Activity,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: isFr ? 'Taux de succès' : 'Success rate',
      value: totalSent > 0 ? `${successRate.toFixed(1)}%` : '—',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: isFr ? 'Échecs' : 'Failed',
      value: failedCount.toLocaleString(),
      icon: AlertTriangle,
      color: failedCount > 0 ? 'text-destructive' : 'text-muted-foreground',
      bg: failedCount > 0 ? 'bg-destructive/10' : 'bg-muted/50',
    },
    {
      label: isFr ? 'Endpoints actifs' : 'Active endpoints',
      value: activeEndpoints.toString(),
      icon: Webhook,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 transition-shadow hover:shadow-md"
        >
          <div className={`rounded-lg p-2.5 ${c.bg}`}>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-none tracking-tight">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
