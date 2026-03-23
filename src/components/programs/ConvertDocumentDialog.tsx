import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { useActionCost } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useCreateProgram, useCreateModule, useCreateLesson } from '@/hooks/usePrograms';
import { queueDeferredCourseLessonImages } from '@/lib/programImageGeneration';
import { Sparkles, ArrowRight, Loader2, FileText, ImageIcon } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (programId: string) => void;
}

type AITier = 'standard' | 'premium';
const SUPPORTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];

export function ConvertDocumentDialog({ open, onOpenChange, onCreated }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [tier, setTier] = useState<AITier>('standard');
  const [generateImages, setGenerateImages] = useState(false);
  const [converting, setConverting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const standardCost = useActionCost('ai_course_structure', 'standard');
  const premiumCost = useActionCost('ai_course_structure', 'premium');

  const createProgram = useCreateProgram();
  const createModule = useCreateModule();
  const createLesson = useCreateLesson();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleConvert = async () => {
    if (!file || !currentOrg || !user) return;
    setConverting(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(
          isFr
            ? 'Format non supporté. Utilisez PDF, Word (.doc/.docx) ou PowerPoint (.ppt/.pptx).'
            : 'Unsupported format. Use PDF, Word (.doc/.docx), or PowerPoint (.ppt/.pptx).',
        );
      }

      const path = `doc-convert/${currentOrg.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(isFr ? 'Session expirée. Reconnectez-vous puis réessayez.' : 'Session expired. Please log in again and retry.');
      }

      const { data, error } = await supabase.functions.invoke('ai-generate-course', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          title: file.name.replace(/\.[^.]+$/, ''),
          description: `Convert this ${ext.toUpperCase()} document into a structured course with modules, lessons, and FULL lesson content. Document URL: ${urlData.publicUrl}`,
          language: isFr ? 'fr' : 'en',
          tier,
          module_count: 5,
          generate_images: generateImages,
        },
      });

      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error);
        (err as any).status = data.status;
        throw err;
      }

      refreshCredits();
      const deferredImageJobs: Array<{ id: string; title: string; imagePrompt: string }> = [];

      const result = await createProgram.mutateAsync({
        organization_id: currentOrg.id,
        title: file.name.replace(/\.[^.]+$/, ''),
        created_by: user.id,
      });

      if (data?.modules) {
        for (let mi = 0; mi < data.modules.length; mi++) {
          const mod = data.modules[mi];
          const modResult = await createModule.mutateAsync({
            program_id: result.id,
            title: mod.title,
            description: mod.description,
            display_order: mi,
          });
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const lesson = mod.lessons[li];
            const lessonResult = await createLesson.mutateAsync({
              module_id: modResult.id,
              title: lesson.title,
              content_type: lesson.content_type || 'text',
              content: lesson.content || '',
              duration_minutes: lesson.duration_minutes,
              display_order: li,
              programId: result.id,
            });

            if (generateImages && lesson?.image_prompt && lessonResult?.data?.id) {
              deferredImageJobs.push({
                id: lessonResult.data.id,
                title: lesson.title,
                imagePrompt: lesson.image_prompt,
              });
            }
          }
        }
      }

      if (generateImages && deferredImageJobs.length > 0) {
        void queueDeferredCourseLessonImages({
          programId: result.id,
          lessonJobs: deferredImageJobs,
          sessionToken: session.access_token,
          tier,
        }).then(async ({ error: imageError, data: imageData }) => {
          const generatedLessonIds = Array.isArray(imageData?.generated_lesson_ids)
            ? imageData.generated_lesson_ids
            : [];

          if (imageData?.images_generated > 0) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['program', result.id] }),
              queryClient.invalidateQueries({ queryKey: ['program-modules', result.id] }),
              ...generatedLessonIds.map((lessonId: string) =>
                queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
              ),
            ]);
          }

          if (imageError || imageData?.error) {
            toast({
              title: isFr ? 'Document converti, mais les images ont échoué' : 'Document converted, but images failed',
              description: isFr ? 'Le cours est prêt. Les visuels peuvent être relancés plus tard.' : 'The course is ready. The visuals can be retried later.',
              variant: 'destructive',
            });
            return;
          }

          if (imageData?.images_generated > 0 && !imageData?.failed) {
            toast({
              title: isFr ? 'Images de leçon générées' : 'Lesson images generated',
              description: isFr
                ? `${imageData.images_generated} visuel(x) ont été ajoutés au cours.`
                : `${imageData.images_generated} visual(s) were added to the course.`,
            });
            return;
          }

          if (imageData?.images_generated > 0) {
            toast({
              title: isFr ? 'Images partiellement générées' : 'Images partially generated',
              description: isFr
                ? `${imageData.images_generated} visuel(x) ajoutés, ${imageData.failed || 0} échec(s).`
                : `${imageData.images_generated} visual(s) added, ${imageData.failed || 0} failed.`,
              variant: 'destructive',
            });
            return;
          }

          toast({
            title: isFr ? 'Document converti, mais aucune image n’a été ajoutée' : 'Document converted, but no images were added',
            description: isFr ? 'Le contenu est prêt, mais les visuels devront être relancés.' : 'The content is ready, but the visuals will need to be retried.',
            variant: 'destructive',
          });
        }).catch(() => {
          toast({
            title: isFr ? 'Document converti, mais les images n’ont pas pu être finalisées' : 'Document converted, but images could not be finalized',
            description: isFr ? 'Le cours a bien été créé. Les visuels pourront être régénérés plus tard.' : 'The course was created successfully. Visuals can be regenerated later.',
            variant: 'destructive',
          });
        });
      }

      toast({
        title: isFr ? '✅ Document converti en cours !' : '✅ Document converted to course!',
        description: generateImages
          ? (isFr ? 'Les images des leçons se génèrent maintenant en arrière-plan.' : 'Lesson images are now generating in the background.')
          : undefined,
      });
      onOpenChange(false);
      setFile(null);
      onCreated(result.id);
    } catch (err: any) {
      const isCreditError = handleAiError(err);
      if (!isCreditError) {
        toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
      }
    } finally {
      setConverting(false);
    }
  };

  const selectedCost = tier === 'premium' ? premiumCost : standardCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isFr ? 'Convertir un document' : 'Convert document'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-center"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{isFr ? 'Conversion IA' : 'AI conversion'}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isFr
                  ? 'Convertit PDF, Word ou PowerPoint en cours structuré avec contenu.'
                  : 'Converts PDF, Word, or PowerPoint into a structured course with content.'}
              </p>
            </div>
          </button>

          <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-muted/20 text-center opacity-60">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">{isFr ? 'Conversion directe' : 'Direct conversion'}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isFr ? 'PowerPoint uniquement — Bientôt disponible' : 'PowerPoint only — Coming soon'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground">{isFr ? 'Type de génération IA' : 'AI generation type'}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tier === 'standard' ? 'default' : 'outline'}
              onClick={() => setTier('standard')}
              disabled={converting}
            >
              Standard
              <span className="ml-1 text-xs opacity-90">({standardCost ?? 8} {isFr ? 'crédits' : 'credits'})</span>
            </Button>
            <Button
              type="button"
              variant={tier === 'premium' ? 'default' : 'outline'}
              onClick={() => setTier('premium')}
              disabled={converting}
            >
              Premium
              <span className="ml-1 text-xs opacity-90">({premiumCost ?? 15} {isFr ? 'crédits' : 'credits'})</span>
            </Button>
          </div>
        </div>

        {/* Image generation option */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-medium">{isFr ? 'Générer des images par leçon' : 'Generate images per lesson'}</p>
              <p className="text-[10px] text-muted-foreground">
                {isFr
                  ? 'Images basées sur le style du document (crédits additionnels)'
                  : 'Images based on document style (additional credits)'}
              </p>
            </div>
          </div>
          <Switch checked={generateImages} onCheckedChange={setGenerateImages} disabled={converting} />
        </div>

        <p className="text-[11px] text-muted-foreground">
          {isFr ? 'Coût estimé' : 'Estimated cost'}: <span className="font-medium text-foreground">{selectedCost ?? (tier === 'premium' ? 15 : 8)} {isFr ? 'crédits' : 'credits'}</span>
          {generateImages && <span className="text-primary"> + {isFr ? 'images' : 'images'}</span>}
        </p>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          onChange={handleFileSelect}
        />

        {file && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <Button size="sm" onClick={handleConvert} disabled={converting} className="gap-1.5">
              {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {converting ? (isFr ? 'Conversion...' : 'Converting...') : (isFr ? 'Convertir' : 'Convert')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
