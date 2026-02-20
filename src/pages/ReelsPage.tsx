import { useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useFeedMedia } from '@/hooks/useMedia';
import { ArrowLeft, Heart, Share2, Volume2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ReelsPage() {
  const navigate = useNavigate();
  const { userOrgs } = useOrg();
  const orgIds = userOrgs.map((o) => o.id);
  const { data: allMedia = [] } = useFeedMedia(orgIds);
  const [currentIndex, setCurrentIndex] = useState(0);

  const reels = allMedia.filter((m) => m.media_type === 'reel');

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const newIndex = Math.round(el.scrollTop / window.innerHeight);
    setCurrentIndex(newIndex);
  };

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 h-9 w-9 rounded-full bg-black/40 flex items-center justify-center text-white"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

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
            <div
              key={reel.id}
              className="relative h-screen w-full snap-start bg-black flex items-center justify-center"
            >
              {/* Background */}
              {reel.thumbnail_url && (
                <img
                  src={reel.thumbnail_url}
                  alt={reel.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Media */}
              {reel.media_url ? (
                <video
                  src={reel.media_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  autoPlay={i === currentIndex}
                  playsInline
                />
              ) : null}

              {/* Info overlay */}
              <div className="absolute bottom-20 left-4 right-16 z-10">
                <h3 className="text-white font-semibold text-base">{reel.title}</h3>
                {reel.speaker && <p className="text-white/70 text-sm">{reel.speaker}</p>}
              </div>

              {/* Actions */}
              <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-5">
                <button className="flex flex-col items-center gap-1">
                  <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white text-xs">{reel.like_count}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white text-xs">Share</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                    <Volume2 className="h-6 w-6 text-white" />
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
