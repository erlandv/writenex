/**
 * @fileoverview tsup configuration for @writenex/astro
 *
 * This configuration builds both server-side (integration) and client-side
 * (React components) code for the package.
 *
 * ## Output Structure:
 * - dist/index.js - Server-side integration entry
 * - dist/client/index.js - Client-side React components
 * - dist/client/styles.css - Plain CSS styles
 *
 * @module @writenex/astro/tsup.config
 */

import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export default defineConfig([
  // Server-side bundle (Astro integration)
  {
    entry: {
      index: "src/index.ts",
    },
    outDir: "dist",
    format: ["esm"],
    target: "node18",
    platform: "node",
    sourcemap: true,
    clean: true,
    dts: true,
    external: [
      "astro",
      "vite",
      "react",
      "react-dom",
      // Node built-ins
      "node:fs",
      "node:fs/promises",
      "node:path",
      "node:url",
    ],
  },
  // Client bundle (React components)
  // Note: React is bundled into the client to avoid module resolution issues in browser
  {
    entry: {
      "client/index": "src/client/index.tsx",
    },
    outDir: "dist",
    format: ["esm"],
    target: "es2020",
    platform: "browser",
    splitting: false, // Disable splitting to avoid chunk file resolution issues
    sourcemap: true,
    clean: false, // Don't clean, server build already did
    dts: true,
    minify: true, // Minify to reduce bundle size since React is included
    noExternal: [/.*/], // Bundle ALL dependencies into client for browser compatibility
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
    onSuccess: async () => {
      const srcCss = join("src", "client", "styles.css");
      const distCss = join("dist", "client", "styles.css");
      mkdirSync(join("dist", "client"), { recursive: true });

      // Copy plain CSS (no processing needed)
      copyFileSync(srcCss, distCss);
      console.log("CSS copied to dist/client/styles.css");
    },
  },
]);
