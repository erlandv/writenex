/**
 * @fileoverview Arrow key navigation hook for list accessibility
 *
 * This hook provides arrow key navigation for lists and tab panels,
 * supporting both vertical (ArrowUp/ArrowDown) and horizontal
 * (ArrowLeft/ArrowRight) navigation patterns.
 *
 * ## Features:
 * - Vertical arrow key navigation for lists
 * - Horizontal arrow key navigation for tabs
 * - Loop and non-loop modes
 * - Enter key for selection
 * - Home/End key support
 *
 * @module @writenex/astro/client/hooks/useArrowNavigation
 */

import { useCallback, useEffect, useRef } from "react";

/**
 * Navigation orientation
 */
export type NavigationOrientation = "vertical" | "horizontal";

/**
 * Options for useArrowNavigation hook
 */
export interface UseArrowNavigationOptions {
  /** List of item IDs or refs */
  items: string[] | React.RefObject<HTMLElement | null>[];
  /** Current focused index */
  currentIndex: number;
  /** Callback when index changes */
  onIndexChange: (index: number) => void;
  /** Callback when Enter is pressed on an item */
  onSelect?: (index: number) => void;
  /** Whether navigation is vertical (default) or horizontal */
  orientation?: NavigationOrientation;
  /** Whether to loop at boundaries (default: true) */
  loop?: boolean;
  /** Whether the navigation is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Return value from useArrowNavigation hook
 */
export interface UseArrowNavigationReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Handle keydown event (for manual attachment) */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Move focus to next item */
  focusNext: () => void;
  /** Move focus to previous item */
  focusPrevious: () => void;
  /** Move focus to first item */
  focusFirst: () => void;
  /** Move focus to last item */
  focusLast: () => void;
}

/**
 * Get the element at a given index from items array
 */
function getElementAtIndex(
  items: string[] | React.RefObject<HTMLElement | null>[],
  index: number
): HTMLElement | null {
  if (index < 0 || index >= items.length) return null;

  const item = items[index];

  // Check if it's a ref
  if (item && typeof item === "object" && "current" in item) {
    return item.current;
  }

  // It's an ID string
  if (typeof item === "string") {
    return document.getElementById(item);
  }

  return null;
}

/**
 * Hook for arrow key navigation in lists and tab panels
 *
 * This hook implements the WAI-ARIA keyboard navigation patterns
 * for lists and tabs, allowing users to navigate using arrow keys.
 *
 * @param options - Navigation configuration options
 * @returns Object containing container ref and navigation functions
 *
 * @example
 * ```tsx
 * function CollectionList({ collections, selectedIndex, onSelect }) {
 *   const { containerRef, handleKeyDown } = useArrowNavigation({
 *     items: collections.map(c => c.id),
 *     currentIndex: selectedIndex,
 *     onIndexChange: setSelectedIndex,
 *     onSelect: (index) => onSelect(collections[index]),
 *     orientation: 'vertical',
 *     loop: true,
 *   });
 *
 *   return (
 *     <ul ref={containerRef} role="listbox" onKeyDown={handleKeyDown}>
 *       {collections.map((collection, index) => (
 *         <li
 *           key={collection.id}
 *           id={collection.id}
 *           role="option"
 *           aria-selected={index === selectedIndex}
 *           tabIndex={index === selectedIndex ? 0 : -1}
 *         >
 *           {collection.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useArrowNavigation(
  options: UseArrowNavigationOptions
): UseArrowNavigationReturn {
  const {
    items,
    currentIndex,
    onIndexChange,
    onSelect,
    orientation = "vertical",
    loop = true,
    enabled = true,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);

  /**
   * Calculate the next index based on direction
   */
  const getNextIndex = useCallback(
    (direction: "next" | "previous"): number => {
      if (items.length === 0) return -1;

      if (direction === "next") {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) {
          return loop ? 0 : currentIndex;
        }
        return nextIndex;
      } else {
        const prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          return loop ? items.length - 1 : currentIndex;
        }
        return prevIndex;
      }
    },
    [items.length, currentIndex, loop]
  );

  /**
   * Move focus to next item
   */
  const focusNext = useCallback(() => {
    const nextIndex = getNextIndex("next");
    if (nextIndex !== currentIndex) {
      onIndexChange(nextIndex);
      const element = getElementAtIndex(items, nextIndex);
      element?.focus();
    }
  }, [getNextIndex, currentIndex, onIndexChange, items]);

  /**
   * Move focus to previous item
   */
  const focusPrevious = useCallback(() => {
    const prevIndex = getNextIndex("previous");
    if (prevIndex !== currentIndex) {
      onIndexChange(prevIndex);
      const element = getElementAtIndex(items, prevIndex);
      element?.focus();
    }
  }, [getNextIndex, currentIndex, onIndexChange, items]);

  /**
   * Move focus to first item
   */
  const focusFirst = useCallback(() => {
    if (items.length === 0) return;
    onIndexChange(0);
    const element = getElementAtIndex(items, 0);
    element?.focus();
  }, [items, onIndexChange]);

  /**
   * Move focus to last item
   */
  const focusLast = useCallback(() => {
    if (items.length === 0) return;
    const lastIndex = items.length - 1;
    onIndexChange(lastIndex);
    const element = getElementAtIndex(items, lastIndex);
    element?.focus();
  }, [items, onIndexChange]);

  /**
   * Handle keydown event
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled || items.length === 0) return;

      const isVertical = orientation === "vertical";
      const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
      const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

      switch (event.key) {
        case nextKey:
          event.preventDefault();
          focusNext();
          break;

        case prevKey:
          event.preventDefault();
          focusPrevious();
          break;

        case "Home":
          event.preventDefault();
          focusFirst();
          break;

        case "End":
          event.preventDefault();
          focusLast();
          break;

        case "Enter":
        case " ":
          if (onSelect && currentIndex >= 0) {
            event.preventDefault();
            onSelect(currentIndex);
          }
          break;
      }
    },
    [
      enabled,
      items.length,
      orientation,
      focusNext,
      focusPrevious,
      focusFirst,
      focusLast,
      onSelect,
      currentIndex,
    ]
  );

  // Focus the current item when index changes externally
  useEffect(() => {
    if (!enabled || currentIndex < 0) return;

    const element = getElementAtIndex(items, currentIndex);
    if (element && document.activeElement !== element) {
      // Only focus if the container or one of its children has focus
      const container = containerRef.current;
      if (container && container.contains(document.activeElement)) {
        element.focus();
      }
    }
  }, [enabled, currentIndex, items]);

  return {
    containerRef,
    handleKeyDown,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}
