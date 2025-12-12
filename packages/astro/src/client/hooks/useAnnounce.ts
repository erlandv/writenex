/**
 * @fileoverview Announce hook for screen reader announcements
 *
 * This hook provides a way to announce messages to screen readers
 * using ARIA live regions. It supports both polite and assertive
 * politeness levels and handles rapid announcement queuing.
 *
 * ## Features:
 * - Polite and assertive announcement modes
 * - Message queuing for rapid announcements
 * - Automatic cleanup of old announcements
 * - Integration with global live region
 *
 * @module @writenex/astro/client/hooks/useAnnounce
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Politeness level for announcements
 * - polite: Waits for user to finish current task before announcing
 * - assertive: Interrupts current task to announce immediately
 */
export type AnnouncePoliteness = "polite" | "assertive";

/**
 * Announcement message structure
 */
export interface Announcement {
  /** Unique identifier for the announcement */
  id: string;
  /** Message to announce */
  message: string;
  /** Politeness level */
  politeness: AnnouncePoliteness;
  /** Timestamp when announcement was created */
  timestamp: number;
}

/**
 * Return value from useAnnounce hook
 */
export interface UseAnnounceReturn {
  /** Announce a message to screen readers */
  announce: (message: string, politeness?: AnnouncePoliteness) => void;
  /** Current announcement message (for live region) */
  currentMessage: string;
  /** Current politeness level */
  currentPoliteness: AnnouncePoliteness;
  /** Clear the current announcement */
  clear: () => void;
}

/** Maximum age for announcements in milliseconds (5 seconds) */
const MAX_ANNOUNCEMENT_AGE = 5000;

/** Delay between processing queued announcements */
const ANNOUNCEMENT_DELAY = 100;

/** Counter for generating unique announcement IDs */
let announcementIdCounter = 0;

/**
 * Generate a unique announcement ID
 */
function generateAnnouncementId(): string {
  return `announcement-${++announcementIdCounter}-${Date.now()}`;
}

/**
 * Hook for announcing messages to screen readers via live regions
 *
 * This hook manages a queue of announcements and processes them
 * sequentially to ensure screen readers can properly announce each
 * message. It automatically discards stale announcements.
 *
 * @returns Object containing announce function and current message state
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { announce } = useAnnounce();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveContent();
 *       announce("Content saved", "polite");
 *     } catch (error) {
 *       announce("Save failed", "assertive");
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useAnnounce(): UseAnnounceReturn {
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentPoliteness, setCurrentPoliteness] =
    useState<AnnouncePoliteness>("polite");

  const queueRef = useRef<Announcement[]>([]);
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Process the next announcement in the queue
   */
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    // Get the next announcement
    const announcement = queueRef.current.shift();

    if (!announcement) {
      isProcessingRef.current = false;
      return;
    }

    // Check if announcement is stale
    const age = Date.now() - announcement.timestamp;
    if (age > MAX_ANNOUNCEMENT_AGE) {
      // Skip stale announcement and process next
      isProcessingRef.current = false;
      processQueue();
      return;
    }

    // Clear current message first to ensure screen reader announces new message
    setCurrentMessage("");

    // Set the new message after a brief delay
    timeoutRef.current = setTimeout(() => {
      setCurrentMessage(announcement.message);
      setCurrentPoliteness(announcement.politeness);

      // Clear after announcement and process next
      timeoutRef.current = setTimeout(() => {
        setCurrentMessage("");
        isProcessingRef.current = false;
        processQueue();
      }, ANNOUNCEMENT_DELAY);
    }, ANNOUNCEMENT_DELAY);
  }, []);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback(
    (message: string, politeness: AnnouncePoliteness = "polite") => {
      if (!message.trim()) return;

      const announcement: Announcement = {
        id: generateAnnouncementId(),
        message: message.trim(),
        politeness,
        timestamp: Date.now(),
      };

      // Add to queue
      queueRef.current.push(announcement);

      // Start processing if not already
      processQueue();
    },
    [processQueue]
  );

  /**
   * Clear the current announcement
   */
  const clear = useCallback(() => {
    setCurrentMessage("");
    queueRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isProcessingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announce,
    currentMessage,
    currentPoliteness,
    clear,
  };
}
