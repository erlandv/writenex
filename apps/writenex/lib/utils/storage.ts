/**
 * @fileoverview Storage Utilities
 *
 * This module provides utilities for managing browser storage in the PWA.
 * It includes functions for requesting persistent storage and checking
 * storage persistence status.
 *
 * ## Persistent Storage:
 * By default, browsers can evict data when storage runs low. Requesting
 * persistent storage asks the browser to keep our data even under pressure.
 *
 * ## Browser Heuristics for Granting Persistent Storage:
 * - Site is bookmarked
 * - Site has high engagement
 * - Site is added to home screen (PWA installed)
 * - Site has push notification permission
 *
 * @module lib/utils/storage
 * @see {@link useStorageQuota} - Hook for monitoring storage usage
 */

/**
 * Request persistent storage from the browser.
 *
 * Persistent storage prevents the browser from automatically evicting
 * the site's data when storage runs low. This is important for a writing
 * app where users store their documents locally.
 *
 * Note: The browser may grant or deny this request based on various
 * heuristics. The request is more likely to be granted if:
 * - The user has installed the PWA
 * - The site has high engagement
 * - The user has bookmarked the site
 *
 * @returns Promise resolving to true if persistent storage is granted
 *
 * @example
 * ```ts
 * // Call after user creates their first document
 * const isPersistent = await requestPersistentStorage();
 * if (isPersistent) {
 *   console.log("Storage will not be evicted");
 * } else {
 *   console.log("Storage may be evicted by browser");
 * }
 * ```
 */
export async function requestPersistentStorage(): Promise<boolean> {
  // Check if Storage API is supported
  if (
    typeof navigator === "undefined" ||
    !("storage" in navigator) ||
    !("persist" in navigator.storage)
  ) {
    console.warn("Persistent storage API not supported");
    return false;
  }

  try {
    // Check if already persisted
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      return true;
    }

    // Request persistent storage
    const granted = await navigator.storage.persist();
    if (granted) {
      console.log("Persistent storage granted");
    } else {
      console.log("Persistent storage denied - data may be evicted by browser");
    }
    return granted;
  } catch (error) {
    console.error("Failed to request persistent storage:", error);
    return false;
  }
}

/**
 * Check if storage is currently persistent.
 *
 * @returns Promise resolving to true if storage is persistent
 *
 * @example
 * ```ts
 * const isPersistent = await isStoragePersistent();
 * if (!isPersistent) {
 *   // Show warning to user about potential data loss
 * }
 * ```
 */
export async function isStoragePersistent(): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !("storage" in navigator) ||
    !("persisted" in navigator.storage)
  ) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error("Failed to check storage persistence:", error);
    return false;
  }
}

/**
 * Storage persistence status
 */
export type StoragePersistenceStatus =
  | "persistent"
  | "not-persistent"
  | "unsupported"
  | "unknown";

/**
 * Get detailed storage persistence status.
 *
 * @returns Promise resolving to persistence status
 *
 * @example
 * ```ts
 * const status = await getStoragePersistenceStatus();
 * switch (status) {
 *   case "persistent":
 *     // Data is safe
 *     break;
 *   case "not-persistent":
 *     // Warn user, offer to request persistence
 *     break;
 *   case "unsupported":
 *     // API not available
 *     break;
 * }
 * ```
 */
export async function getStoragePersistenceStatus(): Promise<StoragePersistenceStatus> {
  if (
    typeof navigator === "undefined" ||
    !("storage" in navigator) ||
    !("persisted" in navigator.storage)
  ) {
    return "unsupported";
  }

  try {
    const isPersisted = await navigator.storage.persisted();
    return isPersisted ? "persistent" : "not-persistent";
  } catch (error) {
    console.error("Failed to get storage persistence status:", error);
    return "unknown";
  }
}
