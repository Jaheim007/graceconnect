/**
 * Safe area CSS utility classes for PWA standalone mode.
 * Apply these to layouts that need to respect device notches and home indicators.
 *
 * Usage:
 *   <div className={safeAreaClasses.paddingAll}>...</div>
 *   <nav className={safeAreaClasses.paddingBottom}>...</nav>
 */
export const safeAreaClasses = {
  /** All sides */
  paddingAll: 'pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
  /** Top only (status bar area) */
  paddingTop: 'pt-[env(safe-area-inset-top)]',
  /** Bottom only (home indicator area) */
  paddingBottom: 'pb-[env(safe-area-inset-bottom)]',
  /** Horizontal (left + right for notch-ear devices in landscape) */
  paddingHorizontal: 'pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]',
} as const;

/**
 * Check if the app is running in PWA standalone mode.
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Get the current display mode of the PWA.
 */
export function getDisplayMode(): 'standalone' | 'browser' | 'minimal-ui' | 'fullscreen' {
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
  return 'browser';
}
