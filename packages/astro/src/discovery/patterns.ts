/**
 * @fileoverview File pattern detection for content collections
 *
 * This module provides functions to detect and work with file naming patterns
 * in Astro content collections.
 *
 * ## Supported Patterns:
 * - `{slug}.md` - Simple slug-based naming
 * - `{date}-{slug}.md` - Date-prefixed naming (2024-01-15-my-post.md)
 * - `{year}/{slug}.md` - Year folder structure
 * - `{year}/{month}/{slug}.md` - Year/month folder structure
 * - `{slug}/index.md` - Folder-based with index file
 * - `{category}/{slug}.md` - Category folder structure
 *
 * ## Detection Process:
 * 1. Scan collection directory for all content files
 * 2. Analyze file paths and names for common patterns
 * 3. Score each pattern based on match frequency
 * 4. Return the best matching pattern
 *
 * @module @writenex/astro/discovery/patterns
 */

import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { isContentFile } from "../filesystem/reader";

/**
 * Pattern definition with regex and template
 */
interface PatternDefinition {
  /** Pattern name for identification */
  name: string;
  /** Template string with tokens */
  template: string;
  /** Regex to match against file paths */
  regex: RegExp;
  /** Function to extract tokens from a match */
  extract: (match: RegExpMatchArray, ext: string) => Record<string, string>;
  /** Priority when multiple patterns match (higher = preferred) */
  priority: number;
}

/**
 * Result of pattern detection
 */
export interface PatternDetectionResult {
  /** The detected pattern template */
  pattern: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Number of files that matched this pattern */
  matchCount: number;
  /** Total files analyzed */
  totalFiles: number;
  /** Sample matches for debugging */
  samples: Array<{
    filePath: string;
    extracted: Record<string, string>;
  }>;
}

/**
 * All supported pattern definitions
 *
 * Order matters - more specific patterns should come first
 */
const PATTERN_DEFINITIONS: PatternDefinition[] = [
  // {year}/{month}/{slug}.md - Most specific nested date structure
  {
    name: "year-month-slug",
    template: "{year}/{month}/{slug}.md",
    regex: /^(\d{4})\/(\d{2})\/([^/]+)\.(md|mdx)$/,
    extract: (match, ext) => ({
      year: match[1] ?? "",
      month: match[2] ?? "",
      slug: match[3] ?? "",
      extension: ext,
    }),
    priority: 90,
  },

  // {year}/{slug}.md - Year folder structure
  {
    name: "year-slug",
    template: "{year}/{slug}.md",
    regex: /^(\d{4})\/([^/]+)\.(md|mdx)$/,
    extract: (match, ext) => ({
      year: match[1] ?? "",
      slug: match[2] ?? "",
      extension: ext,
    }),
    priority: 80,
  },

  // {slug}/index.md - Folder-based content
  {
    name: "folder-index",
    template: "{slug}/index.md",
    regex: /^([^/]+)\/index\.(md|mdx)$/,
    extract: (match, ext) => ({
      slug: match[1] ?? "",
      extension: ext,
    }),
    priority: 75,
  },

  // {date}-{slug}.md - Date-prefixed
  {
    name: "date-slug",
    template: "{date}-{slug}.md",
    regex: /^(\d{4}-\d{2}-\d{2})-(.+)\.(md|mdx)$/,
    extract: (match, ext) => ({
      date: match[1] ?? "",
      slug: match[2] ?? "",
      extension: ext,
    }),
    priority: 70,
  },

  // {category}/{slug}.md - Category folder (catch-all for non-date folders)
  {
    name: "category-slug",
    template: "{category}/{slug}.md",
    regex: /^([^/]+)\/([^/]+)\.(md|mdx)$/,
    extract: (match, ext) => ({
      category: match[1] ?? "",
      slug: match[2] ?? "",
      extension: ext,
    }),
    priority: 50,
  },

  // {slug}.md - Simple flat structure (default fallback)
  {
    name: "simple-slug",
    template: "{slug}.md",
    regex: /^([^/]+)\.(md|mdx)$/,
    extract: (match, ext) => ({
      slug: match[1] ?? "",
      extension: ext,
    }),
    priority: 10,
  },
];

/**
 * List all content files in a directory recursively
 *
 * @param dirPath - Directory to scan
 * @returns Array of relative file paths
 */
async function listContentFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  if (!existsSync(dirPath)) {
    return files;
  }

  async function scan(currentPath: string, relativeTo: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      const relativePath = relative(relativeTo, fullPath);

      if (entry.isDirectory()) {
        // Skip hidden and special directories
        if (!entry.name.startsWith(".") && !entry.name.startsWith("_")) {
          await scan(fullPath, relativeTo);
        }
      } else if (entry.isFile() && isContentFile(entry.name)) {
        files.push(relativePath);
      }
    }
  }

  await scan(dirPath, dirPath);
  return files;
}

/**
 * Try to match a file path against all pattern definitions
 *
 * @param relativePath - Relative path to the content file
 * @returns Matched pattern and extracted tokens, or null
 */
function matchPattern(
  relativePath: string
): { pattern: PatternDefinition; match: RegExpMatchArray } | null {
  // Normalize path separators
  const normalizedPath = relativePath.replace(/\\/g, "/");

  for (const pattern of PATTERN_DEFINITIONS) {
    const match = normalizedPath.match(pattern.regex);
    if (match) {
      return { pattern, match };
    }
  }

  return null;
}

/**
 * Detect the file naming pattern used in a collection
 *
 * Analyzes all content files in the collection directory and determines
 * the most likely pattern based on file names and structure.
 *
 * @param collectionPath - Absolute path to the collection directory
 * @returns Pattern detection result with confidence score
 *
 * @example
 * ```typescript
 * const result = await detectFilePattern('/project/src/content/blog');
 * console.log(result.pattern); // "{date}-{slug}.md"
 * console.log(result.confidence); // 0.95
 * ```
 */
export async function detectFilePattern(
  collectionPath: string
): Promise<PatternDetectionResult> {
  const files = await listContentFiles(collectionPath);

  if (files.length === 0) {
    return {
      pattern: "{slug}.md",
      confidence: 0,
      matchCount: 0,
      totalFiles: 0,
      samples: [],
    };
  }

  // Count matches for each pattern
  const patternCounts = new Map<
    string,
    {
      pattern: PatternDefinition;
      count: number;
      samples: Array<{ filePath: string; extracted: Record<string, string> }>;
      extension: string;
    }
  >();

  for (const pattern of PATTERN_DEFINITIONS) {
    patternCounts.set(pattern.name, {
      pattern,
      count: 0,
      samples: [],
      extension: ".md",
    });
  }

  // Analyze each file
  for (const filePath of files) {
    const result = matchPattern(filePath);

    if (result) {
      const { pattern, match } = result;
      const entry = patternCounts.get(pattern.name);

      if (entry) {
        const ext = extname(filePath);
        const extracted = pattern.extract(match, ext);

        entry.count++;
        entry.extension = ext;

        // Keep up to 3 samples
        if (entry.samples.length < 3) {
          entry.samples.push({ filePath, extracted });
        }
      }
    }
  }

  // Find the best matching pattern
  // Consider both match count and pattern priority
  let bestPattern: PatternDetectionResult | null = null;
  let bestScore = -1;

  for (const [, entry] of patternCounts) {
    if (entry.count === 0) continue;

    // Score = (match ratio * 100) + priority
    // This ensures high match ratio wins, but priority breaks ties
    const matchRatio = entry.count / files.length;
    const score = matchRatio * 100 + entry.pattern.priority;

    if (score > bestScore) {
      bestScore = score;

      // Adjust template for actual extension used
      let template = entry.pattern.template;
      if (entry.extension === ".mdx") {
        template = template.replace(".md", ".mdx");
      }

      bestPattern = {
        pattern: template,
        confidence: matchRatio,
        matchCount: entry.count,
        totalFiles: files.length,
        samples: entry.samples,
      };
    }
  }

  // Return best pattern or default
  return (
    bestPattern ?? {
      pattern: "{slug}.md",
      confidence: 0,
      matchCount: 0,
      totalFiles: files.length,
      samples: [],
    }
  );
}

/**
 * Generate a file path from a pattern and tokens
 *
 * @param pattern - Pattern template (e.g., "{date}-{slug}.md")
 * @param tokens - Token values to substitute
 * @returns Generated file path
 *
 * @example
 * ```typescript
 * const path = generatePathFromPattern(
 *   "{date}-{slug}.md",
 *   { date: "2024-01-15", slug: "my-post" }
 * );
 * // Returns: "2024-01-15-my-post.md"
 * ```
 */
export function generatePathFromPattern(
  pattern: string,
  tokens: Record<string, string>
): string {
  let result = pattern;

  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(`{${key}}`, value);
  }

  return result;
}

/**
 * Parse a pattern template to extract token names
 *
 * @param pattern - Pattern template
 * @returns Array of token names
 *
 * @example
 * ```typescript
 * const tokens = parsePatternTokens("{year}/{month}/{slug}.md");
 * // Returns: ["year", "month", "slug"]
 * ```
 */
export function parsePatternTokens(pattern: string): string[] {
  const tokenRegex = /\{([^}]+)\}/g;
  const tokens: string[] = [];
  let match;

  while ((match = tokenRegex.exec(pattern)) !== null) {
    if (match[1]) {
      tokens.push(match[1]);
    }
  }

  return tokens;
}

/**
 * Validate that a pattern has all required tokens
 *
 * @param pattern - Pattern template
 * @param requiredTokens - Required token names
 * @returns True if all required tokens are present
 */
export function validatePattern(
  pattern: string,
  requiredTokens: string[] = ["slug"]
): boolean {
  const tokens = parsePatternTokens(pattern);
  return requiredTokens.every((req) => tokens.includes(req));
}

/**
 * Get the default extension for a pattern
 *
 * @param pattern - Pattern template
 * @returns The file extension (.md or .mdx)
 */
export function getPatternExtension(pattern: string): string {
  if (pattern.endsWith(".mdx")) {
    return ".mdx";
  }
  return ".md";
}
