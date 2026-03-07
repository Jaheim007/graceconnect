import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import type { WriteState, WriteChapter } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

type Phase = 'thinking' | 'generating' | 'done' | 'error';

function getPlainText(content: string) {
  return content
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasExistingGeneratedChapters(chapters: WriteChapter[]) {
  if (!Array.isArray(chapters) || chapters.length === 0) return false;

  return chapters.some((chapter) => {
    const title = (chapter.title || '').trim();
    const content = getPlainText(chapter.content || '');
    return title.length > 0 || content.length > 0;
  });
}

export function StepGenerating({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('thinking');
  const [visibleChapters, setVisibleChapters] = useState<string[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [thinkingProgress, setThinkingProgress] = useState(12);
  const aborted = useRef(false);
  const ran = useRef(false);

  useEffect(() => {
    if (phase !== 'thinking') return;
    const id = window.setInterval(() => {
      setThinkingProgress((prev) => {
        if (prev >= 65) return prev;
        return prev + (prev < 35 ? 4 : 2);
      });
    }, 900);

    return () => window.clearInterval(id);
  }, [phase]);

  const invokeGeneration = async (requestedPageCount: number) => {
    const generationPromise = supabase.functions.invoke('generate-book-content', {
      body: {
        title: state.title || t('write.my_book'),
        topic: state.topic || state.title || '',
        style: state.style,
        pageCount: requestedPageCount,
        language: state.language || 'fr',
        tone: state.tone || 'professional',
        languageLevel: state.languageLevel || 'intermediate',
        targetAudience: state.targetAudience || 'general',
        styleReference: state.styleReference || '',
        editorialStrategy: state.editorialStrategy || null,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Generation timeout. Please retry.')), 95_000);
    });

    return Promise.race([generationPromise, timeoutPromise]) as Promise<Awaited<typeof generationPromise>>;
  };

  const continueWithoutAi = () => {
    const fallbackChapters: WriteChapter[] = [
      { id: 'ch-1', title: 'Introduction', content: `<p>${t('write.fallback_content_hint')}</p>` },
      { id: 'ch-2', title: 'Développement', content: `<p>${t('write.fallback_content_hint')}</p>` },
      { id: 'ch-3', title: 'Conclusion', content: `<p>${t('write.fallback_content_hint')}</p>` },
    ];
    update({ chapters: fallbackChapters });
    onNext();
  };

  const runGeneration = async () => {
    try {
      setPhase('thinking');
      setThinkingProgress(12);
      setVisibleChapters([]);
      setTotalChapters(0);
      setErrorMsg('');

      const attemptPageCounts = Array.from(new Set([
        state.pageCount,
        Math.max(12, Math.round(state.pageCount * 0.7)),
      ]));

      let aiChapters: any[] | null = null;
      let lastError: Error | null = null;

      for (const pageCount of attemptPageCounts) {
        if (aborted.current) return;

        try {
          const { data, error } = await invokeGeneration(pageCount);
          if (aborted.current) return;
          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          if (!Array.isArray(data?.chapters) || data.chapters.length === 0) {
            throw new Error('No chapters returned from AI');
          }

          aiChapters = data.chapters;
          break;
        } catch (err: any) {
          lastError = err instanceof Error ? err : new Error(err?.message || 'Generation failed');
        }
      }

      if (!aiChapters || aiChapters.length === 0) {
        throw (lastError ?? new Error('Generation failed'));
      }

      setPhase('generating');
      setTotalChapters(aiChapters.length);

      const finalChapters: WriteChapter[] = [];
      for (let i = 0; i < aiChapters.length; i++) {
        if (aborted.current) return;

        const chapter = aiChapters[i];
        const safeTitle = (chapter?.title || `Chapitre ${i + 1}`).trim();
        finalChapters.push({
          id: chapter?.id || `ch-${i + 1}`,
          title: safeTitle,
          content: chapter?.content || '',
        });

        setVisibleChapters((prev) => [...prev, safeTitle]);
        await new Promise((resolve) => setTimeout(resolve, 220));
      }

      if (aborted.current) return;

      setPhase('done');
      update({ chapters: finalChapters });
      setTimeout(() => {
        if (!aborted.current) onNext();
      }, 700);
    } catch (err: any) {
      console.error('Book generation error:', err);
      if (aborted.current) return;
      setPhase('error');
      setErrorMsg(err?.message || 'Generation failed');
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    aborted.current = false;

    if (hasExistingGeneratedChapters(state.chapters)) {
      setPhase('done');
      setVisibleChapters(state.chapters.map((ch, i) => ch.title?.trim() || `Chapitre ${i + 1}`));
      setTotalChapters(state.chapters.length);
      setTimeout(() => {
        if (!aborted.current) onNext();
      }, 180);
      return;
    }

    void runGeneration();

    return () => {
      aborted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = phase === 'thinking'
    ? thinkingProgress
    : phase === 'generating'
      ? 20 + (visibleChapters.length / Math.max(1, totalChapters)) * 70
      : phase === 'done'
        ? 100
        : 0;

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
          {phase === 'thinking' && t('write.generating_outline')}
          {phase === 'generating' && t('write.generating_content')}
          {phase === 'done' && t('write.book_created')}
          {phase === 'error' && t('write.generation_error')}
        </h2>

        <p className="text-sm text-muted-foreground">
          {phase === 'thinking' && t('write.generating_outline_sub')}
          {phase === 'generating' && t('write.generating_content_sub')}
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

      {visibleChapters.length > 0 && (
        <div className="text-left max-w-sm mx-auto space-y-2">
          {visibleChapters.map((ch, i) => (
            <div
              key={`${ch}-${i}`}
              className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-foreground font-medium">{ch}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>

        {phase === 'error' && (
          <>
            <Button onClick={() => void runGeneration()} className="gap-2">
              <Loader2 className="h-4 w-4" />
              {t('write.ai_regenerate')}
            </Button>
            <Button variant="outline" onClick={continueWithoutAi}>
              Continuer sans IA
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        « <strong className="text-foreground">{state.title || t('write.my_book')}</strong> » — {state.pageCount} {t('write.pages')}
      </p>
    </div>
  );
}
