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
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, Shield, Loader2, Sparkles,
  TrendingUp, TrendingDown, BookOpen, PenLine, Target, Wand2, Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ProjectReviewQualityGate() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [checkingQuality, setCheckingQuality] = useState(false);
  const [improvingSection, setImprovingSection] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { currentOrg } = useOrg();

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

  // Fetch latest quality score details
  const { data: qualityDetails } = useQuery({
    queryKey: ['studio-quality-details', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_quality_scores')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Fetch latest quality check job output for detailed recommendations
  const { data: qualityJobOutput } = useQuery({
    queryKey: ['studio-quality-job', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_generation_jobs')
        .select('output_data, result_summary')
        .eq('project_id', id)
        .eq('job_type', 'quality_check')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Fetch PDF asset for preview
  const { data: pdfAsset, refetch: refetchPdf } = useQuery({
    queryKey: ['studio-project-pdf', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_project_assets')
        .select('file_url')
        .eq('project_id', id)
        .eq('asset_type', 'pdf')
        .order('created_at', { ascending: false })
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const generateAndPreviewPdf = async () => {
    if (!id || !currentOrg?.id) return;
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-pdf', {
        body: { org_id: currentOrg.id, project_id: id, format: 'ebook', page_size: 'A4' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refetchPdf();
      setPreviewOpen(true);
      toast({ title: 'PDF généré ✓' });
    } catch (e: any) {
      toast({ title: 'Erreur PDF', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingPdf(false);
    }
  };

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
        setCheckingQuality(false);
        return;
      }
      supabase.functions.invoke('ai-run-job', {
        body: { job_id: data.job_id },
      }).catch(err => console.error('ai-run-job error:', err));
      toast({ title: 'Analyse lancée', description: 'La vérification de qualité est en cours...' });
      const checkInterval = setInterval(async () => {
        const { data: job } = await db.from('ai_generation_jobs')
          .select('status')
          .eq('id', data.job_id)
          .single();
        if (job?.status === 'completed' || job?.status === 'failed') {
          clearInterval(checkInterval);
          setCheckingQuality(false);
          queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
          queryClient.invalidateQueries({ queryKey: ['studio-quality-details', id] });
          queryClient.invalidateQueries({ queryKey: ['studio-quality-job', id] });
          if (job.status === 'completed') {
            toast({ title: 'Analyse terminée ✓' });
          }
        }
      }, 2000);
      setTimeout(() => { clearInterval(checkInterval); setCheckingQuality(false); }, 120000);
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

  // Extract detailed AI feedback from the job output
  const aiOutput = qualityJobOutput?.output_data as any;
  const aiSummary = aiOutput?.summary || aiOutput?.result_summary?.summary || '';
  const aiRecommendations: string[] = aiOutput?.recommendations || aiOutput?.improvements || [];
  const aiStrengths: string[] = aiOutput?.strengths || [];
  const aiWeaknesses: string[] = aiOutput?.weaknesses || [];
  const aiDetailedScores: Record<string, number> = aiOutput?.detailed_scores || aiOutput?.scores || {};
  const aiChapterIssues: Array<{ chapter: string; issues: string[]; score?: number }> =
    aiOutput?.chapter_issues || aiOutput?.section_issues || [];


  const improveSection = async (sectionName: string) => {
    if (!id) return;
    setImprovingSection(sectionName);
    try {
      // Find the chapter in structure_json to get its ID and current content
      const chapters = (project?.structure_json as any)?.chapters || [];
      const isAll = sectionName === '__all__';
      const chapter = !isAll ? chapters.find((c: any) =>
        c.title === sectionName || c.title?.includes(sectionName)
      ) : null;

      const chapterId = chapter?.id || sectionName;
      const currentContent = chapter?.content || '';

      // Find chapter issues for this section to pass as context
      const sectionIssues = aiChapterIssues.find(s => s.chapter === sectionName);
      const issuesList = sectionIssues?.issues?.join('; ') || '';

      const { data, error } = await supabase.functions.invoke('ai-create-job', {
        body: {
          project_id: id,
          job_type: 'generate_chapter',
          params: {
            chapter_id: chapterId,
            chapter_title: sectionName,
            mode: 'improve',
            current_content: currentContent.slice(0, 4000),
            issues: issuesList,
            improve_all: isAll,
          },
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Erreur', description: data.error, variant: 'destructive' });
        setImprovingSection(null);
        return;
      }
      supabase.functions.invoke('ai-run-job', {
        body: { job_id: data.job_id },
      }).catch(err => console.error('ai-run-job error:', err));
      toast({ title: 'Amélioration lancée', description: isAll ? 'Amélioration globale en cours...' : `Amélioration de "${sectionName}" en cours...` });

      const checkInterval = setInterval(async () => {
        const { data: job } = await db.from('ai_generation_jobs')
          .select('status')
          .eq('id', data.job_id)
          .single();
        if (job?.status === 'completed' || job?.status === 'failed') {
          clearInterval(checkInterval);
          setImprovingSection(null);
          queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
          if (job.status === 'completed') {
            toast({ title: 'Contenu amélioré ✓', description: isAll ? 'Relance de l\'analyse...' : `"${sectionName}" amélioré. Relance de l'analyse...` });
            // Auto re-run quality analysis after improvement
            runQualityCheck();
          } else {
            toast({ title: 'Erreur', description: 'L\'amélioration a échoué.', variant: 'destructive' });
          }
        }
      }, 2000);
      setTimeout(() => { clearInterval(checkInterval); setImprovingSection(null); }, 120000);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
      setImprovingSection(null);
    }
  };

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

      {/* Detailed scores */}
      {Object.keys(aiDetailedScores).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Scores détaillés</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(aiDetailedScores).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-xs capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                  <span className={`text-sm font-bold ${
                    (val as number) >= 8 ? 'text-emerald-500' : (val as number) >= 5 ? 'text-yellow-500' : 'text-destructive'
                  }`}>{val as number}/10</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Résumé de l'analyse</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {aiStrengths.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800/30">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2 text-emerald-600"><TrendingUp className="h-4 w-4" /> Points forts</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses / Improvements */}
      {(aiWeaknesses.length > 0 || aiRecommendations.length > 0) && (
        <Card className="border-yellow-200 dark:border-yellow-800/30">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2 text-yellow-600"><TrendingDown className="h-4 w-4" /> Points à améliorer</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiWeaknesses.map((w, i) => (
                <li key={`w-${i}`} className="flex items-start gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
              {aiRecommendations.map((r, i) => (
                <li key={`r-${i}`} className="flex items-start gap-2 text-sm">
                  <PenLine className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Chapter-level issues with improve button */}
      {aiChapterIssues.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <Target className="h-4 w-4" /> Sections à améliorer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiChapterIssues.map((section, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{section.chapter}</span>
                    {section.score != null && (
                      <Badge variant={section.score >= 7 ? 'default' : 'destructive'} className="text-[10px]">
                        {section.score}/10
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    disabled={improvingSection === section.chapter}
                    onClick={() => improveSection(section.chapter)}
                  >
                    {improvingSection === section.chapter ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    Améliorer maintenant
                  </Button>
                </div>
                <ul className="space-y-1">
                  {section.issues.map((issue, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <XCircle className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Global improve all button when weaknesses exist but no chapter detail */}
      {aiChapterIssues.length === 0 && (aiWeaknesses.length > 0 || aiRecommendations.length > 0) && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="gap-2"
            disabled={improvingSection === '__all__'}
            onClick={() => improveSection('__all__')}
          >
            {improvingSection === '__all__' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Améliorer tout le contenu
          </Button>
        </div>
      )}


      {flags.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Alertes</CardTitle></CardHeader>
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
