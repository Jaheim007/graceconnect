import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Trophy, Share2 } from 'lucide-react';
import { SwipeableFeed } from './SwipeableFeed';
import { AmbassadorLeaderboard } from './AmbassadorLeaderboard';
import { EarningsShareSection } from './EarningsShareSection';
import { LiveEarningsCounter } from './LiveEarningsCounter';
import { useAuth } from '@/contexts/AuthContext';

export function GagnerTabs() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      {/* Live stats bar for logged-in ambassadors */}
      {user && <LiveEarningsCounter />}

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="w-full grid grid-cols-3 h-11">
          <TabsTrigger value="marketplace" className="gap-1.5 text-xs">
            <ShoppingBag className="h-3.5 w-3.5" /> Découvrir
          </TabsTrigger>
          {user && (
            <TabsTrigger value="earnings" className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" /> Mes liens
            </TabsTrigger>
          )}
          <TabsTrigger value="leaderboard" className="gap-1.5 text-xs">
            <Trophy className="h-3.5 w-3.5" /> Résultats
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

        <TabsContent value="leaderboard">
          <AmbassadorLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
