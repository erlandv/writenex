/**
 * @fileoverview Focus trap hook for modal accessibility
 *
 * This hook provides focus containment within a container element,
 * ensuring keyboard users cannot tab outside of modal dialogs.
 * It handles Tab/Shift+Tab cycling at boundaries and supports
 * focus restoration when the trap is deactivated.
 *
 * ## Features:
 * - Focus containment within container
 * - Tab and Shift+Tab cycling at boundaries
 * - Escape key callback support
 * - Automatic focus on first focusable element
 * - Focus restoration to trigger element on close
 *
 * @module @writenex/astro/client/hooks/useFocusTrap
 * @see {@link UseFocusTrapOptions} - Configuration options
 */

import { useCallback, useEffect, useRef } from "react";
import {
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
} from "../utils/focus";

/**
 * Options for useFocusTrap hook
 */
export interface UseFocusTrapOptions {
  /** Whether the trap is active */
  enabled: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Element to restore focus to on close */
  returnFocusTo?: HTMLElement | null;
}

/**
 * Return value from useFocusTrap hook
 */
export interface UseFocusTrapReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for trapping focus within a container element
 *
 * This hook is essential for modal accessibility, ensuring that keyboard
 * users cannot accidentally tab outside of a modal dialog. It automatically
 * moves focus to the first focusable element when enabled and restores
 * focus to the trigger element when disabled.
 *
 * @param options - Focus trap configuration options
 * @returns Object containing the container ref to attach to the trap element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 *   const { containerRef } = useFocusTrap({
 *     enabled: isOpen,
 *     onEscape: onClose,
 *     returnFocusTo: triggerRef.current,
 *   });
 *
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions): UseFocusTrapReturn {
  const { enabled, onEscape, returnFocusTo } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  /**
   * Handle keydown events for focus trapping
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      // Handle Escape key
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key for focus cycling
      if (event.key === "Tab") {
        const focusableElements = getFocusableElements(containerRef.current);

        if (focusableElements.length === 0) {
          // No focusable elements, prevent tab from leaving
          event.preventDefault();
          return;
        }

        const firstFocusable = getFirstFocusable(containerRef.current);
        const lastFocusable = getLastFocusable(containerRef.current);
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          // Shift+Tab: cycle from first to last
          if (activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab: cycle from last to first
          if (activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    },
    [enabled, onEscape]
  );

  // Set up focus trap when enabled
  useEffect(() => {
    if (!enabled) return;

    // Store the currently focused element for restoration
    previousActiveElementRef.current =
      returnFocusTo || (document.activeElement as HTMLElement);

    // Move focus to first focusable element in container
    const container = containerRef.current;
    if (container) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const firstFocusable = getFirstFocusable(container);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          // If no focusable elements, focus the container itself
          container.setAttribute("tabindex", "-1");
          container.focus();
        }
      });
    }

    // Add keydown listener
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown, returnFocusTo]);

  // Restore focus when trap is disabled
  useEffect(() => {
    if (enabled) return;

    // Restore focus to the previous element
    const elementToFocus = returnFocusTo || previousActiveElementRef.current;
    if (elementToFocus && typeof elementToFocus.focus === "function") {
      // Use requestAnimationFrame to ensure the modal is fully closed
      requestAnimationFrame(() => {
        elementToFocus.focus();
      });
    }
  }, [enabled, returnFocusTo]);

  return {
    containerRef,
  };
}
