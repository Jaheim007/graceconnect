import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "offline.html",
        "pwa-72x72.png",
        "pwa-96x96.png",
        "pwa-128x128.png",
        "pwa-144x144.png",
        "pwa-152x152.png",
        "pwa-192x192.png",
        "pwa-384x384.png",
        "pwa-512x512.png",
      ],
      manifest: {
        id: "/",
        name: "Siteviral",
        short_name: "Siteviral",
        description: "Infrastructure platform for digital organizations worldwide",
        start_url: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
        background_color: "#0d1117",
        theme_color: "#d4920a",
        orientation: "any",
        dir: "ltr",
        lang: "fr",
        scope: "/",
        prefer_related_applications: false,
        categories: ["social", "business", "productivity"],
        icons: [
          {
            src: "/pwa-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "/pwa-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/pwa-128x128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "/pwa-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/pwa-152x152.png",
            sizes: "152x152",
            type: "image/png",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-384x384.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/og-image.png",
            sizes: "1200x630",
            type: "image/png",
            form_factor: "wide",
            label: "Siteviral Dashboard",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "Siteviral Mobile",
          },
        ],
        shortcuts: [
          {
            name: "Feed",
            short_name: "Feed",
            url: "/feed",
            icons: [{ src: "/pwa-96x96.png", sizes: "96x96" }],
          },
          {
            name: "Discover",
            short_name: "Discover",
            url: "/discover",
            icons: [{ src: "/pwa-96x96.png", sizes: "96x96" }],
          },
          {
            name: "Notifications",
            short_name: "Notifs",
            url: "/notifications",
            icons: [{ src: "/pwa-96x96.png", sizes: "96x96" }],
          },
        ],
        handle_links: "preferred",
        launch_handler: {
          client_mode: "navigate-existing",
        },
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        offlineGoogleAnalytics: false,
        runtimeCaching: [
          {
            // Supabase API: network first with offline fallback
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-rest",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 10 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Supabase storage: cache first (immutable assets)
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Supabase auth: always network
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // Edge functions: network only
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // External images (CDN, etc.)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Paystack script
            urlPattern: /^https:\/\/js\.paystack\.co\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "paystack-scripts",
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
  },
}));
