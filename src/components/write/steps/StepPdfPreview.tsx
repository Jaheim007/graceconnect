import { useState, useRef } from 'react';
import { ArrowLeft, Loader2, Eye, BookOpen, ChevronLeft, ChevronRight, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
  saving?: boolean;
}

export function StepPdfPreview({ state, update, onNext, onBack, onSaveDraft, saving }: Props) {
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover
  const scrollRef = useRef<HTMLDivElement>(null);

  const chapters = state.chapters || [];
  const chapterIllustrations = state.chapterIllustrations || {};
  // Pages: cover + each chapter
  const totalPages = 1 + chapters.length;

  const goTo = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentChapter = currentPage > 0 ? chapters[currentPage - 1] : null;
  const currentChapterImage = currentChapter ? chapterIllustrations[currentChapter.id] : null;

  return (
    <div className="space-y-6 pt-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Eye className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          {t('write.pdf_preview_title')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {t('write.pdf_preview_sub')}
        </p>
      </div>

      {/* Book Preview */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
        {/* Top bar */}
        <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-foreground truncate">
            {state.title || t('write.my_book')}
          </span>
          <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
            {currentPage + 1} / {totalPages}
          </span>
        </div>

        {/* Page content */}
        <div
          ref={scrollRef}
          className="overflow-y-auto bg-white dark:bg-zinc-900"
          style={{ height: '65vh', minHeight: '400px' }}
        >
          {currentPage === 0 ? (
            /* ─── COVER PAGE ─── */
            <div className="flex flex-col items-center justify-center min-h-full p-8 text-center gap-6">
              {state.coverUrl ? (
                <img
                  src={state.coverUrl}
                  alt="Cover"
                  className="max-h-[45vh] w-auto rounded-lg shadow-xl object-contain"
                />
              ) : (
                <div className="w-64 h-80 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary/40" />
                </div>
              )}
              <div className="space-y-2 max-w-md">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {state.title || t('write.my_book')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {chapters.length} {chapters.length > 1 ? t('write.chapter_word_plural') : t('write.chapter_word')}
                </p>
                </p>
              </div>
            </div>
          ) : (
            /* ─── CHAPTER PAGE ─── */
            <div className="max-w-2xl mx-auto p-6 sm:p-10 space-y-6">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                {t('write.chapter_label')} {currentPage}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground pb-3 border-b border-border">
                {currentChapter?.title || `${t('write.chapter_label')} ${currentPage}`}
              </h2>

              {currentChapterImage && (
                <figure className="rounded-xl overflow-hidden border border-border bg-muted/20">
                  <img
                    src={currentChapterImage}
                    alt={`Illustration du chapitre ${currentChapter?.title || currentPage}`}
                    className="w-full max-h-[280px] object-cover"
                    loading="lazy"
                  />
                </figure>
              )}

              <div
                className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground/90"
                dangerouslySetInnerHTML={{
                  __html: currentChapter?.content || `<p class="text-muted-foreground italic">${t('write.empty_content')}</p>`,
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 0}
            className="gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> {t('write.prev_chapter')}
          </Button>

          {/* Page dots (max 10 visible) */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentPage
                    ? 'w-4 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
            {totalPages > 12 && (
              <span className="text-[9px] text-muted-foreground ml-1">+{totalPages - 12}</span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="gap-1 text-xs"
          >
            Suivant <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Auto-save notice */}
      <p className="text-xs text-muted-foreground text-center">
        💾 {t('write.autosave_notice') || 'Ton brouillon est enregistré automatiquement.'}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2" disabled={saving}>
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2 cta-glow"
          onClick={onNext}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Publication en cours…
            </>
          ) : (
            <>
              <ArrowRight className="h-5 w-5" />
              Aller à la publication
            </>
          )}
        </Button>
      </div>

      {onSaveDraft && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onSaveDraft} disabled={saving} className="gap-2 text-xs text-muted-foreground">
            <Save className="h-3.5 w-3.5" /> {t('write.save_as_draft')}
          </Button>
        </div>
      )}
    </div>
  );
}
