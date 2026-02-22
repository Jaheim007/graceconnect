import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

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

// Apply saved theme before first render to avoid FOUC
const savedTheme = localStorage.getItem('gc_theme') || 'dark';
document.documentElement.classList.add(savedTheme);

// Apply saved locale
const savedLocale = localStorage.getItem('sv_locale') || navigator.language.slice(0, 2) || 'en';
document.documentElement.lang = ['en', 'fr'].includes(savedLocale) ? savedLocale : 'en';

createRoot(document.getElementById("root")!).render(<App />);
