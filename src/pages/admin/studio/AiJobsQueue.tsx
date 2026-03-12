import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Cpu, Clock, CheckCircle, XCircle, Loader2, AlertTriangle,
  RotateCcw, Trash2, ExternalLink
} from 'lucide-react';

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
  const { toast } = useToast();
  const { locale } = useI18n();
  const queryClient = useQueryClient();

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
    refetchInterval: 5000,
  });

  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await db.from('ai_generation_jobs').update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: 'Annulé par l\'utilisateur',
      }).eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Tâche annulée' });
      queryClient.invalidateQueries({ queryKey: ['studio-jobs', orgId] });
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await db.from('ai_generation_jobs').delete().eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Tâche supprimée' });
      queryClient.invalidateQueries({ queryKey: ['studio-jobs', orgId] });
    },
  });

  const activeCount = jobs?.filter(j => j.status === 'running' || j.status === 'queued').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" /> Tâches IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount > 0
              ? `${activeCount} tâche${activeCount > 1 ? 's' : ''} en cours`
              : 'Suivi des générations en cours et passées'}
          </p>
        </div>
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
              Lancez une génération depuis l'éditeur de projet pour voir les tâches ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => {
            const statusM = JOB_STATUS_META[job.status] || JOB_STATUS_META.queued;
            const StatusIcon = statusM.icon;
            const isActive = job.status === 'running' || job.status === 'queued';
            return (
              <Card key={job.id}>
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${statusM.color} shrink-0 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                      </p>
                      <Link
                        to={`/admin/studio/projects/${job.project_id}`}
                        className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                      >
                        {job.ai_content_projects?.title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                      {statusM.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(job.created_at).toLocaleTimeString(locale === 'fr' ? 'fr' : 'en', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => cancelJob.mutate(job.id)}
                          title={locale === 'fr' ? 'Annuler' : 'Cancel'}
                        >
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                      {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => deleteJob.mutate(job.id)}
                          title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {isActive && (
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
