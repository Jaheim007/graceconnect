import { useI18n } from '@/i18n/I18nContext';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Layers } from 'lucide-react';

interface ContentSizeBadgeProps {
  pageCount?: number | null;
  productType?: string;
  /** estimated reading time in minutes */
  className?: string;
}

export function ContentSizeBadge({ pageCount, productType, className }: ContentSizeBadgeProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (!pageCount || pageCount <= 0) return null;

  // Estimate reading time: ~2 min per page for PDFs/ebooks
  const readingMinutes = ['pdf', 'ebook'].includes(productType || '')
    ? Math.ceil(pageCount * 2)
    : null;

  const formatTime = (min: number) => {
    if (min >= 60) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h}h${m}` : `${h}h`;
    }
    return `${min} min`;
  };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className || ''}`}>
      <Badge variant="outline" className="text-[9px] gap-0.5 py-0 h-4">
        <FileText className="h-2.5 w-2.5" />
        {pageCount} {isFr ? 'pages' : 'pages'}
      </Badge>
      {readingMinutes && (
        <Badge variant="outline" className="text-[9px] gap-0.5 py-0 h-4">
          <Clock className="h-2.5 w-2.5" />
          ~{formatTime(readingMinutes)} {isFr ? 'de lecture' : 'read'}
        </Badge>
      )}
    </div>
  );
}
