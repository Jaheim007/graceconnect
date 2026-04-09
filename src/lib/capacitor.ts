/**
 * Capacitor native utilities — safe to import on web (graceful no-ops).
 */
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';

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

  // Status bar
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    console.warn('[capacitor] StatusBar init failed:', e);
  }

  // Keyboard
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-visible');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-visible');
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
