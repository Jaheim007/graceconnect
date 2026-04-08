import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, SkipForward, Sparkles, RefreshCw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';
import { useCreditsBalance } from '@/hooks/useCredits';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ILLUSTRATION_STYLES = ['children_book', 'watercolor', 'cartoon', 'realistic', 'line_art'] as const;
type IllustrationStyle = typeof ILLUSTRATION_STYLES[number];

export function StepIllustrations({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [artStyle, setArtStyle] = useState<IllustrationStyle>('children_book');
  const [generatingAll, setGeneratingAll] = useState(false);
  const { showCreditDialog, setShowCreditDialog, creditErrorMessage, handleAiError, refreshCredits } = useCreditGuard();
  const { data: creditSummary } = useCreditsBalance();
  
  // Illustrations are a Premium feature — only available if user has purchased credits
  const hasPurchasedCredits = (creditSummary?.purchased_remaining ?? 0) > 0;

  const chapters = state.chapters || [];
  const illustrations = state.chapterIllustrations || {};
  const illustrationsRef = useRef<Record<string, string>>(illustrations);

  useEffect(() => {
    illustrationsRef.current = state.chapterIllustrations || {};
  }, [state.chapterIllustrations]);

  const illustratedCount = chapters.filter((chapter) => Boolean(illustrations[chapter.id])).length;

  // Check if this book style benefits from illustrations
  const needsIllustrations = ['story', 'activity', 'coloring'].includes(state.style) || state.targetAudience === 'children';

  const styleLabels: Record<IllustrationStyle, string> = {
    children_book: t('write.illust_style_children') || 'Livre enfant',
    watercolor: t('write.illust_style_watercolor') || 'Aquarelle',
    cartoon: t('write.illust_style_cartoon') || 'Cartoon',
    realistic: t('write.illust_style_realistic') || 'Réaliste',
    line_art: t('write.illust_style_line_art') || 'Coloriage (line art)',
  };

  // Auto-select line_art for coloring books
  const isColoringBook = state.style === 'coloring';
  const effectiveArtStyle = isColoringBook ? 'line_art' : artStyle;

  const parseInvokeError = async (error: any): Promise<{ message: string; status?: number }> => {
    try {
      const ctx = error?.context;
      const status = ctx?.status || (typeof error?.status === 'number' ? error.status : undefined);
      
      // Try to parse JSON body from the response context
      if (ctx && typeof ctx.json === 'function') {
        const details = await ctx.json().catch(() => null);
        if (details?.error) return { message: details.error, status };
      }
      // Also try .text() as fallback
      if (ctx && typeof ctx.text === 'function' && !ctx.bodyUsed) {
        const txt = await ctx.text().catch(() => '');
        try {
          const parsed = JSON.parse(txt);
          if (parsed?.error) return { message: parsed.error, status };
        } catch { /* not JSON */ }
      }

      if (status === 402) return { message: 'Crédits insuffisants', status: 402 };
      if (status === 401) return { message: 'Session expirée. Reconnecte-toi.', status: 401 };
      if (status === 429) return { message: 'Trop de requêtes. Réessaie dans un instant.', status: 429 };
      
      // Detect 402 from generic Supabase error message
      const msg = error?.message || '';
      if (msg.includes('non-2xx') || msg.includes('Edge Function')) {
        // If we have the status from context, use it
        if (status) return { message: status === 402 ? 'Crédits insuffisants' : `Erreur serveur (${status})`, status };
      }
      
      return { message: msg || 'Erreur de connexion au serveur', status };
    } catch {
      return { message: error?.message || 'Erreur inconnue' };
    }
  };

  const generateIllustration = async (chapterId: string, chapterTitle: string, chapterContent: string) => {
    setGenerating(chapterId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Session expirée. Reconnecte-toi puis réessaie.');
      }

      const { data, error } = await supabase.functions.invoke('generate-illustration', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          bookTitle: state.title || '',
          chapterTitle,
          chapterSummary: chapterContent.replace(/<[^>]*>/g, ' ').slice(0, 500),
          artStyle: effectiveArtStyle,
          audience: state.targetAudience || 'general',
          bookStyle: state.style,
        },
      });

      if (error) {
        const parsed = await parseInvokeError(error);
        const err = new Error(parsed.message);
        (err as any).status = parsed.status;
        throw err;
      }
      if (data?.error) {
        const err = new Error(data.error);
        if (data.error.includes('insuffisant') || data.error.includes('insufficient')) (err as any).status = 402;
        throw err;
      }
      if (!data?.imageUrl) throw new Error('Aucune image générée. Réessaie.');

      const updated = { ...illustrationsRef.current, [chapterId]: data.imageUrl };
      illustrationsRef.current = updated;
      update({ chapterIllustrations: updated });
      refreshCredits();
      toast({ title: `🎨 ${t('write.illust_generated') || 'Illustration générée !'}` });
    } catch (err: any) {
      console.error('Illustration generation error:', err);
      if (!handleAiError(err)) {
        const friendlyMsg = err?.message?.includes('Edge Function')
          ? (t('write.illust_server_error') || 'Le serveur est temporairement indisponible. Réessaie dans un instant.')
          : err?.message || 'Erreur inconnue';
        toast({ title: '❌ Erreur', description: friendlyMsg, variant: 'destructive' });
      }
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    for (const chapter of chapters) {
      if (illustrationsRef.current[chapter.id]) continue; // skip already generated
      await generateIllustration(chapter.id, chapter.title, chapter.content);
    }
    setGeneratingAll(false);
  };

  return (
    <div className="space-y-6 pt-8">
      <div className="text-center space-y-2">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <ImagePlus className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-extrabold">{t('write.illust_title') || '🎨 Illustrations'}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('write.illust_sub') || 'Génère des illustrations IA pour chaque chapitre de ton livre.'}
        </p>
      </div>

      {/* Premium gate */}
      {!hasPurchasedCredits && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-center space-y-3">
          <Lock className="h-8 w-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-sm">
            {t('write.illust_premium_title') || '✨ Fonctionnalité Premium'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t('write.illust_premium_desc') || 'Les illustrations IA sont réservées aux utilisateurs ayant acheté un pack de crédits. Achetez des crédits pour débloquer cette fonctionnalité.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => window.open('/admin/credits', '_blank')} className="gap-2">
            {t('write.illust_buy_credits') || 'Acheter des crédits'}
          </Button>
        </div>
      )}

      {hasPurchasedCredits && <>
      {/* Art style selection — hidden for coloring books (forced to line_art) */}
      {!isColoringBook && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('write.illust_art_style') || 'Style artistique'}</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ILLUSTRATION_STYLES.map((s) => (
              <button
                key={s}
                onClick={() => setArtStyle(s)}
                className={`p-3 rounded-xl border-2 text-center transition-all text-xs font-semibold ${
                  artStyle === s
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/30 text-muted-foreground'
                }`}
              >
                {styleLabels[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {isColoringBook && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-primary">
            🖍️ {t('write.coloring_auto_line_art') || 'Mode coloriage activé — les illustrations seront générées en line art noir & blanc'}
          </p>
        </div>
      )}

      {/* Generate all button */}
      <Button
        onClick={generateAll}
        disabled={generatingAll || !!generating || chapters.length === 0}
        className="w-full gap-2"
        variant="outline"
      >
        {generatingAll ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {t('write.illust_generating_all') || 'Génération en cours...'}</>
        ) : (
          <><Sparkles className="h-4 w-4" /> {t('write.illust_generate_all') || `Générer toutes les illustrations (${Math.max(0, chapters.length - illustratedCount)} restantes)`}</>
        )}
      </Button>

      {/* Chapter illustration cards */}
      <div className="space-y-3">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-4">
              {/* Illustration preview */}
              <div className="w-24 h-24 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {illustrations[chapter.id] ? (
                  <img
                    src={illustrations[chapter.id]}
                    alt={chapter.title}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>

              {/* Chapter info + actions */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{chapter.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {chapter.content.replace(/<[^>]*>/g, ' ').slice(0, 120)}...
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={illustrations[chapter.id] ? 'ghost' : 'outline'}
                    className="gap-1 text-xs h-7"
                    disabled={generating === chapter.id || generatingAll}
                    onClick={() => generateIllustration(chapter.id, chapter.title, chapter.content)}
                  >
                    {generating === chapter.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : illustrations[chapter.id] ? (
                      <RefreshCw className="h-3 w-3" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {illustrations[chapter.id]
                      ? (t('write.illust_regenerate') || 'Régénérer')
                      : (t('write.illust_generate') || 'Générer')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {illustratedCount > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          🎨 {illustratedCount}/{chapters.length} {t('write.illust_progress') || 'illustrations générées'}
        </p>
      )}
      </>}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('common.back') || 'Retour'}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2"
          onClick={onNext}
        >
          {needsIllustrations && illustratedCount === 0 ? (
            <><SkipForward className="h-4 w-4" /> {t('write.illust_skip') || 'Passer'}</>
          ) : (
            <><ArrowRight className="h-4 w-4" /> {t('write.continue') || 'Continuer'}</>
          )}
        </Button>
      </div>
      <InsufficientCreditsDialog open={showCreditDialog} onOpenChange={setShowCreditDialog} message={creditErrorMessage} />
    </div>
  );
}
