/**
 * Tracks which capability surface the user last used, so the unified home can
 * order its blocks by real activity instead of a fixed role.
 */
export type SurfaceKey = 'learn' | 'earn' | 'create';

const KEY = 'sv_last_surface';

export function markSurfaceVisit(surface: SurfaceKey) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ surface, at: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
}

export function getLastSurface(): { surface: SurfaceKey; at: string } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.surface || !parsed?.at) return null;
    if (!['learn', 'earn', 'create'].includes(parsed.surface)) return null;
    return parsed as { surface: SurfaceKey; at: string };
  } catch {
    return null;
  }
}
