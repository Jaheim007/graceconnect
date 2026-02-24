import { cn } from '@/lib/utils';

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
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-border text-sm font-medium text-muted-foreground shrink-0 hover:border-primary/30 hover:text-foreground transition-colors"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
