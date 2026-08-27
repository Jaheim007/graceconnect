/**
 * Learner-facing course catalog — /courses
 *
 * Browsable, searchable, category-filterable grid of published courses.
 * Cards show the cover, title, creator (organization), price (or "Free") and,
 * for courses the viewer is already enrolled in, a progress ring.
 */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Search, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatPrice } from '@/lib/currency';
import { COURSE_CATEGORIES, categorizeCourse } from '@/lib/courseCategories';
import { SEOHead } from '@/components/seo/SEOHead';

export default function CourseCatalogPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const [activeCat, setActiveCat] = useState(searchParams.get('category') || 'all');
  const [query, setQuery] = useState('');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['course-catalog'],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data } = await db.from('programs')
        .select('id, title, description, cover_image_url, price, currency, is_free, enrollment_count, themes, organizations(name, slug, logo_url)')
        .eq('is_published', true)
        .order('enrollment_count', { ascending: false })
        .limit(200);
      return (data || []).map((c: any) => ({ ...c, _category: categorizeCourse(c) }));
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollment-progress', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await db.from('program_enrollments')
        .select('program_id, progress_percent')
        .eq('user_id', user!.id);
      const map: Record<string, number> = {};
      (data || []).forEach((e: any) => { map[e.program_id] = e.progress_percent ?? 0; });
      return map;
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (courses || []).filter((c: any) => {
      if (activeCat !== 'all' && c._category !== activeCat) return false;
      if (!q) return true;
      return c.title?.toLowerCase().includes(q) || c.organizations?.name?.toLowerCase().includes(q);
    });
  }, [courses, activeCat, query]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Catalogue de formations - SiteViral' : 'Course catalog - SiteViral'}
        description={isFr
          ? 'Parcourez les formations en ligne créées sur SiteViral : business, foi, tech, finance et plus.'
          : 'Browse online courses created on SiteViral: business, faith, tech, finance and more.'}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isFr ? 'Catalogue de formations' : 'Course catalog'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFr
              ? 'Apprends à ton rythme, une diapositive à la fois.'
              : 'Learn at your own pace, one slide at a time.'}
          </p>
        </header>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isFr ? 'Rechercher une formation…' : 'Search courses…'}
            className="pl-9"
            aria-label={isFr ? 'Rechercher une formation' : 'Search courses'}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {COURSE_CATEGORIES.map((cat) => (
            <Badge
              key={cat.key}
              variant={activeCat === cat.key ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-3 py-1.5"
              onClick={() => setActiveCat(cat.key)}
            >
              {isFr ? cat.labelFr : cat.labelEn}
              {courses && (
                <span className="ml-1 opacity-70">
                  ({cat.key === 'all' ? courses.length : courses.filter((c: any) => c._category === cat.key).length})
                </span>
              )}
            </Badge>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any, i: number) => {
            const progress = enrollments?.[c.id];
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link
                  to={`/program/${c.id}`}
                  className="block bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all h-full"
                >
                  {c.cover_image_url ? (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={c.cover_image_url}
                        alt={c.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-9 w-9 text-primary/30" />
                    </div>
                  )}

                  <div className="p-3.5 space-y-2">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1">{c.title}</p>
                      {typeof progress === 'number' && <ProgressRing value={progress} />}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {c.organizations?.logo_url && (
                        <img src={c.organizations.logo_url} alt="" loading="lazy" className="h-4 w-4 rounded-full object-cover" />
                      )}
                      <span className="truncate">{c.organizations?.name || '—'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-primary">
                        {c.is_free || !(c.price > 0)
                          ? (isFr ? 'Gratuit' : 'Free')
                          : formatPrice(c.price, false, c.currency || 'XOF')}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Users className="h-3 w-3" /> {c.enrollment_count ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16 text-sm">
            {isFr ? 'Aucune formation ne correspond à cette recherche.' : 'No courses match this search.'}
          </p>
        )}
      </div>
    </div>
  );
}
