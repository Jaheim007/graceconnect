import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';

const DISMISSED_KEY = 'sv_dismissed_suggestions';

export function SmartSuggestionsBanner() {
  const navigate = useNavigate();
  const { data: suggestions = [] } = useSmartSuggestions();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch { return []; }
  });

  const visible = suggestions.filter(s => !dismissed.includes(s.id));

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  };

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Lightbulb className="h-3.5 w-3.5" />
        Suggestions pour vous
      </div>
      <AnimatePresence>
        {visible.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card group">
              <span className="text-xl shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-xs gap-1 text-primary"
                onClick={() => navigate(s.actionPath)}
              >
                {s.actionLabel} <ArrowRight className="h-3 w-3" />
              </Button>
              <button
                onClick={() => dismiss(s.id)}
                className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
