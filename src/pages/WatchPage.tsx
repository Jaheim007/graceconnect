import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, BookmarkPlus, Share2, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMediaById, useTrackView } from '@/hooks/useMedia';
import { useState, useMemo, useEffect, useRef } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';

/** Detect social media / YouTube / Vimeo / Facebook URLs and return embeddable iframe src */
function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');

    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be') {
      let videoId = '';
      if (host === 'youtu.be') {
        videoId = u.pathname.slice(1).split('?')[0];
      } else if (u.searchParams.get('v')) {
        videoId = u.searchParams.get('v')!;
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.replace('/shorts/', '').split('?')[0];
      } else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.replace('/embed/', '').split('?')[0];
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }

    // Vimeo
    if (host === 'vimeo.com') {
      const videoId = u.pathname.split('/').filter(Boolean)[0];
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }

    // Facebook video
    if (host === 'facebook.com' || host === 'fb.watch') {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
    }

    // Dailymotion
    if (host === 'dailymotion.com') {
      const videoId = u.pathname.split('/video/')[1]?.split('_')[0];
      if (videoId) return `https://www.dailymotion.com/embed/video/${videoId}`;
    }

    return null;
  } catch {
    return null;
  }
}

function isDirectMedia(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v|mkv|mp3|wav|aac|m4a)(\?|$)/i.test(url);
}

export default function WatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: media, isLoading } = useMediaById(id);
  const [playing, setPlaying] = useState(false);
  const trackView = useTrackView();
  const viewTracked = useRef(false);

  // Track view once when media loads
  useEffect(() => {
    if (media?.id && !viewTracked.current) {
      viewTracked.current = true;
      trackView.mutate(media.id);
    }
  }, [media?.id]);

  const embedUrl = useMemo(() => (media?.media_url ? getEmbedUrl(media.media_url) : null), [media?.media_url]);
  const isDirect = media?.media_url ? isDirectMedia(media.media_url) : false;
  const isAudio = media?.media_type === 'audio';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Content not found</p>
        <Button onClick={() => navigate(-1)} variant="outline" size="sm">Go back</Button>
      </div>
    );
  }

  const renderPlayer = () => {
    if (!media.media_url) {
      // No URL — demo placeholder
      return (
        <div className="w-full h-full hero-gradient flex flex-col items-center justify-center gap-3">
          {media.thumbnail_url && (
            <img src={media.thumbnail_url} alt={media.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <button
            onClick={() => setPlaying(!playing)}
            className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center z-10 hover:bg-primary transition-colors"
          >
            {playing ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground ml-0.5" />}
          </button>
          <p className="text-xs text-muted-foreground z-10">No media URL</p>
        </div>
      );
    }

    if (isAudio || (isDirect && isAudio)) {
      return (
        <div className="w-full h-full flex items-end pb-4 px-4">
          {media.thumbnail_url && (
            <img src={media.thumbnail_url} alt={media.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <audio controls className="w-full relative z-10" src={media.media_url} />
        </div>
      );
    }

    // Embedded social media player (YouTube, Vimeo, Facebook…)
    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={media.title}
        />
      );
    }

    // Direct video file
    if (isDirect) {
      return (
        <video
          controls
          src={media.media_url}
          poster={media.thumbnail_url || undefined}
          className="w-full h-full"
        />
      );
    }

    // Unknown URL — show open link button
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        {media.thumbnail_url && (
          <img src={media.thumbnail_url} alt={media.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <a
          href={media.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Open Media ↗
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${media.title} — Siteviral`}
        description={media.description?.slice(0, 155) || `Regardez ${media.title} sur Siteviral`}
        ogImage={media.thumbnail_url || undefined}
        ogType="video.other"
      />
      {/* Back bar */}
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-medium text-sm truncate flex-1">{media.title}</span>
      </div>

      <div className="container max-w-4xl py-6 space-y-5">
        {/* Player */}
        <div className={`rounded-2xl overflow-hidden bg-muted relative ${isAudio ? 'h-40' : 'aspect-video'}`}>
          {renderPlayer()}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h1 className="text-lg font-bold leading-snug">{media.title}</h1>
              {media.speaker && <p className="text-sm text-muted-foreground">{media.speaker}</p>}
            </div>
            <Badge variant="secondary" className="text-xs capitalize shrink-0">
              {media.media_type?.replace('_', ' ')}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <Heart className="h-3.5 w-3.5" /> {media.like_count ?? 0}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <BookmarkPlus className="h-3.5 w-3.5" /> Save
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">{media.view_count ?? 0} views</span>
          </div>
        </div>

        {/* Tags */}
        {media.tags && media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {media.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {media.description && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{media.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
