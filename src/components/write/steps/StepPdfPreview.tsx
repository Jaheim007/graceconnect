import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Save, Loader2, Eye, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
  saving?: boolean;
}

type PreviewPhase = 'generating' | 'ready' | 'error';

export function StepPdfPreview({ state, update, onNext, onBack, saving }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<PreviewPhase>('generating');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // If we already have a preview PDF blob URL, show it
    if (state.previewPdfUrl) {
      setPdfBlobUrl(state.previewPdfUrl);
      setPhase('ready');
      return;
    }

    const generatePreviewPdf = async () => {
      try {
        setPhase('generating');

        // We generate a preview PDF using the chapters data directly
        const { data, error } = await supabase.functions.invoke('ai-generate-pdf', {
          body: {
            chapters: state.chapters.map((ch, i) => ({
              id: ch.id,
              title: ch.title,
              content: ch.content,
              order: i,
            })),
            title: state.title || t('write.my_book'),
            style: state.style,
            page_size: 'A4',
            format: 'ebook',
            preview_only: true,
            cover_url: state.coverUrl || null,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const pdfUrl = data?.download_url;
        if (!pdfUrl) throw new Error('No PDF URL returned');

        // Fetch the PDF and create a blob URL for the iframe
        const response = await fetch(pdfUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch PDF');

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setPdfBlobUrl(blobUrl);
        update({ previewPdfUrl: blobUrl });
        setPhase('ready');
      } catch (err: any) {
        console.error('PDF preview generation error:', err);
        setPhase('error');
        setErrorMsg(err.message || 'Échec de la génération');
      }
    };

    generatePreviewPdf();

    return () => {
      // Don't revoke yet — user may navigate back
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 pt-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          {phase === 'generating' ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Eye className="h-8 w-8 text-primary" />
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          {phase === 'generating' ? t('write.pdf_preview_generating') : t('write.pdf_preview_title')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {phase === 'generating'
            ? t('write.pdf_preview_generating_sub')
            : t('write.pdf_preview_sub')}
        </p>
      </div>

      {/* PDF Viewer */}
      {phase === 'generating' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="aspect-[3/4] max-h-[60vh] flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">{t('write.pdf_preview_wait')}</p>
            </div>
          </div>
        </div>
      )}

      {phase === 'ready' && pdfBlobUrl && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
          <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{state.title || t('write.my_book')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{t('write.pdf_preview_scroll')}</span>
          </div>
          <iframe
            src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
            className="w-full border-0"
            style={{ height: '65vh', minHeight: '400px' }}
            title="PDF Preview"
          />
        </div>
      )}

      {phase === 'error' && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{errorMsg}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              ran.current = false;
              setPhase('generating');
              // re-trigger
              ran.current = false;
              window.location.reload();
            }}
          >
            {t('write.retry')}
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2" disabled={saving}>
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2 cta-glow"
          onClick={onNext}
          disabled={phase === 'generating' || saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('write.saving_draft')}
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              {t('write.save_as_draft')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
