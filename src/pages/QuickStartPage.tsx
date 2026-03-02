import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, CheckCircle, Circle, ExternalLink, Copy, Sparkles, TrendingUp, MessageCircle, Rocket, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

export default function QuickStartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [enrollingOrg, setEnrollingOrg] = useState<string | null>(null);

  // Fetch top products with highest commission potential
  const { data: topProducts = [], isLoading } = useQuery({
    queryKey: ['quick-start-products'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('id, title, cover_image_url, price, currency, sales_count, slug, organization_id, organizations(name, slug, logo_url, commission_rate, affiliation_enabled)')
        .eq('is_published', true)
        .gt('price', 0)
        .order('sales_count', { ascending: false })
        .limit(10);
      return (data || []).filter((p: any) => p.organizations?.affiliation_enabled);
    },
  });

  // Fetch top campaigns
  const { data: topCampaigns = [] } = useQuery({
    queryKey: ['quick-start-campaigns'],
    queryFn: async () => {
      const { data } = await db
        .from('donation_campaigns')
        .select('id, title, image_url, goal_amount, current_amount, currency, organization_id, organizations(name, slug, commission_rate, affiliation_enabled)')
        .eq('is_published', true)
        .eq('is_active', true)
        .order('current_amount', { ascending: false })
        .limit(5);
      return (data || []).filter((c: any) => c.organizations?.affiliation_enabled);
    },
  });

  // User's existing affiliate links
  const { data: myLinks = [] } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links').select('organization_id, code, clicks, conversions').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Self-enroll as ambassador
  const enrollMutation = useMutation({
    mutationFn: async (orgId: string) => {
      if (!user) throw new Error('Non connecté');
      const { error } = await db.rpc('self_enroll_affiliate', { _org_id: orgId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: '🎉 Vous êtes ambassadeur !', description: 'Vous pouvez maintenant partager et gagner.' });
      qc.invalidateQueries({ queryKey: ['user-affiliate-links', user?.id] });
      setEnrollingOrg(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      setEnrollingOrg(null);
    },
  });

  const myLinkMap = new Map(myLinks.map((l: any) => [l.organization_id, l]));

  // Progression checklist
  const hasShared = myLinks.some((l: any) => (l.clicks || 0) > 0);
  const hasClick = myLinks.some((l: any) => (l.clicks || 0) > 0);
  const hasSale = myLinks.some((l: any) => (l.conversions || 0) > 0);
  const totalLinks = myLinks.length;

  const checklist = [
    { label: 'Devenir ambassadeur d\'une organisation', done: totalLinks > 0 },
    { label: 'Partager votre premier lien', done: hasShared },
    { label: 'Obtenir votre premier clic', done: hasClick },
    { label: 'Réaliser votre première vente', done: hasSale },
  ];

  const completedSteps = checklist.filter(s => s.done).length;

  const handleShare = async (orgSlug: string, code: string, title: string) => {
    const url = `${window.location.origin}/org/${orgSlug}?ref=${code}`;
    const text = `Découvrez "${title}" sur Siteviral ! ${url}`;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}

    // Try WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const allItems = [
    ...topProducts.map((p: any) => ({
      id: p.id,
      type: 'product' as const,
      title: p.title,
      image: p.cover_image_url,
      price: p.price,
      currency: p.currency || 'XOF',
      orgId: p.organization_id,
      orgName: p.organizations?.name,
      orgSlug: p.organizations?.slug,
      commissionRate: p.organizations?.commission_rate || 10,
    })),
    ...topCampaigns.map((c: any) => ({
      id: c.id,
      type: 'campaign' as const,
      title: c.title,
      image: c.image_url,
      price: c.goal_amount,
      currency: c.currency || 'XOF',
      orgId: c.organization_id,
      orgName: c.organizations?.name,
      orgSlug: c.organizations?.slug,
      commissionRate: c.organizations?.commission_rate || 10,
    })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Démarrage Rapide — Gagner avec Siteviral" description="Commencez à gagner des commissions en partageant des produits numériques." noindex />

      <div className="container max-w-3xl px-4 py-6 sm:py-10 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Rocket className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Démarrage Rapide <span className="text-accent">Ambassadeur</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Partagez un lien, gagnez des commissions. C'est aussi simple que ça.
          </p>
        </motion.div>

        {/* Progression checklist */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              <h2 className="font-bold text-sm">Votre progression</h2>
            </div>
            <Badge variant="outline" className="text-xs">{completedSteps}/{checklist.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {checklist.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                <span className={cn('text-sm', step.done ? 'text-foreground font-medium' : 'text-muted-foreground')}>{step.label}</span>
                {step.done && i === 0 && <Badge className="text-[9px] bg-accent/10 text-accent border-accent/20 ml-auto">🏅 1er pas</Badge>}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(completedSteps / checklist.length) * 100}%` }} />
          </div>
        </motion.div>

        {/* Products to share */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Produits prêts à partager</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : allItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Aucun produit disponible pour le moment.</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate('/marketplace')}>Explorer la marketplace</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {allItems.map((item, i) => {
                const myLink = myLinkMap.get(item.orgId) as any;
                const estimatedGain = item.price ? Math.round((item.price * item.commissionRate) / 100) : 0;

                return (
                  <motion.div
                    key={item.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                  >
                    {/* Image */}
                    <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Share2 className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.orgName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{item.commissionRate}% commission</Badge>
                        {estimatedGain > 0 && (
                          <span className="text-xs font-bold text-accent">
                            +{formatCurrency(estimatedGain, item.currency)} / vente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {myLink ? (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            onClick={() => {
                              const url = `${window.location.origin}/org/${item.orgSlug}?ref=${myLink.code}`;
                              navigator.clipboard.writeText(url);
                              setCopiedId(myLink.code);
                              setTimeout(() => setCopiedId(null), 2000);
                              toast({ title: 'Lien copié !' });
                            }}
                          >
                            {copiedId === myLink.code ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                            onClick={() => handleShare(item.orgSlug, myLink.code, item.title)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          disabled={enrollingOrg === item.orgId}
                          onClick={() => {
                            setEnrollingOrg(item.orgId);
                            enrollMutation.mutate(item.orgId);
                          }}
                        >
                          {enrollingOrg === item.orgId ? '...' : 'Devenir ambassadeur'}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA to marketplace */}
        <div className="text-center pt-4">
          <Button variant="outline" onClick={() => navigate('/marketplace')} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Voir tout sur la Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}
