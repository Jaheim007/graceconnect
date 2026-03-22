import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugEntry {
  slotKey: string;
  experimentFound: boolean;
  experimentName?: string;
  assignedVariant: 'a' | 'b' | 'default';
  trafficEligible: boolean;
  renderedContent: string;
  sessionSeed: string;
  urlOverride: string | null;
  timestamp: number;
}

// Global debug log accessible from useExperimentContent
const debugLog: DebugEntry[] = [];
const listeners: Set<() => void> = new Set();

export function pushDebugEntry(entry: DebugEntry) {
  debugLog.unshift(entry);
  if (debugLog.length > 50) debugLog.pop();
  listeners.forEach(fn => fn());
}

function useDebugLog() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const cb = () => setTick(t => t + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  return debugLog;
}

/**
 * Floating debug overlay for superadmins.
 * Shows real-time experiment slot resolution data.
 * Only renders if user is superadmin OR ?debug=true is in URL.
 */
export function ExperimentDebugOverlay() {
  const { isSuperadmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const entries = useDebugLog();

  const urlDebug = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true';

  if (!isSuperadmin && !urlDebug) return null;

  return (
    <>
      {/* Toggle FAB */}
      {!open && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-[9999] h-10 w-10 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors"
          title="A/B Debug"
        >
          <Bug className="h-5 w-5" />
        </motion.button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 z-[9999] w-96 max-h-[70vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/10 border-b border-border">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">A/B Debug</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 font-mono">
                  {entries.length} slots
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized(!minimized)} className="p-1 hover:bg-muted rounded">
                  {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {!minimized && (
              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {entries.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No experiment slots resolved yet.<br />Navigate to a page with experiments.
                  </p>
                )}
                {entries.map((e, i) => (
                  <div key={`${e.slotKey}-${e.timestamp}-${i}`} className="rounded-lg border border-border p-2.5 text-xs space-y-1.5 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-foreground">{e.slotKey}</span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded font-semibold text-[10px]',
                        e.experimentFound
                          ? e.assignedVariant !== 'default'
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'bg-amber-500/15 text-amber-700'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {e.experimentFound ? (e.assignedVariant !== 'default' ? `Variant ${e.assignedVariant.toUpperCase()}` : 'Outside traffic') : 'No experiment'}
                      </span>
                    </div>
                    {e.experimentName && (
                      <Row label="Experiment" value={e.experimentName} />
                    )}
                    <Row label="Traffic eligible" value={e.trafficEligible ? '✅ Yes' : '❌ No'} />
                    <Row label="Content" value={e.renderedContent.slice(0, 60)} />
                    <Row label="Session" value={e.sessionSeed.slice(0, 16) + '…'} mono />
                    {e.urlOverride && <Row label="URL override" value={e.urlOverride} />}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-foreground text-right truncate', mono && 'font-mono')}>{value}</span>
    </div>
  );
}
