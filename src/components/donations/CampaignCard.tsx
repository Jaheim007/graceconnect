import { DonationCampaign } from '@/types/database';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Heart, Target, Share2, Copy, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CampaignCardProps {
  campaign: DonationCampaign;
  index?: number;
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const shareUrl = `${window.location.origin}/campaign/${campaign.id}`;

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

  const fmt = (n: number) => formatCurrency(n, campaign.currency);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200">
      <div className="cursor-pointer" onClick={() => navigate(`/campaign/${campaign.id}`)}>
        {campaign.image_url && (
          <div className="h-44 overflow-hidden">
            <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-5 pt-5 pb-2 space-y-2">
          <h3 className="font-bold text-base leading-snug line-clamp-2">{campaign.title}</h3>
          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
          )}
          {(campaign as any).organization_name && (
            <p className="text-xs text-muted-foreground mt-1">
              Publié par{' '}
              <span
                className="font-semibold text-primary hover:underline cursor-pointer"
                onClick={(e) => { e.stopPropagation(); navigate(`/org/${(campaign as any).organization_slug}`); }}
              >
                {(campaign as any).organization_name}
              </span>
            </p>
          )}
          {progress !== null && (
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
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
        </div>
      </div>
      <div className="px-5 pb-5 pt-2 flex gap-2">
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
          onClick={() => navigate(`/campaign/${campaign.id}`)}
          className="flex-1 gap-2 font-semibold"
        >
          <Heart className="h-4 w-4" /> Faire un don
        </Button>
      </div>
    </div>
  );
}
