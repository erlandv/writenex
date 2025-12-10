/**
 * @fileoverview API Context for Writenex client
 *
 * Provides a shared API client instance across all components using React Context.
 * This prevents unnecessary recreation of the API client on every hook call.
 *
 * @module @writenex/astro/client/context/ApiContext
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  type ReactElement,
} from "react";
import { createApiClient } from "../hooks/useApi";

/**
 * API client type inferred from createApiClient
 */
type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Context value containing the API client and base URL
 */
interface ApiContextValue {
  client: ApiClient;
  apiBase: string;
}

/**
 * API Context - holds the shared API client instance
 */
const ApiContext = createContext<ApiContextValue | null>(null);

/**
 * Props for ApiProvider
 */
interface ApiProviderProps {
  /** Base URL for API requests */
  apiBase: string;
  /** Child components */
  children: ReactNode;
}

/**
 * API Provider component
 *
 * Wraps the application and provides a shared API client instance
 * to all child components via context.
 *
 * @example
 * ```tsx
 * <ApiProvider apiBase="/_writenex/api">
 *   <App />
 * </ApiProvider>
 * ```
 */
export function ApiProvider({
  apiBase,
  children,
}: ApiProviderProps): ReactElement {
  // Memoize the API client to prevent recreation on re-renders
  const value = useMemo(
    () => ({
      client: createApiClient({ apiBase }),
      apiBase,
    }),
    [apiBase]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

/**
 * Hook to access the shared API client
 *
 * Must be used within an ApiProvider.
 *
 * @returns The API context value containing client and apiBase
 * @throws Error if used outside of ApiProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client } = useApiContext();
 *   // Use client.getCollections(), client.getContent(), etc.
 * }
 * ```
 */
export function useApiContext(): ApiContextValue {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApiContext must be used within an ApiProvider");
  }
  return context;
}

/**
 * Hook to access just the API client
 *
 * Convenience wrapper around useApiContext for simpler access to the client.
 *
 * @returns The shared API client instance
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const api = useSharedApi();
 *   const collections = await api.getCollections();
 * }
 * ```
 */
export function useSharedApi(): ApiClient {
  const { client } = useApiContext();
  return client;
}
