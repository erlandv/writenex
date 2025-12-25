/**
 * @fileoverview Astro integration for Writenex visual editor
 *
 * This module provides the main Astro integration that injects the Writenex
 * editor UI and API routes into an Astro project.
 *
 * ## Features:
 * - Injects editor UI at /_writenex
 * - Provides API routes for content CRUD operations
 * - Auto-discovers content collections
 * - Production guard to prevent accidental exposure
 *
 * ## Usage:
 * ```typescript
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config';
 * import writenex from '@writenex/astro';
 *
 * export default defineConfig({
 *   integrations: [writenex()],
 * });
 * ```
 *
 * @module @writenex/astro/integration
 */

import type { AstroIntegration } from "astro";
import type { WritenexOptions, WritenexConfig } from "@/types";
import { loadConfig } from "@/config/loader";
import { createMiddleware } from "@/server/middleware";
import { ContentWatcher } from "@/filesystem/watcher";
import { getCache } from "@/server/cache";

/**
 * Default base path for the Writenex editor UI
 */
const DEFAULT_BASE_PATH = "/_writenex";

/**
 * Package name for logging
 */
const PACKAGE_NAME = "@writenex/astro";

/**
 * Creates the Writenex Astro integration.
 *
 * This integration injects the Writenex visual editor into your Astro project,
 * providing a WYSIWYG interface for editing content collections.
 *
 * @param options - Integration options
 * @param options.allowProduction - Allow running in production (default: false)
 * @returns Astro integration object
 *
 * @example
 * ```typescript
 * // Basic usage
 * export default defineConfig({
 *   integrations: [writenex()],
 * });
 *
 * // With options
 * export default defineConfig({
 *   integrations: [
 *     writenex({
 *       allowProduction: true,  // Enable in production (use with caution)
 *     }),
 *   ],
 * });
 * ```
 */
export default function writenex(options?: WritenexOptions): AstroIntegration {
  const { allowProduction = false } = options ?? {};

  // Use fixed base path for consistency and branding
  const basePath = DEFAULT_BASE_PATH;

  // Track if we should be active
  let isActive = true;

  // Store loaded configuration
  let resolvedConfig: Required<WritenexConfig> | null = null;

  // Store project root
  let projectRoot = "";

  // Store Astro's trailingSlash setting
  let astroTrailingSlash: "always" | "never" | "ignore" = "ignore";

  // File watcher instance
  let watcher: ContentWatcher | null = null;

  // Track if editor URL has been logged (to avoid duplicate logs)
  let hasLoggedEditorUrl = false;

  return {
    name: PACKAGE_NAME,
    hooks: {
      /**
       * Configuration setup hook
       *
       * This hook runs during Astro's config resolution phase.
       * We use it to:
       * 1. Check if we should run (production guard)
       * 2. Load Writenex configuration
       * 3. Register any necessary Vite plugins
       */
      "astro:config:setup": async ({ command, logger, config }) => {
        // Production guard: disable in production unless explicitly allowed
        if (command === "build" && !allowProduction) {
          logger.warn(
            "Disabled in production build. Use allowProduction: true to override."
          );
          isActive = false;
          return;
        }

        // Store project root
        projectRoot = config.root.pathname;

        // Capture Astro's trailingSlash setting for preview URLs
        astroTrailingSlash = config.trailingSlash ?? "ignore";

        // Load Writenex configuration
        const { config: loadedConfig, warnings } =
          await loadConfig(projectRoot);
        resolvedConfig = loadedConfig;

        // Log any configuration warnings
        for (const warning of warnings) {
          logger.warn(warning);
        }
      },

      /**
       * Server setup hook
       *
       * This hook runs when the Astro dev server starts.
       * We use it to:
       * 1. Inject middleware for API routes
       * 2. Serve the editor UI
       * 3. Start file watcher for cache invalidation
       */
      "astro:server:setup": ({ server }) => {
        // Skip if disabled (production guard triggered)
        if (!isActive || !resolvedConfig) {
          return;
        }

        // Create and register the middleware
        const middleware = createMiddleware({
          basePath,
          projectRoot,
          config: resolvedConfig,
          trailingSlash: astroTrailingSlash,
        });

        server.middlewares.use(middleware);

        // Setup cache with file watcher integration
        const cache = getCache({ hasWatcher: true });

        // Start file watcher for cache invalidation
        watcher = new ContentWatcher(projectRoot, "src/content", {
          onChange: (event) => {
            cache.handleFileChange(event.type, event.collection);
          },
        });

        watcher.start();
      },

      /**
       * Server start hook
       *
       * This hook runs after the dev server has started and is listening.
       * We use it to log the full editor URL with the actual server address.
       */
      "astro:server:start": ({ address, logger }) => {
        if (!isActive || hasLoggedEditorUrl) {
          return;
        }

        // Build the full URL from the server address
        // Normalize loopback addresses to "localhost" for better readability
        const protocol = "http";
        const rawHost = address.address;
        const isLoopback =
          rawHost === "" ||
          rawHost === "::" ||
          rawHost === "127.0.0.1" ||
          rawHost === "::1";
        const host = isLoopback ? "localhost" : rawHost;
        const port = address.port;
        const editorUrl = `${protocol}://${host}:${port}${basePath}`;

        logger.info(`Writenex editor running at: ${editorUrl}`);
        hasLoggedEditorUrl = true;
      },

      /**
       * Server done hook
       *
       * This hook runs when the server is shutting down.
       * We use it to clean up the file watcher.
       */
      "astro:server:done": async () => {
        if (watcher) {
          await watcher.stop();
          watcher = null;
        }
      },

      /**
       * Build done hook
       *
       * This hook runs after the build completes.
       * Currently just logs a warning if production mode is enabled.
       */
      "astro:build:done": ({ logger }) => {
        if (allowProduction) {
          logger.warn(
            "Production mode enabled. Ensure your deployment is secured."
          );
        }
      },
    },
  };
}
