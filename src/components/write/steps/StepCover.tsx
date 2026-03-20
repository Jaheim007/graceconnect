import { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';
import type { WriteState } from '../WriteWizard';

const COVER_GRADIENTS = [
  'from-primary to-accent',
  'from-violet-600 to-pink-500',
  'from-emerald-600 to-teal-400',
  'from-orange-500 to-red-500',
  'from-blue-600 to-cyan-400',
  'from-rose-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-indigo-600 to-blue-400',
];

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCover({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const { showCreditDialog, setShowCreditDialog, creditErrorMessage, handleAiError, refreshCredits } = useCreditGuard();

  const handleCoverUrlChange = (url: string) => {
    update({
      coverUrl: url,
      coverFile: null,
      coverTemplate: url ? -1 : state.coverTemplate,
    });
  };

  const handleAiGenerate = async () => {
    if (!state.title) {
      toast({ title: 'Veuillez d\'abord saisir un titre', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Session expirée. Reconnecte-toi puis réessaie.');
      }

      const { data, error } = await supabase.functions.invoke('ai-generate-cover', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          product_id: state.productId || crypto.randomUUID(),
          title: state.title,
          product_type: state.style === 'ebook' ? 'ebook' : 'pdf',
          description: state.topic || state.subtitle || '',
          tier: 'standard',
          author_name: state.authorName || '',
          book_style: state.style || '',
        },
      });

      if (error) {
        let errorMsg = (error as any)?.message || 'Erreur de génération';
        let errorStatus: number | undefined = (error as any)?.context?.status;

        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            errorMsg = body?.error || errorMsg;
          } catch {
            // ignore parse error
          }
        }

        if (errorStatus === 401 || /unauthorized/i.test(errorMsg)) {
          errorMsg = 'Session expirée. Reconnecte-toi puis réessaie.';
        }

        if (handleAiError({ message: errorMsg, status: errorStatus })) return;
        const parsedErr = new Error(errorMsg);
        (parsedErr as any).status = errorStatus;
        throw parsedErr;
      }

      if (data?.error) {
        const status = data.error.includes('insuffisant') || data.error.includes('credits') ? 402 : undefined;
        if (handleAiError({ message: data.error, status })) return;
        throw new Error(data.error);
      }

      if (!data?.cover_url) {
        throw new Error('Aucune couverture générée. Réessaie.');
      }

      if (data?.cover_url) {
        update({ coverUrl: data.cover_url, coverFile: null, coverTemplate: -1 });
        refreshCredits();
        toast({ title: '✨ Couverture générée avec succès !' });
      }
    } catch (err: any) {
      if (!handleAiError(err)) {
        toast({ title: err?.message || 'Erreur lors de la génération', variant: 'destructive' });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pt-8">
      {state.title && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">📖 {state.title}</p>
        </div>
      )}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.cover_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.cover_sub')}</p>
      </div>

      {/* AI Generate button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={handleAiGenerate}
          disabled={generating || !state.title}
          className="gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération en cours…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              ✨ Générer la couverture avec l'IA
            </>
          )}
        </Button>
      </div>

      {/* Upload / Canva */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">{t('write.cover_upload_label')}</p>
        <ImageUploader
          value={state.coverUrl || ''}
          onChange={handleCoverUrlChange}
          folder="book-covers"
          label={t('write.cover_title')}
          aspectRatio="book"
          showCanva={true}
        />
      </div>

      {!state.coverUrl && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">{t('write.or_choose_template') || 'Ou choisissez un style provisoire :'}</p>
          <div className="grid grid-cols-4 gap-3">
            {COVER_GRADIENTS.map((gradient, i) => (
              <button
                key={i}
                onClick={() => update({ coverTemplate: i, coverFile: null, coverUrl: '' })}
                className={cn(
                  'aspect-[3/4] rounded-xl bg-gradient-to-br flex flex-col items-center justify-center p-2 transition-all border-2',
                  gradient,
                  state.coverTemplate === i && !state.coverFile && !state.coverUrl
                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                    : 'border-transparent hover:scale-105'
                )}
              >
                <Sparkles className="h-4 w-4 text-white/80 mb-1" />
                <p className="text-white font-bold text-[8px] leading-tight text-center line-clamp-2">
                  {state.title || t('write.my_book')}
                </p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
            {t('write.cover_template_warning')}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button size="lg" className="flex-1 h-14 text-base gap-2" onClick={onNext}>
          {t('write.continue')} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <InsufficientCreditsDialog
        open={showCreditDialog}
        onOpenChange={setShowCreditDialog}
        message={creditErrorMessage}
      />
    </div>
  );
}
