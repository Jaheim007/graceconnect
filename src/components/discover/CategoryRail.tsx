import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const CATEGORY_META = [
  { value: '', emoji: '' },
  { value: 'pdf', emoji: '📄' },
  { value: 'ebook', emoji: '📚' },
  { value: 'audio', emoji: '🎵' },
  { value: 'video', emoji: '🎬' },
  { value: 'course', emoji: '🎓' },
  { value: 'link', emoji: '🔗' },
  { value: 'campaigns', emoji: '❤️' },
  { value: 'offerings', emoji: '🤲' },
] as const;

export type CategoryValue = typeof CATEGORY_META[number]['value'];

export function useCategoryLabels(): Record<string, string> {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  return {
    '': isFr ? 'Tout' : 'All',
    pdf: 'PDF',
    ebook: 'E-books',
    audio: 'Audio',
    video: isFr ? 'Vidéo' : 'Video',
    course: isFr ? 'Cours' : 'Courses',
    link: isFr ? 'Liens' : 'Links',
    campaigns: isFr ? 'Campagnes' : 'Campaigns',
    offerings: isFr ? 'Dons' : 'Donations',
  };
}

interface CategoryRailProps {
  value: CategoryValue;
  onChange: (v: CategoryValue) => void;
  /** Rail id for the sliding pill — keep unique when two rails coexist. */
  layoutId?: string;
  className?: string;
}

/** Glass segmented control used to filter the discover surfaces. */
export function CategoryRail({ value, onChange, layoutId = 'explore-cat-pill', className }: CategoryRailProps) {
  const labels = useCategoryLabels();

  return (
    <ScrollArea className={cn('w-full', className)}>
      <div className="flex w-max gap-1 rounded-full border border-border/60 bg-card/70 p-1 backdrop-blur-md shadow-[0_10px_30px_-22px_hsl(var(--primary)/0.6)]">
        {CATEGORY_META.map((cat) => {
          const active = value === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onChange(cat.value)}
              aria-pressed={active}
              className={cn(
                'relative shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors',
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary via-primary to-fuchsia-500 shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.85)]"
                />
              )}
              <span className="relative flex items-center gap-1.5 whitespace-nowrap">
                {cat.emoji && <span className={cn('transition-transform', active && 'scale-110')}>{cat.emoji}</span>}
                {labels[cat.value]}
              </span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
