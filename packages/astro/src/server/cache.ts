/**
 * @fileoverview Server-side caching for Writenex
 *
 * Provides in-memory caching for collection discovery and content summaries
 * to improve performance by avoiding repeated filesystem operations.
 *
 * ## Features:
 * - TTL-based cache expiration
 * - Per-collection content caching
 * - Image discovery caching
 * - Manual cache invalidation
 * - Integration with file watcher for automatic invalidation
 *
 * @module @writenex/astro/server/cache
 */

import type {
  DiscoveredCollection,
  ContentSummary,
  DiscoveredImage,
} from "@/types";

/**
 * Cache entry with timestamp and data
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Default TTL for cache entries (5 minutes)
 */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * Short TTL for development (30 seconds)
 * Used when file watcher is not active
 */
const DEV_TTL_MS = 30 * 1000;

/**
 * Server-side cache for collection and content data
 *
 * This cache stores:
 * - Collection discovery results (list of collections with metadata)
 * - Content summaries per collection (list of content items)
 * - Discovered images per content item
 *
 * Cache invalidation happens:
 * - Automatically when TTL expires
 * - Manually via invalidate methods
 * - Via file watcher integration
 */
export class ServerCache {
  /** Cache for collection discovery results */
  private collectionsCache: CacheEntry<DiscoveredCollection[]> | null = null;

  /** Cache for content summaries, keyed by collection name */
  private contentCache: Map<string, CacheEntry<ContentSummary[]>> = new Map();

  /** Cache for discovered images, keyed by "collection:contentId" */
  private imagesCache: Map<string, CacheEntry<DiscoveredImage[]>> = new Map();

  /** Time-to-live for cache entries in milliseconds */
  private ttl: number;

  /** Whether file watcher is integrated (allows longer TTL) */
  private hasWatcher: boolean = false;

  constructor(options: { ttl?: number; hasWatcher?: boolean } = {}) {
    this.ttl =
      options.ttl ?? (options.hasWatcher ? DEFAULT_TTL_MS : DEV_TTL_MS);
    this.hasWatcher = options.hasWatcher ?? false;
  }

  /**
   * Enable file watcher integration
   *
   * When watcher is enabled, cache can use longer TTL since
   * invalidation happens via watcher events.
   */
  enableWatcher(): void {
    this.hasWatcher = true;
    this.ttl = DEFAULT_TTL_MS;
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T> | null | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < this.ttl;
  }

  // ==================== Collections Cache ====================

  /**
   * Get cached collections if valid
   *
   * @returns Cached collections or null if expired/not cached
   */
  getCollections(): DiscoveredCollection[] | null {
    if (this.isValid(this.collectionsCache)) {
      return this.collectionsCache!.data;
    }
    return null;
  }

  /**
   * Set collections cache
   *
   * @param collections - Collections to cache
   */
  setCollections(collections: DiscoveredCollection[]): void {
    this.collectionsCache = {
      data: collections,
      timestamp: Date.now(),
    };
  }

  /**
   * Invalidate collections cache
   */
  invalidateCollections(): void {
    this.collectionsCache = null;
  }

  // ==================== Content Cache ====================

  /**
   * Get cached content summaries for a collection if valid
   *
   * @param collection - Collection name
   * @returns Cached content summaries or null if expired/not cached
   */
  getContent(collection: string): ContentSummary[] | null {
    const entry = this.contentCache.get(collection);
    if (this.isValid(entry)) {
      return entry!.data;
    }
    return null;
  }

  /**
   * Set content cache for a collection
   *
   * @param collection - Collection name
   * @param items - Content summaries to cache
   */
  setContent(collection: string, items: ContentSummary[]): void {
    this.contentCache.set(collection, {
      data: items,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate content cache for a specific collection
   *
   * @param collection - Collection name to invalidate
   */
  invalidateContent(collection: string): void {
    this.contentCache.delete(collection);
  }

  /**
   * Invalidate all content caches
   */
  invalidateAllContent(): void {
    this.contentCache.clear();
  }

  // ==================== Images Cache ====================

  /**
   * Generate cache key for image cache
   *
   * @param collection - Collection name
   * @param contentId - Content ID
   * @returns Cache key string
   */
  private getImagesCacheKey(collection: string, contentId: string): string {
    return `${collection}:${contentId}`;
  }

  /**
   * Get cached images for a content item if valid
   *
   * @param collection - Collection name
   * @param contentId - Content ID
   * @returns Cached images or null if expired/not cached
   */
  getImages(collection: string, contentId: string): DiscoveredImage[] | null {
    const key = this.getImagesCacheKey(collection, contentId);
    const entry = this.imagesCache.get(key);
    if (this.isValid(entry)) {
      return entry!.data;
    }
    return null;
  }

  /**
   * Set images cache for a content item
   *
   * @param collection - Collection name
   * @param contentId - Content ID
   * @param images - Discovered images to cache
   */
  setImages(
    collection: string,
    contentId: string,
    images: DiscoveredImage[]
  ): void {
    const key = this.getImagesCacheKey(collection, contentId);
    this.imagesCache.set(key, {
      data: images,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate image cache for a specific content item
   *
   * @param collection - Collection name
   * @param contentId - Content ID
   */
  invalidateImages(collection: string, contentId: string): void {
    const key = this.getImagesCacheKey(collection, contentId);
    this.imagesCache.delete(key);
  }

  /**
   * Invalidate all image caches for a collection
   *
   * @param collection - Collection name
   */
  invalidateCollectionImages(collection: string): void {
    const prefix = `${collection}:`;
    for (const key of this.imagesCache.keys()) {
      if (key.startsWith(prefix)) {
        this.imagesCache.delete(key);
      }
    }
  }

  /**
   * Invalidate all image caches
   */
  invalidateAllImages(): void {
    this.imagesCache.clear();
  }

  // ==================== Bulk Invalidation ====================

  /**
   * Invalidate all caches
   *
   * Called when a major change occurs that affects everything.
   */
  invalidateAll(): void {
    this.collectionsCache = null;
    this.contentCache.clear();
    this.imagesCache.clear();
  }

  /**
   * Handle file change event from watcher
   *
   * Intelligently invalidates only the affected caches.
   *
   * @param type - Type of file change (add, change, unlink)
   * @param collection - Collection that was affected
   * @param contentId - Optional content ID for targeted image cache invalidation
   */
  handleFileChange(
    type: "add" | "change" | "unlink",
    collection: string,
    contentId?: string
  ): void {
    // Always invalidate the affected collection's content cache
    this.invalidateContent(collection);

    // Invalidate image cache for the specific content item or entire collection
    if (contentId) {
      this.invalidateImages(collection, contentId);
    } else {
      this.invalidateCollectionImages(collection);
    }

    // For add/unlink, also invalidate collections cache (count changed)
    if (type === "add" || type === "unlink") {
      this.invalidateCollections();
    }
  }

  // ==================== Stats ====================

  /**
   * Get cache statistics for debugging
   *
   * @returns Object with cache stats
   */
  getStats(): {
    collectionsValid: boolean;
    contentCollections: string[];
    cachedImages: string[];
    ttl: number;
    hasWatcher: boolean;
  } {
    return {
      collectionsValid: this.isValid(this.collectionsCache),
      contentCollections: Array.from(this.contentCache.keys()).filter((key) =>
        this.isValid(this.contentCache.get(key))
      ),
      cachedImages: Array.from(this.imagesCache.keys()).filter((key) =>
        this.isValid(this.imagesCache.get(key))
      ),
      ttl: this.ttl,
      hasWatcher: this.hasWatcher,
    };
  }
}

/**
 * Global cache instance
 *
 * Shared across the server for consistent caching.
 */
let globalCache: ServerCache | null = null;

/**
 * Get or create the global cache instance
 *
 * @param options - Cache options (only used on first call)
 * @returns The global cache instance
 */
export function getCache(options?: {
  ttl?: number;
  hasWatcher?: boolean;
}): ServerCache {
  if (!globalCache) {
    globalCache = new ServerCache(options);
  }
  return globalCache;
}

/**
 * Reset the global cache instance
 *
 * Useful for testing or when configuration changes.
 */
export function resetCache(): void {
  globalCache = null;
}
