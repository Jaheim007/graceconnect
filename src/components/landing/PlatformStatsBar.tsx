import { usePlatformStats } from '@/hooks/usePlatformStats';

/**
 * Injects live platform stats into persona/landing pages.
 * Shows real org/product/user counts.
 */
export function PlatformStatsBar({ category }: { category?: string }) {
  const { data: stats } = usePlatformStats();

  if (!stats || stats.organizations < 5) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-4 px-4 bg-muted/30 rounded-2xl border border-border mt-6">
      <div className="text-center">
        <p className="text-xl sm:text-2xl font-extrabold text-primary">{stats.organizations.toLocaleString()}+</p>
        <p className="text-[10px] text-muted-foreground">organisations actives</p>
      </div>
      <div className="text-center">
        <p className="text-xl sm:text-2xl font-extrabold text-primary">{stats.products.toLocaleString()}+</p>
        <p className="text-[10px] text-muted-foreground">produits publiés</p>
      </div>
      <div className="text-center">
        <p className="text-xl sm:text-2xl font-extrabold text-primary">{stats.users.toLocaleString()}+</p>
        <p className="text-[10px] text-muted-foreground">utilisateurs</p>
      </div>
    </div>
  );
}
