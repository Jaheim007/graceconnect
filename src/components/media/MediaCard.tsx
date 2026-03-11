import { useState, useMemo, useRef, useEffect } from 'react';
import { Play, Headphones, Video, Heart, Eye, X, ExternalLink, Pause } from 'lucide-react';
import { MediaContent } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-3 w-3" />,
  audio: <Headphones className="h-3 w-3" />,
  reel: <Play className="h-3 w-3" />,
  live_replay: <Video className="h-3 w-3" />,
};

const typeLabels: Record<string, string> = {
  video: 'Vidéo',
  audio: 'Audio',
  reel: 'Reel',
  live_replay: 'Replay',
};

function formatDuration(secs?: number) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
      let vid = '';
      if (host === 'youtu.be') vid = u.pathname.slice(1).split('?')[0];
      else if (u.searchParams.get('v')) vid = u.searchParams.get('v')!;
      else if (u.pathname.startsWith('/shorts/')) vid = u.pathname.replace('/shorts/', '').split('?')[0];
      else if (u.pathname.startsWith('/embed/')) vid = u.pathname.replace('/embed/', '').split('?')[0];
      else if (u.pathname.startsWith('/live/')) vid = u.pathname.replace('/live/', '').split('?')[0];
      if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
    }
    if (host === 'vimeo.com') {
      const vid = u.pathname.split('/').filter(Boolean)[0];
      if (vid) return `https://player.vimeo.com/video/${vid}?autoplay=1`;
    }
    if (host === 'dailymotion.com') {
      const vid = u.pathname.split('/video/')[1]?.split('_')[0];
      if (vid) return `https://www.dailymotion.com/embed/video/${vid}?autoplay=1`;
    }
    return null;
  } catch {
    return null;
  }
}

function isDirectMedia(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v|mp3|wav|aac|m4a)(\?|$)/i.test(url);
}

function isFacebookUrl(url: string) {
  return /(?:facebook\.com|fb\.watch|fb\.com)/i.test(url);
}

interface MediaCardProps {
  media: MediaContent;
  index?: number;
  compact?: boolean;
}

export function MediaCard({ media, index = 0, compact = false }: MediaCardProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const embedUrl = useMemo(() => (media.media_url ? getEmbedUrl(media.media_url) : null), [media.media_url]);
  const isDirect = media.media_url ? isDirectMedia(media.media_url) : false;
  const isAudio = media.media_type === 'audio';
  const isFB = media.media_url ? isFacebookUrl(media.media_url) : false;
  const canPlayInline = !!(embedUrl || isDirect || isAudio);

  const handleClick = () => {
    if (isFB && media.media_url) {
      window.open(media.media_url, '_blank');
      return;
    }
    setPlaying(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(false);
  };

  return (
    <div
      className={cn(
        'group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-300',
        compact ? 'flex gap-3 p-2' : '',
        !playing && !compact && 'hover:-translate-y-1'
      )}
      onClick={!playing ? handleClick : undefined}
    >
      {/* Thumbnail / Player */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        compact ? 'h-20 w-28 rounded-xl shrink-0' : playing ? 'aspect-video w-full' : 'aspect-video w-full'
      )}>
        {playing && !compact ? (
          /* Inline player */
          <div className="w-full h-full relative">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={media.title}
              />
            ) : isDirect && isAudio ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                {media.thumbnail_url && (
                  <img src={media.thumbnail_url} alt={media.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                )}
                <audio controls autoPlay className="w-full relative z-10" src={media.media_url!} />
              </div>
            ) : isDirect ? (
              <video
                ref={videoRef}
                controls
                autoPlay
                src={media.media_url!}
                poster={media.thumbnail_url || undefined}
                className="w-full h-full object-contain bg-black"
              />
            ) : isAudio ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                {media.thumbnail_url && (
                  <img src={media.thumbnail_url} alt={media.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                )}
                <audio controls autoPlay className="w-full relative z-10" src={media.media_url!} />
              </div>
            ) : media.media_url ? (
              <a href={media.media_url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-muted-foreground" />
              </a>
            ) : null}
          </div>
        ) : (
          /* Thumbnail view */
          <>
            {media.thumbnail_url ? (
              <img
                src={media.thumbnail_url}
                alt={media.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full hero-gradient flex items-center justify-center">
                <Play className="h-10 w-10 text-primary/40" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-300 shadow-lg">
                <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
              </div>
            </div>

            {/* Duration */}
            {media.duration_seconds && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded-md font-mono">
                {formatDuration(media.duration_seconds)}
              </div>
            )}

            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 bg-black/60 text-white border-0 gap-1 backdrop-blur-sm">
                {typeIcons[media.media_type]}
                {typeLabels[media.media_type] || media.media_type}
              </Badge>
            </div>

            {/* Premium */}
            {media.is_premium && (
              <div className="absolute top-2 right-2">
                <Badge className="text-[10px] px-2 py-0.5 h-5 bg-primary text-primary-foreground border-0 font-bold">
                  PRO
                </Badge>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className={cn('flex-1 min-w-0', compact ? '' : 'p-4')}>
        <h3 className={cn('font-bold leading-snug line-clamp-2', compact ? 'text-xs' : 'text-sm')}>
          {media.title}
        </h3>
        {media.speaker && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{media.speaker}</p>
        )}
        {!compact && (
          <div className="flex items-center gap-4 mt-2.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5" /> {media.like_count}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> {media.view_count} vues
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
