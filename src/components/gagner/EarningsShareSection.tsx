import { useMyAffiliateRank } from '@/hooks/useAffiliateMarketplace';
import { EarningsCard } from '@/components/ambassador/EarningsCard';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { AmbassadorBadges } from '@/components/gamification/AmbassadorBadges';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function EarningsShareSection() {
  const { data: myRank, isLoading } = useMyAffiliateRank();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (isLoading) {
    return <div className="h-48 rounded-2xl bg-muted/50 animate-pulse" />;
  }

  if (!myRank || myRank.totalEarned === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
          <TrendingUp className="h-8 w-8 text-accent" />
        </div>
        <div>
          <p className="font-bold">{isFr ? 'Pas encore de gains' : 'No earnings yet'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isFr
              ? 'Choisis un produit et partage ton lien pour commencer à gagner !'
              : 'Pick a product and share your link to start earning!'}
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/gagner')}>
          {isFr ? 'Explorer les produits' : 'Browse products'} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EarningsCard
        totalEarned={myRank.totalEarned}
        salesCount={myRank.totalConversions}
        clicksCount={myRank.totalClicks}
      />
      <div className="border-t border-border pt-6">
        <AmbassadorBadges />
      </div>
      <div className="border-t border-border pt-6">
        <SocialShareKit
          url="https://siteviral.com/gagner"
          title="Siteviral"
          context="earnings"
          earnings={myRank.totalEarned}
        />
      </div>
    </div>
  );
}
