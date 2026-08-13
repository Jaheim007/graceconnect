import { useState, useEffect } from 'react';
import { stripHtml } from '@/lib/formatText';
import { DonationCampaign } from '@/types/database';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Heart, Target, Share2, Copy, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc, getVerifiedLabel } from '@/lib/verifiedLabel';
import { getOrCreateShortLink, buildSocialShareUrl } from '@/lib/shareMeta';
import { useI18n } from '@/i18n/I18nContext';
import {
import { truncateWords } from '@/lib/truncateText';
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CampaignCardProps {
  campaign: DonationCampaign;
  index?: number;
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [shareUrl, setShareUrl] = useState('');

  const targetPath = `/campaign/${campaign.id}`;

  useEffect(() => {
    const fallback = buildSocialShareUrl({
      targetUrl: `${window.location.origin}${targetPath}`,
      title: campaign.title,
      description: truncateWords(stripHtml(campaign.description || ''), 155) || undefined,
      image: campaign.image_url || undefined,
    });
    setShareUrl(fallback);

    getOrCreateShortLink({
      targetPath,
      title: campaign.title,
      description: truncateWords(stripHtml(campaign.description || ''), 155) || undefined,
      image: campaign.image_url || undefined,
    })
      .then((url) => setShareUrl(url))
      .catch(() => {});
  }, [campaign.id, campaign.title, campaign.description, campaign.image_url, targetPath]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${campaign.title} — ${shareUrl}`)}`, '_blank');
  };

  const progress = campaign.goal_amount
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
    : null;

  const donorCount = Math.max(1, Math.floor((campaign.current_amount || 0) / 5000));
  const fmt = (n: number) => formatCurrency(n, campaign.currency);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200">
      <div className="cursor-pointer" onClick={() => navigate(targetPath)}>
        {campaign.image_url && (
          <div className="h-44 overflow-hidden">
            <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-5 pt-5 pb-2 space-y-2">
          <h3 className="font-bold text-base leading-snug line-clamp-2">{campaign.title}</h3>
          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(campaign.description)}</p>
          )}
          {(campaign as any).organization_name && (
            <p className="text-xs text-muted-foreground mt-1">
              {isFr ? 'Publié par' : 'By'}{' '}
              <span
                className="font-semibold text-primary hover:underline cursor-pointer"
                onClick={(e) => { e.stopPropagation(); navigate(`/org/${(campaign as any).organization_slug}`); }}
              >
                {(campaign as any).organization_name}
              </span>
              {isOrgVerifiedOrKyc((campaign as any).is_org_verified, (campaign as any).org_kyc_status) && <VerifiedBadge size="xs" label={getVerifiedLabel((campaign as any).org_category)} />}
            </p>
          )}
          {campaign.current_amount > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <Heart className="h-3 w-3 text-rose-400 fill-rose-400" />
              {donorCount}+ {isFr ? (donorCount > 1 ? 'donateurs' : 'donateur') : (donorCount > 1 ? 'donors' : 'donor')}
            </p>
          )}
          {progress !== null && (
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
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
              <Copy className="h-3.5 w-3.5" /> {isFr ? 'Copier le lien' : 'Copy link'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareWhatsApp} className="gap-2 text-xs">
              <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="default" onClick={() => navigate(targetPath)} className="flex-1 gap-2 font-semibold">
          <Heart className="h-4 w-4" /> {isFr ? 'Contribuer' : 'Contribute'}
        </Button>
      </div>
    </div>
  );
}
