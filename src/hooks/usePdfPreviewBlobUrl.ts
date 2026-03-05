import { useEffect, useState } from 'react';

export function usePdfPreviewBlobUrl(fileUrl?: string | null, enabled = true) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    if (!enabled || !fileUrl) {
      setBlobUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(fileUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Impossible de charger le PDF.');

        const blob = await response.blob();
        revokedUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setBlobUrl(revokedUrl);
        }
      } catch (err: any) {
        if (!cancelled) {
          setBlobUrl(null);
          setError(err?.message || 'Échec du chargement de l’aperçu PDF.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [fileUrl, enabled]);

  return { blobUrl, loading, error };
}
