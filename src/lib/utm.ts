// UTM parameter capture & persistence
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const STORAGE_KEY = 'sv_utm';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landed_at?: string;
  landing_url?: string;
}

/** Call once on page load to capture UTM from URL and persist to sessionStorage */
export function captureUtm(): UtmParams | null {
  try {
    const url = new URL(window.location.href);
    const params: UtmParams = {};
    let hasAny = false;
    for (const key of UTM_KEYS) {
      const val = url.searchParams.get(key);
      if (val) { params[key] = val; hasAny = true; }
    }
    if (!hasAny) return getStoredUtm();
    params.landed_at = new Date().toISOString();
    params.landing_url = window.location.pathname;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    return params;
  } catch { return null; }
}

export function getStoredUtm(): UtmParams | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
