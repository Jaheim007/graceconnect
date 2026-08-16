import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MousePointer2 } from 'lucide-react';

/** Fake app window chrome — used as the frame of every tutorial "video". */
export function MockWindow({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card overflow-hidden shadow-lg', className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="ml-2 truncate text-[10px] font-medium text-muted-foreground">
          {title ?? 'siteviral.com'}
        </span>
      </div>
      <div className="relative p-3 sm:p-4">{children}</div>
    </div>
  );
}

/** Mini sidebar mimicking the dashboard navigation. */
export function MockSidebar({ items, active }: { items: string[]; active?: string }) {
  return (
    <div className="hidden sm:flex w-32 shrink-0 flex-col gap-1">
      {items.map((label) => (
        <div
          key={label}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-[10px] font-medium',
            label === active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground',
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export function MockCard({
  children,
  className,
  highlight,
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'rounded-xl border bg-background/60 p-3',
        highlight ? 'border-primary/50 ring-2 ring-primary/15' : 'border-border',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function MockButton({
  children,
  variant = 'primary',
  pulse,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  pulse?: boolean;
}) {
  return (
    <motion.span
      animate={pulse ? { scale: [1, 1.05, 1] } : undefined}
      transition={pulse ? { duration: 1.4, repeat: Infinity } : undefined}
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1.5 text-[10px] font-semibold',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground'
          : 'border border-border text-muted-foreground',
      )}
    >
      {children}
    </motion.span>
  );
}

export function MockField({
  label,
  value,
  typing,
}: {
  label: string;
  value: string;
  typing?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground">
        {value}
        {typing && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="ml-0.5 inline-block h-3 w-[1.5px] translate-y-[2px] bg-primary"
          />
        )}
      </div>
    </div>
  );
}

export function MockBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <p className="text-[9px] text-muted-foreground">{label}</p>}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="h-full rounded-full bg-primary"
        />
      </div>
    </div>
  );
}

/** Animated pointer that glides to a target position (percent based). */
export function MockCursor({ to = { x: 60, y: 55 }, delay = 0.3 }: { to?: { x: number; y: number }; delay?: number }) {
  return (
    <motion.div
      initial={{ left: '15%', top: '85%', opacity: 0 }}
      animate={{ left: `${to.x}%`, top: `${to.y}%`, opacity: 1 }}
      transition={{ duration: 1, delay, ease: 'easeInOut' }}
      className="pointer-events-none absolute z-20"
    >
      <MousePointer2 className="h-4 w-4 fill-foreground text-background drop-shadow" />
    </motion.div>
  );
}

export function MockToast({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 22 }}
      className="absolute bottom-3 right-3 z-30 rounded-xl border border-primary/30 bg-card px-3 py-2 text-[10px] font-semibold text-foreground shadow-xl"
    >
      {children}
    </motion.div>
  );
}
