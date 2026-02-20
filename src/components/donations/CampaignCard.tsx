import { DonationCampaign } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Heart, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: DonationCampaign;
  onDonate?: () => void;
  index?: number;
}

export function CampaignCard({ campaign, onDonate, index = 0 }: CampaignCardProps) {
  const progress = campaign.goal_amount
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
    : null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: campaign.currency || 'XOF', maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'both' }}
    >
      {campaign.image_url && (
        <div className="h-36 overflow-hidden">
          <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{campaign.title}</h3>

        {campaign.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>
        )}

        {/* Progress */}
        {progress !== null && (
          <div className="space-y-1.5">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full gold-gradient rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">{fmt(campaign.current_amount)}</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                {fmt(campaign.goal_amount!)}
              </span>
            </div>
          </div>
        )}

        <Button
          size="sm"
          onClick={onDonate}
          className="w-full h-8 text-xs gold-gradient text-primary-foreground border-0 shadow-gold gap-1.5"
        >
          <Heart className="h-3.5 w-3.5" /> Donate Now
        </Button>
      </div>
    </div>
  );
}
