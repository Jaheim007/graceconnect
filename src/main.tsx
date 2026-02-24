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

// Apply saved theme before first render to avoid FOUC
const savedTheme = localStorage.getItem('gc_theme') || 'dark';
document.documentElement.classList.add(savedTheme);

// Apply saved locale
const savedLocale = localStorage.getItem('sv_locale') || navigator.language.slice(0, 2) || 'en';
document.documentElement.lang = ['en', 'fr'].includes(savedLocale) ? savedLocale : 'en';

createRoot(document.getElementById("root")!).render(<App />);
