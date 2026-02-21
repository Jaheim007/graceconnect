import { useNavigate, useParams } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useFeedMedia } from '@/hooks/useMedia';
import { ArrowLeft, Heart, Share2, Volume2, VolumeX, Play, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov|m3u8|ogg)(\?|$)/i.test(url);
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const vid = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
      return vid ? `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1` : null;
    }
    if (u.hostname.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=true&mute=1`;
    }
    if (u.hostname.includes('dailymotion.com')) {
      const id = u.pathname.split('/').pop()?.replace('video/', '');
      return id ? `https://www.dailymotion.com/embed/video/${id}?autoplay=1&mute=1` : null;
    }
  } catch {}
  return null;
}

export default function ReelsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { userOrgs } = useOrg();
  const orgIds = userOrgs.map((o) => o.id);
  const { data: allMedia = [] } = useFeedMedia(orgIds);

  const reels = allMedia.filter((m) => m.media_type === 'reel');

  // Find starting index from URL param
  const startIndex = id ? reels.findIndex((r) => r.id === id) : 0;
  const [currentIndex, setCurrentIndex] = useState(Math.max(startIndex, 0));
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Update index when startIndex resolves (data loads after mount)
  useEffect(() => {
    if (id && reels.length) {
      const idx = reels.findIndex((r) => r.id === id);
      if (idx >= 0) setCurrentIndex(idx);
    }
  }, [id, reels.length]);

  // Play/pause videos based on current index
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === currentIndex) {
        v.play().catch(() => {});
        v.muted = muted;
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex, muted]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const newIndex = Math.round(el.scrollTop / el.clientHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-white font-semibold text-base">Reels</h1>
        <button
          onClick={() => setMuted(!muted)}
          className="h-9 w-9 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {reels.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <EmptyState
            variant="content"
            title="No reels yet"
            description="Join communities to see reels in your feed."
            action={{ label: 'Discover', onClick: () => navigate('/discover') }}
          />
        </div>
      ) : (
        <div
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          onScroll={handleScroll}
        >
          {reels.map((reel, i) => (
            <ReelSlide
              key={reel.id}
              reel={reel}
              isCurrent={i === currentIndex}
              muted={muted}
              videoRef={(el) => { videoRefs.current[i] = el; }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReelSlide({
  reel,
  isCurrent,
  muted,
  videoRef,
}: {
  reel: any;
  isCurrent: boolean;
  muted: boolean;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    // handled via parent, but we track local state for UI
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative h-screen w-full snap-start bg-black flex flex-col items-center justify-center">
      {/* Centered video container - preserves aspect ratio */}
      <div className="relative w-full max-w-md mx-auto flex-1 flex items-center justify-center px-4">
        {reel.media_url && isDirectVideo(reel.media_url) ? (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
            <video
              ref={videoRef}
              src={reel.media_url}
              className="w-full h-auto max-h-[70vh] object-contain bg-black"
              loop
              muted={muted}
              playsInline
              poster={reel.thumbnail_url || undefined}
              onClick={togglePlay}
            />
            {!isCurrent && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-7 w-7 text-white ml-1" />
                </div>
              </div>
            )}
          </div>
        ) : reel.media_url && getEmbedUrl(reel.media_url) ? (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black aspect-[9/16] max-h-[70vh]">
            <iframe
              src={getEmbedUrl(reel.media_url)!}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        ) : reel.media_url ? (
          <a
            href={reel.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl block"
          >
            {reel.thumbnail_url ? (
              <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-auto max-h-[70vh] object-contain" />
            ) : (
              <div className="w-full aspect-[9/16] max-h-[70vh] bg-muted flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ExternalLink className="h-7 w-7 text-white" />
              </div>
            </div>
          </a>
        ) : reel.thumbnail_url ? (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl">
            <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-auto max-h-[70vh] object-contain" />
          </div>
        ) : (
          <div className="w-full aspect-[9/16] max-h-[70vh] rounded-2xl bg-muted flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Side actions */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3 flex flex-col gap-5 sm:flex">
          <button className="flex flex-col items-center gap-1">
            <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs">{reel.like_count || 0}</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs">Share</span>
          </button>
        </div>
      </div>

      {/* Info below video */}
      <div className="w-full max-w-md mx-auto px-4 pb-8 pt-4">
        <h3 className="text-white font-semibold text-sm line-clamp-2">{reel.title}</h3>
        {reel.speaker && <p className="text-white/60 text-xs mt-1">{reel.speaker}</p>}
        {reel.duration_seconds && (
          <p className="text-white/40 text-xs mt-1">
            {Math.floor(reel.duration_seconds / 60)}:{String(reel.duration_seconds % 60).padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  );
}
