import { useCallback, useRef, useEffect } from 'react';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

let sessionId: string | null = null;
function getSessionId() {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('sv_sid') || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('sv_sid', sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

const queue: Array<Record<string, unknown>> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushQueue() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 20);
  db.from('client_events').insert(batch as any).then(() => {});
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushQueue();
  }, 5000);
}

export function trackEvent(eventName: string, eventData?: Record<string, unknown>, userId?: string) {
  queue.push({
    event_name: eventName,
    event_data: eventData || {},
    session_id: getSessionId(),
    user_id: userId || null,
    page_url: window.location.pathname,
    referrer: document.referrer || null,
    device_type: getDeviceType(),
  });
  scheduleFlush();
}

export function useTrackEvent() {
  const { user } = useAuth();
  return useCallback(
    (eventName: string, eventData?: Record<string, unknown>) => {
      trackEvent(eventName, eventData, user?.id);
    },
    [user?.id]
  );
}

export function useTrackPageView() {
  const { user } = useAuth();
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent('page_view', { path: window.location.pathname }, user?.id);
  }, [user?.id]);
}
