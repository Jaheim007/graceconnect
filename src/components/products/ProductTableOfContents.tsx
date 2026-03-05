import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

interface ProductTableOfContentsProps {
  descriptionHtml: string;
  className?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * ProductTableOfContents — Extracts headings (h2, h3) from HTML
 * description and renders an interactive table of contents.
 */
export function ProductTableOfContents({ descriptionHtml, className }: ProductTableOfContentsProps) {
  const items = useMemo(() => {
    if (!descriptionHtml) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(descriptionHtml, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const result: TocItem[] = [];

    headings.forEach((h, i) => {
      const text = h.textContent?.trim();
      if (!text) return;
      result.push({
        id: `toc-heading-${i}`,
        text,
        level: h.tagName === 'H2' ? 2 : 3,
      });
    });

    return result;
  }, [descriptionHtml]);

  if (items.length < 2) return null;

  const scrollToHeading = (index: number) => {
    // Find headings in the actual rendered DOM description
    const descriptionEl = document.querySelector('.prose');
    if (!descriptionEl) return;
    const headings = descriptionEl.querySelectorAll('h2, h3');
    const target = headings[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn('p-4 rounded-2xl border border-border bg-card/50', className)}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
        <List className="h-3.5 w-3.5" /> Sommaire
      </h3>
      <nav className="space-y-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => scrollToHeading(i)}
            className={cn(
              'block w-full text-left text-xs hover:text-primary transition-colors py-1 rounded-md hover:bg-muted/50 px-2',
              item.level === 3 ? 'pl-5 text-muted-foreground' : 'font-medium text-foreground'
            )}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
