/**
 * Course cover picker — two ways only, both obvious:
 *   1. Upload an image from the device (most people already have one)
 *   2. Generate one with AI (uses credits)
 *
 * No URL field: pasting a link confused creators and is not how they work.
 */
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { uploadEditorImage } from '@/lib/editorUpload';
import { ImageIcon, Loader2, Wand2, Upload, Trash2 } from 'lucide-react';

interface Props {
  orgId?: string;
  title: string;
  tier?: 'standard' | 'premium';
  coverUrl?: string | null;
  onChange: (url: string | null) => void;
}



export function CourseCoverCard({ orgId, title, tier = 'standard', coverUrl, onChange }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadEditorImage(file);
      if (!url) throw new Error(isFr ? 'Téléversement impossible' : 'Upload failed');
      onChange(url);
    } catch (e: any) {
      toast({ title: isFr ? 'Téléversement échoué' : 'Upload failed', description: e?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const generateCover = async () => {
    if (!title.trim()) {
      toast({ title: isFr ? 'Ajoutez d’abord un titre' : 'Add a title first' });
      return;
    }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-generate-course-cover', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { title, tier, org_id: orgId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      onChange((data as any).url);
      refreshCredits();
      toast({ title: isFr ? 'Couverture générée' : 'Cover generated' });
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({ title: isFr ? 'Génération échouée' : 'Generation failed', description: e?.message, variant: 'destructive' });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{isFr ? 'Image de couverture' : 'Cover image'}</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isFr
            ? 'C’est la première chose qu’un acheteur voit. Format conseillé : 1280×720 (16/9).'
            : 'This is the first thing a buyer sees. Recommended size: 1280×720 (16:9).'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[220px_1fr] items-start">
        <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-muted border border-border">
          {coverUrl ? (
            <img src={coverUrl} alt={isFr ? 'Couverture du cours' : 'Course cover'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10px]">{isFr ? 'Aucune couverture' : 'No cover yet'}</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { pickFile(e.target.files?.[0]); e.currentTarget.value = ''; }}
            />
            <Button size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {isFr ? 'Téléverser une image' : 'Upload an image'}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={generateCover} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              {isFr ? 'Générer avec l’IA' : 'Generate with AI'}
            </Button>
            {coverUrl && (
              <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => onChange(null)}>
                <Trash2 className="h-3.5 w-3.5" />
                {isFr ? 'Retirer' : 'Remove'}
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Le téléversement est gratuit. La génération par l’IA utilise des crédits.'
              : 'Uploading is free. AI generation uses credits.'}
          </p>

        </div>
      </div>
    </div>
  );
}
