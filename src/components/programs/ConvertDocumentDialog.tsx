import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { useActionCost } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useStartCourseDraft } from '@/hooks/useCourseDraft';
import { draftErrorMessage } from '@/lib/courseDraftErrors';
import { Zap, ArrowRight, Loader2, FileText, ImageIcon, Globe } from 'lucide-react';
import { CourseGenerationLoader } from './CourseGenerationLoader';

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
  const [contentLanguage, setContentLanguage] = useState(isFr ? 'fr' : 'en');
  const [converting, setConverting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const standardCost = useActionCost('ai_course_structure', 'standard');
  const premiumCost = useActionCost('ai_course_structure', 'premium');

  const navigate = useNavigate();
  const startDraft = useStartCourseDraft();

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

      // The pipeline writes a REVIEWABLE DRAFT — never a live course.
      const result = await startDraft.mutateAsync({
        org_id: currentOrg.id,
        source: 'document',
        file_url: urlData.publicUrl,
        file_name: file.name,
        mime: file.type,
        title: file.name.replace(/\.[^.]+$/, ''),
        language: contentLanguage,
        tier,
      });

      refreshCredits();
      onOpenChange(false);
      setFile(null);
      navigate(`/admin/programs/draft/${result.project_id}`);
    } catch (err: any) {
      const isCreditError = handleAiError(err);
      if (!isCreditError) {
        toast({ title: isFr ? 'Erreur' : 'Error', description: draftErrorMessage(err, isFr), variant: 'destructive' });
      }
    } finally {
      setConverting(false);
    }
  };

  const selectedCost = tier === 'premium' ? premiumCost : standardCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" hideCloseButton={converting}>
        {converting ? (
          <CourseGenerationLoader phase="generating" mode="convert" />
        ) : (
        <>
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
              <FileText className="h-6 w-6 text-primary" />
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

        {/* Language selector */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Langue du contenu généré' : 'Generated content language'}
          </p>
          <Select value={contentLanguage} onValueChange={setContentLanguage}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="pt">🇧🇷 Português</SelectItem>
              <SelectItem value="ar">🇸🇦 العربية</SelectItem>
              <SelectItem value="sw">🇰🇪 Kiswahili</SelectItem>
            </SelectContent>
          </Select>
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
              {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {converting ? (isFr ? 'Conversion...' : 'Converting...') : (isFr ? 'Convertir' : 'Convert')}
            </Button>
          </div>
        )}
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
