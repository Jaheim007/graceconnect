/**
 * RouteContentSkeleton — lightweight in-place placeholder used as the Suspense
 * fallback for route content. Intentionally NOT a full-page spinner: the app
 * shell (sidebar, topbar, auth state) stays mounted and interactive while only
 * the page content area swaps.
 */
export function RouteContentSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-150" aria-busy="true" aria-live="polite">
      <div className="h-7 w-48 rounded-lg bg-muted/60 animate-pulse" />
      <div className="h-4 w-72 max-w-full rounded-md bg-muted/40 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-28 rounded-2xl bg-muted/30 animate-pulse" />
        <div className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
      </div>
      <div className="h-40 rounded-2xl bg-muted/30 animate-pulse" />
    </div>
  );
}

export default RouteContentSkeleton;
