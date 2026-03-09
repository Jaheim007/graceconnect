import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

/**
 * Fetches live platform-wide stats for use in persona pages,
 * landing pages, and social proof.
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [{ count: orgCount }, { count: productCount }, { count: userCount }] = await Promise.all([
        db.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('is_published', true),
        db.from('profiles').select('*', { count: 'exact', head: true }),
      ]);
      return {
        organizations: orgCount || 0,
        products: productCount || 0,
        users: userCount || 0,
      };
    },
    staleTime: 5 * 60_000, // 5 min cache
  });
}
