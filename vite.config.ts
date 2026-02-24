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
      includeAssets: ["favicon.ico", "offline.html"],
      manifest: {
        name: "Siteviral",
        short_name: "Siteviral",
        description: "Infrastructure platform for digital organizations worldwide",
        start_url: "/",
        display: "standalone",
        background_color: "#0d1117",
        theme_color: "#d4920a",
        orientation: "any",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
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
        ],
        categories: ["social", "business", "productivity"],
        lang: "fr",
        scope: "/",
        prefer_related_applications: false,
        shortcuts: [
          { name: "Feed", short_name: "Feed", url: "/feed", icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }] },
          { name: "Discover", short_name: "Discover", url: "/discover", icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        // Offline fallback for failed navigations
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
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
