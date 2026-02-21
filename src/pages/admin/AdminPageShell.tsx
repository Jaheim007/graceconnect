// Shared shell for admin CRUD pages — includes back button + title + optional new action
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AdminPageShellProps {
  title: string;
  children: ReactNode;
  newRoute?: string;
  newLabel?: string;
  backRoute?: string;
  /** shown alongside title */
  subtitle?: string;
}

export function AdminPageShell({ title, children, newRoute, newLabel, backRoute, subtitle }: AdminPageShellProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backRoute) navigate(backRoute);
    else navigate(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="space-y-5"
    >
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
            <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {newRoute && (
          <Button
            size="sm"
            onClick={() => navigate(newRoute)}
            className="gap-1.5 text-xs h-9 gold-gradient text-primary-foreground border-0 shadow-gold shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> {newLabel || 'Nouveau'}
          </Button>
        )}
      </div>
      {children}
    </motion.div>
  );
}
