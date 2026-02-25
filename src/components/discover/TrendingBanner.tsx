import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

export function TrendingBanner() {
  const navigate = useNavigate();
  const { locale } = useI18n();

  const { data: trending = [] } = useQuery({
    queryKey: ['trending-orgs'],
    queryFn: async () => {
      const { data } = await db.from('organizations')
        .select('id, name, slug, logo_url, category')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (trending.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent border border-primary/15 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-bold">{locale === 'fr' ? '🔥 En tendance' : '🔥 Trending'}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {trending.map((org: any) => (
          <button
            key={org.id}
            onClick={() => navigate(`/org/${org.slug}`)}
            className="flex items-center gap-2 shrink-0 bg-card/80 border border-border/60 rounded-xl px-3 py-2 hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            {org.logo_url ? (
              <img src={org.logo_url} alt="" className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {org.name?.charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium whitespace-nowrap">{org.name}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
