/**
 * @fileoverview Skip Link component for keyboard navigation
 *
 * A visually hidden link that becomes visible on focus, allowing keyboard
 * users to skip repetitive navigation and jump directly to main content.
 * This is a critical accessibility feature for WCAG 2.1 AA compliance.
 *
 * @module @writenex/astro/client/components/SkipLink
 * @see {@link https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html}
 */

import { useCallback } from "react";
import "./SkipLink.css";

/**
 * Props for the SkipLink component
 */
export interface SkipLinkProps {
  /** Target element ID to skip to (without the # prefix) */
  targetId: string;
  /** Link text for screen readers */
  children: React.ReactNode;
}

/**
 * Skip link component for keyboard accessibility
 *
 * Renders a visually hidden link that becomes visible when focused.
 * When activated, it moves focus to the target element specified by targetId.
 *
 * @component
 * @example
 * ```tsx
 * <SkipLink targetId="main-content">Skip to main content</SkipLink>
 * ```
 */
export function SkipLink({
  targetId,
  children,
}: SkipLinkProps): React.ReactElement {
  /**
   * Handle click to move focus to target element
   */
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        // Make the target focusable if it isn't already
        if (!targetElement.hasAttribute("tabindex")) {
          targetElement.setAttribute("tabindex", "-1");
        }
        targetElement.focus();
        // Scroll the element into view
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [targetId]
  );

  return (
    <a href={`#${targetId}`} className="wn-skip-link" onClick={handleClick}>
      {children}
    </a>
  );
}
