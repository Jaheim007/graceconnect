import { useMemo } from 'react';
import { Play, Headphones, Video, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

interface MediaCardProps {
  media: MediaContent;
  index?: number;
  compact?: boolean;
}

export function MediaCard({ media, index = 0, compact = false }: MediaCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/watch/${media.id}`);
  };

  return (
    <div
      className={cn(
        'group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-300',
        compact ? 'flex gap-3 p-2' : '',
        !compact && 'hover:-translate-y-1'
      )}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        compact ? 'h-20 w-28 rounded-xl shrink-0' : 'aspect-video w-full'
      )}>
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
