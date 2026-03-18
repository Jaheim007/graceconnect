import { supabase } from '@/integrations/supabase/client';

interface FetchWatermarkedFileOptions {
  fileUrl: string;
  productId: string;
  productTitle: string;
  inline?: boolean;
}

export interface WatermarkedFileResult {
  blob: Blob;
  fileName: string;
  contentType: string;
  isPdf: boolean;
}

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

function getExtensionFromUrl(fileUrl: string): string | null {
  const cleanUrl = fileUrl.split('?')[0].split('#')[0];
  const name = cleanUrl.split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return null;
  return name.slice(dot + 1).toLowerCase();
}

function sanitizeBaseName(title: string): string {
  const value = (title || 'document')
    .replace(/[^\w\s-]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^[-_]+|[-_]+$/g, '');

  return value || 'document';
}

function parseFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]).replace(/["']/g, '').trim();
  }

  const basicMatch = disposition.match(/filename="([^"]+)"|filename=([^;]+)/i);
  const raw = basicMatch?.[1] ?? basicMatch?.[2];
  return raw ? raw.replace(/["']/g, '').trim() : null;
}

function buildFallbackName(productTitle: string, contentType: string, fileUrl: string): string {
  const ext = EXT_BY_CONTENT_TYPE[contentType.toLowerCase()] || getExtensionFromUrl(fileUrl) || 'bin';
  return `${sanitizeBaseName(productTitle)}.${ext}`;
}

export function isPdfLikeFile(fileUrl?: string | null, productType?: string | null): boolean {
  const type = (productType || '').toLowerCase();
  if (type === 'pdf') return true;
  return /\.pdf($|\?)/i.test(fileUrl || '');
}

export async function fetchWatermarkedFile({
  fileUrl,
  productId,
  productTitle,
  inline = false,
}: FetchWatermarkedFileOptions): Promise<WatermarkedFileResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Non authentifié');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watermark-download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      file_url: fileUrl,
      product_id: productId,
      product_title: productTitle,
      inline,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Erreur de téléchargement');
  }

  const blob = await response.blob();
  const contentType = blob.type || response.headers.get('content-type') || 'application/octet-stream';
  const disposition = response.headers.get('content-disposition');
  const fileName = parseFilenameFromDisposition(disposition) || buildFallbackName(productTitle, contentType, fileUrl);
  const isPdf = contentType.toLowerCase().includes('pdf') || fileName.toLowerCase().endsWith('.pdf');

  return { blob, fileName, contentType, isPdf };
}

export function triggerBrowserDownload({ blob, fileName }: Pick<WatermarkedFileResult, 'blob' | 'fileName'>) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Open a PDF inline in a new tab.
 * If a pre-opened window handle is provided (recommended for mobile),
 * it will be reused to avoid popup-blocker issues.
 */
export function openFileInline(file: WatermarkedFileResult, preOpenedWindow?: Window | null) {
  if (!file.isPdf) {
    throw new Error('La lecture en ligne est disponible uniquement pour les PDF.');
  }

  const url = URL.createObjectURL(file.blob);

  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = url;
  } else {
    // Fallback — may be blocked on mobile
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Pre-open a blank window synchronously (in a user-click handler)
 * so the async fetch doesn't get popup-blocked on mobile.
 */
export function preOpenWindow(): Window | null {
  const w = window.open('about:blank', '_blank');
  if (w) {
    // Show a loading message while we fetch
    w.document.write('<html><head><title>Chargement…</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666"><p>Chargement du document…</p></body></html>');
  }
  return w;
}
