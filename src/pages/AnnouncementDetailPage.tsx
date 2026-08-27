import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Megaphone, ExternalLink, Pin, Share2, Copy, CheckCircle, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { FormattedText } from '@/lib/formatText';
import { Badge } from '@/components/ui/badge';
import { CommentSection } from '@/components/comments/CommentSection';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { useShortLink } from '@/hooks/useShortLink';
import { useI18n } from '@/i18n/I18nContext';

export default function AnnouncementDetailPage() {
  const { announcementId } = useParams<{ announcementId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copied, setCopied] = useState(false);

  const { data: announcement, isLoading } = useQuery({
    queryKey: ['announcement-detail', announcementId],
    queryFn: async () => {
      const { data } = await db
        .from('announcements')
        .select('*, organizations(name, slug, logo_url, description)')
        .eq('id', announcementId)
        .eq('is_published', true)
        .maybeSingle();
      return data;
    },
    enabled: !!announcementId,
  });

  const { shareUrl: socialShareUrl } = useShortLink({
    targetPath: `/announcement/${announcementId}`,
    title: announcement?.title || (isFr ? 'Annonce Siteviral' : 'Siteviral Announcement'),
    description: announcement?.body?.slice(0, 155) || '',
    image: announcement?.image_url || undefined,
  });

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(socialShareUrl);
    setCopied(true);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${announcement?.title} — ${socialShareUrl}`)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-8 px-4">
          <div className="h-64 rounded-2xl skeleton-shimmer mb-4" />
          <div className="h-8 w-2/3 rounded-lg skeleton-shimmer mb-2" />
          <div className="h-4 w-1/3 rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <EmptyState
        title={isFr ? "Annonce introuvable" : "Announcement not found"}
        description={isFr ? "Cette annonce n'existe pas ou a été retirée." : "This announcement doesn't exist or has been removed."}
        action={{ label: isFr ? 'Retour' : 'Back', onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const org = (announcement as any).organizations;
  const dateLocale = isFr ? 'fr-FR' : 'en-US';
  const publishedDate = announcement.published_at
    ? new Date(announcement.published_at).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${announcement.title} — Siteviral`}
        description={announcement.body?.slice(0, 155) || (isFr ? `Annonce de ${org?.name || 'une plateforme'}` : `Announcement from ${org?.name || 'a platform'}`)}
        ogImage={announcement.image_url || undefined}
      />

      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xs px-4 h-12 flex items-center justify-between">
        <Link to={user ? '/feed' : '/'}>
          <SiteLogo size="sm" linked={false} animate />
        </Link>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> {isFr ? 'Retour' : 'Back'}
        </Button>
      </div>

      <div className="container max-w-3xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {announcement.image_url && (
            <div className="rounded-2xl overflow-hidden border border-border shadow-card aspect-video">
              <img src={announcement.image_url} alt={announcement.title} loading="lazy" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {announcement.is_pinned && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Pin className="h-3 w-3" /> {isFr ? 'Épinglé' : 'Pinned'}
                </Badge>
              )}
              {publishedDate && (
                <span className="text-xs text-muted-foreground">{publishedDate}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{announcement.title}</h1>
          </div>

          <div className="space-y-3">
            <FormattedText
              text={announcement.body}
              className="text-sm text-muted-foreground leading-relaxed break-words"
            />
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopyLink}>
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier le lien' : 'Copy link')}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShareWhatsApp}>
              <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
            </Button>
            {user && <BookmarkButton contentType="announcement" contentId={announcement.id} />}
          </div>

          {/* Organization info */}
          {org && (
            <div className="p-4 rounded-2xl border border-border bg-card shadow-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{isFr ? 'Publié par' : 'Published by'}</p>
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

          {/* Comments */}
          <CommentSection contentType="announcement" contentId={announcement.id} />
        </motion.div>
      </div>
    </div>
  );
}
