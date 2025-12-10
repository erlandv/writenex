/**
 * @fileoverview File watcher for detecting external changes
 *
 * This module provides file watching capabilities to detect when
 * content files are modified outside of the Writenex editor
 * (e.g., in VS Code or another editor).
 *
 * @module @writenex/astro/filesystem/watcher
 */

import { watch, type FSWatcher } from "chokidar";
import { stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * File change event types
 */
export type FileChangeType = "add" | "change" | "unlink";

/**
 * File change event
 */
export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
  collection: string;
}

/**
 * Watcher options
 */
export interface WatcherOptions {
  /** Callback when a file changes */
  onChange?: (event: FileChangeEvent) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Patterns to ignore */
  ignored?: string[];
}

/**
 * Content file watcher
 *
 * Watches the src/content directory for changes and emits events
 * when files are added, modified, or deleted.
 */
export class ContentWatcher {
  private watcher: FSWatcher | null = null;
  private projectRoot: string;
  private contentDir: string;
  private options: WatcherOptions;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    projectRoot: string,
    contentDir: string = "src/content",
    options: WatcherOptions = {}
  ) {
    this.projectRoot = projectRoot;
    this.contentDir = contentDir;
    this.options = {
      debounceMs: 100,
      ignored: ["**/node_modules/**", "**/.git/**"],
      ...options,
    };
  }

  /**
   * Start watching for file changes
   */
  start(): void {
    if (this.watcher) {
      return; // Already watching
    }

    const watchPath = join(this.projectRoot, this.contentDir);

    this.watcher = watch(watchPath, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher
      .on("add", (path) => this.handleChange("add", path))
      .on("change", (path) => this.handleChange("change", path))
      .on("unlink", (path) => this.handleChange("unlink", path))
      .on("error", (error) => {
        console.error("[writenex] Watcher error:", error);
      });
  }

  /**
   * Stop watching for file changes
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Handle a file change event
   */
  private handleChange(type: FileChangeType, filePath: string): void {
    // Only handle markdown files
    if (!filePath.endsWith(".md") && !filePath.endsWith(".mdx")) {
      return;
    }

    // Debounce rapid changes
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.emitChange(type, filePath);
    }, this.options.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Emit a file change event
   */
  private emitChange(type: FileChangeType, filePath: string): void {
    if (!this.options.onChange) {
      return;
    }

    // Extract collection name from path
    const contentPath = join(this.projectRoot, this.contentDir);
    const relativePath = filePath
      .replace(contentPath, "")
      .replace(/^[/\\]/, "");
    const parts = relativePath.split(/[/\\]/);
    const collection = parts[0] ?? "";

    this.options.onChange({
      type,
      path: filePath,
      collection,
    });
  }

  /**
   * Check if the watcher is running
   */
  isWatching(): boolean {
    return this.watcher !== null;
  }
}

/**
 * Track file modification times for conflict detection
 */
export class FileModificationTracker {
  private mtimes: Map<string, number> = new Map();

  /**
   * Record the current modification time of a file
   */
  async track(filePath: string): Promise<void> {
    try {
      const stats = await stat(filePath);
      this.mtimes.set(filePath, stats.mtimeMs);
    } catch {
      // File might not exist yet
      this.mtimes.delete(filePath);
    }
  }

  /**
   * Check if a file has been modified externally
   */
  async hasExternalChanges(filePath: string): Promise<boolean> {
    const lastKnown = this.mtimes.get(filePath);
    if (lastKnown === undefined) {
      return false; // Not tracked, assume no changes
    }

    try {
      const stats = await stat(filePath);
      return stats.mtimeMs > lastKnown;
    } catch {
      return true; // File might have been deleted
    }
  }

  /**
   * Clear tracking for a file
   */
  untrack(filePath: string): void {
    this.mtimes.delete(filePath);
  }

  /**
   * Clear all tracking
   */
  clear(): void {
    this.mtimes.clear();
  }
}

/**
 * Create a content watcher instance
 */
export function createContentWatcher(
  projectRoot: string,
  options?: WatcherOptions
): ContentWatcher {
  return new ContentWatcher(projectRoot, "src/content", options);
}
