/**
 * Capacitor native utilities — safe to import on web (graceful no-ops).
 */
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';

let viewportListenersAttached = false;
let themeObserverAttached = false;

function syncNativeViewportHeight() {
  if (typeof window === 'undefined') return;

  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
}

function attachNativeViewportListeners() {
  if (viewportListenersAttached || typeof window === 'undefined') return;
  viewportListenersAttached = true;

  const update = () => window.requestAnimationFrame(syncNativeViewportHeight);

  update();
  document.documentElement.style.setProperty('--keyboard-height', '0px');
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
  window.visualViewport?.addEventListener('resize', update);
  window.visualViewport?.addEventListener('scroll', update);
}

async function syncStatusBarTheme() {
  if (!isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const isDarkTheme = document.documentElement.classList.contains('dark');

    await StatusBar.setStyle({ style: isDarkTheme ? Style.Light : Style.Dark });

    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: isDarkTheme ? '#0a0a0a' : '#ffffff' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    console.warn('[capacitor] StatusBar theme sync failed:', e);
  }
}

function observeThemeChanges() {
  if (themeObserverAttached || typeof MutationObserver === 'undefined') return;
  themeObserverAttached = true;

  const observer = new MutationObserver(() => {
    void syncStatusBarTheme();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

/** Safe haptic feedback — no-op on web */
export async function hapticLight() {
  if (!isNativePlatform()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium() {
  if (!isNativePlatform()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticSuccess() {
  if (!isNativePlatform()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Success });
}

export async function hideNativeSplash() {
  if (!isNativePlatform()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('[capacitor] SplashScreen hide failed:', e);
  }
}

/** Initialize native plugins on app start */
export async function initNativePlugins() {
  if (!isNativePlatform()) return;

  attachNativeViewportListeners();

  // Status bar
  try {
    await syncStatusBarTheme();
    observeThemeChanges();
  } catch (e) {
    console.warn('[capacitor] StatusBar init failed:', e);
  }

  // Keyboard
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    Keyboard.addListener('keyboardDidShow', ({ keyboardHeight }) => {
      document.body.classList.add('keyboard-visible');
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      syncNativeViewportHeight();
    });
    Keyboard.addListener('keyboardDidHide', () => {
      document.body.classList.remove('keyboard-visible');
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      syncNativeViewportHeight();
    });
  } catch (e) {
    console.warn('[capacitor] Keyboard init failed:', e);
  }

  // App back button handler (Android)
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.minimizeApp();
      }
    });
  } catch (e) {
    console.warn('[capacitor] App back button init failed:', e);
  }
}

/** Network status listener */
export async function onNetworkChange(callback: (connected: boolean) => void) {
  if (!isNativePlatform()) return;
  try {
    const { Network } = await import('@capacitor/network');
    Network.addListener('networkStatusChange', (status) => {
      callback(status.connected);
    });
    const current = await Network.getStatus();
    callback(current.connected);
  } catch (e) {
    console.warn('[capacitor] Network init failed:', e);
  }
}
