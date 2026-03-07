import { useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, SkipForward, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ILLUSTRATION_STYLES = ['children_book', 'watercolor', 'cartoon', 'realistic'] as const;
type IllustrationStyle = typeof ILLUSTRATION_STYLES[number];

export function StepIllustrations({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [artStyle, setArtStyle] = useState<IllustrationStyle>('children_book');
  const [generatingAll, setGeneratingAll] = useState(false);

  const chapters = state.chapters || [];
  const illustrations = state.chapterIllustrations || {};
  const illustratedCount = Object.keys(illustrations).length;

  // Check if this book style benefits from illustrations
  const needsIllustrations = ['story', 'activity'].includes(state.style) || state.targetAudience === 'children';

  const styleLabels: Record<IllustrationStyle, string> = {
    children_book: t('write.illust_style_children') || 'Livre enfant',
    watercolor: t('write.illust_style_watercolor') || 'Aquarelle',
    cartoon: t('write.illust_style_cartoon') || 'Cartoon',
    realistic: t('write.illust_style_realistic') || 'Réaliste',
  };

  const generateIllustration = async (chapterId: string, chapterTitle: string, chapterContent: string) => {
    setGenerating(chapterId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-illustration', {
        body: {
          bookTitle: state.title || '',
          chapterTitle,
          chapterSummary: chapterContent.replace(/<[^>]*>/g, ' ').slice(0, 500),
          artStyle,
          audience: state.targetAudience || 'general',
          bookStyle: state.style,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error('No image returned');

      const updated = { ...illustrations, [chapterId]: data.imageUrl };
      update({ chapterIllustrations: updated });
      toast({ title: `🎨 ${t('write.illust_generated') || 'Illustration générée !'}` });
    } catch (err: any) {
      console.error('Illustration generation error:', err);
      toast({ title: '❌ Erreur', description: err?.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    for (const chapter of chapters) {
      if (illustrations[chapter.id]) continue; // skip already generated
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

      {/* Art style selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.illust_art_style') || 'Style artistique'}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

      {/* Generate all button */}
      <Button
        onClick={generateAll}
        disabled={generatingAll || !!generating}
        className="w-full gap-2"
        variant="outline"
      >
        {generatingAll ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {t('write.illust_generating_all') || 'Génération en cours...'}</>
        ) : (
          <><Sparkles className="h-4 w-4" /> {t('write.illust_generate_all') || `Générer toutes les illustrations (${chapters.length - illustratedCount} restantes)`}</>
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
    </div>
  );
}
