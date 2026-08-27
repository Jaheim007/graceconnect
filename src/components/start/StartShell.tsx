import { ReactNode } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { ArrowLeft } from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { cn } from '@/lib/utils';

interface Props {
  step: 1 | 2 | 3;
  onBack?: () => void;
  children: ReactNode;
}

const STEPS_FR = ['Activité', 'Détails', 'Prêt'];
const STEPS_EN = ['Activity', 'Details', 'Ready'];

export function StartShell({ step, onBack, children }: Props) {
  const navigate = useNavigate();
  const labels = typeof navigator !== 'undefined' && navigator.language?.startsWith('fr') ? STEPS_FR : STEPS_EN;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top brand bar */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-xl w-full flex items-center justify-between px-4 h-14">
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="h-9 w-9 -ml-2 grid place-items-center rounded-full hover:bg-muted transition"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <SiteLogo size="sm" />
            <span className="text-sm font-bold tracking-tight">Siteviral</span>
          </button>
          <div className="scale-90 origin-right">
            <GlobalPreferencesSelector />
          </div>
        </div>
        {/* Progress bar */}
        <div className="mx-auto max-w-xl w-full px-4 pb-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    n <= step ? 'bg-primary' : 'bg-muted',
                  )}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            {labels.map((l, i) => (
              <span key={l} className={cn(i + 1 === step && 'text-foreground font-semibold')}>{l}</span>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-xl w-full px-4 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
