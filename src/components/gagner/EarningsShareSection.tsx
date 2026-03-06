import { useMyAffiliateRank } from '@/hooks/useAffiliateMarketplace';
import { EarningsCard } from '@/components/ambassador/EarningsCard';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';

export function EarningsShareSection() {
  const { data: myRank, isLoading } = useMyAffiliateRank();
  const navigate = useNavigate();

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
          <p className="font-bold">Pas encore de gains</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choisis un produit et partage ton lien pour commencer à gagner !
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/gagner')}>
          Explorer les produits <ArrowRight className="h-4 w-4" />
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
