import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Cpu, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const JOB_STATUS_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  queued: { label: 'En attente', icon: Clock, color: 'text-muted-foreground' },
  running: { label: 'En cours', icon: Loader2, color: 'text-blue-500' },
  completed: { label: 'Terminé', icon: CheckCircle, color: 'text-emerald-500' },
  failed: { label: 'Échoué', icon: XCircle, color: 'text-destructive' },
  cancelled: { label: 'Annulé', icon: AlertTriangle, color: 'text-muted-foreground' },
};

const JOB_TYPE_LABELS: Record<string, string> = {
  generate_outline: 'Générer plan',
  generate_chapter: 'Générer chapitre',
  generate_cover: 'Générer couverture',
  generate_page_images: 'Générer images',
  generate_audio: 'Générer audio',
  generate_pdf: 'Créer PDF',
  generate_description: 'Générer description',
  generate_full: 'Génération complète',
  quality_check: 'Vérification qualité',
};

export default function AiJobsQueue() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['studio-jobs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('ai_generation_jobs')
        .select('*, ai_content_projects!inner(title)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!orgId,
    refetchInterval: 5000, // Poll for active jobs
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" /> Tâches IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi des générations en cours et passées
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="py-4"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : !jobs?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Cpu className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucune tâche IA</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les tâches de génération apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => {
            const statusM = JOB_STATUS_META[job.status] || JOB_STATUS_META.queued;
            const StatusIcon = statusM.icon;
            return (
              <Card key={job.id}>
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${statusM.color} shrink-0 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(job as any).ai_content_projects?.title}
                      </p>
                    </div>
                    <Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                      {statusM.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(job.created_at).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {(job.status === 'running' || job.status === 'queued') && (
                    <Progress value={job.progress || 0} className="h-1.5" />
                  )}
                  {job.status === 'failed' && job.error_message && (
                    <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{job.error_message}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
