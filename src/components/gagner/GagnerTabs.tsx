import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Trophy, Share2, MessageCircle } from 'lucide-react';
import { SwipeableFeed } from './SwipeableFeed';
import { EarningsShareSection } from './EarningsShareSection';
import { LiveEarningsCounter } from './LiveEarningsCounter';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { SocialProofWall } from '@/components/growth/SocialProofWall';
import { ViralShareMessages } from '@/components/growth/ViralShareMessages';
import { MotivationalStatsWidget } from '@/components/growth/MotivationalStatsWidget';

export function GagnerTabs() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="space-y-4">
      {/* Motivational stats for everyone */}
      <MotivationalStatsWidget compact />

      {/* Live stats bar for logged-in ambassadors */}
      {user && <LiveEarningsCounter />}

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="w-full grid grid-cols-4 h-11">
          <TabsTrigger value="marketplace" className="gap-1 text-[11px]">
            <ShoppingBag className="h-3.5 w-3.5" /> {isFr ? 'Catalogue' : 'Catalog'}
          </TabsTrigger>
          {user && (
            <TabsTrigger value="earnings" className="gap-1 text-[11px]">
              <Share2 className="h-3.5 w-3.5" /> {isFr ? 'Mes liens' : 'My links'}
            </TabsTrigger>
          )}
          <TabsTrigger value="proofs" className="gap-1 text-[11px]">
            <Trophy className="h-3.5 w-3.5" /> {isFr ? 'Preuves' : 'Proofs'}
          </TabsTrigger>
          <TabsTrigger value="viral" className="gap-1 text-[11px]">
            <MessageCircle className="h-3.5 w-3.5" /> {isFr ? 'Partager' : 'Share'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          <SwipeableFeed />
        </TabsContent>

        {user && (
          <TabsContent value="earnings">
            <EarningsShareSection />
          </TabsContent>
        )}

        <TabsContent value="proofs">
          <SocialProofWall limit={8} />
        </TabsContent>

        <TabsContent value="viral">
          <ViralShareMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
}
