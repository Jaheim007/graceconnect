import { useEffect, useRef } from 'react';
import { useLocation } from '@/lib/router-compat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { captureFirstTouch, getFirstTouch, guessCountry } from '@/lib/analytics/firstTouch';
import { captureUtm } from '@/lib/utm';

const FT_SYNCED_KEY = 'sv_first_touch_synced';

/**
 * Logs a real `page_view` event on every route change (public and private),
 * with referrer, UTM, device, language and country hint — and persists the
 * visitor's first-touch source onto their profile once they are signed in.
 */
export function PageViewTracker() {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const lastPath = useRef<string | null>(null);

  // 1) Page views
  useEffect(() => {
    const key = pathname + search;
    if (lastPath.current === key) return;
    lastPath.current = key;

    captureFirstTouch();
    const ft = getFirstTouch();
    const utm = captureUtm();

    trackEvent(
      'page_view',
      {
        path: pathname,
        query: search || null,
        first_touch_source: ft?.source || null,
        utm_source: utm?.utm_source || null,
        utm_medium: utm?.utm_medium || null,
        utm_campaign: utm?.utm_campaign || null,
        language: typeof navigator !== 'undefined' ? navigator.language : null,
        country_hint: guessCountry(),
        hour: new Date().getHours(),
        is_authenticated: !!user,
      },
      user?.id,
    );
  }, [pathname, search, user?.id]);

  // 2) First-touch → profile (once per user)
  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(FT_SYNCED_KEY) === user.id) return;
    const ft = getFirstTouch();
    if (!ft) return;

    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_touch_source')
          .eq('id', user.id)
          .maybeSingle();
        if (data && !(data as any).first_touch_source) {
          await supabase
            .from('profiles')
            .update({
              first_touch_source: ft.source,
              first_touch_medium: ft.medium,
              first_touch_campaign: ft.campaign,
              first_touch_page: ft.page,
              first_touch_referrer: ft.referrer,
            } as any)
            .eq('id', user.id);
        }
        localStorage.setItem(FT_SYNCED_KEY, user.id);
      } catch {
        /* attribution is best-effort */
      }
    })();
  }, [user]);

  return null;
}
