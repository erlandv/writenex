/**
 * @fileoverview Backup Reminder Hook
 *
 * This hook tracks when the user last exported/backed up their documents
 * and reminds them to do so periodically. This is especially important
 * for a PWA where all data is stored locally in the browser.
 *
 * ## Reminder Logic:
 * - Remind after 7 days since last export
 * - Only remind if user has documents with content
 * - Dismissable with 3-day snooze
 * - Tracks export date in IndexedDB settings
 *
 * @module hooks/useBackupReminder
 * @see {@link getSetting} - Retrieve settings from IndexedDB
 * @see {@link saveSetting} - Save settings to IndexedDB
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { getSetting, saveSetting, getAllDocuments } from "@/lib/db";

/** Settings key for last export timestamp */
const LAST_EXPORT_KEY = "lastExportDate";

/** Settings key for snooze timestamp */
const SNOOZE_UNTIL_KEY = "backupReminderSnoozeUntil";

/** Days before showing reminder after last export */
const REMINDER_DAYS = 7;

/** Days to snooze reminder when dismissed */
const SNOOZE_DAYS = 3;

/**
 * Backup reminder state returned by the hook
 */
export interface BackupReminderState {
  /** Whether the backup reminder should be shown */
  shouldRemind: boolean;
  /** Number of days since last export (null if never exported) */
  daysSinceExport: number | null;
  /** Whether we're still loading the state */
  isLoading: boolean;
  /** Dismiss the reminder (snooze for 3 days) */
  dismiss: () => Promise<void>;
  /** Record that user has exported (resets the timer) */
  recordExport: () => Promise<void>;
}

/**
 * Hook to manage backup reminder state.
 *
 * Checks if user should be reminded to export their documents based on:
 * - Time since last export (7+ days triggers reminder)
 * - Whether snooze is active
 * - Whether user has documents with content
 *
 * @returns BackupReminderState object
 *
 * @example
 * ```tsx
 * function BackupReminder() {
 *   const { shouldRemind, daysSinceExport, dismiss } = useBackupReminder();
 *
 *   if (!shouldRemind) return null;
 *
 *   return (
 *     <div>
 *       No backup in {daysSinceExport} days
 *       <button onClick={dismiss}>Remind me later</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBackupReminder(): BackupReminderState {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRemind, setShouldRemind] = useState(false);
  const [daysSinceExport, setDaysSinceExport] = useState<number | null>(null);

  // Check if reminder should be shown
  const checkReminder = useCallback(async () => {
    try {
      // Check snooze first
      const snoozeUntil = await getSetting(SNOOZE_UNTIL_KEY);
      if (snoozeUntil) {
        const snoozeDate = new Date(snoozeUntil);
        if (snoozeDate > new Date()) {
          setShouldRemind(false);
          setIsLoading(false);
          return;
        }
      }

      // Check if user has any documents with content
      const documents = await getAllDocuments();
      const hasContent = documents.some((doc) => doc.content.trim().length > 0);
      if (!hasContent) {
        setShouldRemind(false);
        setIsLoading(false);
        return;
      }

      // Check last export date
      const lastExport = await getSetting(LAST_EXPORT_KEY);
      if (!lastExport) {
        // Never exported - remind if user has documents
        setDaysSinceExport(null);
        setShouldRemind(true);
        setIsLoading(false);
        return;
      }

      const lastExportDate = new Date(lastExport);
      const now = new Date();
      const diffMs = now.getTime() - lastExportDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      setDaysSinceExport(diffDays);
      setShouldRemind(diffDays >= REMINDER_DAYS);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to check backup reminder:", error);
      setIsLoading(false);
    }
  }, []);

  // Initial check - use requestAnimationFrame to avoid sync setState in effect
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      checkReminder();
    });
    return () => cancelAnimationFrame(frameId);
  }, [checkReminder]);

  // Dismiss (snooze) the reminder
  const dismiss = useCallback(async () => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + SNOOZE_DAYS);
    await saveSetting(SNOOZE_UNTIL_KEY, snoozeDate.toISOString());
    setShouldRemind(false);
  }, []);

  // Record that user has exported
  const recordExport = useCallback(async () => {
    await saveSetting(LAST_EXPORT_KEY, new Date().toISOString());
    setDaysSinceExport(0);
    setShouldRemind(false);
  }, []);

  return {
    shouldRemind,
    daysSinceExport,
    isLoading,
    dismiss,
    recordExport,
  };
}
