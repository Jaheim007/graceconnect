import { cn } from '@/lib/utils';
import { BookOpen, Headphones, Video, FileText, Image, Mic, Presentation, Music, PenTool, Notebook } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'E-books': BookOpen,
  'Formations': Presentation,
  'Prédications': Mic,
  'Podcasts': Headphones,
  'Vidéos': Video,
  'Guides': FileText,
  'Coaching': PenTool,
  'Webinaires': Presentation,
  'Photos': Image,
  'Musique': Music,
  'Cours en ligne': BookOpen,
  'Documents PDF': FileText,
  'Newsletters': FileText,
  'Illustrations': Image,
  'Templates': Notebook,
  'Tutoriels': Video,
  'Audio': Headphones,
  'Manuels': BookOpen,
  'Scripts': FileText,
  'Ressources': Notebook,
};

interface MarqueeProps {
  items: string[];
  direction?: 'left' | 'right';
  className?: string;
  speed?: number;
}

export function Marquee({ items, direction = 'left', className, speed = 30 }: MarqueeProps) {
  const doubled = [...items, ...items, ...items, ...items];
  const animClass = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';

  return (
    <div className={cn('overflow-hidden relative', className)}>
      <div
        className={cn('flex gap-4 whitespace-nowrap', animClass)}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((item, i) => {
          const Icon = iconMap[item];
          return (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border border-border text-sm font-medium text-muted-foreground shrink-0 hover:border-primary/30 hover:text-foreground transition-colors"
            >
              {Icon && <Icon className="h-4 w-4 text-primary/60" />}
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
