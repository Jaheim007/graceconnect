import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

/**
 * Fetches live platform-wide stats for use in persona pages,
 * landing pages, and social proof.
 * Numbers are strategically inflated for cold-start phase.
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

      // Week-based rotation for fresh numbers
      const weekNum = Math.floor((Date.now() - new Date(2025, 0, 1).getTime()) / (7 * 86400000));

      return {
        organizations: Math.max(orgCount || 0, 85 + (weekNum * 3) % 50),
        products: Math.max(productCount || 0, 250 + (weekNum * 7) % 100),
        users: Math.max(userCount || 0, 2500 + (weekNum * 23) % 800),
      };
    },
    staleTime: 5 * 60_000, // 5 min cache
  });
}
