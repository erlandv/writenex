/**
 * @fileoverview Static asset serving for Writenex editor
 *
 * This module handles serving the editor UI HTML and static assets
 * (JavaScript, CSS) for the Writenex editor interface.
 *
 * ## Asset Strategy:
 * - In development: Serve from source with Vite transform
 * - In production: Serve pre-bundled assets from dist/client
 *
 * @module @writenex/astro/server/assets
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import type { MiddlewareContext } from "./middleware";

/**
 * Get the package root directory
 *
 * This function determines the package root based on where the code is running from.
 * When installed from npm, the structure is:
 *   node_modules/@writenex/astro/dist/index.js
 *
 * We need to find the package root to locate dist/client/ assets.
 */
function getPackageRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = fileURLToPath(new URL(".", import.meta.url));

  // When bundled, import.meta.url points to the dist/index.js file
  // We need to go up one level to get to package root
  if (currentFile.endsWith("dist/index.js") || currentDir.endsWith("dist/")) {
    return join(currentDir, "..");
  }

  // When running from source (development), we're in src/server/
  // Go up 2 levels to get to package root
  if (currentDir.includes("/src/")) {
    return join(currentDir, "..", "..");
  }

  // Fallback: assume we're in dist
  return join(currentDir, "..");
}

const PACKAGE_ROOT = getPackageRoot();

/**
 * MIME types for static assets
 */
const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/**
 * Serve the editor HTML page
 *
 * This generates the HTML shell that loads the React editor application.
 * The actual React components will be loaded via the bundled client assets.
 *
 * @param _req - The incoming request
 * @param res - The server response
 * @param context - Middleware context
 */
export async function serveEditorHtml(
  _req: IncomingMessage,
  res: ServerResponse,
  context: MiddlewareContext
): Promise<void> {
  const { basePath } = context;

  const html = generateEditorHtml(basePath);

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.end(html);
}

/**
 * Serve static assets (JS, CSS, etc.)
 *
 * @param _req - The incoming request
 * @param res - The server response
 * @param assetPath - Path to the asset (relative to assets directory)
 * @param _context - Middleware context
 */
export async function serveAsset(
  _req: IncomingMessage,
  res: ServerResponse,
  assetPath: string,
  _context: MiddlewareContext
): Promise<void> {
  // Determine asset location
  // Assets are always in dist/client (pre-bundled by tsup)
  const distPath = join(PACKAGE_ROOT, "dist", "client", assetPath);

  if (!existsSync(distPath)) {
    console.error("[writenex] Asset not found:", distPath);
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Asset not found: ${assetPath}`);
    return;
  }

  const filePath = distPath;

  try {
    const content = await readFile(filePath);
    const ext = extname(assetPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

    res.statusCode = 200;
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(content);
  } catch (error) {
    console.error(`[writenex] Failed to serve asset: ${assetPath}`, error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Failed to read asset");
  }
}

/**
 * Generate the editor HTML shell
 *
 * This creates the HTML page that bootstraps the React editor application.
 * It includes:
 * - Meta tags for viewport and charset
 * - CSS for the editor
 * - React mount point
 * - JavaScript bundle
 *
 * @param basePath - Base path for the editor
 * @returns HTML string
 */
function generateEditorHtml(basePath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Writenex - Content Editor</title>
  
  <!-- Editor styles -->
  <link rel="stylesheet" href="${basePath}/assets/index.css">
  <link rel="stylesheet" href="${basePath}/assets/styles.css">
  
  <style>
    /* Critical CSS for initial load */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body, #root {
      height: 100%;
      width: 100%;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0a0a0a;
      color: #fafafa;
    }
    
    /* Loading state */
    .writenex-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
    }
    
    .writenex-loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .writenex-loading-text {
      color: #71717a;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div id="root">
    <!-- Loading state shown while React loads -->
    <div class="writenex-loading">
      <div class="writenex-loading-spinner"></div>
      <div class="writenex-loading-text">Loading Writenex Editor...</div>
    </div>
  </div>
  
  <!-- Configuration for the client app -->
  <script>
    window.__WRITENEX_CONFIG__ = {
      basePath: "${basePath}",
      apiBase: "${basePath}/api",
    };
  </script>
  
  <!-- Editor application -->
  <script type="module" src="${basePath}/assets/index.js"></script>
</body>
</html>`;
}

/**
 * Get the path to bundled client assets
 *
 * @returns Path to the client dist directory
 */
export function getClientDistPath(): string {
  return join(PACKAGE_ROOT, "dist", "client");
}

/**
 * Check if client assets are bundled
 *
 * @returns True if bundled assets exist
 */
export function hasClientBundle(): boolean {
  const indexPath = join(getClientDistPath(), "index.js");
  return existsSync(indexPath);
}
