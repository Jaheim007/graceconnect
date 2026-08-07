import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert, Activity, Zap } from 'lucide-react';

export default function AiAbuseMonitor() {
  const { data: stats } = useQuery({
    queryKey: ['ai-abuse-stats'],
    queryFn: async () => {
      const [jobsRes, failedRes, orgsRes] = await Promise.all([
        db.from('ai_generation_jobs').select('id', { count: 'exact', head: true }),
        db.from('ai_generation_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
        db.from('ai_generation_jobs').select('organization_id').order('created_at', { ascending: false }).limit(500),
      ]);
      // Count jobs per org
      const orgCounts: Record<string, number> = {};
      (orgsRes.data || []).forEach((j: any) => { orgCounts[j.organization_id] = (orgCounts[j.organization_id] || 0) + 1; });
      const topOrgs = Object.entries(orgCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return {
        totalJobs: jobsRes.count || 0,
        failedJobs: failedRes.count || 0,
        topOrgs,
      };
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-primary" /> Abus & Monitoring IA</h1>
        <Zap className="h-4 w-4 text-primary shrink-0" />
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center">
          <Activity className="h-8 w-8 mx-auto text-primary/60 mb-2" />
          <p className="text-2xl font-bold">{stats?.totalJobs || 0}</p>
          <p className="text-xs text-muted-foreground">Total jobs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive/60 mb-2" />
          <p className="text-2xl font-bold">{stats?.failedJobs || 0}</p>
          <p className="text-xs text-muted-foreground">Échecs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <ShieldAlert className="h-8 w-8 mx-auto text-yellow-500/60 mb-2" />
          <p className="text-2xl font-bold">{stats?.topOrgs?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Orgs actives</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Top organisations par usage</CardTitle></CardHeader>
        <CardContent>
          {stats?.topOrgs?.length ? (
            <div className="space-y-2">
              {stats.topOrgs.map(([orgId, count]) => (
                <div key={orgId} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{orgId.slice(0, 12)}…</span>
                  <Badge variant={count > 50 ? 'destructive' : 'secondary'}>{count} jobs</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
