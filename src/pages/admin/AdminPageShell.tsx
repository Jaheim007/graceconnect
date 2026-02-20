// Shared shell for admin CRUD pages — includes back button + title + optional new action
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPageShellProps {
  title: string;
  children: ReactNode;
  newRoute?: string;
  backRoute?: string;
  /** shown alongside title */
  subtitle?: string;
}

export function AdminPageShell({ title, children, newRoute, backRoute, subtitle }: AdminPageShellProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backRoute) navigate(backRoute);
    else navigate(-1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {newRoute && (
          <Button
            size="sm"
            onClick={() => navigate(newRoute)}
            className="gap-1.5 text-xs h-8 gold-gradient text-primary-foreground border-0 shadow-gold shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
