import { ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrgBadgesProps {
  isSuspended?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function OrgBadges({ isSuspended, className, size = 'sm' }: OrgBadgesProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  if (!isSuspended) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <Badge variant="outline" className={cn('gap-1 border-0 bg-destructive/10 text-destructive', textSize)}>
        <ShieldAlert className={iconSize} /> Suspended
      </Badge>
    </div>
  );
}
