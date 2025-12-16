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
 * ## Path Aliases:
 * Path aliases defined in tsconfig.json are resolved at build time using
 * esbuild's alias option. This allows using imports like `@/types` instead
 * of relative paths.
 *
 * @module @writenex/astro/tsup.config
 */

import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Base path for source files
 */
const srcPath = resolve("src");

/**
 * Path alias configuration for esbuild
 * Maps TypeScript path aliases to actual file paths
 */
/**
 * Creates an esbuild plugin to resolve TypeScript path aliases
 *
 * This plugin handles both exact matches (e.g., `@/types`) and
 * wildcard patterns (e.g., `@/types/config`).
 *
 * @returns esbuild plugin for path alias resolution
 */
function createAliasPlugin() {
  return {
    name: "alias-path",
    setup(build: {
      onResolve: (
        options: { filter: RegExp },
        callback: (args: {
          path: string;
          importer: string;
        }) => { path: string } | undefined
      ) => void;
    }) {
      // Handle @/* imports
      build.onResolve(
        { filter: /^@\// },
        (args: { path: string; importer: string }) => {
          const importPath = args.path;

          // Check for exact module matches first (e.g., @/types, @/core)
          const moduleMatch = importPath.match(/^@\/([^/]+)$/);
          if (moduleMatch) {
            const moduleName = moduleMatch[1];
            return { path: resolve(srcPath, moduleName, "index.ts") };
          }

          // Handle sub-path imports (e.g., @/types/config, @/core/errors)
          const subPathMatch = importPath.match(/^@\/(.+)$/);
          if (subPathMatch) {
            const relativePath = subPathMatch[1];
            // Return the .ts path - esbuild will handle file existence
            return { path: resolve(srcPath, `${relativePath}.ts`) };
          }

          return undefined;
        }
      );
    },
  };
}

export default defineConfig([
  // Server-side bundle (Astro integration + sub-path modules)
  {
    entry: {
      index: "src/index.ts",
      "config/index": "src/config/index.ts",
      "discovery/index": "src/discovery/index.ts",
      "filesystem/index": "src/filesystem/index.ts",
      "server/index": "src/server/index.ts",
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
    esbuildPlugins: [createAliasPlugin()],
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
    esbuildPlugins: [createAliasPlugin()],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
    onSuccess: async () => {
      const distDir = join("dist", "client");
      mkdirSync(distDir, { recursive: true });

      // Copy plain CSS files (no processing needed)
      const cssFiles = ["styles.css", "variables.css"];
      for (const file of cssFiles) {
        const src = join("src", "client", file);
        const dest = join(distDir, file);
        copyFileSync(src, dest);
        console.log(`CSS copied to dist/client/${file}`);
      }
    },
  },
]);
