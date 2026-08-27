import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from '@/lib/router-compat';
import { Cpu, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function GlobalAiJobsMonitor() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const STATUS_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    queued: { label: isFr ? 'En attente' : 'Queued', icon: Clock, color: 'text-muted-foreground' },
    running: { label: isFr ? 'En cours' : 'Running', icon: Loader2, color: 'text-blue-500' },
    completed: { label: isFr ? 'Terminé' : 'Completed', icon: CheckCircle, color: 'text-emerald-500' },
    failed: { label: isFr ? 'Échoué' : 'Failed', icon: XCircle, color: 'text-destructive' },
    cancelled: { label: isFr ? 'Annulé' : 'Cancelled', icon: AlertTriangle, color: 'text-muted-foreground' },
  };

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['global-ai-jobs'],
    queryFn: async () => {
      const { data } = await db.from('ai_generation_jobs')
        .select('*, ai_content_projects!inner(title, organization_id)')
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    refetchInterval: 5000,
  });

  const active = jobs?.filter(j => j.status === 'running' || j.status === 'queued').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="h-6 w-6 text-primary" /> {isFr ? 'Monitor Jobs IA' : 'AI Jobs Monitor'}</h1>
        <p className="text-sm text-muted-foreground">{active} {isFr ? 'actif(s)' : 'active'} — {jobs?.length || 0} total</p>
      </div>
      {!jobs?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{isFr ? 'Aucun job' : 'No jobs'}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => {
            const s = STATUS_META[job.status] ?? { label: isFr ? 'En attente' : 'Queued', icon: Clock, color: 'text-muted-foreground' };
            const Icon = s.icon;
            return (
              <Card key={job.id}><CardContent className="py-3 space-y-1">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${s.color} ${job.status === 'running' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.job_type} — {job.ai_content_projects?.title}</p>
                    <p className="text-[10px] text-muted-foreground">Org: {job.organization_id?.slice(0, 8)}… | {new Date(job.created_at).toLocaleString(isFr ? 'fr' : 'en')}</p>
                  </div>
                  <Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">{s.label}</Badge>
                </div>
                {(job.status === 'running' || job.status === 'queued') && <Progress value={job.progress || 0} className="h-1" />}
                {job.error_message && <p className="text-xs text-destructive">{job.error_message}</p>}
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
