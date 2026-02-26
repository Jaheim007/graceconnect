import { useState, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye, FileText, ChevronLeft, ChevronRight, X, Lock,
  Loader2, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ProductPreviewViewerProps {
  productId: string;
  fileUrl?: string | null;
  productType?: string | null;
  pageCount?: number | null;
  previewPageCount?: number | null;
  coverImageUrl?: string | null;
  title: string;
  isPurchased?: boolean;
  autoOpen?: boolean;
}

function computePreviewLimit(total: number, previewPageCount?: number | null): number {
  if (previewPageCount && previewPageCount > 0) return previewPageCount;
  if (total <= 5) return 1;
  if (total <= 10) return 2;
  return Math.max(1, Math.min(5, Math.ceil(total * 0.2)));
}

export function ProductPreviewViewer({
  productId,
  fileUrl,
  productType,
  pageCount,
  previewPageCount,
  coverImageUrl,
  title,
  isPurchased,
  autoOpen,
}: ProductPreviewViewerProps) {
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(pageCount || 0);

  const isPdf =
    (productType || '').toLowerCase() === 'pdf' ||
    (productType || '').toLowerCase() === 'ebook' ||
    /\.pdf($|\?)/i.test(fileUrl || '');

  const hasFile = !!fileUrl;

  const getSignedUrl = useCallback(async (): Promise<string | null> => {
    if (!fileUrl) return null;

    if (!fileUrl.includes('private-products')) {
      return fileUrl;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const bearerToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const { data, error } = await supabase.functions.invoke('generate-signed-url', {
        headers: { Authorization: `Bearer ${bearerToken}` },
        body: { product_id: productId, preview: true },
      });

      if (!error && data?.url) {
        return data.url;
      }

      if (error) {
        console.error('Preview signed URL invoke failed:', error);
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({ product_id: productId, preview: true }),
      });

      if (response.ok) {
        const fallbackData = await response.json();
        return fallbackData?.url || null;
      }
    } catch (e) {
      console.error('Preview signed URL failed:', e);
    }

    return null;
  }, [fileUrl, productId]);

  const loadPdfPreview = useCallback(async () => {
    if (!isPdf || !fileUrl || loading) return;

    setLoading(true);
    setError(null);

    try {
      const url = await getSignedUrl();
      if (!url) {
        setError("Impossible d'accéder au fichier");
        return;
      }

      const loadingTask = pdfjsLib.getDocument({
        url,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);

      const limit = isPurchased ? numPages : computePreviewLimit(numPages, previewPageCount);
      const pagesToRender = Math.min(limit, numPages);
      const renderedPages: string[] = [];
      setPages([]);

      for (let i = 1; i <= pagesToRender; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;
        renderedPages.push(canvas.toDataURL('image/jpeg', 0.82));
        setPages([...renderedPages]);
      }
    } catch (e: any) {
      console.error('PDF preview error:', e);
      setError("Erreur lors du chargement de l'aperçu");
    } finally {
      setLoading(false);
    }
  }, [isPdf, fileUrl, previewPageCount, isPurchased, getSignedUrl, loading]);

  const handleOpenPreview = useCallback(() => {
    setCurrentPage(0);
    setOpen(true);
    if (pages.length === 0 && !loading) {
      loadPdfPreview();
    }
  }, [pages.length, loading, loadPdfPreview]);

  useEffect(() => {
    if (autoOpen && !open) {
      handleOpenPreview();
    }
  }, [autoOpen, open, handleOpenPreview]);

  if (!hasFile) {
    if (!isPdf) return null;

    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          Aperçu indisponible : aucun fichier PDF n’a été ajouté pour ce produit.
        </p>
      </div>
    );
  }

  if (!isPdf && !coverImageUrl) return null;

  const displayPageCount = totalPages || pageCount;
  const previewLimit = displayPageCount
    ? computePreviewLimit(displayPageCount, previewPageCount)
    : null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {displayPageCount != null && displayPageCount > 0 && (
            <Badge variant="secondary" className="text-xs gap-1.5">
              <FileText className="h-3 w-3" />
              {displayPageCount} page{displayPageCount > 1 ? 's' : ''}
            </Badge>
          )}

          {isPdf && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 font-semibold"
              onClick={handleOpenPreview}
            >
              <Eye className="h-3.5 w-3.5" />
              👁️ Aperçu gratuit
              {previewLimit ? ` (${previewLimit} page${previewLimit > 1 ? 's' : ''})` : ''}
            </Button>
          )}
        </div>

        {pages.length > 0 && !open && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pages.map((src, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i); setOpen(true); }}
                className="relative shrink-0 w-14 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
              >
                <img src={src} alt={`Page ${i + 1}`} className="w-full h-auto" />
                <span className="absolute bottom-0 inset-x-0 text-[7px] text-center bg-background/80 py-px font-medium">
                  {i + 1}
                </span>
              </button>
            ))}
            {!isPurchased && totalPages > pages.length && (
              <div
                className="shrink-0 w-14 h-[72px] rounded-lg border border-dashed border-border flex flex-col items-center justify-center bg-muted/50 gap-0.5 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => { setCurrentPage(pages.length - 1); setOpen(true); }}
              >
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[7px] text-muted-foreground font-medium">
                  +{totalPages - pages.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isPurchased
                    ? `${totalPages || '?'} pages — Version complète`
                    : `Aperçu : ${pages.length} sur ${totalPages || '?'} pages`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pages.length > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium min-w-[40px] text-center">
                    {currentPage + 1}/{pages.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={currentPage >= pages.length - 1}
                    onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Chargement de l'aperçu…</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button size="sm" variant="outline" onClick={() => { setError(null); loadPdfPreview(); }}>
                    Réessayer
                  </Button>
                </div>
              )}

              {!loading && !error && pages.length > 0 && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-border shadow-lg bg-white mx-auto max-w-2xl">
                    <img
                      src={pages[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      className="w-full h-auto"
                    />
                    {!isPurchased && currentPage === pages.length - 1 && totalPages > pages.length && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95 flex items-end justify-center pb-8">
                        <div className="text-center space-y-2 bg-background/90 backdrop-blur-md rounded-2xl border border-border px-6 py-4 shadow-xl">
                          <Lock className="h-5 w-5 mx-auto text-muted-foreground" />
                          <p className="text-sm font-semibold">
                            {totalPages - pages.length} page{totalPages - pages.length > 1 ? 's' : ''} restante{totalPages - pages.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Achetez pour accéder au contenu complet
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {pages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                      {pages.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={cn(
                            'relative shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-all hover:opacity-90',
                            currentPage === i
                              ? 'border-primary shadow-md'
                              : 'border-border opacity-60 hover:opacity-80'
                          )}
                        >
                          <img src={src} alt={`Page ${i + 1}`} className="w-full h-auto" />
                          <span className="absolute bottom-0 inset-x-0 text-[8px] text-center bg-background/80 py-0.5 font-medium">
                            {i + 1}
                          </span>
                        </button>
                      ))}
                      {!isPurchased && totalPages > pages.length && (
                        <div className="shrink-0 w-16 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/50 gap-1">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[8px] text-muted-foreground font-medium">
                            +{totalPages - pages.length}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
