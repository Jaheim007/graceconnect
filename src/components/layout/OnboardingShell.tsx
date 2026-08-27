import { useNavigate } from '@/lib/router-compat';
import { X } from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { cn } from '@/lib/utils';

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  onClose?: () => void;
  onBack?: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children: React.ReactNode;
}

/**
 * Light branded shell for onboarding-style screens (welcome-intent, looking-for).
 * Mobile-first: logo top-left, progress bar, close X top-right, sticky footer with
 * primary + secondary actions. Content centered in a phone-width column.
 */
export function OnboardingShell({
  step,
  totalSteps,
  onClose,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  children,
}: OnboardingShellProps) {
  const navigate = useNavigate();
  const handleClose = onClose ?? (() => navigate('/'));
  const hasFooter = Boolean(primaryLabel || secondaryLabel || onBack);

  return (
    <div className="min-h-[100dvh] bg-muted/30 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="mx-auto w-full max-w-xl px-4 h-14 flex items-center gap-3">
          <span className="inline-flex items-center" aria-label="SiteViral"><SiteLogo size="sm" animate /></span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Progress bar (segmented) */}
        <div className="mx-auto w-full max-w-xl px-4 pb-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all',
                  i < step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      {hasFooter && (
        <footer className="sticky bottom-0 z-20 bg-background/95 backdrop-blur border-t border-border/60">
          <div className="mx-auto w-full max-w-xl px-4 py-4 space-y-2">
            {primaryLabel && (
              <button
                type="button"
                onClick={onPrimary}
                disabled={primaryDisabled}
                className="w-full h-12 rounded-2xl bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {primaryLabel}
              </button>
            )}
            {(secondaryLabel || onBack) && (
              <button
                type="button"
                onClick={onSecondary ?? onBack}
                className="w-full h-11 text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                {secondaryLabel ?? 'Previous step'}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
