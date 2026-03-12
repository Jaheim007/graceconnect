import { useParams, useNavigate, Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CalendarDays, MapPin, ExternalLink, Copy, CheckCircle, MessageCircle, Clock, Play } from 'lucide-react';
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
import { EventCountdown } from '@/components/events/EventCountdown';
import { GoogleMapCard } from '@/components/events/GoogleMapCard';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const dateLoc = locale === 'fr' ? 'fr-FR' : 'en-US';
  const [copied, setCopied] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-detail', eventId],
    queryFn: async () => {
      const { data } = await db
        .from('events')
        .select('*, organizations(name, slug, logo_url, description, is_verified)')
        .eq('id', eventId)
        .eq('is_published', true)
        .maybeSingle();
      return data;
    },
    enabled: !!eventId,
  });

  const { shareUrl: socialShareUrl } = useShortLink({
    targetPath: `/event/${eventId}`,
    title: event?.title || 'Événement Siteviral',
    description: event?.description?.slice(0, 155) || '',
    image: event?.image_url || undefined,
  });

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(socialShareUrl);
    setCopied(true);
    toast({ title: 'Lien copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${event?.title} — ${socialShareUrl}`)}`, '_blank');
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

  if (!event) {
    return (
      <EmptyState
        title="Événement introuvable"
        description="Cet événement n'existe pas ou a été retiré."
        action={{ label: 'Retour', onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const org = (event as any).organizations;
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const isPast = eventDate && eventDate < new Date();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${event.title} — Siteviral`}
        description={event.description?.slice(0, 155) || `Événement de ${org?.name || 'une plateforme'}`}
        ogImage={event.image_url || undefined}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.title,
          description: event.description,
          startDate: event.event_date,
          location: event.location ? { '@type': 'Place', name: event.location } : undefined,
          image: event.image_url,
          organizer: org ? { '@type': 'Organization', name: org.name } : undefined,
        }}
      />

      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between">
        <Link to={user ? '/feed' : '/'}>
          <SiteLogo size="sm" linked={false} animate />
        </Link>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </div>

      <div className="container max-w-3xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {event.image_url ? (
            <div className="rounded-2xl overflow-hidden border border-border shadow-card aspect-video">
              <img src={event.image_url} alt={event.title} loading="lazy" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-border shadow-card aspect-video bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-16 w-16 text-primary/30" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {isPast && <Badge variant="secondary" className="text-xs">Passé</Badge>}
              {event.is_featured && <Badge variant="default" className="text-xs">En vedette</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{event.title}</h1>

            <div className="flex flex-col gap-2">
              {eventDate && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-primary">
                    {eventDate.toLocaleDateString(dateLoc, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
              {eventDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{eventDate.toLocaleTimeString(dateLoc, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Countdown */}
          {!isPast && eventDate && (
            <EventCountdown endDate={event.event_date} />
          )}

          {/* YouTube Video */}
          {(event as any).video_url && (() => {
            const url = (event as any).video_url as string;
            let videoId = '';
            if (url.includes('youtu.be/')) {
              videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
            } else if (url.includes('youtube.com')) {
              const match = url.match(/[?&]v=([^&#]+)/);
              videoId = match?.[1] || '';
            }
            if (!videoId) return null;
            return (
              <div className="rounded-2xl overflow-hidden border border-border shadow-card aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  title="Vidéo de l'événement"
                />
              </div>
            );
          })()}

          {event.description && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">À propos de cet événement</h2>
              <FormattedText
                text={event.description}
                className="text-sm text-muted-foreground leading-relaxed break-words"
              />
            </div>
          )}

          {/* Google Map */}
          {(event.location || (event as any).map_url) && (
            <GoogleMapCard location={event.location || undefined} mapUrl={(event as any).map_url || undefined} />
          )}

          {/* Share buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopyLink}>
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copié' : 'Copier le lien'}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShareWhatsApp}>
              <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
            </Button>
            {user && <BookmarkButton contentType="event" contentId={event.id} />}
          </div>

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

          {/* Comments */}
          <CommentSection contentType="event" contentId={event.id} />
        </motion.div>
      </div>
    </div>
  );
}
