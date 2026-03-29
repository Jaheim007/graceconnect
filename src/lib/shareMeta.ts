import { supabase } from '@/integrations/supabase/client';
import { isMainPlatformDomain } from '@/hooks/useDomainResolver';

const SITE_ORIGIN = 'https://siteviral.com';
const FUNCTIONS_BASE = 'https://api.siteviral.com/functions/v1';

/** Get domain param for share URLs when on org custom domain */
function getDomainParam(): string {
  const host = window.location.hostname;
  if (!isMainPlatformDomain(host)) return host;
  return '';
}

// ─── Short code generator (Base62, 7 chars → ~3.5 trillion combos) ───

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateShortCode(len = 7): string {
  const arr = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(arr, (b) => BASE62[b % 62]).join('');
}

// ─── Helpers ───

const toAbsoluteUrl = (value: string): string => {
  try { return new URL(value).toString(); } catch {
    try { return new URL(value, typeof window !== 'undefined' ? window.location.origin : SITE_ORIGIN).toString(); } catch { return ''; }
  }
};

const extractPath = (url: string): string | null => {
  try { return new URL(url).pathname + new URL(url).search; } catch { return null; }
};

// ─── In-memory cache to avoid duplicate DB inserts for the same path in one session ───
const shortLinkCache = new Map<string, string>();

/**
 * Create (or retrieve) a short link for the given path.
 * Returns the clean branded URL: https://siteviral.com/go/x7kQ9
 *
 * - First checks session cache
 * - Then checks DB for existing link with same target_path
 * - Finally creates a new one
 */
export async function getOrCreateShortLink(opts: {
  targetPath: string;
  title?: string;
  description?: string;
  image?: string;
}): Promise<string> {
  const cleanPath = opts.targetPath.startsWith('/') ? opts.targetPath : `/${opts.targetPath}`;

  // 1. Session cache
  const cached = shortLinkCache.get(cleanPath);
  if (cached) {
    const domainP = getDomainParam();
    return `${FUNCTIONS_BASE}/share-meta?code=${cached}${domainP ? `&domain=${domainP}` : ''}`;
  }

  // 2. Check DB for existing
  try {
    const { data: existing } = await (supabase as any)
      .from('short_links')
      .select('id')
      .eq('target_path', cleanPath)
      .limit(1)
      .maybeSingle();

    if (existing) {
      shortLinkCache.set(cleanPath, existing.id);
      const domainP = getDomainParam();
      return `${FUNCTIONS_BASE}/share-meta?code=${existing.id}${domainP ? `&domain=${domainP}` : ''}`;
    }
  } catch {
    // DB read failed — fall through to create
  }

  // 3. Create new short link
  const code = generateShortCode();
  try {
    // Get current user for RLS compliance
    const { data: { user } } = await supabase.auth.getUser();
    const insertData: Record<string, unknown> = {
      id: code,
      target_path: cleanPath,
      created_by: user?.id ?? null,
    };
    if (opts.title?.trim()) insertData.title = opts.title.trim().slice(0, 180);
    if (opts.description?.trim()) insertData.description = opts.description.trim().slice(0, 300);
    if (opts.image) {
      const absImg = toAbsoluteUrl(opts.image);
      if (absImg) insertData.image = absImg;
    }

    const { error } = await (supabase as any).from('short_links').insert(insertData);

    if (error) {
      // Collision or RLS issue — fallback to legacy URL
      console.warn('[shareMeta] short link insert failed:', error.message);
      return buildLegacyShareUrl(cleanPath, opts.title, opts.description, opts.image);
    }

    shortLinkCache.set(cleanPath, code);
    const domainP = getDomainParam();
    return `${FUNCTIONS_BASE}/share-meta?code=${code}${domainP ? `&domain=${domainP}` : ''}`;
  } catch {
    return buildLegacyShareUrl(cleanPath, opts.title, opts.description, opts.image);
  }
}

/**
 * Legacy fallback: direct edge function URL with ?path= param.
 * Used when short link creation fails (e.g. not authenticated).
 */
function buildLegacyShareUrl(
  path: string,
  title?: string,
  description?: string,
  image?: string,
): string {
  const params = new URLSearchParams({ path });
  if (title?.trim()) params.set('title', title.trim().slice(0, 180));
  if (description?.trim()) params.set('description', description.trim().slice(0, 300));
  if (image) {
    const abs = toAbsoluteUrl(image);
    if (abs) params.set('image', abs);
  }
  return `${FUNCTIONS_BASE}/share-meta?${params.toString()}`;
}

/**
 * Synchronous share URL builder (legacy compat).
 * Returns the edge function URL immediately — no DB call.
 * Use getOrCreateShortLink() for the clean branded URL.
 */
export function buildSocialShareUrl(opts: {
  targetUrl: string;
  title?: string;
  description?: string;
  image?: string;
}): string {
  const absoluteTarget = toAbsoluteUrl(opts.targetUrl);
  if (!absoluteTarget) return opts.targetUrl;

  const path = extractPath(absoluteTarget);
  if (!path) return opts.targetUrl;

  return buildLegacyShareUrl(path, opts.title, opts.description, opts.image);
}

/**
 * Shorthand: build a share URL for a known internal path.
 */
export const buildShareUrlForPath = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const params = new URLSearchParams({ path: cleanPath });
  return `${FUNCTIONS_BASE}/share-meta?${params.toString()}`;
};
