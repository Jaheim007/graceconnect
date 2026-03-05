import { useParams, Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, FileText,
  Sparkles, Loader2, ChevronLeft, ChevronRight, ListTree,
  FileCheck, BookOpen, Eye, ImagePlus, Upload, Star, StarOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [generatingJob, setGeneratingJob] = useState<string | null>(null);
  const [hasActiveJobs, setHasActiveJobs] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fetch PDF asset
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

  // Fetch project
  const { data: project, isLoading } = useQuery({
    queryKey: ['studio-project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db.from('ai_content_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Poll active jobs for this project
  const { data: activeJobs } = useQuery({
    queryKey: ['studio-editor-jobs', id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await db.from('ai_generation_jobs')
        .select('id, job_type, status, progress, error_message, output_data, input_params')
        .eq('project_id', id)
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id,
    refetchInterval: generatingJob || hasActiveJobs ? 2000 : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    setHasActiveJobs((activeJobs?.length || 0) > 0);
  }, [activeJobs]);

  // Restore running state after refresh/navigation
  useEffect(() => {
    if (!generatingJob && activeJobs?.length) {
      setGeneratingJob(activeJobs[0].id);
    }
  }, [activeJobs, generatingJob]);

  // When a job completes, refresh project and clear generating state
  useEffect(() => {
    if (!generatingJob) return;
    const isStillRunning = activeJobs?.some(j => j.id === generatingJob);
    if (!isStillRunning && activeJobs !== undefined) {
      setGeneratingJob(null);
      queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
      toast({ title: 'Génération terminée ✓' });
    }
  }, [activeJobs, generatingJob, id, queryClient, toast]);

  // Progressive sync of partial generation content + live project refresh
  useEffect(() => {
    if (!activeJobs?.length) return;

    queryClient.invalidateQueries({ queryKey: ['studio-project', id] });

    const chapterJob = activeJobs.find((job: any) =>
      job.job_type === 'generate_chapter' &&
      typeof job?.output_data?.html === 'string' &&
      job?.input_params?.chapter_id
    );

    if (chapterJob) {
      const chapterId = chapterJob.input_params.chapter_id as string;
      const partialHtml = chapterJob.output_data.html as string;
      setChapters(prev => prev.map(ch =>
        ch.id === chapterId && ch.content !== partialHtml
          ? { ...ch, content: partialHtml }
          : ch
      ));
    }

    const outlineJob = activeJobs.find((job: any) =>
      job.job_type === 'generate_outline' &&
      Array.isArray(job?.output_data?.structure?.chapters) &&
      job.output_data.structure.chapters.length > 0
    );

    if (outlineJob) {
      const streamedChapters = outlineJob.output_data.structure.chapters.map((ch: any, i: number) => ({
        ...ch,
        order: ch.order ?? i,
        content: ch.content || '',
      })) as Chapter[];

      setChapters(prev => {
        if (
          prev.length === streamedChapters.length &&
          prev.every((ch, i) =>
            ch.id === streamedChapters[i]?.id &&
            ch.title === streamedChapters[i]?.title &&
            ch.content === streamedChapters[i]?.content
          )
        ) {
          return prev;
        }
        return streamedChapters;
      });

      if (!activeChapterId && streamedChapters[0]?.id) {
        setActiveChapterId(streamedChapters[0].id);
      }
    }
  }, [activeJobs, activeChapterId, id, queryClient]);

  // Initialize chapters from structure_json
  useEffect(() => {
    if (project?.structure_json) {
      const stored = project.structure_json as { chapters?: Chapter[] };
      if (stored.chapters?.length) {
        setChapters(stored.chapters);
        if (!activeChapterId) setActiveChapterId(stored.chapters[0].id);
        return;
      }
    }
    if (chapters.length === 0) {
      const defaultCh: Chapter = {
        id: crypto.randomUUID(),
        title: 'Chapitre 1',
        content: '',
        order: 0,
      };
      setChapters([defaultCh]);
      setActiveChapterId(defaultCh.id);
    }
  }, [project]);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || null;

  const updateChapter = useCallback((chId: string, patch: Partial<Chapter>) => {
    setChapters(prev => prev.map(c => c.id === chId ? { ...c, ...patch } : c));
    setDirty(true);
  }, []);

  const addChapter = useCallback(() => {
    const newCh: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapitre ${chapters.length + 1}`,
      content: '',
      order: chapters.length,
    };
    setChapters(prev => [...prev, newCh]);
    setActiveChapterId(newCh.id);
    setDirty(true);
  }, [chapters.length]);

  const removeChapter = useCallback((chId: string) => {
    if (chapters.length <= 1) {
      toast({ title: 'Impossible', description: 'Vous devez garder au moins un chapitre.' });
      return;
    }
    setChapters(prev => {
      const next = prev.filter(c => c.id !== chId).map((c, i) => ({ ...c, order: i }));
      if (activeChapterId === chId) setActiveChapterId(next[0]?.id || null);
      return next;
    });
    setDirty(true);
  }, [chapters.length, activeChapterId, toast]);

  const moveChapter = useCallback((chId: string, direction: -1 | 1) => {
    setChapters(prev => {
      const idx = prev.findIndex(c => c.id === chId);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy.map((c, i) => ({ ...c, order: i }));
    });
    setDirty(true);
  }, []);

  // Save to DB
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await db.from('ai_content_projects')
        .update({ structure_json: { chapters }, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDirty(false);
      toast({ title: 'Sauvegardé ✓' });
      queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate(undefined, { onSettled: () => setSaving(false) });
  };

  // Auto-save
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => saveMutation.mutate(), 5_000);
    return () => clearTimeout(timer);
  }, [dirty, chapters]);

  // AI actions
  const triggerJob = useCallback(async (jobType: string, extraParams: Record<string, any> = {}) => {
    if (!id) return;
    // Save first if dirty
    if (dirty) {
      await db.from('ai_content_projects')
        .update({ structure_json: { chapters }, updated_at: new Date().toISOString() })
        .eq('id', id);
      setDirty(false);
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-create-job', {
        body: { project_id: id, job_type: jobType, input_params: extraParams },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Erreur', description: data.error, variant: 'destructive' });
        return;
      }
      const jobId = data.job_id;
      setGeneratingJob(jobId);
      setHasActiveJobs(true);
      toast({ title: 'Génération lancée', description: 'Le contenu est en cours de création...' });
      queryClient.invalidateQueries({ queryKey: ['studio-editor-jobs', id] });

      // Trigger ai-run-job directly from client (fire-and-forget but reliable)
      supabase.functions.invoke('ai-run-job', {
        body: { job_id: jobId },
      }).catch(err => console.error('ai-run-job invoke error:', err));
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible de lancer la génération.', variant: 'destructive' });
    }
  }, [id, dirty, chapters, toast, queryClient]);

  const generateOutline = () => triggerJob('generate_outline');
  const generateChapter = () => {
    if (!activeChapter) return;
    triggerJob('generate_chapter', {
      chapter_id: activeChapter.id,
      chapter_title: activeChapter.title,
    });
  };
  const generateDescription = () => triggerJob('generate_description');
  const runQualityCheck = () => triggerJob('quality_check');

  const isGenerating = !!generatingJob || (activeJobs && activeJobs.length > 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[70vh] w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Projet introuvable</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/admin/studio/projects"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/studio/projects/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Projet
            </Link>
          </Button>
          <span className="text-sm font-semibold truncate max-w-[200px]">{project.title}</span>
          {dirty && <Badge variant="outline" className="text-[10px]">Non sauvegardé</Badge>}
          {isGenerating && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> IA en cours...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Active job progress */}
      {activeJobs && activeJobs.length > 0 && (
        <div className="mb-2 space-y-1">
          {activeJobs.map(job => (
            <div key={job.id} className="flex items-center gap-2 text-xs">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-muted-foreground">{job.job_type}</span>
              <Progress value={job.progress || 0} className="flex-1 h-1.5" />
              <span className="text-muted-foreground">{job.progress || 0}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Sidebar: chapters */}
        {sidebarOpen && (
          <div className="w-56 shrink-0 border border-border rounded-xl bg-card flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chapitres</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addChapter}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChapterId(ch.id)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-lg text-sm flex items-center gap-2 group transition-colors',
                      ch.id === activeChapterId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="flex-1 truncate text-xs">{ch.title}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      {idx > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); moveChapter(ch.id, -1); }} className="p-0.5 hover:bg-muted rounded">
                          <GripVertical className="h-3 w-3 rotate-90" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeChapter(ch.id); }}
                        className="p-0.5 hover:bg-destructive/10 text-destructive rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeChapter ? (
            <>
              <Input
                value={activeChapter.title}
                onChange={(e) => updateChapter(activeChapter.id, { title: e.target.value })}
                className="text-lg font-semibold border-0 border-b border-border rounded-none px-1 mb-2 focus-visible:ring-0 bg-transparent"
                placeholder="Titre du chapitre"
              />
              <div className="flex-1 overflow-auto">
                <RichTextEditor
                  value={activeChapter.content}
                  onChange={(html) => updateChapter(activeChapter.id, { content: html })}
                  placeholder="Écrivez le contenu de ce chapitre..."
                  className="min-h-[400px]"
                  showAIButton={false}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Sélectionnez ou créez un chapitre</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-60 shrink-0 border border-border rounded-xl bg-card overflow-auto hidden lg:block">
          <div className="p-3 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Projet</h3>
              <div className="space-y-1.5 text-xs">
                {project.tone && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Ton</span><span className="capitalize">{project.tone}</span></div>
                )}
                {project.target_audience && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Cible</span><span className="truncate ml-2">{project.target_audience}</span></div>
                )}
                {project.target_length && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Pages</span><span>{project.target_length}</span></div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actions IA</h3>
              <div className="space-y-1.5">
                <Button
                  variant="outline" size="sm"
                  className="w-full justify-start text-xs h-8 gap-2"
                  onClick={generateOutline}
                  disabled={!!isGenerating}
                >
                  <ListTree className="h-3.5 w-3.5 text-primary" /> Générer le plan
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="w-full justify-start text-xs h-8 gap-2"
                  onClick={generateChapter}
                  disabled={!!isGenerating || !activeChapter}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Générer ce chapitre
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Statistiques</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chapitres</span>
                  <span>{chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mots (total)</span>
                  <span>{chapters.reduce((sum, c) => sum + (c.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length), 0)}</span>
                </div>
              </div>
            </div>

            {/* Preview PDF */}
            <div className="border-t border-border pt-3">
              <Button
                variant="outline" size="sm"
                className="w-full justify-start text-xs h-8 gap-2"
                onClick={() => pdfAsset?.file_url ? setPreviewOpen(true) : generateAndPreviewPdf()}
                disabled={generatingPdf}
              >
                {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                {generatingPdf ? 'Génération...' : 'Aperçu du document'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* PDF Preview Dialog */}
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Aperçu — {project?.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-white">
          {pdfAsset?.file_url ? (
            <iframe src={pdfAsset.file_url} className="w-full h-full" title="Aperçu du document" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Aucun aperçu disponible. Générez le PDF d'abord.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={generateAndPreviewPdf} disabled={generatingPdf}>
            {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            Regénérer le PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
