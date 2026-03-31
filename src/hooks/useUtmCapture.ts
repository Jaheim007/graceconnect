import { useEffect } from 'react';
import { captureUtm, getStoredUtm } from '@/lib/utm';
import { db } from '@/lib/db';

/** Captures UTM params on mount and logs to client_events */
export function useUtmCapture() {
  useEffect(() => {
    const utm = captureUtm();
    if (utm?.utm_source) {
      db.from('client_events').insert({
        event_name: 'utm_landing',
        page_url: window.location.pathname,
        event_data: utm as any,
        device_type: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        session_id: sessionStorage.getItem('sv_session_id') || undefined,
      }).then(() => {});
    }
  }, []);

  return getStoredUtm();
}
