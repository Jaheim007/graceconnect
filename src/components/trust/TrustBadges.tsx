import { Shield, CheckCircle, Award, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrustBadgesProps {
  kycVerified?: boolean;
  salesCount?: number;
  createdAt?: string;
  className?: string;
}

/**
 * Seller Trust Badges — displays credibility indicators
 * - Verified Seller (KYC done)
 * - Top Seller (>= 50 sales)
 * - Established Seller (> 90 days)
 */
export function TrustBadges({ kycVerified, salesCount = 0, createdAt, className }: TrustBadgesProps) {
  const badges: { icon: typeof Shield; label: string; variant: 'default' | 'secondary' | 'outline' }[] = [];

  if (kycVerified) {
    badges.push({ icon: Shield, label: 'Vendeur Vérifié', variant: 'default' });
  }

  if (salesCount >= 50) {
    badges.push({ icon: Award, label: 'Top Vendeur', variant: 'secondary' });
  }

  if (createdAt) {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 90) {
      badges.push({ icon: Clock, label: 'Vendeur Établi', variant: 'outline' });
    }
  }

  if (!badges.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges.map(b => (
        <Badge key={b.label} variant={b.variant} className="gap-1 text-[10px] font-semibold">
          <b.icon className="h-3 w-3" />
          {b.label}
        </Badge>
      ))}
    </div>
  );
}
