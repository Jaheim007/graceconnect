import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DonateModal } from '@/components/donations/DonateModal';
import { useAuth } from '@/contexts/AuthContext';
import { DonationCampaign } from '@/types/database';
import {
  ArrowLeft, Heart, Share2, Copy, CheckCircle, Target,
  ExternalLink, MessageCircle, Calendar, Users,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency } from '@/lib/currency';
import { FormattedText } from '@/lib/formatText';

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [donateOpen, setDonateOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign-detail', campaignId],
    queryFn: async () => {
      const { data } = await db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency, description)')
        .eq('id', campaignId)
        .eq('is_published', true)
        .maybeSingle();
      return data;
    },
    enabled: !!campaignId,
  });

  const fmt = (n: number) => formatCurrency(n, campaign?.currency);

  const shareUrl = `${window.location.origin}/campaign/${campaignId}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Lien copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${campaign?.title} — ${shareUrl}`)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl py-8 px-4">
          <div className="grid md:grid-cols-[1fr_340px] gap-8">
            <div className="h-72 rounded-2xl skeleton-shimmer" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-1/3 rounded skeleton-shimmer" />
              <div className="h-12 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <EmptyState
        title="Campagne introuvable"
        description="Cette campagne n'existe pas ou a été retirée."
        action={{ label: 'Retour', onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const org = (campaign as any).organizations;
  const progress = campaign.goal_amount
    ? Math.min(((campaign.current_amount || 0) / campaign.goal_amount) * 100, 100)
    : null;

  const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
  const isExpired = endDate && endDate < new Date();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${campaign.title} — Siteviral`}
        description={campaign.description?.slice(0, 155) || `Soutenez ${campaign.title} sur Siteviral`}
        ogImage={campaign.image_url || undefined}
      />

      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between">
        <Link to={user ? '/feed' : '/'}>
          <span className="text-lg font-extrabold tracking-tight italic text-primary">Siteviral</span>
        </Link>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </div>

      <div className="container max-w-5xl px-4 py-6">
        <div className="grid md:grid-cols-[1fr_340px] gap-6 md:gap-8">
          {/* Left column */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {campaign.image_url && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-card aspect-video">
                <img src={campaign.image_url} alt={campaign.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="md:hidden space-y-2">
              <h1 className="text-2xl font-bold">{campaign.title}</h1>
              {endDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {isExpired ? 'Campagne terminée' : `Jusqu'au ${endDate.toLocaleDateString('fr-FR')}`}
                </div>
              )}
            </div>

            {campaign.description && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold">À propos de cette campagne</h2>
                <FormattedText
                  text={campaign.description}
                  className="text-sm text-muted-foreground leading-relaxed break-words"
                />
              </div>
            )}

            {/* Organization info */}
            {org && (
              <div className="p-4 rounded-2xl border border-border bg-card shadow-card">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Organisé par</p>
                <div className="flex items-center gap-3">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="h-12 w-12 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {org.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{org.name}</p>
                    {org.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{org.description}</p>}
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => navigate(`/org/${org.slug}`)}>
                    <ExternalLink className="h-3.5 w-3.5" /> Voir
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:sticky md:top-16 md:self-start space-y-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-card space-y-4">
              <div className="hidden md:block space-y-2">
                <h1 className="text-xl font-bold leading-snug">{campaign.title}</h1>
                {endDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {isExpired ? 'Campagne terminée' : `Jusqu'au ${endDate.toLocaleDateString('fr-FR')}`}
                  </div>
                )}
              </div>

              {/* Progress */}
              {progress !== null && (
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary">{fmt(campaign.current_amount || 0)}</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      {fmt(campaign.goal_amount!)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{Math.round(progress)}% de l'objectif atteint</p>
                </div>
              )}

              {!isExpired ? (
                <Button
                  className="w-full h-12 text-base bg-primary text-primary-foreground gap-2 font-semibold"
                  onClick={() => setDonateOpen(true)}
                >
                  <Heart className="h-5 w-5" /> Faire un don
                </Button>
              ) : (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  Campagne terminée
                </Badge>
              )}

              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/40">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopyLink}>
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShareWhatsApp}>
                  <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <DonateModal
        campaign={campaign as DonationCampaign}
        organizationId={campaign.organization_id}
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
      />
    </div>
  );
}
