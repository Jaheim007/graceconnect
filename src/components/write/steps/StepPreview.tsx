import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Edit3, Plus, Trash2, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
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
  const [activeChapter, setActiveChapter] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(state.title);

  useEffect(() => {
    if (state.chapters.length > 0) {
      setChaptersDraft(state.chapters.map((chapter) => ({ ...chapter })));
      return;
    }
    setChaptersDraft([{
      id: 'ch-1',
      title: t('write.chapter_default_title'),
      content: '',
    }]);
  }, [state.chapters, t]);

  useEffect(() => {
    setTitleDraft(state.title);
  }, [state.title]);

  const normalizedChapters = useMemo(() => normalizeChapters(chaptersDraft), [chaptersDraft]);
  const currentChapter = chaptersDraft[activeChapter] || chaptersDraft[0];

  const updateChapterTitle = (index: number, title: string) => {
    setChaptersDraft((prev) => prev.map((ch, i) => (i === index ? { ...ch, title } : ch)));
  };

  const updateChapterContent = (index: number, content: string) => {
    setChaptersDraft((prev) => prev.map((ch, i) => (i === index ? { ...ch, content } : ch)));
  };

  const addChapter = () => {
    const newChapter = {
      id: `ch-${Date.now()}`,
      title: `${t('write.chapter_label')} ${chaptersDraft.length + 1}`,
      content: '',
    };
    setChaptersDraft((prev) => [...prev, newChapter]);
    setActiveChapter(chaptersDraft.length);
  };

  const removeChapter = (index: number) => {
    if (chaptersDraft.length <= 1) return;
    setChaptersDraft((prev) => prev.filter((_, i) => i !== index));
    if (activeChapter >= chaptersDraft.length - 1) {
      setActiveChapter(Math.max(0, chaptersDraft.length - 2));
    }
  };

  const applyEdits = () => {
    update({ title: titleDraft, chapters: normalizedChapters });
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.preview_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.preview_sub')}</p>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left: Book preview card + TOC */}
        <div className="space-y-4">
          {/* Mini book cover */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 p-6 flex justify-center">
              <div className="w-[140px] aspect-[3/4] rounded-lg bg-gradient-to-br from-primary to-accent flex flex-col items-center justify-center p-3 shadow-xl">
                <Sparkles className="h-6 w-6 text-primary-foreground/80 mb-2 shrink-0" />
                <h3 className="text-primary-foreground font-extrabold text-[10px] leading-tight text-center line-clamp-3 break-words">
                  {titleDraft || t('write.my_book')}
                </h3>
              </div>
            </div>

            {/* Editable title */}
            <div className="px-4 pt-3 pb-2">
              {editingTitle ? (
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                  autoFocus
                  className="h-9 text-sm font-bold"
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="w-full text-left group flex items-center gap-1"
                >
                  <span className="font-bold text-sm text-foreground truncate">
                    {titleDraft || t('write.my_book')}
                  </span>
                  <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              )}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                <span>📄 {state.pageCount} {t('write.pages')}</span>
                <span>·</span>
                <span>📘 {state.style === 'ebook' ? t('write.style_ebook') : state.style === 'guide' ? t('write.style_guide') : t('write.style_prayers')}</span>
              </div>
            </div>

            {/* Table of contents */}
            <div className="border-t border-border">
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('write.toc')}
                </p>
              </div>
              <ScrollArea className="max-h-[240px]">
                <div className="px-2 pb-2 space-y-0.5">
                  {chaptersDraft.map((chapter, i) => (
                    <button
                      key={chapter.id}
                      onClick={() => setActiveChapter(i)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                        activeChapter === i
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-[10px] font-bold w-4 shrink-0 text-center">
                        {i + 1}
                      </span>
                      <span className="truncate flex-1">{chapter.title || '—'}</span>
                      {activeChapter === i && (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="px-3 pb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1 text-xs h-8"
                  onClick={addChapter}
                >
                  <Plus className="h-3 w-3" /> {t('write.add_chapter')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chapter editor */}
        <div className="space-y-4">
          {currentChapter && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Chapter header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <Input
                  value={currentChapter.title}
                  onChange={(e) => updateChapterTitle(activeChapter, e.target.value)}
                  placeholder={`${t('write.chapter_label')} ${activeChapter + 1}`}
                  className="h-8 text-sm font-semibold border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeChapter(activeChapter)}
                  disabled={chaptersDraft.length <= 1}
                  aria-label={t('write.remove_chapter')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Rich text editor */}
              <div className="p-4">
                <RichTextEditor
                  value={currentChapter.content}
                  onChange={(html) => updateChapterContent(activeChapter, html)}
                  placeholder={t('write.preview_content_hint')}
                  showAIButton={true}
                />
              </div>

              {/* Chapter navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeChapter === 0}
                  onClick={() => setActiveChapter(prev => prev - 1)}
                  className="gap-1 text-xs"
                >
                  <ArrowLeft className="h-3 w-3" /> {t('write.prev_chapter') || 'Précédent'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {activeChapter + 1} / {chaptersDraft.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeChapter === chaptersDraft.length - 1}
                  onClick={() => setActiveChapter(prev => prev + 1)}
                  className="gap-1 text-xs"
                >
                  {t('write.next_chapter') || 'Suivant'} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3 pt-2">
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
