/**
 * Unified platform detection — single source of truth for web / PWA / native.
 * Import this instead of scattering detection logic across components.
 */
import { isNativePlatform, isIOS, isAndroid, getPlatform } from './capacitor';

export type AppPlatform = 'web' | 'pwa' | 'android' | 'ios';
export type AppShell = 'browser' | 'standalone' | 'native-wrapper';

/** True if running inside Capacitor native shell */
export const isNative = isNativePlatform;

/** True if installed as PWA (standalone mode, not native) */
export function isPWA(): boolean {
  if (isNative()) return false;
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/** True if running in a standard browser tab */
export function isBrowser(): boolean {
  return !isNative() && !isPWA();
}

/** Get the current platform */
export function getAppPlatform(): AppPlatform {
  if (isNative()) return isIOS() ? 'ios' : 'android';
  if (isPWA()) return 'pwa';
  return 'web';
}

/** Get the shell type */
export function getAppShell(): AppShell {
  if (isNative()) return 'native-wrapper';
  if (isPWA()) return 'standalone';
  return 'browser';
}

/** True if the user is on a mobile device (any shell) */
export function isMobileDevice(): boolean {
  if (isNative()) return true;
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;
}

/** True if touch is the primary input */
export function isTouchDevice(): boolean {
  if (isNative()) return true;
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Should show install prompts? Only on web browser (not PWA, not native) */
export function shouldShowInstallPrompt(): boolean {
  return isBrowser() && isMobileDevice();
}

/**
 * Should show cookie consent? Only in a real browser tab.
 * Installed PWAs and native shells behave like apps (no third-party browser
 * cookie surface to consent to), so the banner is pure friction there.
 */
export function shouldShowCookieConsent(): boolean {
  return !isNative() && !isPWA();
}

/** Marketing surfaces (landing pages, "learn more" links) are web-only. */
export function shouldShowMarketingSurfaces(): boolean {
  return !isNative() && !isPWA() && !isMobileDevice();
}


/** Should register service worker? Not on native */
export function shouldRegisterSW(): boolean {
  return !isNative() && 'serviceWorker' in navigator && import.meta.env.PROD;
}

/**
 * Apply platform data attributes to document for CSS targeting.
 * Call once on app init.
 */
export function applyPlatformClasses() {
  const platform = getAppPlatform();
  const shell = getAppShell();
  const touch = isTouchDevice();

  document.documentElement.dataset.platform = platform;
  document.documentElement.dataset.shell = shell;
  if (touch) document.documentElement.dataset.touch = 'true';

  // CSS custom property for platform-specific selectors
  document.documentElement.style.setProperty('--platform', platform);
}
