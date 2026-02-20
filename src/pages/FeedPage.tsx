import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Search, Megaphone, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonList, SkeletonBanner } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOrg } from '@/contexts/OrgContext';
import { useFeedMedia } from '@/hooks/useMedia';
import { useFeedAnnouncements } from '@/hooks/useAnnouncements';
import { useFeedEvents } from '@/hooks/useEvents';
import { MediaType } from '@/types/database';
import { cn } from '@/lib/utils';

const FILTERS: { value: MediaType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'video', label: '🎬 Videos' },
  { value: 'audio', label: '🎧 Audio' },
  { value: 'reel', label: '📱 Reels' },
];

export default function FeedPage() {
  const navigate = useNavigate();
  const { userOrgs } = useOrg();
  const orgIds = userOrgs.map((o) => o.id);
  const [filter, setFilter] = useState<MediaType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: allMedia = [], isLoading: mediaLoading } = useFeedMedia(orgIds);
  const { data: announcements = [], isLoading: announcementsLoading } = useFeedAnnouncements(orgIds);
  const { data: events = [] } = useFeedEvents(orgIds);

  const filteredMedia = allMedia.filter((m) => {
    if (filter !== 'all' && m.media_type !== filter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const featuredMedia = filteredMedia.filter((m) => m.is_featured);
  const regularMedia = filteredMedia.filter((m) => !m.is_featured);

  if (userOrgs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          variant="feed"
          action={{ label: 'Discover communities', onClick: () => navigate('/discover') }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">Your Feed</h1>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>

        {/* Announcements carousel */}
        {!announcementsLoading && announcements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Announcements</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {announcements.slice(0, 5).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="shrink-0 w-64 bg-card rounded-2xl border border-border p-3 shadow-card"
                >
                  {a.image_url && (
                    <div className="h-24 rounded-xl overflow-hidden mb-2">
                      <img src={a.image_url} alt={a.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {a.is_pinned && (
                    <span className="text-[10px] text-primary font-medium">📌 Pinned</span>
                  )}
                  <h3 className="font-semibold text-xs mt-0.5 line-clamp-2">{a.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-3">{a.body}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming events strip */}
        {events.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-sm">Upcoming Events</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {events.map((ev, i) => (
                <div
                  key={ev.id}
                  className="shrink-0 w-48 bg-card rounded-xl border border-border p-3 shadow-card"
                >
                  <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center mb-2">
                    <CalendarDays className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <p className="font-medium text-xs line-clamp-2">{ev.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : 'TBA'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Media filter */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                filter === f.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-gold'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Featured media */}
        {featuredMedia.length > 0 && (
          <section>
            <h2 className="font-semibold text-sm mb-3">✨ Featured</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredMedia.slice(0, 2).map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
            </div>
          </section>
        )}

        {/* Main media grid */}
        <section>
          <h2 className="font-semibold text-sm mb-3">Latest Content</h2>
          {mediaLoading ? (
            <SkeletonList count={6} />
          ) : regularMedia.length === 0 ? (
            <EmptyState
              variant={search ? 'search' : 'content'}
              action={search ? { label: 'Clear search', onClick: () => setSearch('') } : undefined}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regularMedia.map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
