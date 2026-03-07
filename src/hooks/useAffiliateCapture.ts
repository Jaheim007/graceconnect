// Robust affiliate attribution: cookie (7 days) + localStorage fallback
// Last-click wins within the attribution window
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'sv_affiliate_ref';
const COOKIE_NAME = 'sv_aff';
const COOKIE_DAYS = 7;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

export function useAffiliateCapture() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Last-click wins: overwrite any existing attribution
      setCookie(COOKIE_NAME, ref, COOKIE_DAYS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: ref, ts: Date.now() })); } catch {}

      // Track click server-side (fire-and-forget) — increments counter + notifies ambassador
      supabase.rpc('track_affiliate_click', { _code: ref }).then(() => {}, () => {});
    }
  }, [searchParams]);
}

export function getAffiliateCode(): string | null {
  // Priority: cookie > localStorage (both have 7-day window)
  const cookieVal = getCookie(COOKIE_NAME);
  if (cookieVal) return cookieVal;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { code, ts } = JSON.parse(raw);
      const age = Date.now() - ts;
      if (age < COOKIE_DAYS * 864e5) return code;
      // Expired — clean up
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  return null;
}

export function clearAffiliateCode() {
  deleteCookie(COOKIE_NAME);
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
