import { Bookmark, ArrowLeft } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function BookmarksPage() {
  const { data: bookmarks = [], isLoading } = useBookmarks();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={isFr ? 'Favoris' : 'Bookmarks'} />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm flex-1">{isFr ? 'Favoris' : 'Bookmarks'}</span>
      </div>
      <main id="main-content" className="container max-w-2xl py-5 space-y-4">
        {isLoading ? <SkeletonList count={5} /> : bookmarks.length === 0 ? (
          <EmptyState variant="generic" title={isFr ? 'Aucun favori' : 'No bookmarks'} description={isFr ? 'Ajoutez du contenu à vos favoris pour le retrouver facilement.' : 'Bookmark content to find it easily later.'} />
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bookmark className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{b.content_type}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
