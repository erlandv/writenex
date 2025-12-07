/**
 * @fileoverview Application constants for the Writenex editor
 *
 * Centralized constants for configuration values used throughout the application.
 * These values control timing, limits, defaults, and feature behavior.
 *
 * ## Categories:
 * - Application metadata (name, description)
 * - Storage keys (localStorage, IndexedDB)
 * - Auto-save configuration
 * - Version history limits
 * - Document defaults
 * - UI configuration
 * - PWA constants
 *
 * @module lib/constants
 * @see {@link useAutoSave} - Auto-save implementation using these constants
 * @see {@link db} - Database using storage keys
 */

// =============================================================================
// APPLICATION CONSTANTS
// =============================================================================

/**
 * Application name displayed in UI and metadata.
 */
export const APP_NAME = "Writenex";

/**
 * Application description for metadata and about sections.
 */
export const APP_DESCRIPTION = "A modern, feature-rich Markdown editor";

/**
 * LocalStorage key for Zustand persist middleware.
 * Used for persisting editor UI state across sessions.
 */
export const STORAGE_KEY = "markdown-editor-storage";

/**
 * IndexedDB database name for document persistence.
 * @see {@link db} - Dexie database instance
 */
export const DB_NAME = "MarkdownEditorDB";

// =============================================================================
// AUTO-SAVE TIMING CONSTANTS
// =============================================================================

/**
 * Debounce delay for auto-save to document table in milliseconds.
 * Document content is saved after this delay of inactivity.
 *
 * @default 3000 (3 seconds)
 */
export const AUTO_SAVE_DEBOUNCE = 3000;

/**
 * Time in milliseconds user must be idle before checking for version snapshot.
 * Combined with VERSION_MIN_GAP to prevent excessive snapshots.
 *
 * @default 30000 (30 seconds)
 */
export const IDLE_THRESHOLD = 30000;

/**
 * Minimum gap between automatic version snapshots in milliseconds.
 * Prevents creating too many snapshots during active editing.
 *
 * @default 300000 (5 minutes)
 */
export const VERSION_MIN_GAP = 300000;

/**
 * Maximum number of version snapshots to keep per document.
 * Older versions are automatically deleted when this limit is exceeded.
 *
 * @default 50
 */
export const MAX_VERSIONS_PER_DOCUMENT = 50;

/**
 * Default title for new documents.
 */
export const DEFAULT_DOCUMENT_TITLE = "Untitled";

/**
 * Default content for new documents.
 * Empty string - onboarding is handled by Welcome Tour modal.
 */
export const DEFAULT_DOCUMENT_CONTENT = "";

/**
 * Placeholder text shown in the editor when document is empty.
 * Disappears as soon as user starts typing.
 */
export const EDITOR_PLACEHOLDER = "Start writing here...";

/**
 * Tooltip delay in milliseconds before showing.
 * @default 300
 */
export const TOOLTIP_DELAY = 300;

/**
 * Scroll amount in pixels for scroll buttons.
 * Used in document tabs horizontal scrolling.
 *
 * @default 200
 */
export const SCROLL_AMOUNT = 200;

/**
 * Average reading speed in words per minute.
 * Used for calculating estimated reading time.
 *
 * Uses slightly below the commonly cited 250 WPM to account for
 * technical content that may require more attention.
 *
 * @default 225
 */
export const WORDS_PER_MINUTE = 225;

// =============================================================================
// PWA CONSTANTS
// =============================================================================

/**
 * LocalStorage key for tracking offline session start time.
 * Used to calculate offline duration for reconnect messages.
 */
export const LS_OFFLINE_START = "writenex_offline_start";

/**
 * LocalStorage key for storage warning dismissal timestamp.
 * Prevents showing storage warning repeatedly.
 */
export const LS_STORAGE_WARNING_DISMISSED =
  "writenex_storage_warning_dismissed_at";

/**
 * Minimum offline duration in milliseconds to consider "was offline".
 * Shorter disconnections are ignored.
 *
 * @default 1000 (1 second)
 */
export const OFFLINE_MIN_DURATION = 1000;

/**
 * Threshold in milliseconds for showing duration in reconnect message.
 * Only shows "You were offline for X" if duration exceeds this.
 *
 * @default 60000 (1 minute)
 */
export const RECONNECT_SHOW_DURATION_THRESHOLD = 60000;

/**
 * Auto-dismiss delay for reconnect message in milliseconds.
 *
 * @default 3000 (3 seconds)
 */
export const RECONNECT_AUTO_DISMISS = 3000;
