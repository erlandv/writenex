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

import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { applyRemoteCmsDefaults } from "@/config/defaults";
import { loadConfig } from "@/config/loader";
import { ContentWatcher } from "@/filesystem/watcher";
import { createSessionManager } from "@/server/auth";
import { getCache } from "@/server/cache";
import { createMiddleware } from "@/server/middleware";
import {
  API_ROUTE_FILE,
  EDITOR_ROUTE_FILE,
  generateApiRouteModule,
  generateEditorRouteModule,
} from "@/server/route-modules";
import type { WritenexConfig, WritenexOptions } from "@/types";

/**
 * Default base path for the Writenex editor UI
 */
const DEFAULT_BASE_PATH = "/_writenex";

/**
 * Resolve the effective base path, respecting Astro's `base` option
 *
 * @param astroBase - Astro's configured base (may be "/" or undefined)
 * @returns Base path for Writenex routes (e.g. "/_writenex" or "/blog/_writenex")
 */
function resolveBasePath(astroBase?: string): string {
  // Strip trailing slashes; ignore "/" and ""
  const trimmed =
    astroBase && astroBase !== "/" && astroBase !== ""
      ? astroBase.replace(/\/+$/, "")
      : "";

  // Ensure there is always a leading slash on the prefix
  const prefix =
    trimmed && !trimmed.startsWith("/") ? `/${trimmed}` : trimmed;

  return `${prefix}${DEFAULT_BASE_PATH}`;
}

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
 * @param options.remoteCms - Remote CMS auth settings (overrides writenex.config.ts)
 * @returns Astro integration object
 *
 * @example
 * ```typescript
 * // Basic usage
 * export default defineConfig({
 *   integrations: [writenex()],
 * });
 *
 * // With remote CMS authentication enabled
 * export default defineConfig({
 *   integrations: [
 *     writenex({
 *       remoteCms: {
 *         enabled: true,
 *         username: process.env.WRITENEX_CMS_USER,
 *         password: process.env.WRITENEX_CMS_PASS,
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
export default function writenex(options?: WritenexOptions): AstroIntegration {
  const { allowProduction = false, remoteCms } = options ?? {};

  // Base path for Writenex routes (resolved from Astro's `base` in config setup)
  let basePath = DEFAULT_BASE_PATH;

  // Track if we should be active
  let isActive = true;

  // Store loaded configuration
  let resolvedConfig: Required<WritenexConfig> | null = null;

  // Fully-resolved remote CMS config (always has all fields set, no optionals)
  let resolvedRemoteCms: import("@/types").ResolvedRemoteCmsConfig | null =
    null;

  // Store project root
  let projectRoot = "";

  // Store Astro's trailingSlash setting
  let astroTrailingSlash: "always" | "never" | "ignore" = "ignore";

  // File watcher instance
  let watcher: ContentWatcher | null = null;

  // Remote CMS session manager (only set when the auth gate is enabled)
  let auth: ReturnType<typeof createSessionManager> | null = null;

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
      "astro:config:setup": async ({
        command,
        logger,
        config,
        createCodegenDir,
        injectRoute,
      }) => {
        // Production guard: disable in production unless explicitly allowed
        if (command === "build" && !allowProduction) {
          logger.warn(
            "Disabled in production build. Use allowProduction: true to override."
          );
          isActive = false;
          return;
        }

        projectRoot = fileURLToPath(config.root);

        // Capture Astro's trailingSlash setting for preview URLs
        astroTrailingSlash = config.trailingSlash ?? "ignore";

        // Resolve the effective base path (respects Astro's `base` option)
        basePath = resolveBasePath(config.base);

        // Load Writenex configuration
        const { config: loadedConfig, warnings } =
          await loadConfig(projectRoot);

        // Integration-level remoteCms options override the config file;
        // always fully resolve so resolvedConfig.remoteCms is a
        // ResolvedRemoteCmsConfig (no optional fields).
        const mergedRemoteCms = applyRemoteCmsDefaults(
          remoteCms
            ? { ...loadedConfig.remoteCms, ...remoteCms }
            : loadedConfig.remoteCms
        );

        resolvedConfig = { ...loadedConfig, remoteCms: mergedRemoteCms };
        resolvedRemoteCms = mergedRemoteCms;

        // Fail closed: never run an unauthenticated writable editor when
        // the remote CMS is requested but credentials are missing.
        if (
          mergedRemoteCms.enabled &&
          (!mergedRemoteCms.username || !mergedRemoteCms.password)
        ) {
          logger.error(
            "[writenex] Remote CMS is enabled but credentials are missing. " +
              "Set remoteCms.username/password in writenex.config.ts or the " +
              "WRITENEX_CMS_USER / WRITENEX_CMS_PASS environment variables. " +
              "Disabling the editor to avoid exposing unauthenticated write access."
          );
          isActive = false;
          return;
        }

        // Production serving: inject the remote CMS routes so the editor
        // works on the deployed site through an SSR adapter.
        if (command === "build") {
          if (!mergedRemoteCms.enabled) {
            logger.warn(
              "Production build: editor not injected. Enable remoteCms " +
                "(with credentials) to use the remote CMS in production."
            );
            isActive = false;
            return;
          }

          if (config.output === "static") {
            logger.error(
              "[writenex] The remote CMS requires server-side rendering. " +
                "Set output: 'server' in your Astro config and add an SSR " +
                "adapter (e.g. @astrojs/node). Editor not injected."
            );
            isActive = false;
            return;
          }

          // Generate route modules in Astro's codegen directory and inject
          // them as server-rendered routes.
          const codegenDir = createCodegenDir();
          const editorEntry = new URL(EDITOR_ROUTE_FILE, codegenDir);
          const apiEntry = new URL(API_ROUTE_FILE, codegenDir);

          // Build a sanitized runtime config: strip credentials so they are
          // never baked into the generated source files. remote.ts re-reads
          // them from environment variables at runtime.
          const sanitizedConfig = {
            ...resolvedConfig,
            remoteCms: {
              ...resolvedConfig.remoteCms,
              username: "",
              password: "",
              secret: "",
            },
          } satisfies Required<WritenexConfig>;

          const runtime = {
            basePath,
            projectRoot,
            config: sanitizedConfig,
            trailingSlash: astroTrailingSlash,
          };

          writeFileSync(
            editorEntry,
            generateEditorRouteModule(runtime),
            "utf8"
          );
          writeFileSync(apiEntry, generateApiRouteModule(runtime), "utf8");

          injectRoute({
            pattern: basePath,
            entrypoint: editorEntry,
            prerender: false,
          });
          injectRoute({
            pattern: `${basePath}/[...writenex]`,
            entrypoint: apiEntry,
            prerender: false,
          });

          logger.info(
            `Writenex remote CMS will be served at ${basePath} in production.`
          );
          return;
        }

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
        if (!isActive || !resolvedConfig || !resolvedRemoteCms) {
          return;
        }

        // Create the session manager when the remote CMS gate is enabled.
        // resolvedRemoteCms is the fully-resolved config (no optional fields).
        // An explicit secret keeps sessions valid across restarts; falling back
        // to a random per-process secret means sessions reset on every restart.
        auth =
          resolvedRemoteCms.enabled &&
          resolvedRemoteCms.username &&
          resolvedRemoteCms.password
            ? createSessionManager(
                resolvedRemoteCms,
                resolvedRemoteCms.secret || randomBytes(32).toString("hex")
              )
            : null;

        // Create and register the middleware
        const middleware = createMiddleware({
          basePath,
          projectRoot,
          config: resolvedConfig,
          trailingSlash: astroTrailingSlash,
          auth: auth ?? undefined,
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

        if (auth) {
          logger.info(
            "Remote CMS authentication is enabled. Sign in with your configured credentials."
          );
        }
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
