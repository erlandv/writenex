/**
 * @fileoverview Table of Contents Hook
 *
 * This hook provides functionality for extracting headings from markdown
 * content and managing Table of Contents state. It uses smart parsing to
 * accurately identify headings while ignoring code blocks and frontmatter.
 *
 * ## Features:
 * - Smart parsing that skips frontmatter and code blocks
 * - Debounced updates for performance
 * - Active heading detection based on scroll position
 * - Click-to-jump functionality
 *
 * ## Usage:
 * ```tsx
 * const { headings, activeHeadingId } = useTableOfContents();
 * ```
 *
 * @module hooks/useTableOfContents
 * @see {@link TocPanel} - Component that displays the ToC
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useEditorStore } from "@/store/editorStore";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Represents a heading extracted from the document
 */
export interface TocHeading {
  /** Unique identifier for React key */
  id: string;
  /** Heading level (1-6 for H1-H6) */
  level: number;
  /** Heading text content */
  text: string;
  /** Position index in the document */
  index: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Remove YAML frontmatter from markdown content.
 *
 * Frontmatter is delimited by `---` at the start and end.
 *
 * @param markdown - Raw markdown content
 * @returns Markdown without frontmatter
 */
function stripFrontmatter(markdown: string): string {
  // Match frontmatter at the very beginning of the document
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n?/;
  return markdown.replace(frontmatterRegex, "");
}

/**
 * Remove fenced code blocks from markdown content.
 *
 * Code blocks can contain `#` characters that look like headings
 * but should not be extracted.
 *
 * @param markdown - Markdown content
 * @returns Markdown without code blocks
 */
function stripCodeBlocks(markdown: string): string {
  // Match fenced code blocks (``` or ~~~)
  const fencedCodeRegex = /^(`{3,}|~{3,}).*\n[\s\S]*?\n\1/gm;
  return markdown.replace(fencedCodeRegex, "");
}

/**
 * Remove indented code blocks from markdown content.
 *
 * Lines indented with 4+ spaces or a tab are code blocks.
 *
 * @param markdown - Markdown content
 * @returns Markdown without indented code blocks
 */
function stripIndentedCode(markdown: string): string {
  // Match lines starting with 4 spaces or tab (indented code)
  // Only remove if preceded by blank line or start of doc
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  let prevLineBlank = true;

  for (const line of lines) {
    const isIndented = /^(?: {4}|\t)/.test(line);
    const isBlank = line.trim() === "";

    if (isIndented && prevLineBlank) {
      inCodeBlock = true;
    } else if (!isIndented && !isBlank) {
      inCodeBlock = false;
    }

    if (!inCodeBlock) {
      result.push(line);
    }

    prevLineBlank = isBlank;
  }

  return result.join("\n");
}

/**
 * Extract headings from markdown content.
 *
 * This function:
 * 1. Removes frontmatter
 * 2. Removes code blocks (fenced and indented)
 * 3. Extracts ATX-style headings (# to ######)
 *
 * @param markdown - Raw markdown content
 * @returns Array of extracted headings
 */
export function extractHeadings(markdown: string): TocHeading[] {
  if (!markdown || markdown.trim() === "") {
    return [];
  }

  // Clean the content
  let cleaned = stripFrontmatter(markdown);
  cleaned = stripCodeBlocks(cleaned);
  cleaned = stripIndentedCode(cleaned);

  // Extract headings
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;
  let index = 0;

  while ((match = headingRegex.exec(cleaned)) !== null) {
    const text = match[2].trim();
    // Skip empty headings
    if (text) {
      headings.push({
        id: `heading-${index}-${text.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`,
        level: match[1].length,
        text,
        index,
      });
      index++;
    }
  }

  return headings;
}

/**
 * Scroll to a heading element in the editor.
 *
 * Finds the heading by matching text content and scrolls it into view.
 *
 * @param headingText - The text content of the heading to scroll to
 */
export function scrollToHeading(headingText: string): void {
  // Find the MDXEditor content area
  const editorEl = document.querySelector(".mdxeditor");
  if (!editorEl) return;

  // Find all heading elements
  const headings = editorEl.querySelectorAll("h1, h2, h3, h4, h5, h6");

  for (const el of headings) {
    if (el.textContent?.trim() === headingText) {
      // Scroll the heading into view
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // Brief highlight effect
      const originalBg = (el as HTMLElement).style.backgroundColor;
      (el as HTMLElement).style.backgroundColor = "rgba(59, 130, 246, 0.2)";
      (el as HTMLElement).style.transition = "background-color 0.3s ease";

      setTimeout(() => {
        (el as HTMLElement).style.backgroundColor = originalBg;
      }, 1000);

      break;
    }
  }
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Debounce delay for heading extraction (ms)
 */
const EXTRACT_DEBOUNCE = 300;

/**
 * Throttle delay for scroll tracking (ms)
 */
const SCROLL_THROTTLE = 100;

/**
 * Main hook for Table of Contents functionality.
 *
 * Extracts headings from the current document content with debouncing
 * for performance.
 *
 * @returns Object containing headings array
 *
 * @example
 * ```tsx
 * function TocPanel() {
 *   const { headings } = useTableOfContents();
 *
 *   return (
 *     <ul>
 *       {headings.map((h) => (
 *         <li key={h.id}>{h.text}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useTableOfContents(): { headings: TocHeading[] } {
  const { content } = useEditorStore();
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the extraction
    debounceRef.current = setTimeout(() => {
      const extracted = extractHeadings(content);
      setHeadings(extracted);
    }, EXTRACT_DEBOUNCE);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content]);

  return { headings };
}

/**
 * Hook for tracking the currently active heading based on scroll position.
 *
 * Uses scroll event listener to detect which heading is closest to the
 * top of the viewport. This approach is more reliable than IntersectionObserver
 * in complex editor environments where DOM elements may change frequently.
 *
 * @param headings - Array of headings to track
 * @returns The ID of the currently active heading, or null
 *
 * @example
 * ```tsx
 * function TocPanel() {
 *   const { headings } = useTableOfContents();
 *   const activeHeadingId = useActiveHeading(headings);
 *
 *   return (
 *     <ul>
 *       {headings.map((h) => (
 *         <li
 *           key={h.id}
 *           className={h.id === activeHeadingId ? "active" : ""}
 *         >
 *           {h.text}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useActiveHeading(headings: TocHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  // Create a map of heading text to heading data for quick lookup
  const headingMap = useMemo(() => {
    const map = new Map<string, TocHeading>();
    headings.forEach((h) => map.set(h.text, h));
    return map;
  }, [headings]);

  /**
   * Calculate which heading is currently "active" based on scroll position.
   * The active heading is the one closest to (but above) the top of the viewport.
   */
  const calculateActiveHeading = useCallback(() => {
    const editorEl = document.querySelector(".mdxeditor");
    if (!editorEl) return;

    // Find the scrollable content area
    const contentArea =
      editorEl.querySelector("[contenteditable]")?.closest(".mdxeditor") ||
      editorEl;

    // Get all heading elements
    const headingEls = contentArea.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (headingEls.length === 0) {
      setActiveId(null);
      return;
    }

    // Calculate which heading is closest to the top
    // We look for headings that are at or above the "activation line" (top 20% of viewport)
    const activationOffset = window.innerHeight * 0.2;
    let closestHeadingId: string | null = null;
    let closestDistance = Infinity;

    headingEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const text = el.textContent?.trim() || "";
      const heading = headingMap.get(text);

      if (!heading) return;

      // Distance from the activation line (positive = below, negative = above)
      const distance = rect.top - activationOffset;

      // Prefer headings that are above or at the activation line
      // but still visible (not scrolled too far up)
      if (distance <= 0 && rect.bottom > 0) {
        // Heading is above or at activation line and still visible
        const absDistance = Math.abs(distance);
        if (absDistance < closestDistance) {
          closestDistance = absDistance;
          closestHeadingId = heading.id;
        }
      } else if (distance > 0 && closestHeadingId === null) {
        // No heading above activation line yet, use the first one below
        closestHeadingId = heading.id;
        closestDistance = distance;
      }
    });

    if (closestHeadingId !== null) {
      setActiveId(closestHeadingId);
    } else if (headings.length > 0) {
      // Default to first heading if none found
      setActiveId(headings[0].id);
    }
  }, [headingMap, headings]);

  useEffect(() => {
    // No headings to track
    if (headings.length === 0) {
      const timeoutId = setTimeout(() => setActiveId(null), 0);
      return () => clearTimeout(timeoutId);
    }

    // Calculate initial active heading
    // Use a small delay to ensure DOM is ready
    const initialTimeout = setTimeout(calculateActiveHeading, 100);

    // Throttled scroll handler
    const handleScroll = () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      throttleRef.current = setTimeout(calculateActiveHeading, SCROLL_THROTTLE);
    };

    // Listen to scroll events on multiple potential scroll containers
    const editorEl = document.querySelector(".mdxeditor");
    const scrollContainers: Element[] = [];

    if (editorEl) {
      // MDXEditor may have nested scroll containers
      const contentEditable = editorEl.querySelector("[contenteditable]");
      if (contentEditable) {
        // Find the scrollable parent
        let parent = contentEditable.parentElement;
        while (parent && parent !== document.body) {
          const style = window.getComputedStyle(parent);
          if (
            style.overflowY === "auto" ||
            style.overflowY === "scroll" ||
            style.overflow === "auto" ||
            style.overflow === "scroll"
          ) {
            scrollContainers.push(parent);
          }
          parent = parent.parentElement;
        }
      }
    }

    // Also listen to window scroll as fallback
    window.addEventListener("scroll", handleScroll, { passive: true });
    scrollContainers.forEach((container) => {
      container.addEventListener("scroll", handleScroll, { passive: true });
    });

    // Also recalculate on content changes (MutationObserver)
    const mutationObserver = new MutationObserver(() => {
      // Debounce mutation updates
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      throttleRef.current = setTimeout(calculateActiveHeading, 200);
    });

    if (editorEl) {
      mutationObserver.observe(editorEl, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      clearTimeout(initialTimeout);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      scrollContainers.forEach((container) => {
        container.removeEventListener("scroll", handleScroll);
      });
      mutationObserver.disconnect();
    };
  }, [headings, calculateActiveHeading]);

  return activeId;
}
