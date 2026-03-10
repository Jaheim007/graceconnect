import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrgBadgesProps {
  isVerified?: boolean;
  kycStatus?: string | null;
  isSuspended?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function OrgBadges({ isVerified, kycStatus, isSuspended, className, size = 'sm' }: OrgBadgesProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  // Don't show isVerified here — the VerifiedBadge icon is already shown next to the name
  const hasAnything = (kycStatus && kycStatus !== 'none') || isSuspended;
  if (!hasAnything) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {kycStatus && kycStatus !== 'none' && (
        <Badge variant="outline" className={cn('gap-1 border-0 bg-emerald-500/10 text-emerald-600', textSize)}>
          <ShieldCheck className={iconSize} /> {kycStatus === 'level2' ? 'Vérifié Niv.2' : 'Vérifié'}
        </Badge>
      )}
      {isSuspended && (
        <Badge variant="outline" className={cn('gap-1 border-0 bg-destructive/10 text-destructive', textSize)}>
          <ShieldAlert className={iconSize} /> Suspended
        </Badge>
      )}
    </div>
  );
}
