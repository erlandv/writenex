import withPWAInit from "@ducanh2912/next-pwa";
import { readFileSync } from "fs";

// Read version from package.json
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version;

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  reloadOnOnline: false, // Don't auto-reload when coming back online
  workboxOptions: {
    // Precache the editor page for offline access
    // Use app version for revision to avoid unnecessary SW updates
    additionalManifestEntries: [{ url: "/editor", revision: appVersion }],
    // Don't precache images to save space
    exclude: [/\.(?:png|jpg|jpeg|gif|webp|ico)$/i, /\.map$/],
    // Runtime caching strategies
    runtimeCaching: [
      // Editor HTML - Network First (always try to get latest)
      {
        urlPattern: /^https?:\/\/.*\/editor/,
        handler: "NetworkFirst",
        options: {
          cacheName: "editor-html",
          expiration: {
            maxEntries: 5,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          networkTimeoutSeconds: 5, // Fallback to cache after 5s
        },
      },
      // Next.js static assets - Cache First (files have hash in name)
      {
        urlPattern: /^\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // Fonts - Cache First (rarely change)
      {
        urlPattern: /^https?:\/\/.*\/fonts\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // Google Fonts
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // Images - Cache First
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  devIndicators: false,
  // Silence Next.js 16 warning about webpack config without turbopack config.
  // PWA plugin adds webpack config, but we use Turbopack for dev (faster).
  // Build uses --webpack flag for PWA service worker generation.
  turbopack: {},
  // Expose app version to client
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
};

export default withPWA(nextConfig);
