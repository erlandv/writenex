/**
 * @fileoverview Class name utility for Tailwind CSS
 *
 * Provides the `cn` function for combining and merging Tailwind CSS classes.
 * This is extracted as a separate module because it's the most frequently
 * imported utility across all packages.
 *
 * @module utils/cn
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
