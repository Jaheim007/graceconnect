import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Check, Loader2 } from 'lucide-react';
import { useExpressSetup } from '@/hooks/useExpressSetup';
import { useOrgProducts, useOrgCampaigns } from '@/hooks/useMonetization';
import { useOrg } from '@/contexts/OrgContext';

/**
 * "Démarrage Express" button — creates demo product + campaign in one click.
 * Hidden once the org already has content.
 */
export function ExpressSetupButton() {
  const { currentOrg } = useOrg();
  const { run, loading } = useExpressSetup();
  const [done, setDone] = useState(false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: campaigns = [] } = useOrgCampaigns(currentOrg?.id, false);

  // Hide if org already has products or campaigns
  if (products.length > 0 || campaigns.length > 0 || done) return null;

  const handleClick = async () => {
    await run();
    setDone(true);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md"
      size="sm"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : done ? (
        <Check className="h-4 w-4" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      {loading ? 'Création en cours…' : 'Démarrage Express'}
    </Button>
  );
}
