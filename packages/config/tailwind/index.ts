/**
 * Shared Tailwind CSS configuration for Writenex packages
 *
 * Note: Tailwind v4 uses CSS-based configuration.
 * This file provides shared utilities and theme tokens.
 */

/**
 * Content paths for Tailwind to scan for class names
 * Use these in your app's Tailwind config
 */
export const contentPaths = {
  // Shared packages that contain Tailwind classes
  packages: [
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/editor/src/**/*.{ts,tsx}",
  ],
};

/**
 * Get content paths for a specific app
 * @param appName - The name of the app (e.g., 'writenex')
 */
export function getContentPaths(appName: string): string[] {
  return [`./src/**/*.{ts,tsx,mdx}`, ...contentPaths.packages];
}
