import { useState } from 'react';
import { Table as TableIcon, Plus, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/react';

interface TableMenuProps {
  editor: Editor;
}

export function TableMenu({ editor }: TableMenuProps) {
  const [open, setOpen] = useState(false);
  const isInTable = editor.isActive('table');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Tableau"
        className={cn(
          'h-7 w-7 rounded flex items-center justify-center transition-colors',
          (open || isInTable) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
      >
        <TableIcon className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-1.5 min-w-[180px]">
          {!isInTable ? (
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" /> Insérer un tableau 3×3
            </button>
          ) : (
            <>
              <button type="button" onClick={() => { editor.chain().focus().addColumnAfter().run(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Ajouter colonne
              </button>
              <button type="button" onClick={() => { editor.chain().focus().addRowAfter().run(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Ajouter ligne
              </button>
              <button type="button" onClick={() => { editor.chain().focus().deleteColumn().run(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground transition-colors">
                <Minus className="h-3 w-3" /> Supprimer colonne
              </button>
              <button type="button" onClick={() => { editor.chain().focus().deleteRow().run(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground transition-colors">
                <Minus className="h-3 w-3" /> Supprimer ligne
              </button>
              <div className="h-px bg-border my-1" />
              <button type="button" onClick={() => { editor.chain().focus().deleteTable().run(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-destructive transition-colors">
                <Trash2 className="h-3 w-3" /> Supprimer tableau
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
