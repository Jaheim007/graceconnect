import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { supabase } from '@/integrations/supabase/client';
import { useCreateProgram, useCreateModule, useCreateLesson } from '@/hooks/usePrograms';
import { Sparkles, ArrowRight, Upload, Loader2, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (programId: string) => void;
}

export function ConvertDocumentDialog({ open, onOpenChange, onCreated }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();

  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      // Upload file to storage
      const ext = file.name.split('.').pop();
      const path = `doc-convert/${currentOrg.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

      // Use AI to convert document into course structure
      const { data, error } = await supabase.functions.invoke('ai-generate-course', {
        body: {
          title: file.name.replace(/\.[^.]+$/, ''),
          description: `Convert this document into a structured course. Document URL: ${urlData.publicUrl}`,
          language: isFr ? 'fr' : 'en',
          tier: 'standard',
          module_count: 5,
        },
      });

      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error);
        (err as any).status = data.status;
        throw err;
      }

      refreshCredits();

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
            await createLesson.mutateAsync({
              module_id: modResult.id,
              title: lesson.title,
              content_type: lesson.content_type || 'text',
              duration_minutes: lesson.duration_minutes,
              display_order: li,
              programId: result.id,
            });
          }
        }
      }

      toast({ title: isFr ? '✅ Document converti en cours !' : '✅ Document converted to course!' });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isFr ? 'Convertir un document' : 'Convert document'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-4">
          {/* AI conversion */}
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
                  ? 'Transforme le contenu texte en cours structuré avec modules et leçons'
                  : 'Transform text content into a structured course with modules and lessons'}
              </p>
            </div>
          </button>

          {/* Direct conversion (coming soon) */}
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

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
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
