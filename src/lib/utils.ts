/**
 * @fileoverview Utility functions for the Writenex application
 *
 * Common utility functions used throughout the application including
 * class name merging, URL validation, content statistics calculation,
 * and date formatting utilities.
 *
 * @module lib/utils
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges Tailwind CSS class names.
 *
 * Uses clsx to conditionally join class names and tailwind-merge
 * to intelligently merge Tailwind classes, resolving conflicts.
 *
 * @param inputs - Class values (strings, objects, arrays, conditionals)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```ts
 * cn("px-4 py-2", "px-6"); // "px-6 py-2" (px-6 overrides px-4)
 * cn("text-red-500", isActive && "text-blue-500"); // conditional classes
 * cn({ "hidden": !show, "block": show }); // object syntax
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Validates if a string is a valid URL or allowed link format.
 *
 * Accepts:
 * - Absolute URLs (https://example.com)
 * - Relative URLs starting with /, #, or .
 * - Email links (mailto:user@example.com)
 * - Domain-like strings (example.com)
 *
 * @param url - The URL string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * isValidUrl("https://example.com"); // true
 * isValidUrl("/path/to/page"); // true
 * isValidUrl("#section"); // true
 * isValidUrl("mailto:user@example.com"); // true
 * isValidUrl("example.com"); // true
 * isValidUrl("not a url"); // false
 * ```
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;

  // Allow absolute URLs
  try {
    new URL(url);
    return true;
  } catch {
    // Continue checking
  }

  // Allow relative URLs starting with / or # or .
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith(".")) {
    return true;
  }

  // Allow email links
  if (url.startsWith("mailto:")) return true;

  // Allow simple domain-like strings (e.g. google.com)
  // Must have at least one dot and no spaces
  if (url.includes(".") && !url.includes(" ")) {
    return true;
  }

  return false;
}

/**
 * Statistics returned by calculateStats function.
 */
interface ContentStats {
  /** Number of words in the content */
  wordCount: number;
  /** Total character count including spaces */
  charCount: number;
  /** Number of lines in the content */
  lineCount: number;
}

/**
 * Calculates content statistics for a text string.
 *
 * Used for displaying word count, character count, and line count
 * in the editor status bar.
 *
 * @param content - The text content to analyze
 * @returns Object containing word, character, and line counts
 *
 * @example
 * ```ts
 * const stats = calculateStats("Hello world!\nNew line.");
 * // { wordCount: 3, charCount: 23, lineCount: 2 }
 * ```
 */
export function calculateStats(content: string): ContentStats {
  const text = content || "";
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return {
    wordCount: words.length,
    charCount: text.length,
    lineCount: text.split("\n").length,
  };
}

// =============================================================================
// DATE FORMATTING UTILITIES
// =============================================================================

/**
 * Formats a date as time only (e.g., "2:30 PM").
 *
 * Used in StatusBar for displaying last saved time.
 *
 * @param date - The date to format
 * @returns Formatted time string (e.g., "2:30 PM")
 *
 * @example
 * ```ts
 * formatTime(new Date()); // "2:30 PM"
 * ```
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formats a date as short date with time (e.g., "Dec 5, 2:30 PM").
 *
 * Used in VersionHistoryPanel for displaying version timestamps.
 *
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Dec 5, 2:30 PM")
 *
 * @example
 * ```ts
 * formatShortDateTime(new Date()); // "Dec 5, 2:30 PM"
 * ```
 */
export function formatShortDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formats a date as short date only (e.g., "Dec 5, 2025").
 *
 * Useful for displaying dates without time.
 *
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Dec 5, 2025")
 *
 * @example
 * ```ts
 * formatShortDate(new Date()); // "Dec 5, 2025"
 * ```
 */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Formats a date as full date and time (e.g., "December 5, 2025, 2:30 PM").
 *
 * Useful for detailed timestamps.
 *
 * @param date - The date to format
 * @returns Formatted date string (e.g., "December 5, 2025, 2:30 PM")
 *
 * @example
 * ```ts
 * formatFullDateTime(new Date()); // "December 5, 2025, 2:30 PM"
 * ```
 */
export function formatFullDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
