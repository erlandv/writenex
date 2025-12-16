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
 * - `{year}/{month}/{day}/{slug}.md` - Full date folder structure
 * - `{slug}/index.md` - Folder-based with index file
 * - `{category}/{slug}.md` - Category folder structure
 * - `{category}/{slug}/index.md` - Category with folder-based content
 * - `{lang}/{slug}.md` - Language-prefixed content (i18n)
 * - `{lang}/{slug}/index.md` - Language with folder-based content
 *
 * ## Custom Patterns:
 * Developers can configure custom patterns in their collection config.
 * Custom tokens are resolved from frontmatter data or use default values.
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
import { isContentFile } from "@/filesystem/reader";

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
 * Order matters - more specific patterns should come first.
 * Higher priority patterns are preferred when multiple patterns match.
 */
const PATTERN_DEFINITIONS: PatternDefinition[] = [
  // {year}/{month}/{day}/{slug}.md - Full date folder structure
  {
    name: "year-month-day-slug",
    template: "{year}/{month}/{day}/{slug}.md",
    regex: /^(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\.(md|mdx)$/,
    extract: (match, ext) => ({
      year: match[1] ?? "",
      month: match[2] ?? "",
      day: match[3] ?? "",
      slug: match[4] ?? "",
      extension: ext,
    }),
    priority: 95,
  },

  // {year}/{month}/{slug}.md - Year/month nested date structure
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
    priority: 85,
  },

  // {lang}/{slug}/index.md - Language with folder-based content (i18n)
  {
    name: "lang-folder-index",
    template: "{lang}/{slug}/index.md",
    regex: /^([a-z]{2}(?:-[A-Z]{2})?)\/([^/]+)\/index\.(md|mdx)$/,
    extract: (match, ext) => ({
      lang: match[1] ?? "",
      slug: match[2] ?? "",
      extension: ext,
    }),
    priority: 82,
  },

  // {category}/{slug}/index.md - Category with folder-based content
  {
    name: "category-folder-index",
    template: "{category}/{slug}/index.md",
    regex: /^([^/]+)\/([^/]+)\/index\.(md|mdx)$/,
    extract: (match, ext) => ({
      category: match[1] ?? "",
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

  // {date}-{slug}.md - Date-prefixed (ISO format)
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

  // {lang}/{slug}.md - Language-prefixed content (i18n)
  // Matches: en/my-post.md, pt-BR/my-post.md
  {
    name: "lang-slug",
    template: "{lang}/{slug}.md",
    regex: /^([a-z]{2}(?:-[A-Z]{2})?)\/([^/]+)\.(md|mdx)$/,
    extract: (match, ext) => ({
      lang: match[1] ?? "",
      slug: match[2] ?? "",
      extension: ext,
    }),
    priority: 60,
  },

  // {category}/{slug}.md - Category folder (catch-all for non-date/non-lang folders)
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

/**
 * Known token types and their default value generators
 */
type TokenResolver = (
  frontmatter: Record<string, unknown>,
  slug: string
) => string;

const TOKEN_RESOLVERS: Record<string, TokenResolver> = {
  // Core tokens
  slug: (_fm, slug) => slug,

  // Date tokens - from pubDate or current date
  date: (fm) => {
    const pubDate = resolveDateFromFrontmatter(fm);
    return pubDate.toISOString().split("T")[0] ?? "";
  },
  year: (fm) => {
    const pubDate = resolveDateFromFrontmatter(fm);
    return pubDate.getFullYear().toString();
  },
  month: (fm) => {
    const pubDate = resolveDateFromFrontmatter(fm);
    return (pubDate.getMonth() + 1).toString().padStart(2, "0");
  },
  day: (fm) => {
    const pubDate = resolveDateFromFrontmatter(fm);
    return pubDate.getDate().toString().padStart(2, "0");
  },

  // i18n tokens
  lang: (fm) => {
    if (typeof fm.lang === "string") return fm.lang;
    if (typeof fm.language === "string") return fm.language;
    if (typeof fm.locale === "string") return fm.locale;
    return "en"; // Default to English
  },

  // Organization tokens
  category: (fm) => {
    if (typeof fm.category === "string") return fm.category;
    if (Array.isArray(fm.categories) && typeof fm.categories[0] === "string") {
      return fm.categories[0];
    }
    return "uncategorized";
  },
  author: (fm) => {
    if (typeof fm.author === "string") return slugifyValue(fm.author);
    if (
      typeof fm.author === "object" &&
      fm.author !== null &&
      "name" in fm.author
    ) {
      return slugifyValue(String(fm.author.name));
    }
    return "anonymous";
  },
  type: (fm) => {
    if (typeof fm.type === "string") return fm.type;
    if (typeof fm.contentType === "string") return fm.contentType;
    return "post";
  },
  status: (fm) => {
    if (typeof fm.status === "string") return fm.status;
    if (fm.draft === true) return "draft";
    return "published";
  },
  series: (fm) => {
    if (typeof fm.series === "string") return slugifyValue(fm.series);
    return "";
  },
  collection: (fm) => {
    if (typeof fm.collection === "string") return fm.collection;
    return "";
  },
};

/**
 * Resolve a date from frontmatter
 *
 * Checks common date field names: pubDate, date, publishDate, createdAt
 *
 * @param frontmatter - Frontmatter data
 * @returns Resolved Date object
 */
function resolveDateFromFrontmatter(
  frontmatter: Record<string, unknown>
): Date {
  const dateFields = ["pubDate", "date", "publishDate", "createdAt", "created"];

  for (const field of dateFields) {
    const value = frontmatter[field];
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  return new Date();
}

/**
 * Convert a string to a URL-safe slug
 *
 * @param value - String to slugify
 * @returns URL-safe slug
 */
function slugifyValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Options for resolving pattern tokens
 */
export interface ResolveTokensOptions {
  /** The content slug */
  slug: string;
  /** Frontmatter data for resolving dynamic tokens */
  frontmatter?: Record<string, unknown>;
  /** Custom token values (override automatic resolution) */
  customTokens?: Record<string, string>;
}

/**
 * Resolve all tokens in a pattern to their values
 *
 * Token resolution priority:
 * 1. Custom tokens (explicitly provided)
 * 2. Known token resolvers (date, year, month, etc.)
 * 3. Frontmatter values (for custom tokens)
 * 4. Empty string (fallback)
 *
 * @param pattern - Pattern template with tokens
 * @param options - Resolution options
 * @returns Record of token names to resolved values
 *
 * @example
 * ```typescript
 * const tokens = resolvePatternTokens("{year}/{month}/{slug}.md", {
 *   slug: "my-post",
 *   frontmatter: { pubDate: new Date("2024-06-15") }
 * });
 * // Returns: { year: "2024", month: "06", slug: "my-post" }
 * ```
 */
export function resolvePatternTokens(
  pattern: string,
  options: ResolveTokensOptions
): Record<string, string> {
  const { slug, frontmatter = {}, customTokens = {} } = options;
  const tokenNames = parsePatternTokens(pattern);
  const resolved: Record<string, string> = {};

  for (const tokenName of tokenNames) {
    // Priority 1: Custom tokens
    if (tokenName in customTokens) {
      resolved[tokenName] = customTokens[tokenName] ?? "";
      continue;
    }

    // Priority 2: Known token resolvers
    const resolver = TOKEN_RESOLVERS[tokenName];
    if (resolver) {
      resolved[tokenName] = resolver(frontmatter, slug);
      continue;
    }

    // Priority 3: Direct frontmatter value
    const fmValue = frontmatter[tokenName];
    if (typeof fmValue === "string") {
      resolved[tokenName] = slugifyValue(fmValue);
      continue;
    }
    if (typeof fmValue === "number") {
      resolved[tokenName] = fmValue.toString();
      continue;
    }

    // Priority 4: Fallback to empty string
    resolved[tokenName] = "";
  }

  return resolved;
}

/**
 * Check if a pattern is valid for content creation
 *
 * A pattern is valid if:
 * - It contains the {slug} token (required)
 * - It ends with .md or .mdx
 * - All tokens can be resolved
 *
 * @param pattern - Pattern template to validate
 * @returns Validation result with error message if invalid
 */
export function isValidPattern(pattern: string): {
  valid: boolean;
  error?: string;
} {
  // Must contain slug token
  if (!pattern.includes("{slug}")) {
    return { valid: false, error: "Pattern must contain {slug} token" };
  }

  // Must end with .md or .mdx
  if (!pattern.endsWith(".md") && !pattern.endsWith(".mdx")) {
    return { valid: false, error: "Pattern must end with .md or .mdx" };
  }

  // Check for unclosed tokens
  const unclosed = pattern.match(/\{[^}]*$/);
  if (unclosed) {
    return { valid: false, error: "Pattern contains unclosed token" };
  }

  return { valid: true };
}

/**
 * Get list of all supported token names
 *
 * @returns Array of supported token names
 */
export function getSupportedTokens(): string[] {
  return Object.keys(TOKEN_RESOLVERS);
}
