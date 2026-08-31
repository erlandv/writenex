/**
 * @fileoverview Configuration loader for @writenex/astro
 *
 * This module handles loading Writenex configuration from various sources:
 * - writenex.config.ts (TypeScript)
 * - writenex.config.js (JavaScript)
 * - writenex.config.mjs (ES Module)
 *
 * The loader searches for configuration files in the project root and
 * applies default values for any missing options.
 *
 * @module @writenex/astro/config/loader
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import type { WritenexConfig } from "@/types";
import { applyConfigDefaults } from "./defaults";
import { resolveConfigInput, validateConfig } from "./schema";

/**
 * Normalize a project root path that may have come from URL.pathname.
 *
 * On Windows, `config.root.pathname` returns `/C:/Users/...` — a leading slash
 * before the drive letter that makes every subsequent `path.join` and
 * `fs.existsSync` call fail silently.  Strip it so downstream code gets a
 * valid Windows path like `C:\Users\...`.
 *
 * On macOS/Linux the path starts with a real `/` so the regex won't match
 * and the string is returned unchanged.
 */
function normalizeProjectRoot(projectRoot: string): string {
  if (projectRoot.startsWith("file://")) {
    return fileURLToPath(projectRoot);
  }
  let normalized = projectRoot.replace(/^\/([A-Za-z]:)/, "$1");
  try {
    normalized = decodeURIComponent(normalized);
  } catch (_) {}
  return normalized;
}

/**
 * Supported configuration file names in order of priority
 */
const CONFIG_FILE_NAMES = [
  "writenex.config.ts",
  "writenex.config.mts",
  "writenex.config.js",
  "writenex.config.mjs",
];

/**
 * Result of loading configuration
 */
export interface LoadConfigResult {
  /** The loaded and validated configuration with defaults applied */
  config: Required<WritenexConfig>;
  /** Path to the configuration file (if found) */
  configPath: string | null;
  /** Whether a configuration file was found */
  hasConfigFile: boolean;
  /** Any warnings generated during loading */
  warnings: string[];
}

/**
 * Find the configuration file in the project root
 *
 * @param projectRoot - The root directory of the Astro project
 * @returns Path to the configuration file, or null if not found
 */
export function findConfigFile(projectRoot: string): string | null {
  projectRoot = normalizeProjectRoot(projectRoot);
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = join(projectRoot, fileName);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Load configuration from a file.
 *
 * TypeScript config files (.ts / .mts) are loaded via `jiti` so that Node.js
 * does not need to understand the `.ts` extension natively.  Plain JS / MJS
 * files are still loaded with a regular dynamic `import()`.
 *
 * @param configPath - Absolute path to the configuration file
 * @returns The loaded configuration object
 * @throws Error if the file cannot be loaded or parsed
 */
async function loadConfigFile(configPath: string): Promise<WritenexConfig> {
  const absolutePath = resolve(configPath);

  try {
    let mod: unknown;

    if (/\.[mc]?ts$/.test(absolutePath)) {
      // Use jiti to transpile and load TypeScript config files at runtime.
      // `createJiti` accepts the "caller" URL so that relative imports inside
      // the config file resolve correctly.
      const jiti = createJiti(pathToFileURL(absolutePath).href, {
        interopDefault: true,
      });
      mod = await jiti.import(absolutePath);
    } else {
      // Plain .js / .mjs files can be loaded with a standard dynamic import.
      const fileUrl = pathToFileURL(absolutePath).href;
      mod = await import(fileUrl);
    }

    // Support both default export (`export default ...`) and
    // interop-wrapped objects (`{ default: ... }` from jiti).
    const config =
      (mod as { default?: WritenexConfig })?.default ??
      (mod as { config?: WritenexConfig })?.config ??
      (mod as WritenexConfig);

    return config;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load configuration from ${absolutePath}: ${message}`
    );
  }
}

/**
 * Load Writenex configuration from the project root
 *
 * This function:
 * 1. Searches for a configuration file in the project root
 * 2. Loads and validates the configuration if found
 * 3. Applies default values for any missing options
 * 4. Returns the resolved configuration
 *
 * If no configuration file is found, default configuration is returned
 * with auto-discovery enabled.
 *
 * @param projectRoot - The root directory of the Astro project
 * @returns LoadConfigResult with the resolved configuration
 *
 * @example
 * ```typescript
 * const { config, hasConfigFile, warnings } = await loadConfig('/path/to/project');
 *
 * if (!hasConfigFile) {
 *   console.log('Using auto-discovery mode');
 * }
 *
 * if (warnings.length > 0) {
 *   warnings.forEach(w => console.warn(w));
 * }
 * ```
 */
export async function loadConfig(
  projectRoot: string
): Promise<LoadConfigResult> {
  projectRoot = normalizeProjectRoot(projectRoot);
  const warnings: string[] = [];
  let userConfig: WritenexConfig = {};
  let configPath: string | null = null;
  let hasConfigFile = false;

  // Try to find and load configuration file
  configPath = findConfigFile(projectRoot);

  if (configPath) {
    hasConfigFile = true;

    try {
      const rawConfig = await loadConfigFile(configPath);

      const validationResult = validateConfig(rawConfig);

      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        warnings.push(`Configuration validation warnings: ${errors}`);
      }

      userConfig =
        typeof rawConfig === "object" && rawConfig !== null
          ? resolveConfigInput(rawConfig as WritenexConfig)
          : {};
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to load config file: ${message}. Using defaults.`);
      userConfig = {};
    }
  }

  // Apply defaults to the configuration
  const config = applyConfigDefaults(userConfig);

  return {
    config,
    configPath,
    hasConfigFile,
    warnings,
  };
}

/**
 * Check if a content directory exists in the project
 *
 * @param projectRoot - The root directory of the Astro project
 * @param contentPath - Relative path to the content directory
 * @returns True if the content directory exists
 */
export function contentDirectoryExists(
  projectRoot: string,
  contentPath: string = "src/content"
): boolean {
  projectRoot = normalizeProjectRoot(projectRoot);
  const fullPath = join(projectRoot, contentPath);
  return existsSync(fullPath);
}
