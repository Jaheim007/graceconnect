import { HelpCircle } from 'lucide-react';

export interface AnswerItem {
  q: string;
  a: string;
}

interface AnswerBlockProps {
  items: AnswerItem[];
  title?: string;
  /** Short lead sentence rendered above the questions. */
  lead?: string;
  className?: string;
}

/**
 * Direct-answer block (AEO / LLMO).
 *
 * Renders real questions with short, self-contained answers in plain semantic
 * HTML so AI answer engines and search engines can quote a single passage
 * without inferring it from long-form copy. Pair it with FAQPage JSON-LD.
 */
export function AnswerBlock({ items, title, lead, className }: AnswerBlockProps) {
  const visible = items.filter((i) => i.q?.trim() && i.a?.trim());
  if (visible.length === 0) return null;

  return (
    <section
      aria-label={title || 'Questions & answers'}
      className={`rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6 ${className || ''}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-base sm:text-lg font-semibold tracking-tight">
          {title || 'Questions fréquentes'}
        </h2>
      </div>

      {lead && <p className="text-sm text-muted-foreground mb-4">{lead}</p>}

      <dl className="space-y-4">
        {visible.map((item, i) => (
          <div key={i} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
            <dt className="text-sm font-semibold text-foreground">{item.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
