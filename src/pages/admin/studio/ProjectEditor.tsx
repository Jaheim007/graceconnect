import { useParams, Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/hooks/useImageOptimizer';
import { useCanvaAuth } from '@/hooks/useCanvaAuth';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, FileText,
  Sparkles, Loader2, ChevronLeft, ChevronRight, ListTree,
  FileCheck, BookOpen, Eye, ImagePlus, Upload, Star, StarOff, Palette
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePdfPreviewBlobUrl } from '@/hooks/usePdfPreviewBlobUrl';
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
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const [canvaDesigning, setCanvaDesigning] = useState(false);
  
  // Drag-and-drop state for chapters
  const dragChapterRef = useRef<string | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null);

  const handleChapterDragStart = useCallback((chId: string) => {
    dragChapterRef.current = chId;
  }, []);

  const handleChapterDragOver = useCallback((e: React.DragEvent, chId: string) => {
    e.preventDefault();
    if (dragChapterRef.current === null || dragChapterRef.current === chId) return;
    setDragOverChapterId(chId);
  }, []);

  const handleChapterDrop = useCallback((e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    const fromId = dragChapterRef.current;
    if (!fromId || fromId === dropId) {
      dragChapterRef.current = null;
      setDragOverChapterId(null);
      return;
    }
    setChapters(prev => {
      const copy = [...prev];
      const fromIdx = copy.findIndex(c => c.id === fromId);
      const toIdx = copy.findIndex(c => c.id === dropId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy.map((c, i) => ({ ...c, order: i }));
    });
    setDirty(true);
    dragChapterRef.current = null;
    setDragOverChapterId(null);
  }, []);

  const handleChapterDragEnd = useCallback(() => {
    dragChapterRef.current = null;
    setDragOverChapterId(null);
  }, []);

  const { isConnected: canvaConnected, startAuth: canvaStartAuth, getValidToken: getCanvaToken, loading: canvaLoading } = useCanvaAuth();

  // Fetch cover asset
  const { data: coverAsset, refetch: refetchCover } = useQuery({
    queryKey: ['studio-project-cover', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_project_assets')
        .select('id, file_url')
        .eq('project_id', id)
        .eq('is_cover', true)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

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

  const { blobUrl: pdfPreviewUrl, loading: previewLoading, error: previewError } = usePdfPreviewBlobUrl(
    previewOpen ? pdfAsset?.file_url : null,
    previewOpen,
  );

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

  const handleCoverUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !id || !currentOrg?.id) return;
      setUploadingCover(true);
      try {
        const optimized = await compressImage(file);
        const ext = optimized.name?.split('.').pop() || 'webp';
        const path = `studio/${id}/cover-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('org-uploads').upload(path, optimized, { cacheControl: '31536000' });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('org-uploads').getPublicUrl(path);
        const brandedCoverUrl = (await import('@/lib/storageUrl')).brandUrl(urlData.publicUrl);
        if (coverAsset) {
          await db.from('ai_project_assets').update({ is_cover: false }).eq('id', coverAsset.id);
        }
        await db.from('ai_project_assets').insert({
          project_id: id, organization_id: currentOrg.id, file_url: brandedCoverUrl,
          asset_type: 'image', label: 'Couverture', mime_type: file.type, file_size: file.size,
          is_cover: true, display_order: 0,
        });
        toast({ title: 'Couverture ajoutée ✓' });
        refetchCover();
      } catch (err: any) {
        toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      } finally {
        setUploadingCover(false);
      }
    };
    input.click();
  }, [id, currentOrg?.id, coverAsset, toast, refetchCover]);


  const openCanvaDesign = async () => {
    if (!id || !currentOrg?.id || !project) return;
    
    // Save return path for after OAuth
    sessionStorage.setItem('canva_return_to', window.location.pathname);

    if (!canvaConnected) {
      // Start OAuth flow
      try {
        await canvaStartAuth();
      } catch (e: any) {
        toast({ title: 'Erreur Canva', description: e.message, variant: 'destructive' });
      }
      return;
    }

    setCanvaDesigning(true);
    try {
      const token = await getCanvaToken();
      if (!token) {
        toast({ title: 'Session Canva expirée', description: 'Reconnectez-vous à Canva.', variant: 'destructive' });
        return;
      }

      // Create a design with book cover dimensions (600x900)
      const { data, error } = await supabase.functions.invoke('canva-design', {
        body: {
          action: 'create',
          canva_token: token,
          title: `Couverture — ${project.title}`,
          width: 600,
          height: 900,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Échec création design Canva');

      // Open Canva editor in new tab
      if (data.edit_url) {
        window.open(data.edit_url, '_blank');
        toast({
          title: '🎨 Design Canva créé',
          description: 'Éditez votre couverture dans l\'onglet Canva, puis revenez ici pour l\'exporter.',
        });

        // Store design_id for later export
        sessionStorage.setItem(`canva_design_${id}`, data.design_id);
      }
    } catch (e: any) {
      toast({ title: 'Erreur Canva', description: e.message, variant: 'destructive' });
    } finally {
      setCanvaDesigning(false);
    }
  };

  const exportCanvaDesign = async () => {
    if (!id || !currentOrg?.id) return;
    const designId = sessionStorage.getItem(`canva_design_${id}`);
    if (!designId) {
      toast({ title: 'Aucun design Canva', description: 'Créez d\'abord un design avec Canva.', variant: 'destructive' });
      return;
    }

    setCanvaDesigning(true);
    try {
      const token = await getCanvaToken();
      if (!token) {
        toast({ title: 'Session Canva expirée', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('canva-design', {
        body: { action: 'export', canva_token: token, design_id: designId },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Export échoué');

      // Save as cover asset
      if (coverAsset) {
        await db.from('ai_project_assets').update({ is_cover: false }).eq('id', coverAsset.id);
      }
      await db.from('ai_project_assets').insert({
        project_id: id, organization_id: currentOrg.id, file_url: data.cover_url,
        asset_type: 'image', label: 'Couverture Canva', mime_type: 'image/png',
        is_cover: true, display_order: 0,
      });

      sessionStorage.removeItem(`canva_design_${id}`);
      toast({ title: '✅ Couverture Canva importée !' });
      refetchCover();
    } catch (e: any) {
      toast({ title: 'Erreur export', description: e.message, variant: 'destructive' });
    } finally {
      setCanvaDesigning(false);
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
                  <div
                    key={ch.id}
                    draggable
                    onDragStart={() => handleChapterDragStart(ch.id)}
                    onDragOver={(e) => handleChapterDragOver(e, ch.id)}
                    onDrop={(e) => handleChapterDrop(e, ch.id)}
                    onDragEnd={handleChapterDragEnd}
                    onClick={() => setActiveChapterId(ch.id)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-lg text-sm flex items-center gap-1.5 group transition-all cursor-grab active:cursor-grabbing',
                      ch.id === activeChapterId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground',
                      dragOverChapterId === ch.id && 'ring-2 ring-primary/40 scale-[1.02]'
                    )}
                  >
                    <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="flex-1 truncate text-xs">{ch.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeChapter(ch.id); }}
                      className="p-0.5 hover:bg-destructive/10 text-destructive rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
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

            {/* Cover */}
            <div className="border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Couverture</h3>
              {coverAsset?.file_url ? (
                <div className="space-y-2">
                  <img src={coverAsset.file_url} alt="Couverture" className="w-full aspect-[2/3] rounded-lg object-cover border border-border shadow-sm" />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-7" onClick={handleCoverUpload} disabled={uploadingCover}>
                      {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />} Changer
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-7" onClick={openCanvaDesign} disabled={canvaDesigning || canvaLoading}>
                      {canvaDesigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Palette className="h-3 w-3 mr-1" />} {canvaConnected ? 'Canva' : 'Connecter Canva'}
                    </Button>
                    {sessionStorage.getItem(`canva_design_${id}`) && (
                      <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-7" onClick={exportCanvaDesign} disabled={canvaDesigning}>
                        {canvaDesigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />} Importer Canva
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-3 text-center">
                    <ImagePlus className="h-6 w-6 mx-auto text-muted-foreground/30 mb-1" />
                    <p className="text-[10px] text-muted-foreground">Aucune couverture</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1" onClick={handleCoverUpload} disabled={uploadingCover}>
                    {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Importer
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1" onClick={openCanvaDesign} disabled={canvaDesigning || canvaLoading}>
                    {canvaDesigning || canvaLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Palette className="h-3 w-3" />}
                    {canvaConnected ? 'Créer avec Canva' : 'Connecter Canva'}
                  </Button>
                  {sessionStorage.getItem(`canva_design_${id}`) && (
                    <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1" onClick={exportCanvaDesign} disabled={canvaDesigning}>
                      {canvaDesigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Importer depuis Canva
                    </Button>
                  )}
                </div>
              )}
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
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-background">
          {previewLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Chargement de l’aperçu...</div>
          ) : previewError ? (
            <div className="flex items-center justify-center h-full text-destructive text-sm">{previewError}</div>
          ) : pdfPreviewUrl ? (
            <iframe src={pdfPreviewUrl} className="w-full h-full" title="Aperçu du document" />
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
