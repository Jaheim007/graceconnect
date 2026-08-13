// First-touch attribution: remembers where a visitor originally came from,
// then writes it once onto their profile after signup.
const KEY = 'sv_first_touch';

export interface FirstTouch {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  page: string | null;
  referrer: string | null;
  at: string;
}

function inferSource(referrer: string | null): string | null {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host === window.location.hostname) return null; // internal navigation
    if (/facebook|fb\.|instagram/.test(host)) return 'facebook';
    if (/whatsapp|wa\.me/.test(host)) return 'whatsapp';
    if (/google/.test(host)) return 'google';
    if (/t\.co|twitter|x\.com/.test(host)) return 'twitter';
    if (/tiktok/.test(host)) return 'tiktok';
    if (/youtube|youtu\.be/.test(host)) return 'youtube';
    if (/linkedin/.test(host)) return 'linkedin';
    return host;
  } catch {
    return null;
  }
}

/** Capture the first touch once per browser. Safe to call on every page view. */
export function captureFirstTouch(): FirstTouch | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return JSON.parse(existing) as FirstTouch;

    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || null;
    const inferred = inferSource(referrer);
    if (!inferred && !params.get('utm_source')) return null; // internal nav, not a real entry

    const ft: FirstTouch = {
      source: params.get('utm_source') || inferred,
      medium: params.get('utm_medium') || (referrer ? 'referral' : 'direct'),
      campaign: params.get('utm_campaign') || null,
      page: window.location.pathname,
      referrer,
      at: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(ft));
    return ft;
  } catch {
    return null;
  }
}

export function getFirstTouch(): FirstTouch | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FirstTouch) : null;
  } catch {
    return null;
  }
}

/** Detect a coarse country hint from the browser (no network call). */
export function guessCountry(): string | null {
  try {
    const locale = navigator.language || '';
    const region = locale.split('-')[1];
    return region ? region.toUpperCase() : null;
  } catch {
    return null;
  }
}
