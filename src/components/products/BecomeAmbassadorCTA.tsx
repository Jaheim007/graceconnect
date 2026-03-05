import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface BecomeAmbassadorCTAProps {
  organizationId: string;
  orgSlug: string;
  orgName: string;
  commissionPercent?: number;
}

/**
 * 1-click "Become Ambassador" CTA shown on public product pages.
 * Calls self_enroll_affiliate RPC for instant enrollment.
 */
export function BecomeAmbassadorCTA({ organizationId, orgSlug, orgName, commissionPercent }: BecomeAmbassadorCTAProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);

  // Check if org has affiliation enabled
  const { data: orgInfo } = useQuery({
    queryKey: ['org-affiliation-check', organizationId],
    queryFn: async () => {
      const { data } = await db.from('organizations')
        .select('affiliation_enabled, owner_id')
        .eq('id', organizationId)
        .maybeSingle();
      return data;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 10,
  });

  // Check if user already has affiliate link
  const { data: existingLink, refetch: refetchLink } = useQuery({
    queryKey: ['my-aff-link-exists', user?.id, organizationId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await db.from('affiliate_links')
        .select('code')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!organizationId,
    staleTime: 1000 * 60 * 5,
  });

  // Don't show if affiliation not enabled, or user is org owner
  if (!orgInfo?.affiliation_enabled) return null;
  if (user && orgInfo?.owner_id === user.id) return null;
  if (existingLink) return null;

  const handleEnroll = async () => {
    if (!user) {
      navigate(`/auth?returnTo=/org/${orgSlug}`);
      return;
    }
    setEnrolling(true);
    try {
      const { error } = await supabase.rpc('self_enroll_affiliate', { _org_id: organizationId });
      if (error) throw error;
      toast.success('🎉 Vous êtes maintenant ambassadeur !', {
        description: `Partagez les produits de ${orgName} et gagnez des commissions.`,
      });
      refetchLink();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-background to-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Users className="h-4.5 w-4.5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Devenez ambassadeur</p>
          <p className="text-xs text-muted-foreground">
            Partagez et gagnez {commissionPercent ? `${commissionPercent}%` : 'une commission'} sur chaque vente
          </p>
        </div>
      </div>
      <Button
        onClick={handleEnroll}
        disabled={enrolling}
        className="w-full gap-2 h-10"
        variant="outline"
      >
        <Zap className="h-4 w-4" />
        {enrolling ? 'Inscription...' : 'Devenir ambassadeur en 1 clic'}
      </Button>
    </motion.div>
  );
}
