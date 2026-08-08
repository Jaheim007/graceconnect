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
      // The dialog closes immediately: the generation animation lives on a
      // single page (/admin/programs/generating), so there is no double loader.
      onOpenChange(false);
      setFile(null);
      navigate('/admin/programs/generating', {
        state: {
          mode: 'convert',
          input: {
            org_id: currentOrg.id,
            source: 'document',
            file_url: urlData.publicUrl,
            file_name: file.name,
            mime: file.type,
            title: file.name.replace(/\.[^.]+$/, ''),
            language: contentLanguage,
            tier,
            generate_images: generateImages,
          },
        },
      });
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
            <button
              type="button"
              onClick={() => setTier('standard')}
              disabled={converting}
              className={`rounded-xl border p-3 text-left transition ${tier === 'standard' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            >
              <p className="text-sm font-semibold">Standard <span className="font-normal text-muted-foreground">· {standardCost ?? 8} {isFr ? 'crédits' : 'credits'}</span></p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {isFr
                  ? '8 à 12 leçons · 12 à 20 slides par leçon · textes courts de 40 à 80 mots · 5 à 6 quiz · 3 à 4 cartes mémo'
                  : '8-12 lessons · 12-20 slides each · short 40-80 word slides · 5-6 quizzes · 3-4 flashcards'}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setTier('premium')}
              disabled={converting}
              className={`rounded-xl border p-3 text-left transition ${tier === 'premium' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            >
              <p className="text-sm font-semibold">Premium <span className="font-normal text-muted-foreground">· {premiumCost ?? 15} {isFr ? 'crédits' : 'credits'}</span></p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {isFr
                  ? '14 à 18 leçons · 18 à 28 slides par leçon · textes courts de 60 à 100 mots · 8 à 10 quiz · 5 à 6 cartes mémo · modèle IA avancé'
                  : '14-18 lessons · 18-28 slides each · short 60-100 word slides · 8-10 quizzes · 5-6 flashcards · advanced AI model'}
              </p>
            </button>
          </div>
        </div>

        {/* Images are opt-in and billed per generated image */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-medium">{isFr ? 'Générer une image par leçon' : 'Generate an image per lesson'}</p>
              <p className="text-[10px] text-muted-foreground">
                {isFr ? 'Optionnel — crédits supplémentaires par image générée' : 'Optional — extra credits per generated image'}
              </p>
            </div>
          </div>
          <Switch checked={generateImages} onCheckedChange={setGenerateImages} disabled={converting} />
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

        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
          <p className="text-xs font-medium">{isFr ? 'Brouillon à relire' : 'Reviewable draft'}</p>
          <p className="text-[10px] text-muted-foreground">
            {isFr
              ? 'Le document est extrait, découpé en leçons et en slides avec des quiz issus du texte. Vous relisez tout avant publication.'
              : 'The document is extracted, split into lessons and slides with quizzes grounded in the text. You review everything before publishing.'}
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {isFr ? 'Coût estimé' : 'Estimated cost'}: <span className="font-medium text-foreground">{selectedCost ?? (tier === 'premium' ? 15 : 8)} {isFr ? 'crédits' : 'credits'}</span>
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
