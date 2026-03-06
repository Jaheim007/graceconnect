import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Edit3, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState, WriteChapter } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function normalizeChapters(chapters: WriteChapter[]): WriteChapter[] {
  return chapters
    .map((chapter, index) => ({
      id: chapter.id || `ch-${index + 1}`,
      title: chapter.title.trim(),
      content: chapter.content.trim(),
    }))
    .filter((chapter) => chapter.title.length > 0);
}

export function StepPreview({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const [chaptersDraft, setChaptersDraft] = useState<WriteChapter[]>(state.chapters);

  useEffect(() => {
    if (state.chapters.length > 0) {
      setChaptersDraft(state.chapters.map((chapter) => ({ ...chapter })));
      return;
    }

    setChaptersDraft([
      {
        id: 'ch-1',
        title: t('write.chapter_default_title'),
        content: '',
      },
    ]);
  }, [state.chapters, t]);

  const normalizedChapters = useMemo(() => normalizeChapters(chaptersDraft), [chaptersDraft]);

  const updateChapterTitle = (index: number, title: string) => {
    setChaptersDraft((prev) => prev.map((chapter, i) => (i === index ? { ...chapter, title } : chapter)));
  };

  const updateChapterContent = (index: number, content: string) => {
    setChaptersDraft((prev) => prev.map((chapter, i) => (i === index ? { ...chapter, content } : chapter)));
  };

  const addChapter = () => {
    setChaptersDraft((prev) => [
      ...prev,
      {
        id: `ch-${Date.now()}`,
        title: `${t('write.chapter_label')} ${prev.length + 1}`,
        content: '',
      },
    ]);
  };

  const removeChapter = (index: number) => {
    setChaptersDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const applyEdits = () => {
    update({ chapters: normalizedChapters });
  };

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          {t('write.preview_title')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('write.preview_sub')}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.preview_edit_title')}</label>
        <Input
          value={state.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder={t('write.title_placeholder')}
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t('write.preview_edit_content')}</label>
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addChapter}>
            <Plus className="h-4 w-4" /> {t('write.add_chapter')}
          </Button>
        </div>

        <div className="space-y-4">
          {chaptersDraft.map((chapter, index) => (
            <div key={chapter.id} className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <div className="flex items-center gap-2">
                <Input
                  value={chapter.title}
                  onChange={(e) => updateChapterTitle(index, e.target.value)}
                  placeholder={`${t('write.chapter_label')} ${index + 1}`}
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChapter(index)}
                  disabled={chaptersDraft.length <= 1}
                  aria-label={t('write.remove_chapter')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={chapter.content}
                onChange={(e) => updateChapterContent(index, e.target.value)}
                rows={6}
                placeholder={t('write.preview_content_hint')}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-primary/20 bg-card overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 p-8 text-center">
          <div className="max-w-[200px] mx-auto aspect-[3/4] rounded-lg bg-gradient-to-br from-primary to-accent flex flex-col items-center justify-center p-4 shadow-xl overflow-hidden">
            <Sparkles className="h-8 w-8 text-primary-foreground/80 mb-3 shrink-0" />
            <h3 className="text-primary-foreground font-extrabold text-sm leading-tight text-center line-clamp-3 break-words">
              {state.title || t('write.my_book')}
            </h3>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('write.toc')}</p>
          {normalizedChapters.map((chapter, i) => (
            <div key={chapter.id} className="flex items-center gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
              <span className="text-xs font-bold text-primary w-6">{i + 1}</span>
              <span className="text-foreground">{chapter.title}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <span>📄 {state.pageCount} {t('write.pages')}</span>
            <span>·</span>
            <span>📘 {state.style === 'ebook' ? t('write.style_ebook') : state.style === 'guide' ? t('write.style_guide') : t('write.style_prayers')}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2"
          disabled={normalizedChapters.length === 0}
          onClick={() => {
            applyEdits();
            onNext();
          }}
        >
          ✅ {t('write.continue')} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Edit3 className="h-3 w-3 inline mr-1" />
        {t('write.preview_edit_note')}
      </p>
    </div>
  );
}


