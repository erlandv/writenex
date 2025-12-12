/**
 * @fileoverview Version history hook for Writenex client
 *
 * Custom React hook for managing version history operations.
 * Provides methods for listing, creating, restoring, and deleting versions.
 *
 * @module @writenex/astro/client/hooks/useVersionHistory
 */

import { useState, useCallback, useMemo } from "react";
import type { VersionEntry, Version } from "../../types";

/**
 * Version history API client configuration
 */
interface VersionApiConfig {
  apiBase: string;
}

/**
 * Diff data returned from API
 */
export interface DiffData {
  version: Version;
  current: {
    content: string;
    frontmatter: Record<string, unknown>;
    body: string;
  };
}

/**
 * Create version history API client functions
 */
export function createVersionApiClient(config: VersionApiConfig) {
  const { apiBase } = config;

  return {
    /**
     * List all versions for a content item
     */
    async listVersions(
      collection: string,
      contentId: string
    ): Promise<VersionEntry[]> {
      const response = await fetch(
        `${apiBase}/versions/${collection}/${contentId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }
      const data = await response.json();
      return data.versions;
    },

    /**
     * Get a specific version with full content
     */
    async getVersion(
      collection: string,
      contentId: string,
      versionId: string
    ): Promise<Version> {
      const response = await fetch(
        `${apiBase}/versions/${collection}/${contentId}/${versionId}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Version not found");
        }
        throw new Error("Failed to fetch version");
      }
      const data = await response.json();
      return data.version;
    },

    /**
     * Create a manual version snapshot
     */
    async createVersion(
      collection: string,
      contentId: string,
      label?: string
    ): Promise<{ success: boolean; version?: VersionEntry; error?: string }> {
      const response = await fetch(
        `${apiBase}/versions/${collection}/${contentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        }
      );
      return response.json();
    },

    /**
     * Restore a version to current content
     */
    async restoreVersion(
      collection: string,
      contentId: string,
      versionId: string
    ): Promise<{
      success: boolean;
      content?: string;
      safetySnapshot?: VersionEntry;
      error?: string;
    }> {
      const response = await fetch(
        `${apiBase}/versions/${collection}/${contentId}/${versionId}/restore`,
        { method: "POST" }
      );
      return response.json();
    },

    /**
     * Get diff data between version and current content
     */
    async getDiff(
      collection: string,
      contentId: string,
      versionId: string
    ): Promise<DiffData> {
      const response = await fetch(
        `${apiBase}/versions/${collection}/${contentId}/${versionId}/diff`
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Version not found");
        }
        throw new Error("Failed to fetch diff data");
      }
      const data = await response.json();
      return { version: data.version, current: data.current };
    },

    /**
     * Delete a specific version
     */
    async deleteVersion(
      collection: string,
      contentId: string,
      versionId: string
    ): Promise<{ success: boolean; error?: string }> {
      const response = await fetch(
        `${apiBase}/versions/${collection}/${contentId}/${versionId}`,
        { method: "DELETE" }
      );
      return response.json();
    },

    /**
     * Clear all versions for a content item
     */
    async clearVersions(
      collection: string,
      contentId: string
    ): Promise<{ success: boolean; error?: string }> {
      const response = await fetch(
        `${apiBase}/versions/${collection}/${contentId}`,
        { method: "DELETE" }
      );
      return response.json();
    },
  };
}

/**
 * Hook state for version history
 */
export interface UseVersionHistoryState {
  /** List of versions */
  versions: VersionEntry[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Currently selected version for viewing */
  selectedVersion: Version | null;
  /** Loading state for selected version */
  loadingVersion: boolean;
}

/**
 * Hook actions for version history
 */
export interface UseVersionHistoryActions {
  /** Refresh the version list */
  refresh: () => Promise<void>;
  /** Get a specific version with full content */
  getVersion: (versionId: string) => Promise<Version | null>;
  /** Create a manual version snapshot */
  createVersion: (label?: string) => Promise<boolean>;
  /** Restore a version to current content */
  restoreVersion: (versionId: string) => Promise<string | null>;
  /** Delete a specific version */
  deleteVersion: (versionId: string) => Promise<boolean>;
  /** Clear all versions */
  clearVersions: () => Promise<boolean>;
  /** Get diff data between version and current */
  getDiff: (versionId: string) => Promise<DiffData | null>;
  /** Clear selected version */
  clearSelectedVersion: () => void;
}

/**
 * Hook for managing version history
 *
 * Provides state and actions for version history operations.
 *
 * @param apiBase - Base URL for API calls
 * @param collection - Collection name
 * @param contentId - Content ID (slug)
 * @returns State and actions for version history
 *
 * @example
 * ```tsx
 * const { versions, loading, refresh, restoreVersion } = useVersionHistory(
 *   apiBase,
 *   "blog",
 *   "my-post"
 * );
 * ```
 */
export function useVersionHistory(
  apiBase: string,
  collection: string | null,
  contentId: string | null
): UseVersionHistoryState & UseVersionHistoryActions {
  const client = useMemo(() => createVersionApiClient({ apiBase }), [apiBase]);

  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);

  /**
   * Refresh the version list
   */
  const refresh = useCallback(async () => {
    if (!collection || !contentId) {
      setVersions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await client.listVersions(collection, contentId);
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch versions");
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [client, collection, contentId]);

  /**
   * Get a specific version with full content
   */
  const getVersion = useCallback(
    async (versionId: string): Promise<Version | null> => {
      if (!collection || !contentId) return null;

      setLoadingVersion(true);
      setError(null);

      try {
        const version = await client.getVersion(
          collection,
          contentId,
          versionId
        );
        setSelectedVersion(version);
        return version;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch version"
        );
        return null;
      } finally {
        setLoadingVersion(false);
      }
    },
    [client, collection, contentId]
  );

  /**
   * Create a manual version snapshot
   */
  const createVersion = useCallback(
    async (label?: string): Promise<boolean> => {
      if (!collection || !contentId) return false;

      setError(null);

      try {
        const result = await client.createVersion(collection, contentId, label);
        if (result.success) {
          await refresh();
          return true;
        }
        setError(result.error ?? "Failed to create version");
        return false;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create version"
        );
        return false;
      }
    },
    [client, collection, contentId, refresh]
  );

  /**
   * Restore a version to current content
   */
  const restoreVersion = useCallback(
    async (versionId: string): Promise<string | null> => {
      if (!collection || !contentId) return null;

      setError(null);

      try {
        const result = await client.restoreVersion(
          collection,
          contentId,
          versionId
        );
        if (result.success && result.content) {
          await refresh();
          return result.content;
        }
        setError(result.error ?? "Failed to restore version");
        return null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to restore version"
        );
        return null;
      }
    },
    [client, collection, contentId, refresh]
  );

  /**
   * Delete a specific version
   */
  const deleteVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      if (!collection || !contentId) return false;

      setError(null);

      try {
        const result = await client.deleteVersion(
          collection,
          contentId,
          versionId
        );
        if (result.success) {
          await refresh();
          return true;
        }
        setError(result.error ?? "Failed to delete version");
        return false;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete version"
        );
        return false;
      }
    },
    [client, collection, contentId, refresh]
  );

  /**
   * Clear all versions
   */
  const clearVersions = useCallback(async (): Promise<boolean> => {
    if (!collection || !contentId) return false;

    setError(null);

    try {
      const result = await client.clearVersions(collection, contentId);
      if (result.success) {
        setVersions([]);
        return true;
      }
      setError(result.error ?? "Failed to clear versions");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear versions");
      return false;
    }
  }, [client, collection, contentId]);

  /**
   * Get diff data between version and current content
   */
  const getDiff = useCallback(
    async (versionId: string): Promise<DiffData | null> => {
      if (!collection || !contentId) return null;

      setError(null);

      try {
        return await client.getDiff(collection, contentId, versionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch diff");
        return null;
      }
    },
    [client, collection, contentId]
  );

  /**
   * Clear selected version
   */
  const clearSelectedVersion = useCallback(() => {
    setSelectedVersion(null);
  }, []);

  return {
    versions,
    loading,
    error,
    selectedVersion,
    loadingVersion,
    refresh,
    getVersion,
    createVersion,
    restoreVersion,
    deleteVersion,
    clearVersions,
    getDiff,
    clearSelectedVersion,
  };
}
