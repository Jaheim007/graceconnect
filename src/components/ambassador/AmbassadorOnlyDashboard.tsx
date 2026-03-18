import { useState } from 'react';
import { getOrCreateShortLink, buildShareUrlForPath } from '@/lib/shareMeta';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Search, Link2, TrendingUp, DollarSign, ExternalLink,
  Copy, ArrowRight, Sparkles, Eye, MousePointerClick, Share2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { AmbassadorGoalTracker } from './AmbassadorGoalTracker';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * Simplified dashboard for ambassador-only users (no org creation).
 * Shows their affiliate links, earnings, and quick access to discover.
 */
export function AmbassadorOnlyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user's affiliate links across all orgs
  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ['ambassador-links', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db.from('affiliate_links')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch total earnings
  const { data: salesData = [] } = useQuery({
    queryKey: ['ambassador-sales', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db.from('affiliate_sales')
        .select('commission_amount, status, organizations(currency)')
        .eq('affiliate_user_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalEarnings = salesData.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
  const pendingEarnings = salesData.filter(s => s.status === 'pending' || s.status === 'payable').reduce((sum, s) => sum + (s.commission_amount || 0), 0);
  const paidEarnings = salesData.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.commission_amount || 0), 0);
  const totalClicks = affiliateLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const totalConversions = affiliateLinks.reduce((sum, l) => sum + (l.conversions || 0), 0);

  const copyLink = async (code: string, slug: string) => {
    const path = `/org/${slug}?ref=${code}`;
    try {
      const shortUrl = await getOrCreateShortLink({ targetPath: path });
      navigator.clipboard.writeText(shortUrl);
    } catch {
      navigator.clipboard.writeText(buildShareUrlForPath(path));
    }
    toast({ title: 'Lien copié ✅' });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center space-y-2">
        <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
          <Share2 className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold">Mon espace Ambassadeur</h1>
        <p className="text-sm text-muted-foreground">
          Partagez, gagnez des commissions. Zéro contenu à créer.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Gains totaux', value: formatCurrency(totalEarnings, 'XOF'), icon: DollarSign, color: 'text-green-500 bg-green-500/10' },
          { label: 'En attente', value: formatCurrency(pendingEarnings, 'XOF'), icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Clics totaux', value: totalClicks.toString(), icon: MousePointerClick, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Conversions', value: totalConversions.toString(), icon: Eye, color: 'text-purple-500 bg-purple-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
            <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-1.5 sm:mb-2`}>
              <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <p className="text-base sm:text-lg font-bold truncate">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Goal Tracker & Tiers */}
      <AmbassadorGoalTracker />

      {/* Active links */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Mes liens d'ambassadeur ({affiliateLinks.length})</h2>
          <Button size="sm" variant="outline" onClick={() => navigate('/discover')} className="gap-1.5 text-xs h-8">
            <Search className="h-3.5 w-3.5" /> Trouver des produits
          </Button>
        </div>

        {affiliateLinks.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Commencez à gagner !</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Parcourez les plateformes disponibles et rejoignez celles qui vous intéressent. Vous recevrez un lien de partage unique pour chacune.
              </p>
            </div>
            <Button onClick={() => navigate('/discover')} className="gap-2">
              Explorer les plateformes <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {affiliateLinks.map((link: any) => {
              const org = link.organizations;
              if (!org) return null;
              const refUrl = `${window.location.origin}/org/${org.slug}?ref=${link.code}`;
              return (
                <div key={link.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{org.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{link.clicks || 0} clics</Badge>
                      <Badge variant="secondary" className="text-[10px]">{link.conversions || 0} ventes</Badge>
                      <Badge variant="outline" className="text-[10px] text-green-600">{formatCurrency(link.total_earned || 0, org.currency)}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyLink(link.code, org.slug)} title="Copier le lien">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(refUrl, '_blank')} title="Ouvrir">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* CTA to discover */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-bold">Augmentez vos revenus 🚀</h3>
          <p className="text-sm text-muted-foreground">Plus vous rejoignez de plateformes, plus vous gagnez. Explorez le catalogue.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate('/discover')} className="gap-2">
              <Search className="h-4 w-4" /> Explorer les plateformes
            </Button>
            <Button variant="outline" onClick={() => navigate('/ambassador')} className="gap-2">
              En savoir plus <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
