import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, CheckCircle, Sparkles, BookOpen } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import type { WriteState, WriteChapter } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
}

const DEFAULT_CHAPTERS: Record<string, string[]> = {
  ebook: ['Introduction', 'Chapitre 1 : Les fondamentaux', 'Chapitre 2 : Aller plus loin', 'Chapitre 3 : Mise en pratique', 'Chapitre 4 : Études de cas', 'Chapitre 5 : Stratégies avancées', 'Conclusion'],
  guide: ['Avant de commencer', 'Étape 1 : Préparation', 'Étape 2 : Mise en œuvre', 'Étape 3 : Optimisation', 'Étape 4 : Résultats', 'Ressources supplémentaires', 'Prochaines étapes'],
  prayers: ['Ouverture', 'Prière du matin', 'Méditation de gratitude', 'Prière de guérison', 'Prière de protection', 'Prière du soir', 'Bénédiction finale'],
};

type Phase = 'outline' | 'content' | 'done' | 'error';

export function StepGenerating({ state, update, onNext }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('outline');
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [visibleChapters, setVisibleChapters] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const aborted = useRef(false);
  const ran = useRef(false);

  const chapterTitles = useMemo(() => {
    const chapterKey = `write.ch_${state.style}` as string;
    const translated = t(chapterKey);
    if (translated && translated !== chapterKey) {
      return translated.split(',').map(s => s.trim()).filter(Boolean);
    }
    return DEFAULT_CHAPTERS[state.style] || DEFAULT_CHAPTERS.ebook;
  }, [state.style, t]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    aborted.current = false;

    const generateBook = async () => {
      try {
        // Phase 1: Build outline (instant)
        setPhase('outline');
        const outlineChapters: WriteChapter[] = chapterTitles.map((title, i) => ({
          id: `ch-${i + 1}`,
          title,
          content: '',
        }));
        setTotalChapters(outlineChapters.length);

        // Show chapters appearing one by one
        for (let i = 0; i < outlineChapters.length; i++) {
          if (aborted.current) return;
          await new Promise(r => setTimeout(r, 200));
          setVisibleChapters(prev => [...prev, outlineChapters[i].title]);
        }

        await new Promise(r => setTimeout(r, 500));
        if (aborted.current) return;

        // Phase 2: Generate content via AI
        setPhase('content');

        const { data, error } = await supabase.functions.invoke('generate-book-content', {
          body: {
            title: state.title || t('write.my_book'),
            topic: state.topic || '',
            style: state.style,
            chapters: outlineChapters.map(ch => ({ id: ch.id, title: ch.title })),
            language: 'fr',
          },
        });

        if (aborted.current) return;

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const aiChapters = data?.chapters;
        if (!Array.isArray(aiChapters) || aiChapters.length === 0) {
          throw new Error('No chapters returned from AI');
        }

        // Merge AI content with our outline, progressively revealing
        const finalChapters: WriteChapter[] = [];
        for (let i = 0; i < outlineChapters.length; i++) {
          if (aborted.current) return;
          const aiChapter = aiChapters.find((ac: any) => ac.id === outlineChapters[i].id) || aiChapters[i];
          finalChapters.push({
            id: outlineChapters[i].id,
            title: aiChapter?.title || outlineChapters[i].title,
            content: aiChapter?.content || '',
          });
          setGeneratedCount(i + 1);
          await new Promise(r => setTimeout(r, 300));
        }

        if (aborted.current) return;

        // Phase 3: Done
        setPhase('done');
        update({ chapters: finalChapters });
        setTimeout(() => {
          if (!aborted.current) onNext();
        }, 800);

      } catch (err: any) {
        console.error('Book generation error:', err);
        if (aborted.current) return;
        setPhase('error');
        setErrorMsg(err.message || 'Generation failed');

        // Fallback: use chapters without AI content so user can still proceed
        const fallbackChapters: WriteChapter[] = chapterTitles.map((title, i) => ({
          id: `ch-${i + 1}`,
          title,
          content: `<p>${t('write.fallback_content_hint')}</p>`,
        }));
        update({ chapters: fallbackChapters });
        setTimeout(() => {
          if (!aborted.current) onNext();
        }, 2000);
      }
    };

    generateBook();

    return () => { aborted.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = phase === 'outline'
    ? Math.min(20, (visibleChapters.length / Math.max(1, chapterTitles.length)) * 20)
    : phase === 'content'
      ? 20 + (generatedCount / Math.max(1, totalChapters)) * 70
      : phase === 'done' ? 100 : 0;

  return (
    <div className="space-y-8 pt-16 text-center">
      <div className="space-y-4">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
          {phase === 'done' ? (
            <CheckCircle className="h-10 w-10 text-primary" />
          ) : phase === 'error' ? (
            <BookOpen className="h-10 w-10 text-destructive" />
          ) : (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          )}
        </div>

        <h2 className="text-2xl font-extrabold">
          {phase === 'outline' && t('write.generating_outline')}
          {phase === 'content' && t('write.generating_content')}
          {phase === 'done' && t('write.book_created')}
          {phase === 'error' && t('write.generation_error')}
        </h2>

        <p className="text-sm text-muted-foreground">
          {phase === 'outline' && t('write.generating_outline_sub')}
          {phase === 'content' && `${t('write.generating_content_sub')} (${generatedCount}/${totalChapters})`}
          {phase === 'done' && t('write.generation_done_sub')}
          {phase === 'error' && errorMsg}
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-2">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </div>

      <div className="text-left max-w-sm mx-auto space-y-2">
        {visibleChapters.map((ch, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-300"
          >
            {phase === 'content' && i < generatedCount ? (
              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : phase === 'content' && i === generatedCount ? (
              <Loader2 className="h-3.5 w-3.5 text-primary shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span className={`text-foreground ${phase === 'content' && i < generatedCount ? 'font-medium' : ''}`}>{ch}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        « <strong className="text-foreground">{state.title || t('write.my_book')}</strong> » — {state.pageCount} {t('write.pages')}
      </p>
    </div>
  );
}
