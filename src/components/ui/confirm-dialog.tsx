import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Hides the cancel button — acts as an in-app alert() replacement */
  alert?: boolean;
}

type Request = ConfirmOptions & { resolve: (v: boolean) => void };

const EVENT = 'sv:confirm-request';

/**
 * Promise-based, in-app replacement for window.confirm / window.alert.
 * Renders through the app's own AlertDialog so it looks native to SiteViral
 * instead of showing a browser popup.
 */
export function askConfirm(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string' ? { title: options } : options;
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    window.dispatchEvent(new CustomEvent<Request>(EVENT, { detail: { ...opts, resolve } }));
  });
}

/** In-app alert() replacement. Resolves once dismissed. */
export function askAlert(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string' ? { title: options } : options;
  return askConfirm({ ...opts, alert: true });
}

export function ConfirmDialogHost() {
  const [queue, setQueue] = useState<Request[]>([]);
  const current = queue[0];

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Request>).detail;
      if (detail) setQueue((q) => [...q, detail]);
    };
    window.addEventListener(EVENT, handler as EventListener);
    return () => window.removeEventListener(EVENT, handler as EventListener);
  }, []);

  const settle = (value: boolean) => {
    if (current) current.resolve(value);
    setQueue((q) => q.slice(1));
  };

  if (!current) return null;

  return (
    <AlertDialog open onOpenChange={(o) => { if (!o) settle(false); }}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">{current.title}</AlertDialogTitle>
          {current.description && (
            <AlertDialogDescription className="text-sm leading-relaxed">
              {current.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          {!current.alert && (
            <AlertDialogCancel onClick={() => settle(false)}>
              {current.cancelLabel ?? 'Annuler'}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={() => settle(true)}
            className={current.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
          >
            {current.confirmLabel ?? (current.alert ? 'OK' : 'Confirmer')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
