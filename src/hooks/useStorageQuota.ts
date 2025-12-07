/**
 * @fileoverview Storage Quota Hook
 *
 * This hook monitors the browser's storage quota usage using the Storage API.
 * It provides real-time feedback about how much storage the PWA is using,
 * which is important for users who store many documents locally.
 *
 * ## Features:
 * - Monitors storage usage and quota
 * - Calculates usage percentage
 * - Warns when storage is running low (configurable threshold)
 * - Periodically refreshes storage info
 *
 * ## Browser Support:
 * - Storage API is available in all modern browsers
 * - Falls back gracefully if not supported
 *
 * @module hooks/useStorageQuota
 * @see {@link StorageWarning} - Component that uses this hook
 */

"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Storage information returned by the hook
 *
 * @interface StorageInfo
 */
export interface StorageInfo {
  /** Storage used in bytes */
  used: number;
  /** Total storage quota in bytes */
  quota: number;
  /** Usage percentage (0-100) */
  percentage: number;
  /** Whether storage is running low (above threshold) */
  isLow: boolean;
  /** Whether the Storage API is supported */
  isSupported: boolean;
}

/** Default threshold percentage for low storage warning */
const DEFAULT_LOW_THRESHOLD = 80;

/** Refresh interval in milliseconds (1 minute) */
const REFRESH_INTERVAL = 60 * 1000;

/**
 * Formats bytes to human-readable string.
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with appropriate unit
 *
 * @example
 * ```ts
 * formatBytes(1024)           // "1.0 KB"
 * formatBytes(1048576)        // "1.0 MB"
 * formatBytes(1073741824)     // "1.0 GB"
 * formatBytes(500)            // "500 Bytes"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Hook to monitor browser storage quota.
 *
 * Uses the Storage API to track storage usage and provides warnings
 * when usage exceeds a configurable threshold.
 *
 * @param lowThreshold - Percentage threshold for low storage warning (default: 80)
 * @returns Storage information object or null if not yet loaded
 *
 * @example
 * ```tsx
 * function StorageDisplay() {
 *   const storage = useStorageQuota();
 *
 *   if (!storage) return <span>Loading...</span>;
 *   if (!storage.isSupported) return <span>Storage API not supported</span>;
 *
 *   return (
 *     <div>
 *       <p>Used: {formatBytes(storage.used)} / {formatBytes(storage.quota)}</p>
 *       <p>Usage: {storage.percentage.toFixed(1)}%</p>
 *       {storage.isLow && <p>Warning: Storage is running low!</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStorageQuota(
  lowThreshold: number = DEFAULT_LOW_THRESHOLD
): StorageInfo | null {
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const checkStorage = useCallback(async () => {
    // Check if Storage API is supported
    if (
      typeof navigator === "undefined" ||
      !("storage" in navigator) ||
      !("estimate" in navigator.storage)
    ) {
      setStorage({
        used: 0,
        quota: 0,
        percentage: 0,
        isLow: false,
        isSupported: false,
      });
      return;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      // Cap percentage at 100% to handle edge cases where used > quota
      const percentage = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;

      setStorage({
        used,
        quota,
        percentage,
        isLow: percentage > lowThreshold,
        isSupported: true,
      });
    } catch (error) {
      console.error("Failed to estimate storage:", error);
      setStorage({
        used: 0,
        quota: 0,
        percentage: 0,
        isLow: false,
        isSupported: false,
      });
    }
  }, [lowThreshold]);

  useEffect(() => {
    // Defer initial check to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      checkStorage();
    });

    // Periodic refresh
    const interval = setInterval(checkStorage, REFRESH_INTERVAL);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [checkStorage]);

  return storage;
}
