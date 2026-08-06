/**
 * SiteViral surface visibility — single source of truth for what the MAIN
 * SiteViral experience exposes today.
 *
 * The service-marketplace work (Beauty, Artisans/Home, Tutors/Education,
 * Events, Influencers, Music, generic services) is FULLY PRESERVED in the
 * codebase and the database. It is only HIDDEN from the principal experience
 * through this configuration so it can be re-enabled later by flipping the
 * flags below — no code, routes, tables or records are removed.
 *
 * Restored core direction: Create → Sell → Earn → Discover
 *   AI books · AI formations · digital product sales · affiliation ·
 *   digital product discovery · creator / organization / NGO / community /
 *   church platforms.
 */
import type { SiteviralWorld } from '@/lib/siteviral/worlds';

/** Master switch. Set to `true` to bring the service marketplace back. */
export const SERVICE_MARKETPLACE_ENABLED = false;

/** Worlds visible in public surfaces and in platform onboarding. */
export const VISIBLE_WORLDS: SiteviralWorld[] = SERVICE_MARKETPLACE_ENABLED
  ? ['digital', 'church', 'beauty', 'home', 'events', 'education']
  : ['digital', 'church'];

/** Worlds kept in the system but hidden from the main experience. */
export const HIDDEN_WORLDS: SiteviralWorld[] = (['beauty', 'home', 'events', 'education'] as SiteviralWorld[])
  .filter((w) => !VISIBLE_WORLDS.includes(w));

export function isWorldVisible(world: SiteviralWorld): boolean {
  return VISIBLE_WORLDS.includes(world);
}

/**
 * True when a service-marketplace surface (discovery pages, provider
 * onboarding entry points, buyer/provider intent chooser) may be linked from
 * the main SiteViral experience. Direct URLs keep working for existing
 * providers — only promotion/navigation is gated.
 */
export const showServiceSurfaces = () => SERVICE_MARKETPLACE_ENABLED;
