import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  count?: number;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="h-40 skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 rounded skeleton-shimmer w-3/4" />
        <div className="h-3 rounded skeleton-shimmer w-1/2" />
        <div className="h-3 rounded skeleton-shimmer w-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 6, className }: SkeletonCardProps) {
  return (
    <div className={cn('grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
          <div className="h-10 w-10 rounded-full skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 rounded skeleton-shimmer w-2/5" />
            <div className="h-3 rounded skeleton-shimmer w-3/5" />
          </div>
          <div className="h-7 w-16 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonBanner() {
  return <div className="h-48 sm:h-64 rounded-2xl skeleton-shimmer" />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn('h-3 rounded skeleton-shimmer', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}
