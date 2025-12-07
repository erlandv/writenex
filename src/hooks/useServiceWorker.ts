/**
 * @fileoverview Service Worker Hook
 *
 * This hook manages the PWA service worker lifecycle, including registration,
 * update detection, and providing a way to apply updates. It's essential for
 * keeping the PWA up-to-date while giving users control over when to update.
 *
 * ## Features:
 * - Automatic service worker registration
 * - Update detection when new version is available
 * - User-controlled update application
 * - Graceful handling of SW not supported browsers
 *
 * ## Update Flow:
 * 1. User opens app with cached SW
 * 2. Browser checks for new SW in background
 * 3. New SW installs and enters "waiting" state
 * 4. Hook sets `updateAvailable: true`
 * 5. UI shows update prompt to user
 * 6. User clicks update -> `applyUpdate()` called
 * 7. New SW activates, page reloads
 *
 * @module hooks/useServiceWorker
 * @see {@link UpdatePrompt} - Component that uses this hook
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Return type for the useServiceWorker hook
 *
 * @interface ServiceWorkerResult
 */
interface ServiceWorkerResult {
  /** Whether the service worker is registered and active */
  isRegistered: boolean;
  /** Whether a new version of the app is available */
  updateAvailable: boolean;
  /** Apply the pending update (will reload the page) */
  applyUpdate: () => void;
  /** The current service worker registration */
  registration: ServiceWorkerRegistration | null;
}

/**
 * Hook to manage PWA service worker lifecycle.
 *
 * Handles registration, update detection, and provides a function to
 * apply pending updates. Uses the `skipWaiting` pattern for smooth updates.
 *
 * @returns Object containing SW status and update utilities
 *
 * @example
 * ```tsx
 * function UpdateBanner() {
 *   const { updateAvailable, applyUpdate } = useServiceWorker();
 *
 *   if (!updateAvailable) return null;
 *
 *   return (
 *     <div>
 *       <p>A new version is available!</p>
 *       <button onClick={applyUpdate}>Update now</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useServiceWorker(): ServiceWorkerResult {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  const applyUpdate = useCallback(() => {
    const waitingWorker = waitingWorkerRef.current;
    if (waitingWorker) {
      // Tell the waiting SW to skip waiting and become active
      waitingWorker.postMessage({ type: "SKIP_WAITING" });

      // Listen for the new SW to take control, then reload
      waitingWorker.addEventListener("statechange", () => {
        if (waitingWorker.state === "activated") {
          window.location.reload();
        }
      });
    }
  }, []);

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        // The SW is registered by next-pwa, we just need to get the registration
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);
        setIsRegistered(true);

        // Check if there's already a waiting worker
        if (reg.waiting) {
          waitingWorkerRef.current = reg.waiting;
          setUpdateAvailable(true);
        }

        // Listen for new service workers
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // When the new SW is installed but waiting to activate
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              waitingWorkerRef.current = newWorker;
              setUpdateAvailable(true);
            }
          });
        });

        // Listen for controller change (SW was activated)
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          // Reload to get the new version
          window.location.reload();
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    registerSW();
  }, []);

  return {
    isRegistered,
    updateAvailable,
    applyUpdate,
    registration,
  };
}
