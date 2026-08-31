/**
 * @fileoverview Runtime entry point for the remote CMS in production
 *
 * This module powers the Astro routes injected by the integration during
 * production builds (`/_writenex` and `/_writenex/[...writenex]`). It:
 *
 * - Gates every request behind the remote CMS session cookie
 * - Bridges Astro's web-standard `Request`/`Response` to the existing
 *   Node.js-style API router (IncomingMessage/ServerResponse)
 * - Serves the editor UI, the login screen, and static editor assets
 *
 * The injected virtual route modules embed a `RemoteRuntimeConfig` at build
 * time; credentials and the signing secret are re-resolved from environment
 * variables at runtime so secrets can rotate without a rebuild.
 *
 * @module @writenex/astro/server/remote
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  ApiUnauthorizedError,
  isWritenexError,
  WritenexErrorCode,
  wrapError,
} from "@/core/errors";
import type { WritenexConfig } from "@/types";
import { generateEditorHtml, generateLoginHtml, serveAsset } from "./assets";
import { createSessionManager, type SessionManager } from "./auth";
import type { MiddlewareContext } from "./middleware";
import { createApiRouter } from "./routes";

/**
 * Configuration embedded into the injected route modules at build time
 */
export interface RemoteRuntimeConfig {
  /** Base path for Writenex routes (e.g. "/_writenex") */
  basePath: string;
  /** Project root directory */
  projectRoot: string;
  /** Astro trailingSlash setting for preview URLs */
  trailingSlash: "always" | "never" | "ignore";
  /** Resolved Writenex configuration */
  config: Required<WritenexConfig>;
}

/**
 * Environment variables re-read at runtime (override embedded values)
 */
const RUNTIME_ENV = {
  username: "WRITENEX_CMS_USER",
  password: "WRITENEX_CMS_PASS",
  secret: "WRITENEX_SECRET",
} as const;

/**
 * Maximum time to wait for a streaming handler to finish writing
 */
const STREAM_COMPLETION_TIMEOUT_MS = 30_000;

/**
 * Lazily-created session manager shared by all injected routes
 */
let sharedSession: SessionManager | null = null;

/**
 * Resolve the effective remote CMS settings at runtime
 *
 * Environment variables take precedence over values embedded at build time
 * so credentials can be rotated without rebuilding the site.
 */
function resolveRuntimeRemoteCms(config: Required<WritenexConfig>) {
  const embedded = config.remoteCms;
  return {
    enabled: embedded.enabled,
    username: process.env[RUNTIME_ENV.username] ?? embedded.username,
    password: process.env[RUNTIME_ENV.password] ?? embedded.password,
    secret: process.env[RUNTIME_ENV.secret] ?? embedded.secret,
    sessionTtl: embedded.sessionTtl,
  };
}

/**
 * Get (and cache) the session manager for this server process
 *
 * @returns null when the remote CMS is disabled or not fully configured
 */
function getSessionManager(
  config: Required<WritenexConfig>
): SessionManager | null {
  if (sharedSession) return sharedSession;

  const runtime = resolveRuntimeRemoteCms(config);

  if (!runtime.enabled || !runtime.username || !runtime.password) {
    return null;
  }

  sharedSession = createSessionManager(
    {
      ...runtime,
      username: runtime.username ?? "",
      password: runtime.password ?? "",
      secret: runtime.secret ?? "",
      sessionTtl: runtime.sessionTtl ?? 7 * 24 * 60 * 60,
    },
    runtime.secret || undefined
  );
  return sharedSession;
}

/**
 * Normalize a response chunk to a Buffer
 */
function toBuffer(chunk: unknown): Buffer {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (typeof chunk === "string") return Buffer.from(chunk, "utf8");
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);
  return Buffer.from(String(chunk), "utf8");
}

/**
 * Bridge a web-standard Request into the minimal IncomingMessage surface
 * used by the API router and asset server.
 */
function createNodeShims(request: Request, url: URL) {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const method = request.method.toUpperCase();
  const fullUrl = `${url.pathname}${url.search}`;

  const hasBody = method !== "GET" && method !== "HEAD";
  let bodyChunks: Buffer[] = [];
  let bodyPromise: Promise<void> | null = null;

  const ensureBody = (): Promise<void> => {
    if (!hasBody) return Promise.resolve();
    bodyPromise ??= request
      .arrayBuffer()
      .then((buffer) => {
        bodyChunks = [Buffer.from(buffer)];
      })
      .catch(() => {
        bodyChunks = [];
      });
    return bodyPromise;
  };

  const req = {
    method,
    url: fullUrl,
    headers,
    socket: {},
    on(event: string, listener: (arg?: unknown) => void) {
      if (event === "data") {
        void ensureBody().then(() => {
          for (const chunk of bodyChunks) listener(chunk);
        });
      } else if (event === "end") {
        void ensureBody().then(() => process.nextTick(listener));
      }
      // "error" and others are no-ops: the body is fully buffered up-front
    },
    [Symbol.asyncIterator]() {
      return (async function* () {
        await ensureBody();
        for (const chunk of bodyChunks) {
          yield chunk;
        }
      })();
    },
  } as unknown as IncomingMessage;

  const responseChunks: Buffer[] = [];
  const responseHeaders = new Map<string, string | string[]>();
  let finished = false;
  let resolveFinished: (() => void) | null = null;
  const finishedPromise = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const markFinished = () => {
    if (finished) return;
    finished = true;
    resolveFinished?.();
  };

  const res = {
    get headersSent() {
      return finished;
    },
    statusCode: 200,
    setHeader(name: string, value: string | number | string[]) {
      if (finished) return;
      const key = name.toLowerCase();
      if (key === "set-cookie") {
        const existing = responseHeaders.get(key);
        const incoming = Array.isArray(value) ? value : [String(value)];
        const merged = existing
          ? [...(Array.isArray(existing) ? existing : [existing]), ...incoming]
          : incoming;
        responseHeaders.set(key, merged);
        return;
      }
      responseHeaders.set(key, Array.isArray(value) ? value : String(value));
    },
    getHeader(name: string): string | number | string[] | undefined {
      return responseHeaders.get(name.toLowerCase());
    },
    removeHeader(name: string) {
      responseHeaders.delete(name.toLowerCase());
    },
    write(chunk: unknown) {
      if (!finished) {
        responseChunks.push(toBuffer(chunk));
      }
      return true;
    },
    end(chunk?: unknown) {
      if (finished) return;
      if (chunk != null) {
        responseChunks.push(toBuffer(chunk));
      }
      markFinished();
    },
    // Stream piping may attach event listeners; buffered responses make
    // these no-ops.
    on() {},
    once() {},
    emit() {
      return false;
    },
    removeListener() {},
  } as unknown as ServerResponse;

  const toResponse = async (): Promise<Response> => {
    // Drain the request body if a handler never consumed it
    await ensureBody();

    // Handlers that write via Node streams (e.g. image serving pipes a
    // file stream into the response) finish asynchronously. Wait until the
    // response is complete, with a safety timeout in case a stream errors
    // out without ending.
    const streamTimeout = new Promise<void>((resolve) => {
      setTimeout(resolve, STREAM_COMPLETION_TIMEOUT_MS).unref();
    });
    await Promise.race([finishedPromise, streamTimeout]);

    const body = Buffer.concat(responseChunks);
    const headers = new Headers();
    for (const [key, value] of responseHeaders) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else {
        headers.set(key, value);
      }
    }

    return new Response(body, {
      status: res.statusCode,
      headers,
    });
  };

  return {
    req: req as IncomingMessage,
    res: res as ServerResponse,
    toResponse,
  };
}

/**
 * Build a 401 JSON response for unauthenticated API calls
 */
function unauthorizedResponse(): Response {
  const error = new ApiUnauthorizedError();
  return new Response(JSON.stringify(error.toJSON()), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Build the login page response for unauthenticated page requests
 */
function loginResponse(basePath: string): Response {
  return new Response(generateLoginHtml(basePath), {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Handle a request to any Writenex route in production
 *
 * Called by the injected Astro route handlers. Performs the auth gate and
 * dispatches to the API router, asset server, or editor/login HTML.
 *
 * @param runtime - Configuration embedded at build time
 * @param request - The incoming Astro request
 * @returns The response to send to the client
 */
export async function handleRemoteRequest(
  runtime: RemoteRuntimeConfig,
  request: Request
): Promise<Response> {
  const { basePath, projectRoot, config, trailingSlash } = runtime;

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const path = url.pathname.startsWith(basePath)
    ? url.pathname.slice(basePath.length) || "/"
    : url.pathname;

  const session = getSessionManager(config);

  if (!session) {
    // The build fails closed when the remote CMS is not configured, so an
    // unconfigured runtime is a deployment error rather than an attack
    // surface. Still, never serve the writable editor unauthenticated.
    return new Response(
      "Writenex remote CMS is not configured. Set the credentials and rebuild.",
      { status: 503 }
    );
  }

  const isAuthRoute = path.startsWith("/api/auth/");
  if (
    !isAuthRoute &&
    !session.isAuthenticatedFromCookie(request.headers.get("cookie"))
  ) {
    if (path.startsWith("/api/")) {
      return unauthorizedResponse();
    }
    if (path.startsWith("/assets/")) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return loginResponse(basePath);
  }

  const context: MiddlewareContext = {
    basePath,
    projectRoot,
    config,
    trailingSlash,
    auth: session,
  };

  const { req, res, toResponse } = createNodeShims(request, url);

  try {
    if (path.startsWith("/api/")) {
      const router = createApiRouter(context);
      await router(req, res, path.slice(4));
      return await toResponse();
    }

    if (path.startsWith("/assets/")) {
      await serveAsset(req, res, path.slice(8), context);
      return await toResponse();
    }

    // Editor UI page (client-side routing handles sub-paths)
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(generateEditorHtml(basePath), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const writenexError = isWritenexError(error)
      ? error
      : wrapError(error, WritenexErrorCode.API_INTERNAL_ERROR);

    return new Response(JSON.stringify(writenexError.toJSON()), {
      status: writenexError.httpStatus,
      headers: { "Content-Type": "application/json" },
    });
  }
}
