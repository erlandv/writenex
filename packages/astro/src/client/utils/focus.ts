/**
 * @fileoverview Focus management utilities for accessibility
 *
 * Provides helper functions for managing focus within containers,
 * useful for modal dialogs and focus trapping.
 *
 * @module @writenex/astro/client/utils/focus
 */

/**
 * Selector for focusable elements
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Get all focusable elements within a container
 *
 * @param container - The container element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => {
    // Filter out elements that are not visible
    return el.offsetParent !== null;
  });
}

/**
 * Get the first focusable element within a container
 *
 * @param container - The container element to search within
 * @returns The first focusable element, or null if none found
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable[0] || null;
}

/**
 * Get the last focusable element within a container
 *
 * @param container - The container element to search within
 * @returns The last focusable element, or null if none found
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable[focusable.length - 1] || null;
}
