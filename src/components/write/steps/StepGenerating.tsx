import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle, Sparkles, BookOpen } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import type { WriteState, WriteChapter } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
}

type Phase = 'thinking' | 'generating' | 'done' | 'error';

export function StepGenerating({ state, update, onNext }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('thinking');
  const [visibleChapters, setVisibleChapters] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const aborted = useRef(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    aborted.current = false;

    // If chapters already exist (user navigated back), skip regeneration
    if (state.chapters && state.chapters.length > 0 && state.chapters[0].content.length > 30) {
      setPhase('done');
      setVisibleChapters(state.chapters.map(ch => ch.title));
      setTimeout(() => {
        if (!aborted.current) onNext();
      }, 400);
      return;
    }

    const generateBook = async () => {
      try {
        setPhase('thinking');

        // Call AI to generate chapters based on user's TOPIC, not style templates
        const { data, error } = await supabase.functions.invoke('generate-book-content', {
          body: {
            title: state.title || t('write.my_book'),
            topic: state.topic || state.title || '',
            style: state.style,
            pageCount: state.pageCount,
            language: state.language || 'fr',
            tone: state.tone || 'professional',
            languageLevel: state.languageLevel || 'intermediate',
            targetAudience: state.targetAudience || 'general',
            styleReference: state.styleReference || '',
          },
        });

        if (aborted.current) return;
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const aiChapters = data?.chapters;
        if (!Array.isArray(aiChapters) || aiChapters.length === 0) {
          throw new Error('No chapters returned from AI');
        }

        setPhase('generating');

        // Progressively reveal chapters
        const finalChapters: WriteChapter[] = [];
        for (let i = 0; i < aiChapters.length; i++) {
          if (aborted.current) return;
          const ch = aiChapters[i];
          finalChapters.push({
            id: ch.id || `ch-${i + 1}`,
            title: ch.title || `Chapitre ${i + 1}`,
            content: ch.content || '',
          });
          setVisibleChapters(prev => [...prev, ch.title]);
          await new Promise(r => setTimeout(r, 300));
        }

        if (aborted.current) return;

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

        // Fallback: create minimal chapters so user can proceed
        const fallbackChapters: WriteChapter[] = [
          { id: 'ch-1', title: 'Introduction', content: `<p>${t('write.fallback_content_hint')}</p>` },
          { id: 'ch-2', title: 'Développement', content: `<p>${t('write.fallback_content_hint')}</p>` },
          { id: 'ch-3', title: 'Conclusion', content: `<p>${t('write.fallback_content_hint')}</p>` },
        ];
        update({ chapters: fallbackChapters });
        setTimeout(() => {
          if (!aborted.current) onNext();
        }, 2000);
      }
    };

    generateBook();
    return () => { aborted.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = phase === 'thinking' ? 15
    : phase === 'generating' ? 20 + (visibleChapters.length / Math.max(1, visibleChapters.length + 1)) * 70
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
              key={i}
              className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-foreground font-medium">{ch}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        « <strong className="text-foreground">{state.title || t('write.my_book')}</strong> » — {state.pageCount} {t('write.pages')}
      </p>
    </div>
  );
}
