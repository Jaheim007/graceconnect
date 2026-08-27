import { useParams, Link, useNavigate } from '@/lib/router-compat';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Upload, ShoppingBag, GraduationCap, Radio, Loader2, Check, Image as ImageIcon, FileText, Zap, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePdfPreviewBlobUrl } from '@/hooks/usePdfPreviewBlobUrl';

type PublishTarget = 'product' | 'course' | 'media';

export default function ProjectPublishWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [target, setTarget] = useState<PublishTarget>('product');
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preparingProduct, setPreparingProduct] = useState(false);

  // Product fields (used for course target only now)
  const [description, setDescription] = useState('');

  const descGenerated = useRef(false);
  const pdfGenerated = useRef(false);

  const { data: project } = useQuery({
    queryKey: ['studio-project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_content_projects').select('*').eq('id', id).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: coverAsset } = useQuery({
    queryKey: ['studio-project-cover', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_project_assets')
        .select('file_url')
        .eq('project_id', id)
        .eq('is_cover', true)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

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

  // Auto-generate description + PDF when entering step 1 (course only now)
  useEffect(() => {
    if (step !== 1 || !project || !currentOrg?.id || !user?.id) return;

    if (!description && !descGenerated.current) {
      descGenerated.current = true;
      generateDescription();
    }
  }, [step, project?.id]);

  // Navigate to normal product form pre-filled with AI data
  const goToProductForm = useCallback(async () => {
    if (!project || !currentOrg?.id || !id) return;
    setPreparingProduct(true);

    // Generate PDF if not ready
    let fileUrl = pdfAsset?.file_url || null;
    if (!fileUrl) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-generate-pdf', {
          body: { org_id: currentOrg.id, project_id: id, format: 'ebook', page_size: 'A4' },
        });
        if (!error && data?.download_url) fileUrl = data.download_url;
      } catch (e) {
        console.error('PDF generation error:', e);
      }
    }

    // Description left empty — user can write it or use AI assistant in the product form

    setPreparingProduct(false);

    // Navigate to normal product form with pre-filled state
    navigate('/admin/products/new', {
      state: {
        fromStudio: true,
        studioProjectId: id,
        prefill: {
          title: project.title,
          description: '',
          product_type: project.project_type === 'course_pack' ? 'course' : 'ebook',
          cover_image_url: coverAsset?.file_url || '',
          file_url: fileUrl || '',
          is_published: true,
        },
      },
    });
  }, [project, currentOrg, id, user, pdfAsset, coverAsset, navigate]);

  const generateDescription = async () => {
    if (!id || !currentOrg?.id || !user?.id || !project) return;
    setGeneratingDesc(true);
    try {
      const { data: job, error: jobErr } = await db.from('ai_generation_jobs').insert({
        organization_id: currentOrg.id,
        created_by: user.id,
        project_id: id,
        job_type: 'generate_description',
        input_params: { title: project.title, objective: project.objective },
        status: 'queued',
        provider: 'gemini',
      }).select('id').single();

      if (jobErr || !job) throw jobErr || new Error('Failed to create job');

      const { error: runErr } = await supabase.functions.invoke('ai-run-job', {
        body: { job_id: job.id },
      });
      if (runErr) throw runErr;

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: updatedJob } = await db.from('ai_generation_jobs')
          .select('status, output_data')
          .eq('id', job.id)
          .single();

        if (updatedJob?.status === 'completed') {
          clearInterval(poll);
          const { data: updatedProject } = await db.from('ai_content_projects')
            .select('description')
            .eq('id', id)
            .single();
          if (updatedProject?.description) {
            setDescription(updatedProject.description);
          }
          setGeneratingDesc(false);
        } else if (updatedJob?.status === 'failed' || attempts > 30) {
          clearInterval(poll);
          setGeneratingDesc(false);
        }
      }, 2000);
    } catch (e: any) {
      console.error('Description generation error:', e);
      setGeneratingDesc(false);
    }
  };

  const generatePdf = useCallback(async () => {
    if (!id || !currentOrg?.id) return;
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-pdf', {
        body: { org_id: currentOrg.id, project_id: id, format: 'ebook', page_size: 'A4' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refetchPdf();
      queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
      toast({ title: 'PDF généré ✓', description: 'Le fichier est prêt pour la publication.' });
    } catch (e: any) {
      console.error('PDF generation error:', e);
      toast({ title: 'Erreur PDF', description: e.message || 'La génération du PDF a échoué. Réessayez.', variant: 'destructive' });
    } finally {
      setGeneratingPdf(false);
    }
  }, [id, currentOrg?.id]);

  const publishAsCourse = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user || !project) throw new Error('Missing context');
      const structure = project.structure_json as { chapters?: any[] };
      const chapters = structure?.chapters || [];

      const { data: program, error: progErr } = await db.from('programs').insert({
        organization_id: currentOrg.id,
        created_by: user.id,
        title: project.title,
        description: description || project.objective || '',
        is_published: true,
        cover_image_url: coverAsset?.file_url || null,
      }).select('id').single();
      if (progErr) throw progErr;

      const { data: mod, error: modErr } = await db.from('program_modules').insert({
        program_id: program.id,
        title: project.title,
        display_order: 0,
      }).select('id').single();
      if (modErr) throw modErr;

      for (let i = 0; i < chapters.length; i++) {
        await db.from('program_lessons').insert({
          module_id: mod.id,
          title: chapters[i].title,
          content: chapters[i].content,
          display_order: i,
          duration_minutes: Math.max(5, Math.round((chapters[i].content?.length || 0) / 1000)),
        });
      }

      await db.from('ai_content_projects').update({
        linked_program_id: program.id,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      return program;
    },
    onSuccess: () => {
      toast({ title: 'Cours publié ✓', description: 'Les leçons ont été créées depuis vos chapitres.' });
      queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
      navigate(`/admin/studio/projects/${id}`);
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (target === 'course') {
        await publishAsCourse.mutateAsync();
      } else {
        toast({ title: 'Bientôt disponible', description: 'La publication en média sera disponible prochainement.' });
      }
    } finally {
      setPublishing(false);
    }
  };

  if (!project) return null;

  const isReady = project.status === 'ready_to_publish' || project.status === 'published';
  const chapters = (project.structure_json as any)?.chapters || [];
  const pdfReady = !!pdfAsset?.file_url;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/admin/studio/projects/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Projet</Link>
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" /> Publier le projet
        </h1>
      </div>

      {!isReady && project.status !== 'review' && (
        <Card className="border-yellow-300 dark:border-yellow-800">
          <CardContent className="py-4 text-center text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ Ce projet n'est pas encore approuvé. Passez par la revue qualité avant de publier.
          </CardContent>
        </Card>
      )}

      {/* Step 0: Choose target */}
      {step === 0 && (
        <div className="grid gap-3">
          {[
            { value: 'product' as PublishTarget, label: 'Publier en produit', desc: 'Ebook, PDF en vente sur votre boutique. Le fichier sera généré automatiquement depuis vos chapitres.', icon: ShoppingBag },
            { value: 'course' as PublishTarget, label: 'Publier en cours', desc: `Créer un programme avec ${chapters.length} leçon(s) depuis vos chapitres`, icon: GraduationCap },
            { value: 'media' as PublishTarget, label: 'Publier en média', desc: 'Contenu libre dans la médiathèque (bientôt)', icon: Radio, disabled: true },
          ].map(opt => (
            <Card
              key={opt.value}
              className={`cursor-pointer transition-all ${
                opt.disabled ? 'opacity-50 cursor-not-allowed' :
                target === opt.value ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/30'
              }`}
              onClick={() => !opt.disabled && setTarget(opt.value)}
            >
              <CardContent className="py-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  target === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {opt.disabled && <Badge variant="secondary" className="ml-auto text-[10px]">Bientôt</Badge>}
              </CardContent>
            </Card>
          ))}
          <div className="flex gap-2 mt-2">
            {pdfReady && (
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-1" /> Aperçu du document
              </Button>
            )}
            <Button
              onClick={() => {
                if (target === 'product') {
                  goToProductForm();
                } else {
                  setStep(1);
                }
              }}
              disabled={preparingProduct}
            >
              {preparingProduct ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Préparation du produit...</>
              ) : (
                <>Continuer <Check className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Details (course only) */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails du cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={project.title} disabled className="bg-muted" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Description</Label>
                {generatingDesc && (
                  <span className="text-xs text-primary flex items-center gap-1">
                     Génération en cours...
                  </span>
                )}
              </div>
              {generatingDesc ? (
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground animate-pulse min-h-[120px]">
                  L'IA rédige une description percutante...
                </div>
              ) : (
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Description du cours..."
                  showAIButton={false}
                />
              )}
              {!generatingDesc && !description && (
                <Button variant="ghost" size="sm" className="mt-1 text-xs h-7" onClick={generateDescription}>
                   Générer avec l'IA
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              {coverAsset ? (
                <div className="flex items-center gap-2">
                  <img src={coverAsset.file_url} alt="Cover" className="h-10 w-8 rounded object-cover border" />
                  <span>Image de couverture détectée ✓</span>
                </div>
              ) : (
                <span>Aucune couverture — ajoutez-en une dans les <Link to={`/admin/studio/projects/${id}/assets`} className="text-primary underline">Assets</Link></span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>Retour</Button>
              <Button onClick={() => setStep(2)} disabled={generatingDesc}>
                {generatingDesc ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirmer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirm & publish (course only) */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmation</CardTitle>
            <CardDescription>
              Le cours "{project.title}" sera créé avec {chapters.length} leçon(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Destination</span>
              <span className="font-medium">Cours / Programme</span>
              <span className="text-muted-foreground">Titre</span>
              <span>{project.title}</span>
              <span className="text-muted-foreground">Leçons</span>
              <span>{chapters.length}</span>
              <span className="text-muted-foreground">Couverture</span>
              <span>{coverAsset ? '✓' : '✗'}</span>
              {description && (
                <>
                  <span className="text-muted-foreground">Description</span>
                  <span className="line-clamp-2 text-xs">{description.slice(0, 100)}...</span>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
              {pdfReady && (
                <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-1" /> Aperçu
                </Button>
              )}
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                Publier maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Aperçu du livre — {project.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-background">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">Chargement de l’aperçu...</div>
            ) : previewError ? (
              <div className="flex items-center justify-center h-full text-destructive text-sm">{previewError}</div>
            ) : pdfPreviewUrl ? (
              <object data={pdfPreviewUrl} type="application/pdf" className="w-full h-full">
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <p className="text-sm">Impossible d'afficher l'aperçu dans le navigateur.</p>
                  <a href={pdfPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Ouvrir le PDF dans un nouvel onglet</a>
                </div>
              </object>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucun aperçu disponible
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
