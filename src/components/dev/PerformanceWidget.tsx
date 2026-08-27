import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface Vitals {
  fcp: number | null;
  lcp: number | null;
  domReady: number | null;
  fullLoad: number | null;
}

/**
 * PerformanceWidget — Dev-only floating widget showing Core Web Vitals.
 * Only renders in development or when ?perf=1 is in URL.
 */
export function PerformanceWidget() {
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [visible, setVisible] = useState(false);

  const shouldShow = import.meta.env.DEV || new URLSearchParams(window.location.search).has('perf');

  useEffect(() => {
    if (!shouldShow) return;

    const measure = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const paint = performance.getEntriesByName('first-contentful-paint')[0];

      setVitals({
        fcp: paint ? Math.round(paint.startTime) : null,
        lcp: null, // Will be set by observer
        domReady: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        fullLoad: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      });
    };

    // Delay to ensure metrics are available
    const timer = setTimeout(measure, 2000);

    // LCP observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          setVitals(v => v ? { ...v, lcp: Math.round(last.startTime) } : v);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      return () => { clearTimeout(timer); lcpObserver.disconnect(); };
    } catch {
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  if (!shouldShow || !vitals) return null;

  const getColor = (ms: number | null, good: number, poor: number) => {
    if (ms === null) return 'text-muted-foreground';
    if (ms <= good) return 'text-emerald-500';
    if (ms <= poor) return 'text-amber-500';
    return 'text-red-500';
  };

  const metrics = [
    { label: 'FCP', value: vitals.fcp, good: 1800, poor: 3000 },
    { label: 'LCP', value: vitals.lcp, good: 2500, poor: 4000 },
    { label: 'DOM', value: vitals.domReady, good: 1500, poor: 3000 },
    { label: 'Load', value: vitals.fullLoad, good: 3000, poor: 5000 },
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setVisible(v => !v)}
        className="fixed top-2 right-2 z-[200] h-7 w-7 rounded-full bg-muted/80 backdrop-blur-xs border border-border flex items-center justify-center hover:bg-muted transition-colors"
        title="Performance Vitals"
      >
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {visible && (
        <div className="fixed top-10 right-2 z-[200] rounded-xl border border-border bg-card/95 backdrop-blur-xs shadow-lg p-3 min-w-[140px]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Web Vitals</p>
          <div className="space-y-1">
            {metrics.map(m => (
              <div key={m.label} className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                <span className={`text-[10px] font-mono font-bold ${getColor(m.value, m.good, m.poor)}`}>
                  {m.value !== null ? `${m.value}ms` : '—'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-muted-foreground mt-2 text-center">
            🟢 Good 🟡 Needs work 🔴 Poor
          </p>
        </div>
      )}
    </>
  );
}
