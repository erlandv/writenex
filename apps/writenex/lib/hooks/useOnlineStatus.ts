/**
 * @fileoverview Online Status Hook
 *
 * This hook tracks the browser's online/offline status and provides
 * utilities for handling reconnection events. It's essential for PWA
 * functionality to give users feedback about their connectivity state.
 *
 * ## Features:
 * - Real-time online/offline detection
 * - Tracks when user was last offline
 * - Calculates offline duration on reconnection
 * - Persists offline start time to handle page refreshes
 *
 * ## Usage:
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, wasOffline, offlineDuration } = useOnlineStatus();
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />;
 *   }
 *
 *   if (wasOffline && offlineDuration > 60000) {
 *     return <ReconnectedMessage duration={offlineDuration} />;
 *   }
 * }
 * ```
 *
 * @module hooks/useOnlineStatus
 * @see {@link OfflineIndicator} - Component that uses this hook
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { LS_OFFLINE_START, OFFLINE_MIN_DURATION } from "@/lib/utils";

/**
 * Return type for the useOnlineStatus hook
 *
 * @interface OnlineStatusResult
 */
interface OnlineStatusResult {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether the user recently came back online after being offline */
  wasOffline: boolean;
  /** Duration in milliseconds of the last offline period (null if never offline) */
  offlineDuration: number | null;
  /** Clear the wasOffline flag (call after showing reconnection UI) */
  clearWasOffline: () => void;
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable duration string
 *
 * @example
 * ```ts
 * formatOfflineDuration(30000)     // "30 seconds"
 * formatOfflineDuration(120000)    // "2 minutes"
 * formatOfflineDuration(3600000)   // "1 hour"
 * formatOfflineDuration(86400000)  // "1 day"
 * ```
 */
export function formatOfflineDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? "1 day" : `${days} days`;
  }
  if (hours > 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  return seconds === 1 ? "1 second" : `${seconds} seconds`;
}

/**
 * Hook to track browser online/offline status.
 *
 * Monitors `navigator.onLine` and listens for online/offline events.
 * When the user goes offline, it records the start time in localStorage.
 * When coming back online, it calculates the offline duration.
 *
 * @returns Object containing online status and utilities
 *
 * @example
 * ```tsx
 * function StatusBar() {
 *   const { isOnline } = useOnlineStatus();
 *
 *   return (
 *     <div>
 *       {!isOnline && <span>You are offline</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnlineStatus(): OnlineStatusResult {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null);

  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
    setOfflineDuration(null);
  }, []);

  useEffect(() => {
    // Check for stored offline state on mount (handles page refresh while offline then coming back online)
    const checkStoredOfflineState = () => {
      const storedOfflineStart = localStorage.getItem(LS_OFFLINE_START);
      if (storedOfflineStart && navigator.onLine) {
        const duration = Date.now() - parseInt(storedOfflineStart, 10);
        if (duration > OFFLINE_MIN_DURATION) {
          setWasOffline(true);
          setOfflineDuration(duration);
        }
        localStorage.removeItem(LS_OFFLINE_START);
      }
    };

    // Use requestAnimationFrame to defer state updates after initial render
    const rafId = requestAnimationFrame(checkStoredOfflineState);

    const handleOnline = () => {
      setIsOnline(true);

      // Calculate offline duration
      const offlineStart = localStorage.getItem(LS_OFFLINE_START);
      if (offlineStart) {
        const duration = Date.now() - parseInt(offlineStart, 10);
        if (duration > OFFLINE_MIN_DURATION) {
          setWasOffline(true);
          setOfflineDuration(duration);
        }
        localStorage.removeItem(LS_OFFLINE_START);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
      setOfflineDuration(null);

      // Record when we went offline
      if (!localStorage.getItem(LS_OFFLINE_START)) {
        localStorage.setItem(LS_OFFLINE_START, Date.now().toString());
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    offlineDuration,
    clearWasOffline,
  };
}
