import { useParams, useNavigate, Link } from '@/lib/router-compat';
import { useShortLink } from '@/hooks/useShortLink';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfferingModal } from '@/components/offerings/OfferingModal';
import { useAuth } from '@/contexts/AuthContext';
import { Offering } from '@/hooks/useOfferings';
import {
  ArrowLeft, HandHeart, Copy, CheckCircle, ExternalLink,
  MessageCircle, RefreshCw, Lock,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { ShareButtons } from '@/components/social/ShareButtons';
import { FormattedText } from '@/lib/formatText';
import { useI18n } from '@/i18n/I18nContext';

export default function OfferingDetailPage() {
  const { offeringId } = useParams<{ offeringId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [donateOpen, setDonateOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: offering, isLoading } = useQuery({
    queryKey: ['offering-detail', offeringId],
    queryFn: async () => {
      const { data } = await db
        .from('offerings')
        .select('*, organizations(name, slug, logo_url, currency, description, banner_url)')
        .eq('id', offeringId)
        .eq('is_active', true)
        .maybeSingle();
      return data as (Offering & { organizations: any }) | null;
    },
    enabled: !!offeringId,
  });

  const { data: pageSettings } = useQuery({
    queryKey: ['org-page-settings-offering', offering?.organization_id],
    queryFn: async () => {
      const { data } = await db
        .from('org_page_settings')
        .select('theme_primary_color, theme_accent_color')
        .eq('organization_id', offering!.organization_id)
        .maybeSingle();
      return data;
    },
    enabled: !!offering?.organization_id,
  });

  const orgPrimary = pageSettings?.theme_primary_color;
  const orgThemeStyle = useMemo(() => {
    if (!orgPrimary) return {};
    return { '--org-primary': orgPrimary } as React.CSSProperties;
  }, [orgPrimary]);

  const { shareUrl: socialShareUrl } = useShortLink({
    targetPath: `/offering/${offeringId}`,
    title: offering?.title || 'Offering Siteviral',
    description: offering?.description?.slice(0, 155) || undefined,
    image: offering?.image_url || undefined,
  });

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(socialShareUrl);
    setCopied(true);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${offering?.title} — ${socialShareUrl}`)}`, '_blank');
  };

  const fmtLoc = isFr ? 'fr-FR' : 'en-US';
  const fmt = (n: number) =>
    new Intl.NumberFormat(fmtLoc, { maximumFractionDigits: 0 }).format(n) + ` ${offering?.currency || 'XOF'}`;

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

  if (!offering) {
    return (
      <EmptyState
        title={isFr ? 'Don introuvable' : 'Donation not found'}
        description={isFr ? "Ce don n'existe pas ou a été retiré." : 'This donation does not exist or has been removed.'}
        action={{ label: isFr ? 'Retour' : 'Back', onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const org = (offering as any).organizations;
  const presets = offering.preset_amounts || [1000, 2500, 5000, 10000];
  const topBarStyle = orgPrimary ? { borderBottomColor: `${orgPrimary}30` } : {};
  const bannerBg = orgPrimary
    ? { background: `linear-gradient(135deg, ${orgPrimary}18, ${orgPrimary}08, transparent)` }
    : {};

  return (
    <div className="min-h-screen bg-background" style={orgThemeStyle}>
      <SEOHead
        title={`${offering.title} — ${org?.name || 'Siteviral'}`}
        description={offering.description?.slice(0, 155) || (isFr ? `Soutenez ${offering.title} sur Siteviral` : `Support ${offering.title} on Siteviral`)}
        ogImage={offering.image_url || undefined}
      />

      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xs px-4 h-12 flex items-center justify-between" style={topBarStyle}>
        {org ? (
          <Link to={`/org/${org.slug}`} className="flex items-center gap-2.5">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}>
                {org.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold truncate max-w-[180px]">{org.name}</span>
          </Link>
        ) : (
          <Link to={user ? '/feed' : '/'}><SiteLogo size="sm" linked={false} animate /></Link>
        )}
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> {isFr ? 'Retour' : 'Back'}
        </Button>
      </div>

      {/* Org banner */}
      {org && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative border-b border-border/30 overflow-hidden" style={bannerBg}>
          {!orgPrimary && <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10" />}
          {org.banner_url && (
            <div className="absolute inset-0"><img src={org.banner_url} alt="" className="w-full h-full object-cover opacity-15" /></div>
          )}
          <div className="container max-w-5xl px-4 py-4 relative z-10">
            <div className="flex items-center gap-4">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="h-12 w-12 rounded-xl object-cover border-2 border-background shadow-md" />
              ) : (
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold text-primary-foreground shadow-md border-2 border-background" style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}>
                  {org.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{isFr ? 'Organisation' : 'Organization'}</p>
                <p className="font-bold text-sm">{org.name}</p>
                {org.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{org.description}</p>}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0 bg-background/80 backdrop-blur-xs" onClick={() => navigate(`/org/${org.slug}`)}>
                <ExternalLink className="h-3.5 w-3.5" /> {isFr ? 'Voir' : 'View'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="container max-w-5xl px-4 py-6">
        <div className="grid md:grid-cols-[1fr_340px] gap-6 md:gap-8">
          {/* Left column */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {offering.image_url && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-card aspect-video">
                <img src={offering.image_url} alt={offering.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
            )}
            {!offering.image_url && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-card aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <HandHeart className="h-20 w-20 text-primary/20" />
              </div>
            )}

            <div className="md:hidden space-y-2">
              <h1 className="text-2xl font-bold">{offering.title}</h1>
              {offering.is_recurring_allowed && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <RefreshCw className="h-3 w-3" /> {isFr ? 'Ponctuel ou récurrent' : 'One-time or recurring'}
                </Badge>
              )}
            </div>

            {offering.description && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <HandHeart className="h-4.5 w-4.5 text-primary" />
                  {isFr ? 'À propos de ce don' : 'About this donation'}
                </h2>
                <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
                  <FormattedText text={offering.description} className="text-sm text-muted-foreground leading-relaxed break-words" />
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl border border-border bg-card shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{isFr ? 'Partager ce don' : 'Share this donation'}</p>
              <ShareButtons url={`/offering/${offeringId}`} title={offering.title} description={offering.description || (isFr ? `Soutenez ${offering.title}` : `Support ${offering.title}`)} />
            </div>

            {org && (
              <div className="p-4 rounded-2xl border border-border bg-card shadow-card">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{isFr ? 'Organisation' : 'Organization'}</p>
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
                    <ExternalLink className="h-3.5 w-3.5" /> {isFr ? 'Voir' : 'View'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:sticky md:top-16 md:self-start space-y-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-card space-y-4">
              <div className="hidden md:block space-y-2">
                <h1 className="text-xl font-bold leading-snug">{offering.title}</h1>
                {offering.is_recurring_allowed && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <RefreshCw className="h-3 w-3" /> {isFr ? 'Ponctuel ou récurrent' : 'One-time or recurring'}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{isFr ? 'Montants suggérés' : 'Suggested amounts'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {presets.slice(0, 4).map((p) => (
                    <div key={p} className="text-center py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-semibold">
                      {fmt(p)}
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full h-12 text-base bg-primary text-primary-foreground gap-2 font-semibold" onClick={() => setDonateOpen(true)}>
                <HandHeart className="h-5 w-5" /> {isFr ? 'Faire un don' : 'Donate'}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                {isFr ? 'Paiement sécurisé' : 'Secure payment'}
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/40">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopyLink}>
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShareWhatsApp}>
                  <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <OfferingModal offering={offering as Offering} organizationId={offering.organization_id} open={donateOpen} onClose={() => setDonateOpen(false)} />
    </div>
  );
}
