interface BuildSocialShareUrlInput {
  targetUrl: string;
  title?: string;
  description?: string;
  image?: string;
}

const DEFAULT_SITE_ORIGIN = 'https://siteviral.com';

const getFunctionsBase = () => 'https://api.siteviral.com/functions/v1';

const toAbsoluteUrl = (value: string) => {
  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(value, typeof window !== 'undefined' ? window.location.origin : DEFAULT_SITE_ORIGIN).toString();
    } catch {
      return '';
    }
  }
};

/**
 * Paths where the edge function can resolve meta tags from the database.
 * For these paths, we pass `path` instead of explicit params so the server
 * fetches the real title / description / image from Supabase.
 */
const DB_RESOLVABLE_PREFIXES = [
  '/org/',
  '/product/',
  '/campagne/',
  '/campaign/',
  '/event/',
  '/annonce/',
  '/offering/',
];

const extractPath = (url: string): string | null => {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return null;
  }
};

const isDbResolvable = (path: string) =>
  DB_RESOLVABLE_PREFIXES.some((p) => path.startsWith(p));

/**
 * Build a social-share-friendly URL that goes through the `share-meta`
 * edge function so crawlers (WhatsApp, Facebook, Twitter) receive the
 * correct OG meta tags + a redirect to the real page.
 *
 * • For DB content (orgs, products, campaigns…) → passes `path` so the
 *   server auto-resolves metadata. Explicit params serve as overrides.
 * • For static content (blogs, guides…) → passes explicit params.
 */
export const buildSocialShareUrl = ({
  targetUrl,
  title,
  description,
  image,
}: BuildSocialShareUrlInput): string => {
  const absoluteTarget = toAbsoluteUrl(targetUrl);
  if (!absoluteTarget) return targetUrl;

  const path = extractPath(absoluteTarget);
  const params = new URLSearchParams();

  if (path && isDbResolvable(path)) {
    // Let the server fetch meta from DB — much more reliable
    params.set('path', path);
    // Explicit params as optional overrides (e.g. affiliate code in title)
    if (title?.trim()) params.set('title', title.trim().slice(0, 180));
    if (description?.trim()) params.set('description', description.trim().slice(0, 300));
    const absoluteImage = image ? toAbsoluteUrl(image) : '';
    if (absoluteImage) params.set('image', absoluteImage);
  } else {
    // Static content — pass all params explicitly
    params.set('target', absoluteTarget);
    if (title?.trim()) params.set('title', title.trim().slice(0, 180));
    if (description?.trim()) params.set('description', description.trim().slice(0, 300));
    const absoluteImage = image ? toAbsoluteUrl(image) : '';
    if (absoluteImage) params.set('image', absoluteImage);
  }

  return `${getFunctionsBase()}/share-meta?${params.toString()}`;
};

/**
 * Shorthand: build a share URL for a known internal path.
 * The edge function resolves all meta from the database.
 */
export const buildShareUrlForPath = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const params = new URLSearchParams({ path: cleanPath });
  return `${getFunctionsBase()}/share-meta?${params.toString()}`;
};
