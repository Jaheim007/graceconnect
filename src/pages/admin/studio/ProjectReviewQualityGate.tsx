import { useParams, Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, Shield, Loader2, Sparkles
} from 'lucide-react';

export default function ProjectReviewQualityGate() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [checkingQuality, setCheckingQuality] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['studio-project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_content_projects')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await db.from('ai_content_projects').update({
        status: 'ready_to_publish',
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        requires_human_review: false,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Projet approuvé ✓', description: 'Le projet est prêt à être publié.' });
      queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!id || !rejectReason.trim()) return;
      const { error } = await db.from('ai_content_projects').update({
        status: 'draft',
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        review_notes: rejectReason.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Projet rejeté', description: 'Le projet est renvoyé en brouillon.' });
      setShowRejectForm(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
    },
  });

  const runQualityCheck = async () => {
    if (!id) return;
    setCheckingQuality(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-create-job', {
        body: { project_id: id, job_type: 'quality_check' },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Erreur', description: data.error, variant: 'destructive' });
        return;
      }
      // Trigger ai-run-job directly
      supabase.functions.invoke('ai-run-job', {
        body: { job_id: data.job_id },
      }).catch(err => console.error('ai-run-job error:', err));
      toast({ title: 'Analyse lancée', description: 'La vérification de qualité est en cours...' });
      // Poll for completion
      const checkInterval = setInterval(async () => {
        const { data: job } = await db.from('ai_generation_jobs')
          .select('status')
          .eq('id', data.job_id)
          .single();
        if (job?.status === 'completed' || job?.status === 'failed') {
          clearInterval(checkInterval);
          setCheckingQuality(false);
          queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
          if (job.status === 'completed') {
            toast({ title: 'Analyse terminée ✓' });
          }
        }
      }, 2000);
      // Safety timeout
      setTimeout(() => { clearInterval(checkInterval); setCheckingQuality(false); }, 60000);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
      setCheckingQuality(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><div className="h-8 w-64 bg-muted animate-pulse rounded" /></div>;
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Projet introuvable</p>
      </div>
    );
  }

  const score = project.quality_score;
  const flags = project.quality_flags || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/studio/projects/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Projet</Link>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Qualité & Revue
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runQualityCheck}
          disabled={checkingQuality}
        >
          {checkingQuality ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {score != null ? 'Relancer l\'analyse' : 'Analyser la qualité'}
        </Button>
      </div>

      {/* Score */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Score de qualité</CardTitle></CardHeader>
        <CardContent>
          {score != null ? (
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${
                score >= 8 ? 'text-emerald-500' : score >= 5 ? 'text-yellow-500' : 'text-destructive'
              }`}>
                {score}/10
              </div>
              <div>
                {score >= 8 && <p className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Excellent — Prêt pour publication</p>}
                {score >= 5 && score < 8 && <p className="text-sm text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Correct — Des améliorations sont possibles</p>}
                {score < 5 && <p className="text-sm text-destructive flex items-center gap-1"><XCircle className="h-4 w-4" /> Insuffisant — Révision recommandée</p>}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">
                Aucune vérification effectuée. Cliquez sur "Analyser la qualité" pour obtenir un score.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags */}
      {flags.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Points d'attention</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flags.map((flag: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review notes from previous rejection */}
      {project.review_notes && (
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-sm text-destructive">Notes de revue précédente</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{project.review_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Human review actions */}
      <Card className={project.status === 'review' ? 'border-yellow-300 dark:border-yellow-800' : ''}>
        <CardContent className="py-6">
          {project.status === 'review' || project.requires_human_review ? (
            <>
              <div className="text-center mb-4">
                <Shield className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="font-medium">Revue humaine requise</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ce projet nécessite votre approbation avant publication
                </p>
              </div>

              {!project.reviewed_at || project.status === 'review' ? (
                <>
                  {showRejectForm ? (
                    <div className="space-y-3 max-w-md mx-auto">
                      <Textarea
                        placeholder="Motif du rejet (obligatoire)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}>Annuler</Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectMutation.mutate()}
                          disabled={!rejectReason.trim() || rejectMutation.isPending}
                        >
                          {rejectMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          Confirmer le rejet
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" className="gap-1" onClick={() => setShowRejectForm(true)}>
                        <XCircle className="h-4 w-4" /> Rejeter
                      </Button>
                      <Button
                        className="gap-1"
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        <CheckCircle className="h-4 w-4" /> Approuver
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <Badge variant="default" className="mt-2">
                    Approuvé le {new Date(project.reviewed_at).toLocaleDateString('fr')}
                  </Badge>
                </div>
              )}
            </>
          ) : project.status === 'ready_to_publish' ? (
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <p className="font-medium text-emerald-600">Projet approuvé</p>
              <p className="text-sm text-muted-foreground mt-1">Ce projet est prêt à être publié</p>
              <Button className="mt-3" asChild>
                <Link to={`/admin/studio/projects/${id}/publish`}>Publier maintenant</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Lancez d'abord une analyse de qualité pour accéder à la revue
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
