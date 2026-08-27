import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, X } from 'lucide-react';
import { useGrowthSuggestions } from '@/hooks/useGrowthSuggestions';
import { useNavigate } from '@/lib/router-compat';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

interface AdminGrowthSuggestionsProps {
  className?: string;
  maxItems?: number;
}

export function AdminGrowthSuggestions({ className, maxItems = 3 }: AdminGrowthSuggestionsProps) {
  const { data: suggestions = [], isLoading } = useGrowthSuggestions();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const visible = suggestions.filter(s => !dismissed.has(s.id)).slice(0, maxItems);

  if (isLoading || visible.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {isFr ? 'Suggestions de croissance' : 'Growth suggestions'}
        </span>
      </div>
      {visible.map((s, i) => (
        <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer relative"
          onClick={() => navigate(s.actionUrl)}>
          <span className="text-xl shrink-0">{s.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          <button onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set(prev).add(s.id)); }}
            className="absolute top-2 right-2 p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
