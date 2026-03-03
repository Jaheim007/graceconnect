import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';
import { Share2, Building2 } from 'lucide-react';

export function ModeSwitch() {
  const { mode, preferredMode, toggleMode, isRouteOverride } = useMode();
  
  // Use preferredMode for highlight state so toggle reflects user intent even on public pages
  const activeMode = isRouteOverride ? preferredMode : mode;

  return (
    <button
      onClick={toggleMode}
      className="flex items-center gap-0.5 h-8 rounded-full ring-1 ring-border hover:ring-primary/40 transition-all px-0.5 bg-muted/50"
      title={activeMode === 'ambassador' ? 'Mode Ambassadeur — Cliquer pour passer en mode Créateur' : 'Mode Créateur — Cliquer pour passer en mode Ambassadeur'}
    >
      <span className={cn(
        'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all',
        activeMode === 'ambassador'
          ? 'bg-emerald-500 text-white shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}>
        <Share2 className="h-3 w-3" />
        <span className="hidden sm:inline">Gagner</span>
      </span>
      <span className={cn(
        'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all',
        activeMode === 'creator'
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}>
        <Building2 className="h-3 w-3" />
        <span className="hidden sm:inline">Créer</span>
      </span>
    </button>
  );
}
