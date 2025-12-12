/**
 * @fileoverview Live Region component for screen reader announcements
 *
 * A global live region component that announces dynamic content changes
 * to screen readers. Integrates with the useAnnounce hook to provide
 * a centralized announcement system.
 *
 * @module @writenex/astro/client/components/LiveRegion
 * @see {@link useAnnounce} - Hook for triggering announcements
 */

import type { AnnouncePoliteness } from "../../hooks/useAnnounce";
import "./LiveRegion.css";

/**
 * Props for the LiveRegion component
 */
export interface LiveRegionProps {
  /** Current message to announce */
  message: string;
  /** Politeness level - polite waits, assertive interrupts */
  politeness?: AnnouncePoliteness;
}

/**
 * Live region component for screen reader announcements
 *
 * Renders an ARIA live region that announces messages to screen readers.
 * The component is visually hidden but accessible to assistive technology.
 *
 * @component
 * @example
 * ```tsx
 * function App() {
 *   const { currentMessage, currentPoliteness } = useAnnounce();
 *
 *   return (
 *     <>
 *       <LiveRegion message={currentMessage} politeness={currentPoliteness} />
 *       {/* rest of app *\/}
 *     </>
 *   );
 * }
 * ```
 */
export function LiveRegion({
  message,
  politeness = "polite",
}: LiveRegionProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="wn-live-region"
    >
      {message}
    </div>
  );
}
