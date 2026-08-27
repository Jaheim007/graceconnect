import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@/lib/router-compat';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/contexts/OrgContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Alert {
  id: string;
  alert_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function ProactiveAlertsWidget() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();

  const { data: alerts } = useQuery({
    queryKey: ['proactive-alerts', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('proactive_alerts_log')
        .select('id, alert_type, metadata, created_at')
        .eq('organization_id', currentOrg.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) return [];
      return (data || []) as Alert[];
    },
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-semibold">Alertes intelligentes</span>
        </div>
        <ul className="space-y-2">
          {alerts.map(a => (
            <li key={a.id} className="text-xs text-muted-foreground">
              {a.alert_type === 'churn_high' && (
                <>Taux de churn : <strong>{a.metadata?.churn_rate}%</strong> — campagne de réactivation recommandée.</>
              )}
              {a.alert_type === 'at_risk_buyers' && (
                <><strong>{a.metadata?.at_risk_count}</strong> clients à risque — envoie une offre exclusive.</>
              )}
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1 border-amber-500/30"
          onClick={() => navigate('/creator/analytics')}
        >
          Voir les détails <ArrowRight className="w-3 h-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
