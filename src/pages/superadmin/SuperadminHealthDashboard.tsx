import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertTriangle, XCircle, Activity, Database, Shield, Mail, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type SystemStatus = 'healthy' | 'warning' | 'critical';

interface SystemCheck {
  name: string;
  icon: React.ReactNode;
  status: SystemStatus;
  detail: string;
  value?: number;
}

export default function SuperadminHealthDashboard() {
  const { data: checks, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['superadmin-health'],
    queryFn: async (): Promise<SystemCheck[]> => {
      const results: SystemCheck[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 1. Database connectivity
      try {
        const start = performance.now();
        await db.from('organizations').select('id', { count: 'exact', head: true });
        const latency = Math.round(performance.now() - start);
        results.push({
          name: 'Base de données',
          icon: <Database className="h-4 w-4" />,
          status: latency < 500 ? 'healthy' : latency < 2000 ? 'warning' : 'critical',
          detail: `Latence: ${latency}ms`,
          value: latency,
        });
      } catch {
        results.push({ name: 'Base de données', icon: <Database className="h-4 w-4" />, status: 'critical', detail: 'Connexion échouée' });
      }

      // 2. Auth service
      try {
        const start = performance.now();
        await supabase.auth.getSession();
        const latency = Math.round(performance.now() - start);
        results.push({
          name: 'Authentification',
          icon: <Shield className="h-4 w-4" />,
          status: latency < 500 ? 'healthy' : 'warning',
          detail: `Latence: ${latency}ms`,
          value: latency,
        });
      } catch {
        results.push({ name: 'Authentification', icon: <Shield className="h-4 w-4" />, status: 'critical', detail: 'Service indisponible' });
      }

      // 3. Failed emails (24h)
      const { count: failedEmails } = await db
        .from('email_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', oneDayAgo.toISOString());
      results.push({
        name: 'Emails',
        icon: <Mail className="h-4 w-4" />,
        status: (failedEmails || 0) === 0 ? 'healthy' : (failedEmails || 0) < 10 ? 'warning' : 'critical',
        detail: `${failedEmails || 0} échec(s) en 24h`,
        value: failedEmails || 0,
      });

      // 4. Pending KYC > 7 days
      const { count: staleKyc } = await db
        .from('kyc_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('submitted_at', sevenDaysAgo.toISOString());
      results.push({
        name: 'KYC en retard',
        icon: <Shield className="h-4 w-4" />,
        status: (staleKyc || 0) === 0 ? 'healthy' : (staleKyc || 0) < 5 ? 'warning' : 'critical',
        detail: `${staleKyc || 0} soumission(s) > 7 jours`,
        value: staleKyc || 0,
      });

      // 5. Pending payouts
      const { count: pendingPayouts } = await db
        .from('payout_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      results.push({
        name: 'Retraits en attente',
        icon: <Activity className="h-4 w-4" />,
        status: (pendingPayouts || 0) < 5 ? 'healthy' : (pendingPayouts || 0) < 20 ? 'warning' : 'critical',
        detail: `${pendingPayouts || 0} demande(s)`,
        value: pendingPayouts || 0,
      });

      // 6. Content reports
      const { count: openReports } = await db
        .from('content_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      results.push({
        name: 'Signalements',
        icon: <AlertTriangle className="h-4 w-4" />,
        status: (openReports || 0) === 0 ? 'healthy' : (openReports || 0) < 10 ? 'warning' : 'critical',
        detail: `${openReports || 0} en attente`,
        value: openReports || 0,
      });

      // 7. Edge Functions (basic check)
      try {
        const start = performance.now();
        await supabase.functions.invoke('platform-health-check', { body: { ping: true } });
        const latency = Math.round(performance.now() - start);
        results.push({
          name: 'Edge Functions',
          icon: <Zap className="h-4 w-4" />,
          status: latency < 3000 ? 'healthy' : 'warning',
          detail: `Latence: ${latency}ms`,
          value: latency,
        });
      } catch {
        results.push({ name: 'Edge Functions', icon: <Zap className="h-4 w-4" />, status: 'warning', detail: 'Vérification échouée' });
      }

      return results;
    },
    staleTime: 60_000,
  });

  const statusIcon = (s: SystemStatus) => {
    switch (s) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const statusBadge = (s: SystemStatus) => {
    switch (s) {
      case 'healthy': return <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Opérationnel</Badge>;
      case 'warning': return <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">Attention</Badge>;
      case 'critical': return <Badge className="bg-destructive/10 text-destructive text-[10px]">Critique</Badge>;
    }
  };

  const overallStatus: SystemStatus = !checks ? 'healthy'
    : checks.some(c => c.status === 'critical') ? 'critical'
    : checks.some(c => c.status === 'warning') ? 'warning'
    : 'healthy';

  const healthScore = !checks ? 100 : Math.round(
    (checks.filter(c => c.status === 'healthy').length / checks.length) * 100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🏥 Platform Health</h1>
          <p className="text-sm text-muted-foreground">État en temps réel de tous les systèmes</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualiser
        </Button>
      </div>

      {/* Overall score */}
      <div className={`rounded-2xl border p-6 text-center space-y-2 ${
        overallStatus === 'healthy' ? 'border-emerald-500/30 bg-emerald-500/5' :
        overallStatus === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
        'border-destructive/30 bg-destructive/5'
      }`}>
        <p className="text-5xl font-black">{healthScore}</p>
        <p className="text-sm text-muted-foreground">Score de santé / 100</p>
        {statusBadge(overallStatus)}
      </div>

      {/* System checks */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {checks?.map((check, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {check.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{check.name}</p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {statusBadge(check.status)}
                {statusIcon(check.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
