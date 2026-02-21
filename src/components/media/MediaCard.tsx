import { useNavigate } from 'react-router-dom';
import { Play, Headphones, Mic, Video, Heart, BookmarkPlus, Clock } from 'lucide-react';
import { MediaContent } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-3 w-3" />,
  audio: <Headphones className="h-3 w-3" />,
  reel: <Mic className="h-3 w-3" />,
  live_replay: <Video className="h-3 w-3" />,
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

  return (
    <div
      onClick={() => navigate(media.media_type === 'reel' ? `/reels/${media.id}` : `/watch/${media.id}`)}
      className={cn(
        'group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5 animate-fade-in',
        compact ? 'flex gap-3 p-2' : ''
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      {/* Thumbnail */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        compact ? 'h-20 w-28 rounded-lg shrink-0' : 'aspect-video w-full'
      )}>
        {media.thumbnail_url ? (
          <img
            src={media.thumbnail_url}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full hero-gradient flex items-center justify-center">
            <Play className="h-8 w-8 text-primary/60" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-elevated">
            <Play className="h-4 w-4 text-gray-900 ml-0.5" />
          </div>
        </div>

        {/* Duration */}
        {media.duration_seconds && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded font-mono">
            {formatDuration(media.duration_seconds)}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-1 left-1">
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-black/60 text-white border-0 gap-0.5">
            {typeIcons[media.media_type]}
            {media.media_type.replace('_', ' ')}
          </Badge>
        </div>

        {/* Premium lock */}
        {media.is_premium && (
          <div className="absolute top-1 right-1">
            <Badge className="text-[9px] px-1.5 py-0 h-4 gold-gradient text-primary-foreground border-0">
              PRO
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn('flex-1 min-w-0', compact ? '' : 'p-3')}>
        <h3 className={cn('font-semibold leading-snug line-clamp-2', compact ? 'text-xs' : 'text-sm')}>
          {media.title}
        </h3>
        {media.speaker && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{media.speaker}</p>
        )}
        {!compact && (
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" /> {media.like_count}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {media.view_count} views
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
