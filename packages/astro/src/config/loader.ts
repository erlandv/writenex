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
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import type { WritenexConfig } from "../types";
import { validateConfig } from "./schema";
import { applyConfigDefaults } from "./defaults";

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
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = join(projectRoot, fileName);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Load configuration from a file
 *
 * @param configPath - Path to the configuration file
 * @returns The loaded configuration object
 * @throws Error if the file cannot be loaded or parsed
 */
async function loadConfigFile(configPath: string): Promise<WritenexConfig> {
  try {
    // Convert to file URL for dynamic import (required for Windows compatibility)
    const fileUrl = pathToFileURL(resolve(configPath)).href;

    // Dynamic import the configuration file
    const module = await import(fileUrl);

    // Support both default export and named export
    const config = module.default ?? module.config ?? module;

    return config as WritenexConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load configuration from ${configPath}: ${message}`
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
  const warnings: string[] = [];
  let userConfig: WritenexConfig = {};
  let configPath: string | null = null;
  let hasConfigFile = false;

  // Try to find and load configuration file
  configPath = findConfigFile(projectRoot);

  if (configPath) {
    hasConfigFile = true;

    try {
      userConfig = await loadConfigFile(configPath);

      // Validate the loaded configuration
      const validationResult = validateConfig(userConfig);

      if (!validationResult.success) {
        const errors = validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        warnings.push(`Configuration validation warnings: ${errors}`);
      }
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
  const fullPath = join(projectRoot, contentPath);
  return existsSync(fullPath);
}
