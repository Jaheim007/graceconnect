import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState, WriteChapter } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
}

function buildChapterContent(state: WriteState, chapterTitle: string, index: number): string {
  const topic = (state.topic || state.title || 'votre sujet').trim();
  const styleContext =
    state.style === 'guide'
      ? 'guide pratique'
      : state.style === 'prayers'
        ? 'parcours spirituel'
        : 'livre structuré';

  return [
    `Ce chapitre « ${chapterTitle} » introduit un point clé de ce ${styleContext} autour de « ${topic} ».`,
    `Objectif : aider le lecteur à comprendre les notions essentielles, puis à passer à l'action avec des exemples concrets.`,
    `Conseil pratique : relis cette section et adapte-la avec tes expériences personnelles avant publication finale.`,
    `Section ${index + 1}/${Math.max(1, state.pageCount)} — brouillon éditable.`,
  ].join('\n\n');
}

export function StepGenerating({ state, update, onNext }: Props) {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [visibleChapters, setVisibleChapters] = useState<string[]>([]);
  const done = useRef(false);
  const updateRef = useRef(update);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    updateRef.current = update;
    onNextRef.current = onNext;
  }, [update, onNext]);

  const aiWriting = t('write.ai_writing');
  const bookCreated = t('write.book_created');
  const chapterKey = `write.ch_${state.style}` as string;
  const chapterTranslation = t(chapterKey);
  const defaultChapters = t('write.ch_ebook');

  const motivationalMessages = useMemo(() => [
    '✨ ' + aiWriting.replace('…', '') + '…',
    '📝 ' + aiWriting,
    '🎯 ' + aiWriting,
    '🔥 ' + aiWriting,
    '📖 ' + aiWriting,
    '🚀 ' + bookCreated.replace('✅ ', ''),
  ], [aiWriting, bookCreated]);

  const chapterDrafts = useMemo<WriteChapter[]>(() => {
    const resolved = chapterTranslation !== chapterKey ? chapterTranslation : defaultChapters;

    return resolved
      .split(',')
      .map((ch) => ch.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: `ch-${index + 1}`,
        title,
        content: buildChapterContent(state, title, index),
      }));
  }, [chapterTranslation, defaultChapters, chapterKey, state]);

  useEffect(() => {
    done.current = false;
    setProgress(0);
    setMsgIndex(0);
    setVisibleChapters([]);

    const totalDuration = 6000;
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      const chapterIdx = Math.floor((pct / 100) * chapterDrafts.length);
      setVisibleChapters(chapterDrafts.slice(0, chapterIdx).map((chapter) => chapter.title));

      const mi = Math.floor((pct / 100) * motivationalMessages.length);
      setMsgIndex(Math.min(mi, motivationalMessages.length - 1));

      if (pct >= 100 && !done.current) {
        done.current = true;
        clearInterval(timer);
        updateRef.current({ chapters: chapterDrafts });
        setTimeout(() => onNextRef.current(), 800);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [chapterDrafts, motivationalMessages]);

  return (
    <div className="space-y-8 pt-16 text-center">
      <div className="space-y-4">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
          {progress < 100 ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <CheckCircle className="h-10 w-10 text-primary" />
          )}
        </div>

        <h2 className="text-2xl font-extrabold">
          {progress < 100 ? aiWriting : bookCreated}
        </h2>

        <p className="text-sm text-muted-foreground animate-pulse">
          {motivationalMessages[msgIndex]}
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-2">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
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
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-foreground">{ch}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        « <strong className="text-foreground">{state.title || t('write.my_book')}</strong> » — {state.pageCount} {t('write.pages')}
      </p>
    </div>
  );
}

