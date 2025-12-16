/**
 * @fileoverview Client entry point for Writenex editor
 *
 * This is the main entry point for the React-based editor UI.
 * It bootstraps the application and mounts it to the DOM.
 *
 * @module @writenex/astro/client
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { ApiProvider } from "./context/ApiContext";

/**
 * Configuration injected by the server
 */
declare global {
  interface Window {
    __WRITENEX_CONFIG__?: {
      basePath: string;
      apiBase: string;
    };
  }
}

/**
 * Get the configuration from the window object
 */
function getConfig() {
  return (
    window.__WRITENEX_CONFIG__ ?? {
      basePath: "/_writenex",
      apiBase: "/_writenex/api",
    }
  );
}

/**
 * Initialize and mount the application
 */
function mount() {
  const container = document.getElementById("root");

  if (!container) {
    console.error("[writenex] Root element not found");
    return;
  }

  const config = getConfig();
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <ThemeProvider>
        <ApiProvider apiBase={config.apiBase}>
          <App />
        </ApiProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

// Mount when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
