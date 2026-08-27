import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { useNavigate } from '@/lib/router-compat';
import { Building2, ArrowRight, Users, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

/**
 * Featured organizations carousel — shows active orgs with affiliation enabled.
 * Designed to help ambassadors discover new orgs to promote.
 */
export function FeaturedOrgs({ limit = 8 }: { limit?: number }) {
  const navigate = useNavigate();

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['featured-orgs', limit],
    queryFn: async () => {
      const { data } = await db.from('organizations')
        .select('id, name, slug, logo_url, description, category, affiliation_enabled, affiliation_commission_percent')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading || !orgs.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold flex items-center gap-1.5">
          <Building2 className="h-4.5 w-4.5 text-primary" /> Créateurs à suivre
        </h2>
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/discover')}>
          Tout voir <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
        {orgs.map((org: any, i: number) => (
          <motion.button
            key={org.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => navigate(`/org/${org.slug}`)}
            className="flex-shrink-0 w-48 snap-start rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors space-y-3"
          >
            <div className="flex items-center gap-2.5">
              {org.logo_url ? (
                <img src={org.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {org.name?.[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate flex items-center gap-1">{org.name} <VerifiedBadge size="xs" showTooltip={false} /></p>
                {org.affiliation_enabled && (
                  <Badge variant="secondary" className="text-[9px] mt-0.5 gap-0.5">
                    <ShoppingBag className="h-2.5 w-2.5" />
                    {org.affiliation_commission_percent || 10}%
                  </Badge>
                )}
              </div>
            </div>
            {org.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-2">{org.description}</p>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
