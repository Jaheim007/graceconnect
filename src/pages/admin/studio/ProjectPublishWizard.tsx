import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  ArrowLeft, Upload, ShoppingBag, GraduationCap, Radio,
  Loader2, Check, Image as ImageIcon, FileText
} from 'lucide-react';

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

  // Product fields
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);

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

  // Auto-generate PDF from chapters
  const generatePdf = async () => {
    if (!id || !currentOrg?.id) return;
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-pdf', {
        body: { org_id: currentOrg.id, project_id: id, format: 'ebook', page_size: 'A4' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Document généré ✓', description: 'Le fichier a été créé depuis vos chapitres.' });
      await refetchPdf();
      queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const publishAsProduct = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user || !project) throw new Error('Missing context');

      // Auto-generate PDF if none exists
      let fileUrl = pdfAsset?.file_url || null;
      if (!fileUrl) {
        const { data, error } = await supabase.functions.invoke('ai-generate-pdf', {
          body: { org_id: currentOrg.id, project_id: id, format: 'ebook', page_size: 'A4' },
        });
        if (!error && data?.download_url) {
          fileUrl = data.download_url;
        }
      }

      const { data: product, error } = await db.from('digital_products').insert({
        organization_id: currentOrg.id,
        created_by: user.id,
        title: project.title,
        description: description || project.objective || '',
        price: isFree ? 0 : price,
        sale_price: salePrice || null,
        is_free: isFree,
        is_published: true,
        cover_image_url: coverAsset?.file_url || null,
        file_url: fileUrl,
        product_type: project.project_type === 'course_pack' ? 'course' : 'ebook',
      }).select('id').single();

      if (error) throw error;

      await db.from('ai_content_projects').update({
        linked_product_id: product.id,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      return product;
    },
    onSuccess: () => {
      toast({ title: 'Produit publié ✓', description: 'Votre contenu est maintenant disponible.' });
      queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
      navigate(`/admin/studio/projects/${id}`);
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

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
      if (target === 'product') {
        await publishAsProduct.mutateAsync();
      } else if (target === 'course') {
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
          <Button onClick={() => setStep(1)} className="mt-2">
            Continuer <Check className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {target === 'product' ? 'Détails du produit' : 'Détails du cours'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={project.title} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Description de vente</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description percutante pour vos acheteurs..."
                rows={3}
              />
            </div>

            {target === 'product' && (
              <>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="rounded"
                    />
                    Gratuit
                  </label>
                </div>
                {!isFree && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prix (XOF)</Label>
                      <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Prix promo (optionnel)</Label>
                      <Input type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              {coverAsset ? 'Image de couverture détectée ✓' : 'Aucune couverture — ajoutez-en une dans les Assets'}
            </div>
            {target === 'product' && (
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {pdfAsset ? (
                  <span className="text-muted-foreground">Fichier PDF détecté ✓</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Aucun PDF —</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={generatePdf}
                      disabled={generatingPdf}
                    >
                      {generatingPdf ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      {generatingPdf ? 'Génération...' : 'Générer depuis les chapitres'}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              💡 Si aucun PDF n'est présent, il sera <strong>automatiquement généré</strong> depuis vos chapitres lors de la publication.
            </p>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>Retour</Button>
              <Button onClick={() => setStep(2)}>Confirmer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirm & publish */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmation</CardTitle>
            <CardDescription>
              {target === 'product'
                ? `Le produit "${project.title}" sera créé et publié${isFree ? ' (gratuit)' : ` à ${price} XOF`}.`
                : `Le cours "${project.title}" sera créé avec ${chapters.length} leçon(s).`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Destination</span>
              <span className="font-medium">{target === 'product' ? 'Produit numérique' : 'Cours / Programme'}</span>
              <span className="text-muted-foreground">Titre</span>
              <span>{project.title}</span>
              {target === 'product' && !isFree && (
                <>
                  <span className="text-muted-foreground">Prix</span>
                  <span>{price} XOF{salePrice ? ` (promo: ${salePrice} XOF)` : ''}</span>
                </>
              )}
              {target === 'course' && (
                <>
                  <span className="text-muted-foreground">Leçons</span>
                  <span>{chapters.length}</span>
                </>
              )}
              <span className="text-muted-foreground">Couverture</span>
              <span>{coverAsset ? '✓' : '✗'}</span>
              {target === 'product' && (
                <>
                  <span className="text-muted-foreground">Fichier</span>
                  <span>{pdfAsset ? '✓ PDF existant' : '⚡ Sera généré automatiquement'}</span>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                Publier maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
