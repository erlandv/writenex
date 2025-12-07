/**
 * @fileoverview Offline Indicator Component
 *
 * This component displays a subtle indicator in the status bar when the user
 * is offline. It also shows a brief reconnection message when coming back online.
 *
 * ## Design Decisions:
 * - Uses amber color for offline (warning, not error - app still works)
 * - Shows green briefly when reconnecting to confirm connection restored
 * - Compact design to fit in status bar without being intrusive
 * - Auto-dismisses reconnection message after 3 seconds
 *
 * ## States:
 * - **Online**: Hidden (no indicator shown)
 * - **Offline**: Shows "Offline" with cloud-off icon in amber
 * - **Reconnected**: Shows "Back online" with wifi icon in green (auto-dismisses)
 *
 * @module components/editor/OfflineIndicator
 * @see {@link useOnlineStatus} - Hook providing online/offline state
 * @see {@link StatusBar} - Parent component where this is rendered
 */

"use client";

import React, { useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import {
  useOnlineStatus,
  formatOfflineDuration,
} from "@/hooks/useOnlineStatus";
import {
  RECONNECT_AUTO_DISMISS,
  RECONNECT_SHOW_DURATION_THRESHOLD,
} from "@/lib/constants";

/**
 * Offline indicator for the status bar.
 *
 * Displays current connectivity status with appropriate visual feedback.
 * When offline, shows an amber indicator. When reconnecting after being
 * offline, briefly shows a green "Back online" message.
 *
 * @component
 * @example
 * ```tsx
 * function StatusBar() {
 *   return (
 *     <div className="flex items-center gap-4">
 *       <OfflineIndicator />
 *       {/* other status bar items *\/}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Offline indicator element or null if online
 */
export function OfflineIndicator(): React.ReactElement | null {
  const { isOnline, wasOffline, offlineDuration, clearWasOffline } =
    useOnlineStatus();

  // Auto-dismiss reconnection message
  useEffect(() => {
    if (wasOffline) {
      const timer = setTimeout(() => {
        clearWasOffline();
      }, RECONNECT_AUTO_DISMISS);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, clearWasOffline]);

  // Show reconnection message
  if (isOnline && wasOffline) {
    return (
      <div
        className="flex items-center gap-1.5 text-green-600 dark:text-green-400"
        role="status"
        aria-live="polite"
      >
        <Wifi className="h-3 w-3" aria-hidden="true" />
        <span>
          Back online
          {offlineDuration &&
            offlineDuration > RECONNECT_SHOW_DURATION_THRESHOLD && (
              <span className="ml-1 hidden text-zinc-500 sm:inline dark:text-zinc-400">
                (was offline {formatOfflineDuration(offlineDuration)})
              </span>
            )}
        </span>
      </div>
    );
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
        role="status"
        aria-live="polite"
      >
        <WifiOff className="h-3 w-3" aria-hidden="true" />
        <span>Offline</span>
      </div>
    );
  }

  // Online and not recently reconnected - show nothing
  return null;
}
