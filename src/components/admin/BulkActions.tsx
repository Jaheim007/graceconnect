// Reusable bulk actions toolbar for admin lists
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, CheckSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkAction {
  label: string;
  icon: typeof Trash2;
  variant?: 'default' | 'destructive';
  onClick: (selectedIds: string[]) => Promise<void> | void;
}

interface BulkActionsToolbarProps {
  selectedIds: string[];
  totalCount: number;
  onClear: () => void;
  actions: BulkAction[];
}

export function BulkActionsToolbar({ selectedIds, totalCount, onClear, actions }: BulkActionsToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (selectedIds.length === 0) return null;

  const handleAction = async (action: BulkAction) => {
    setLoading(action.label);
    try {
      await action.onClick(selectedIds);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 animate-in slide-in-from-top-2">
      <Badge className="bg-primary text-primary-foreground text-[10px]">
        {selectedIds.length}/{totalCount}
      </Badge>
      <span className="text-xs text-muted-foreground">sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
      <div className="flex-1" />
      {actions.map(action => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
          className="h-7 text-xs gap-1"
          disabled={loading === action.label}
          onClick={() => handleAction(action)}
        >
          <action.icon className="h-3 w-3" />
          {loading === action.label ? '...' : action.label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// Hook to manage bulk selection state
export function useBulkSelect<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds(prev => prev.length === items.length ? [] : items.map(i => i.id));
  };

  const clear = () => setSelectedIds([]);
  const isSelected = (id: string) => selectedIds.includes(id);
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  return { selectedIds, toggle, toggleAll, clear, isSelected, allSelected };
}
