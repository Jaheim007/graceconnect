import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, BookmarkPlus, Share2, Volume2, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMediaById } from '@/hooks/useMedia';
import { useState } from 'react';

export default function WatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: media, isLoading } = useMediaById(id);
  const [playing, setPlaying] = useState(false);

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

  const isAudio = media.media_type === 'audio';

  return (
    <div className="min-h-screen bg-background">
      {/* Back */}
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-medium text-sm truncate flex-1">{media.title}</span>
      </div>

      <div className="container max-w-4xl py-6 space-y-5">
        {/* Player */}
        <div className={`rounded-2xl overflow-hidden bg-muted relative ${isAudio ? 'h-40' : 'aspect-video'}`}>
          {media.media_url ? (
            isAudio ? (
              <audio controls className="w-full absolute bottom-0" src={media.media_url} />
            ) : (
              <video
                controls
                src={media.media_url}
                poster={media.thumbnail_url || undefined}
                className="w-full h-full"
              />
            )
          ) : (
            <div className="w-full h-full hero-gradient flex flex-col items-center justify-center gap-3">
              {media.thumbnail_url && (
                <img src={media.thumbnail_url} alt={media.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
              )}
              <button
                onClick={() => setPlaying(!playing)}
                className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center z-10 shadow-gold hover:bg-primary transition-colors"
              >
                {playing ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground ml-0.5" />}
              </button>
              <p className="text-xs text-muted-foreground z-10">No media URL — demo mode</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h1 className="text-lg font-bold leading-snug">{media.title}</h1>
              {media.speaker && <p className="text-sm text-muted-foreground">{media.speaker}</p>}
            </div>
            <Badge variant="secondary" className="text-xs capitalize shrink-0">
              {media.media_type.replace('_', ' ')}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <Heart className="h-3.5 w-3.5" /> {media.like_count}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <BookmarkPlus className="h-3.5 w-3.5" /> Save
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">{media.view_count} views</span>
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
