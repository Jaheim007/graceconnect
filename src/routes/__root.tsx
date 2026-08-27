import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import * as Sentry from "@sentry/react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { I18nProvider } from "@/i18n/I18nContext";
import { RouteContentSkeleton } from "@/components/layout/RouteFallback";
import { GlobalBottomNav } from "@/components/layout/GlobalBottomNav";
import { FloatingHelpWidget } from "@/components/help/FloatingHelpWidget";
import { AssistantChatWidget } from "@/components/assistant/AssistantChatWidget";
import { TrialBillingBanner } from "@/components/billing/TrialBillingBanner";
import { CreditAlertWatcher } from "@/components/credits/CreditAlertWatcher";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { SkipLink } from "@/components/layout/SkipLink";
import { FloatingProofToast } from "@/components/social-proof/FloatingProofToast";
import { DomainRouter } from "@/components/layout/DomainRouter";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { NativePushBootstrap } from "@/components/pwa/NativePushBootstrap";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { capturePromoFromUrl } from "@/hooks/usePromoCapture";
import { prefetchRates } from "@/lib/currencyConvert";
import { SplashScreen as NativeIntroSplash } from "@/components/splash/SplashScreen";
import { hideNativeSplash, initNativePlugins, isNativePlatform } from "@/lib/capacitor";
import { applyPlatformClasses } from "@/lib/platform";

const NotFound = lazy(() => import("@/pages/NotFound"));

// ported from main.tsx — client-only init (SSR-safe behind the window guard)
if (typeof window !== "undefined") {
  // Capture promo code from URL params on page load
  capturePromoFromUrl();

  // Pre-warm currency conversion rates cache
  prefetchRates();

  // Sentry error tracking (production only)
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env["VITE_SENTRY_DSN"] || "",
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
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Global] Unhandled promise rejection:", event.reason);
    event.preventDefault();
  });

  // Auto-reload on stale chunk errors (e.g. after a new deploy when SW serves old bundles)
  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk") ||
      msg.includes("Loading CSS chunk")
    ) {
      console.warn("[StaleCache] Chunk load failed — reloading page");
      const key = "sv_chunk_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  });

  // Legacy cache cleanup (old SW-era supabase-rest cache)
  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k === "supabase-rest").map((k) => caches.delete(k))))
      .catch(() => {});
  }

  const isNativeApp = isNativePlatform();
  if (isNativeApp) {
    // Native shell never uses a web SW — clear any leftover registrations/caches
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
    }
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }
    document.body.classList.add("capacitor-app");
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (viewportMeta && !viewportMeta.content.includes("viewport-fit=cover")) {
      viewportMeta.content += ", viewport-fit=cover";
    }
  }

  // Initialize Capacitor native plugins
  initNativePlugins();

  // Apply platform detection classes (data-platform, data-shell, data-touch)
  applyPlatformClasses();
}

// Runs before first paint via head() so there is no theme flash. The shell's
// suppressHydrationWarning absorbs the expected <html> attribute mismatch.
// Note: the locale (html lang) is deliberately NOT set here — mutating it
// pre-hydration makes locale-dependent text mismatch the SSR output.
// I18nProvider applies the resolved locale right after hydration instead.
const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('gc_theme')||'light';document.documentElement.classList.add(t);var c=t==='dark'?'#09090b':'#ffffff';var m=document.querySelector('meta[name="theme-color"]');if(m){m.content=c;}else{m=document.createElement('meta');m.name='theme-color';m.content=c;document.head.appendChild(m);}}catch(e){}})();`;

const organizationJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SiteViral",
  alternateName: "Siteviral",
  url: "https://siteviral.com",
  logo: "https://siteviral.com/logo-s.png",
  description:
    "Plateforme tout-en-un pour créateurs : vendre des produits numériques, formations, livres, et organiser des événements. 0% de commission sur le plan Pro.",
  sameAs: [
    "https://www.facebook.com/siteviral",
    "https://twitter.com/siteviral",
    "https://www.linkedin.com/company/siteviral",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@siteviral.com",
    availableLanguage: ["French", "English"],
  },
});

const csp =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://onesignal.com https://js.stripe.com https://js.paystack.co https://*.paystack.com https://cdnjs.cloudflare.com; worker-src 'self' blob: https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com https://api.fontshare.com; img-src 'self' data: blob: https: http:; connect-src 'self' https://api.fontshare.com https://cdn.fontshare.com https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.siteviral.com https://api.stripe.com https://api.paystack.co https://*.paystack.com https://onesignal.com https://cdn.onesignal.com https://cdnjs.cloudflare.com https://ipapi.co https://api.exchangerate.host https://open.er-api.com https://www.youtube.com; frame-src https://js.stripe.com https://js.paystack.co https://*.paystack.com https://onesignal.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; media-src 'self' blob: https:;";

const TITLE = "Siteviral — Votre Centre Digital tout-en-un Gratuit";
const DESCRIPTION =
  "Votre centre digital tout-en-un. Gratuit. Vendez vos produits numériques, collectez des dons via Mobile Money et cartes, et gagnez en partageant.";

const appleSplashScreens = [
  "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
  "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
  "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
  "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
  "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
  "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
  "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
  "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
  "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
  "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
  "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)",
  "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
  "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)",
  "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)",
].map((media) => ({ rel: "apple-touch-startup-image", media, href: "/pwa-512x512.png" }));

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "google-site-verification", content: "1sTM0hMgI8yiykIA6JZIaI0tXfxcnVVpNtxnyheRtmM" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover",
      },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "author", content: "Hacktualiz Inc." },
      {
        name: "keywords",
        content:
          "plateforme digitale, vendre produits numériques, Mobile Money, affiliation Afrique, gagner argent en ligne, ebook, formation en ligne, ambassadeur digital, contenu numérique, boutique en ligne Afrique, collecte de dons, créateur de contenu, monétisation, Siteviral",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: "https://siteviral.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:url", content: "https://siteviral.com" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Siteviral" },
      { property: "og:locale", content: "fr_FR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@siteviral" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: "https://siteviral.com/og-image.png" },
      { name: "theme-color", content: "#d4920a" },
      { name: "color-scheme", content: "dark light" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Siteviral" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
      { name: "application-name", content: "Siteviral" },
      { name: "apple-touch-fullscreen", content: "yes" },
      { name: "msapplication-TileColor", content: "#0d1117" },
      { name: "msapplication-TileImage", content: "/pwa-144x144.png" },
      { name: "msapplication-config", content: "none" },
      { httpEquiv: "Content-Security-Policy", content: csp },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://api.fontshare.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://cdn.fontshare.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
      },
      { rel: "apple-touch-icon", href: "/pwa-192x192.png" },
      { rel: "apple-touch-icon", sizes: "152x152", href: "/pwa-152x152.png" },
      { rel: "apple-touch-icon", sizes: "144x144", href: "/pwa-144x144.png" },
      { rel: "apple-touch-icon", sizes: "128x128", href: "/pwa-128x128.png" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/pwa-192x192.png" },
      { rel: "apple-touch-icon", sizes: "384x384", href: "/pwa-384x384.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/pwa-512x512.png" },
      ...appleSplashScreens,
    ],
    scripts: [
      { children: themeBootstrapScript },
      { type: "application/ld+json", children: organizationJsonLd },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <Suspense fallback={<RouteContentSkeleton />}>
      <NotFound />
    </Suspense>
  ),
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a className="px-4 py-2 rounded-md border border-border" href="/">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // ported from main.tsx — native intro splash (once per session)
  const [showNativeIntro, setShowNativeIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    if (!isNativePlatform()) return false;
    return !sessionStorage.getItem("sv_splash_shown");
  });

  useEffect(() => {
    if (!isNativePlatform()) return;

    let timeout = 0;
    const frame = window.requestAnimationFrame(() => {
      timeout = window.setTimeout(() => {
        void hideNativeSplash();
      }, 140);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <OrgProvider>
                <ErrorBoundary>
                  <Toaster />
                  <Sonner />
                  <ConfirmDialogHost />

                  <SkipLink />
                  <OfflineBanner />
                  <ScrollToTop />
                  <ReferralCapture />
                  <PageViewTracker />
                  <NativePushBootstrap />
                  <FloatingProofToast />
                  <DomainRouter />
                  <TrialBillingBanner />
                  <CreditAlertWatcher />

                  <Suspense fallback={<RouteContentSkeleton />}>
                    <Outlet />
                  </Suspense>
                  <GlobalBottomNav />
                  <FloatingHelpWidget />
                  <AssistantChatWidget />
                  {showNativeIntro && <NativeIntroSplash onComplete={() => setShowNativeIntro(false)} />}
                </ErrorBoundary>
              </OrgProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}