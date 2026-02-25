import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import { capturePromoFromUrl } from './hooks/usePromoCapture';
import "./index.css";

// Capture promo code from URL params on page load
capturePromoFromUrl();

// Sentry error tracking (production only)
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

// Global unhandled rejection handler — prevents white-screen on async errors (e.g. payment)
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // prevent default console error & crash
});

// Auto-reload on stale chunk errors (e.g. after a new deploy when SW serves old bundles)
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  ) {
    console.warn('[StaleCache] Chunk load failed — reloading page');
    // Only reload once per session to avoid infinite loop
    const key = 'sv_chunk_reload';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  }
});

// Apply saved theme before first render to avoid FOUC
const savedTheme = localStorage.getItem('gc_theme') || 'dark';
document.documentElement.classList.add(savedTheme);

// Apply saved locale
const savedLocale = localStorage.getItem('sv_locale') || navigator.language.slice(0, 2) || 'en';
document.documentElement.lang = ['en', 'fr'].includes(savedLocale) ? savedLocale : 'en';

// ── PWA Service Worker Registration with Update Prompt ──
const registerSW = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          // Show update notification
          if (confirm('Une nouvelle version de Siteviral est disponible. Mettre à jour maintenant ?')) {
            updateSW(true);
          }
        },
        onOfflineReady() {
          console.log('[PWA] App prête pour utilisation hors ligne');
        },
        onRegisteredSW(swUrl, registration) {
          console.log('[PWA] Service Worker enregistré:', swUrl);
          // Check for updates every 60 minutes
          if (registration) {
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
          }
        },
        onRegisterError(error) {
          console.error('[PWA] Erreur d\'enregistrement SW:', error);
        },
      });
    } catch (e) {
      console.warn('[PWA] SW registration skipped:', e);
    }
  }
};
registerSW();

createRoot(document.getElementById("root")!).render(<App />);
