import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  canEdit: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function InlineEditableText({
  value,
  onSave,
  canEdit,
  multiline = false,
  className = '',
  placeholder = 'Cliquez pour modifier...',
  tag: Tag = 'p',
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => { setDraft(value); }, [value]);

  const handleSave = async () => {
    if (draft.trim() === value.trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch { /* keep editing */ }
    setSaving(false);
  };

  const handleCancel = () => { setDraft(value); setEditing(false); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') handleCancel();
  };

  if (!canEdit) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  if (editing) {
    return (
      <div className="relative group">
        {multiline ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full bg-transparent border border-primary/40 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[60px]',
              className
            )}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full bg-transparent border border-primary/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30',
              className
            )}
          />
        )}
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> {saving ? '...' : 'OK'}
          </button>
          <button
            onClick={handleCancel}
            className="h-7 px-2.5 rounded-md bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1 hover:bg-muted/80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => setEditing(true)}
    >
      <Tag className={cn(className, 'group-hover:bg-primary/5 rounded-lg transition-colors pr-8')}>
        {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      </Tag>
      <div className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Pencil className="h-3 w-3 text-primary" />
        </div>
      </div>
    </div>
  );
}
