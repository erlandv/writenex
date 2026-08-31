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

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { MiddlewareContext } from "./middleware";

/**
 * Package name used to resolve the installed package root at runtime
 */
const PACKAGE_NAME = "@imjp/writenex-astro";

/**
 * Get the package root directory
 *
 * This function determines the package root so that bundled client assets
 * (dist/client) can be located at runtime. The code may run from:
 *
 * - The package's own dist (npm-installed standalone usage)
 * - A user project's server bundle (production remote CMS, where this
 *   module is bundled into the host's SSR output and `import.meta.url`
 *   points at the host's dist directory)
 *
 * Resolution order:
 * 1. Node resolution of the package specifier relative to the current file
 * 2. Heuristics based on `import.meta.url`
 * 3. Walking up from `process.cwd()` looking for the installed package
 */
function getPackageRoot(): string {
  // 1. Resolve the installed package from wherever this code is running.
  //    When bundled into a host project, node resolution walks up from the
  //    host's dist directory and finds the installed package.
  try {
    const entry = createRequire(import.meta.url).resolve(PACKAGE_NAME);
    // entry = <packageRoot>/dist/index.js
    return join(entry, "..", "..");
  } catch {
    // Fall through to heuristics
  }

  const currentDir = fileURLToPath(new URL(".", import.meta.url));

  // 2. Running from the package's own dist (bundled by tsup)
  if (
    (currentDir.endsWith("dist/") || currentDir.endsWith("dist\\")) &&
    existsSync(join(currentDir, "client"))
  ) {
    return join(currentDir, "..");
  }

  // 3. Walk up from the working directory looking for the package
  let dir = process.cwd();
  for (let i = 0; i < 20; i++) {
    const candidate = join(dir, "node_modules", PACKAGE_NAME);
    if (existsSync(join(candidate, "dist", "client"))) {
      return candidate;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback: assume we're in dist
  return join(currentDir, "..");
}

const PACKAGE_ROOT = getPackageRoot();

function isPathInside(parentPath: string, targetPath: string): boolean {
  const relativePath = relative(parentPath, targetPath);
  return !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

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
  const clientDistRoot = resolve(PACKAGE_ROOT, "dist", "client");
  const filePath = resolve(clientDistRoot, assetPath);

  if (!isPathInside(clientDistRoot, filePath)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain");
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) {
    console.error("[writenex] Asset not found:", filePath);
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Asset not found: ${assetPath}`);
    return;
  }

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
export function generateEditorHtml(basePath: string): string {
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
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
 * Serve the login page for the remote CMS
 *
 * A self-contained HTML page (no external assets) that posts credentials
 * to the auth API and redirects to the editor on success.
 *
 * @param res - The server response
 * @param basePath - Base path for Writenex routes
 * @param options - Optional message (e.g. previous failed attempt)
 */
export function serveLoginHtml(
  res: ServerResponse,
  basePath: string,
  options?: { error?: string }
): void {
  const html = generateLoginHtml(basePath, options?.error);

  res.statusCode = 401;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(html);
}

/**
 * Generate the login page HTML
 */
export function generateLoginHtml(basePath: string, error?: string): string {
  const errorHtml = error
    ? `<div class="wn-login-error" role="alert">${escapeHtml(error)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Writenex - Sign in</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0a0a0a;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .wn-login-card {
      width: 100%;
      max-width: 380px;
      background: #141414;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 2.5rem 2rem;
    }
    .wn-login-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .wn-login-brand svg { flex-shrink: 0; }
    .wn-login-brand h1 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .wn-login-sub {
      color: #71717a;
      font-size: 0.875rem;
      margin-bottom: 1.75rem;
    }
    .wn-login-field {
      margin-bottom: 1rem;
    }
    .wn-login-field label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #a1a1aa;
      margin-bottom: 0.375rem;
    }
    .wn-login-field input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #27272a;
      background: #0a0a0a;
      color: #fafafa;
      font-size: 0.9375rem;
      outline: none;
    }
    .wn-login-field input:focus {
      border-color: #335DFF;
      box-shadow: 0 0 0 3px rgba(51, 93, 255, 0.15);
    }
    .wn-login-error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #f87171;
      font-size: 0.8125rem;
      border-radius: 8px;
      padding: 0.625rem 0.75rem;
      margin-bottom: 1rem;
    }
    .wn-login-submit {
      width: 100%;
      padding: 0.6875rem;
      border: none;
      border-radius: 8px;
      background: #335DFF;
      color: #ffffff;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.25rem;
    }
    .wn-login-submit:hover:not(:disabled) { background: #2a4ddb; }
    .wn-login-submit:disabled { opacity: 0.6; cursor: wait; }
  </style>
</head>
<body>
  <main class="wn-login-card">
    <div class="wn-login-brand">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#335DFF" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20.18 4.22l3.7 0c0.05,0 0.08,0.02 0.1,0.06 0.03,0.03 0.03,0.08 0,0.12l-5.78 10.31c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.89 -3.28c-0.03,-0.04 -0.03,-0.08 -0.01,-0.12l3.98 -7.03c0.02,-0.04 0.06,-0.06 0.1,-0.06zm-6.13 6.34l3.24 5.65c0.03,0.04 0.03,0.09 0,0.12l-1.9 3.39c-0.02,0.04 -0.05,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-3.17 -5.68 -3.12 5.68c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.92 -3.38c-0.03,-0.04 -0.03,-0.09 0,-0.13l3.26 -5.66 -3.48 -6.15c-0.02,-0.04 -0.02,-0.09 0,-0.12 0.02,-0.04 0.06,-0.06 0.1,-0.06l3.74 0c0.05,0 0.08,0.02 0.11,0.06l1.51 2.7 1.53 -2.7c0.02,-0.04 0.06,-0.06 0.1,-0.06l3.84 0c0.04,0 0.08,0.02 0.1,0.06 0.02,0.03 0.02,0.08 0,0.12l-3.54 6.16zm-10.06 -6.28l3.99 7.01c0.02,0.04 0.02,0.08 0,0.12l-1.91 3.31c-0.03,0.04 -0.06,0.06 -0.11,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-5.84 -10.32c-0.03,-0.04 -0.03,-0.09 0,-0.12 0.02,-0.04 0.05,-0.06 0.1,-0.06l3.76 0c0.05,0 0.09,0.02 0.11,0.06z"/>
      </svg>
      <h1>Writenex</h1>
    </div>
    <p class="wn-login-sub">Sign in to manage your content.</p>
    ${errorHtml}
    <form id="wn-login-form">
      <div class="wn-login-field">
        <label for="wn-login-username">Username</label>
        <input id="wn-login-username" name="username" type="text" autocomplete="username" required autofocus>
      </div>
      <div class="wn-login-field">
        <label for="wn-login-password">Password</label>
        <input id="wn-login-password" name="password" type="password" autocomplete="current-password" required>
      </div>
      <button class="wn-login-submit" id="wn-login-submit" type="submit">Sign in</button>
    </form>
  </main>
  <script>
    (function () {
      var form = document.getElementById('wn-login-form');
      var button = document.getElementById('wn-login-submit');
      var card = document.querySelector('.wn-login-card');
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        button.disabled = true;
        button.textContent = 'Signing in...';
        var existing = card.querySelector('.wn-login-error');
        if (existing) existing.remove();
        fetch('${basePath}/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            username: document.getElementById('wn-login-username').value,
            password: document.getElementById('wn-login-password').value
          })
        }).then(function (response) {
          if (response.ok) {
            window.location.href = '${basePath}';
            return;
          }
          return response.json().then(function (data) {
            showError(data && data.error ? data.error : 'Sign in failed');
          });
        }).catch(function () {
          showError('Network error. Please try again.');
        });

        function showError(message) {
          var el = document.createElement('div');
          el.className = 'wn-login-error';
          el.setAttribute('role', 'alert');
          el.textContent = message;
          card.insertBefore(el, form);
          button.disabled = false;
          button.textContent = 'Sign in';
        }
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Escape a string for safe inclusion in HTML
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
