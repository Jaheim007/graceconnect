import { createSeededRandom, getDaySeed } from './seeded-random';

const MAX_PER_ORG = 2;
const RECENCY_DAYS = 14;
const RECENCY_BOOST = 50; // bonus points for products < 14 days old

/**
 * Apply diversity rules to a product list:
 * 1. Weighted random shuffle (changes daily)
 * 3. Max 2 products per organization
 * 5. Recency boost for products < 14 days old
 */
export function diversifyFeed<T extends Record<string, any>>(
  products: T[],
  opts?: { maxPerOrg?: number; orgKey?: string; dateKey?: string; seed?: number }
): T[] {
  const maxPerOrg = opts?.maxPerOrg ?? MAX_PER_ORG;
  const orgKey = opts?.orgKey ?? 'organization_id';
  const dateKey = opts?.dateKey ?? 'created_at';
  const seed = opts?.seed ?? getDaySeed();
  const rng = createSeededRandom(seed);

  const now = Date.now();
  const recencyCutoff = now - RECENCY_DAYS * 24 * 60 * 60 * 1000;

  // Score each product: base popularity + recency boost + random factor
  const scored = products.map((p) => {
    const sales = (p.sales_count as number) || 0;
    const featured = (p.featured_score as number) || 0;

    // Base score from popularity (logarithmic to avoid huge gaps)
    const popularityScore = Math.log2(sales + 1) * 10 + featured;

    // Recency boost
    const createdAt = p[dateKey] ? new Date(p[dateKey]).getTime() : 0;
    const recencyBonus = createdAt > recencyCutoff ? RECENCY_BOOST : 0;

    // Daily random factor (0-30) to shuffle positions
    const randomFactor = rng() * 30;

    return {
      product: p,
      score: popularityScore + recencyBonus + randomFactor,
      orgId: p[orgKey] as string,
    };
  });

  // Sort by combined score descending
  scored.sort((a, b) => b.score - a.score);

  // Apply per-org cap
  const orgCount: Record<string, number> = {};
  const result: T[] = [];

  for (const item of scored) {
    const count = orgCount[item.orgId] || 0;
    if (count >= maxPerOrg) continue;
    orgCount[item.orgId] = count + 1;
    result.push(item.product);
  }

  return result;
}
