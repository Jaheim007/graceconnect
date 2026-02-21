import { DonationCampaign } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Heart, Target, Share2, Copy, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CampaignCardProps {
  campaign: DonationCampaign;
  onDonate?: () => void;
  index?: number;
}

export function CampaignCard({ campaign, onDonate, index = 0 }: CampaignCardProps) {
  const { toast } = useToast();

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Lien copié !' });
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${campaign.title} — ${shareUrl}`)}`, '_blank');
  };

  const progress = campaign.goal_amount
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
    : null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: campaign.currency || 'XOF', maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
    >
      {campaign.image_url && (
        <div className="h-44 overflow-hidden">
          <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5 space-y-3">
        <h3 className="font-bold text-base leading-snug line-clamp-2">{campaign.title}</h3>

        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
        )}

        {/* Progress */}
        {progress !== null && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full gold-gradient rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-primary">{fmt(campaign.current_amount)}</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {fmt(campaign.goal_amount!)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="shrink-0 px-3">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={handleCopyLink} className="gap-2 text-xs">
                <Copy className="h-3.5 w-3.5" /> Copier le lien
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareWhatsApp} className="gap-2 text-xs">
                <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="default"
            onClick={onDonate}
            className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold gap-2 font-semibold"
          >
            <Heart className="h-4 w-4" /> Faire un don
          </Button>
        </div>
      </div>
    </div>
  );
}
