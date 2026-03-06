import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Trophy, Share2 } from 'lucide-react';
import { AmbassadorMarketplace } from './AmbassadorMarketplace';
import { AmbassadorLeaderboard } from './AmbassadorLeaderboard';
import { EarningsShareSection } from './EarningsShareSection';
import { useAuth } from '@/contexts/AuthContext';

export function GagnerTabs() {
  const { user } = useAuth();

  return (
    <Tabs defaultValue="marketplace" className="space-y-6">
      <TabsList className="w-full grid grid-cols-3 h-11">
        <TabsTrigger value="marketplace" className="gap-1.5 text-xs">
          <ShoppingBag className="h-3.5 w-3.5" /> Produits
        </TabsTrigger>
        <TabsTrigger value="leaderboard" className="gap-1.5 text-xs">
          <Trophy className="h-3.5 w-3.5" /> Classement
        </TabsTrigger>
        {user && (
          <TabsTrigger value="earnings" className="gap-1.5 text-xs">
            <Share2 className="h-3.5 w-3.5" /> Mes gains
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="marketplace">
        <AmbassadorMarketplace />
      </TabsContent>

      <TabsContent value="leaderboard">
        <AmbassadorLeaderboard />
      </TabsContent>

      {user && (
        <TabsContent value="earnings">
          <EarningsShareSection />
        </TabsContent>
      )}
    </Tabs>
  );
}
