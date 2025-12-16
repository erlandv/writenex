/**
 * @fileoverview API hooks for Writenex client
 *
 * Custom React hooks for interacting with the Writenex API.
 * These hooks use the shared API client from ApiContext when available,
 * falling back to creating a new client for standalone usage.
 *
 * @module @writenex/astro/client/hooks/useApi
 */

import { useState, useCallback, useMemo } from "react";

/**
 * Collection data from API
 */
export interface Collection {
  name: string;
  path: string;
  filePattern: string;
  count: number;
  schema?: Record<string, unknown>;
  previewUrl?: string;
}

/**
 * Content summary for listing
 */
export interface ContentSummary {
  id: string;
  path: string;
  title: string;
  pubDate?: string;
  draft?: boolean;
  excerpt?: string;
}

/**
 * Full content item
 */
export interface ContentItem {
  id: string;
  path: string;
  frontmatter: Record<string, unknown>;
  body: string;
  raw: string;
}

/**
 * API client configuration
 */
interface ApiConfig {
  apiBase: string;
}

/**
 * Image configuration from API
 */
export interface ImageConfig {
  strategy: "colocated" | "public" | "custom";
  publicPath?: string;
  storagePath?: string;
}

/**
 * Editor configuration from API
 */
export interface EditorConfig {
  autosave?: boolean;
  autosaveInterval?: number;
}

/**
 * Writenex configuration from API
 */
export interface WritenexClientConfig {
  images?: ImageConfig;
  editor?: EditorConfig;
  /** Astro's trailingSlash setting for preview URLs */
  trailingSlash?: "always" | "never" | "ignore";
}

/**
 * Config path response from API
 */
export interface ConfigPathResponse {
  configPath: string | null;
  projectRoot: string;
  hasConfigFile: boolean;
}

/**
 * Create API client functions
 */
export function createApiClient(config: ApiConfig) {
  const { apiBase } = config;

  // Extract basePath from apiBase (remove /api suffix)
  const basePath = apiBase.replace(/\/api$/, "");

  return {
    /** Base path for the Writenex editor (without /api) */
    basePath,
    /**
     * Fetch configuration
     */
    async getConfig(): Promise<WritenexClientConfig> {
      const response = await fetch(`${apiBase}/config`);
      if (!response.ok) {
        throw new Error("Failed to fetch config");
      }
      return response.json();
    },

    /**
     * Fetch config file path for opening in editor
     */
    async getConfigPath(): Promise<ConfigPathResponse> {
      const response = await fetch(`${apiBase}/config/path`);
      if (!response.ok) {
        throw new Error("Failed to fetch config path");
      }
      return response.json();
    },

    /**
     * Fetch all collections
     */
    async getCollections(): Promise<Collection[]> {
      const response = await fetch(`${apiBase}/collections`);
      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }
      const data = await response.json();
      return data.collections;
    },

    /**
     * Fetch content list for a collection
     */
    async getContentList(
      collection: string,
      options?: {
        includeDrafts?: boolean;
        sort?: string;
        order?: "asc" | "desc";
      }
    ): Promise<ContentSummary[]> {
      const params = new URLSearchParams();
      if (options?.includeDrafts) params.set("draft", "true");
      if (options?.sort) params.set("sort", options.sort);
      if (options?.order) params.set("order", options.order);

      const url = `${apiBase}/content/${collection}${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch content list");
      }
      const data = await response.json();
      return data.items;
    },

    /**
     * Fetch single content item
     */
    async getContent(collection: string, id: string): Promise<ContentItem> {
      const response = await fetch(`${apiBase}/content/${collection}/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }
      return response.json();
    },

    /**
     * Create new content
     */
    async createContent(
      collection: string,
      data: {
        frontmatter: Record<string, unknown>;
        body: string;
        slug?: string;
      }
    ): Promise<{
      success: boolean;
      id?: string;
      path?: string;
      error?: string;
    }> {
      const response = await fetch(`${apiBase}/content/${collection}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    /**
     * Update content
     */
    async updateContent(
      collection: string,
      id: string,
      data: { frontmatter?: Record<string, unknown>; body?: string }
    ): Promise<{ success: boolean; error?: string }> {
      const response = await fetch(`${apiBase}/content/${collection}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    /**
     * Delete content
     */
    async deleteContent(
      collection: string,
      id: string
    ): Promise<{ success: boolean; error?: string }> {
      const response = await fetch(`${apiBase}/content/${collection}/${id}`, {
        method: "DELETE",
      });
      return response.json();
    },

    /**
     * Upload image
     */
    async uploadImage(
      file: File,
      collection: string,
      contentId: string
    ): Promise<{
      success: boolean;
      path?: string;
      url?: string;
      error?: string;
    }> {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("collection", collection);
      formData.append("contentId", contentId);

      const response = await fetch(`${apiBase}/images`, {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
  };
}

/**
 * Hook for using the API client
 *
 * Creates a memoized API client instance that persists across re-renders.
 * For shared usage across the app, consider using ApiProvider and useSharedApi instead.
 */
export function useApi(apiBase: string) {
  const client = useMemo(() => createApiClient({ apiBase }), [apiBase]);
  return client;
}

/** API client type */
export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Hook for fetching collections
 *
 * @param apiBaseOrClient - Either an API base URL string or a pre-created API client
 */
export function useCollections(apiBaseOrClient: string | ApiClient) {
  const client = useMemo(() => {
    if (typeof apiBaseOrClient === "string") {
      return createApiClient({ apiBase: apiBaseOrClient });
    }
    return apiBaseOrClient;
  }, [apiBaseOrClient]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getCollections();
      setCollections(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch collections"
      );
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { collections, loading, error, refresh };
}

/**
 * Hook for fetching content list
 *
 * @param apiBaseOrClient - Either an API base URL string or a pre-created API client
 * @param collection - Collection name to fetch content from
 */
export function useContentList(
  apiBaseOrClient: string | ApiClient,
  collection: string | null
) {
  const client = useMemo(() => {
    if (typeof apiBaseOrClient === "string") {
      return createApiClient({ apiBase: apiBaseOrClient });
    }
    return apiBaseOrClient;
  }, [apiBaseOrClient]);
  const [items, setItems] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!collection) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await client.getContentList(collection, {
        includeDrafts: true,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch content");
    } finally {
      setLoading(false);
    }
  }, [client, collection]);

  return { items, loading, error, refresh };
}

/**
 * Hook for fetching configuration
 *
 * @param apiBaseOrClient - Either an API base URL string or a pre-created API client
 */
export function useConfig(apiBaseOrClient: string | ApiClient) {
  const client = useMemo(() => {
    if (typeof apiBaseOrClient === "string") {
      return createApiClient({ apiBase: apiBaseOrClient });
    }
    return apiBaseOrClient;
  }, [apiBaseOrClient]);
  const [config, setConfig] = useState<WritenexClientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getConfig();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { config, loading, error, refresh };
}
