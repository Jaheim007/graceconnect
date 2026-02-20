// Shared stub for admin CRUD pages
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminPageShell({ title, children, newRoute }: { title: string; children: ReactNode; newRoute?: string }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">{title}</h1>
        {newRoute && (
          <Button size="sm" onClick={() => navigate(newRoute)} className="gap-1.5 text-xs h-8 gold-gradient text-primary-foreground border-0 shadow-gold">
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
