/**
 * @fileoverview Authentication and session management for Writenex remote CMS
 *
 * This module provides:
 * - HMAC-signed stateless session tokens stored in an HttpOnly cookie
 * - Timing-safe credential comparison
 * - In-memory per-IP rate limiting for login attempts
 *
 * Sessions are stateless: no database or server-side store is required.
 * The token is `base64url(payload).base64url(hmac)` where the payload
 * contains the username, issued-at, and expiry timestamps.
 *
 * @module @writenex/astro/server/auth
 */

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ResolvedRemoteCmsConfig } from "@/types";

/**
 * Name of the session cookie
 */
export const SESSION_COOKIE_NAME = "wn_session";

/**
 * Session token payload
 */
interface SessionPayload {
  /** Authenticated username */
  sub: string;
  /** Issued at (unix seconds) */
  iat: number;
  /** Expires at (unix seconds) */
  exp: number;
}

/**
 * Login rate limiter settings
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

/**
 * Failed login attempt tracking
 */
interface FailedAttempt {
  count: number;
  resetAt: number;
}

/**
 * Compute the SHA-256 digest of a string.
 *
 * Digests are used instead of raw strings so that `timingSafeEqual` always
 * receives buffers of equal length (raw strings of different lengths would
 * throw).
 */
function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Timing-safe string comparison
 */
function safeEquals(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/**
 * Base64url encode a buffer or string
 */
function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Base64url decode a string
 */
function base64UrlDecode(input: string): Buffer {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

/**
 * Extract the client IP address from a request
 *
 * @security `X-Forwarded-For` is trusted unconditionally, which is correct
 * when the server sits behind a reverse proxy or load balancer that sets this
 * header. When Writenex is exposed directly to the internet (no proxy), a
 * client can spoof this header to bypass the login rate limiter. In that case
 * consider placing Writenex behind a reverse proxy (nginx, Caddy, etc.) that
 * strips or overrides the header before it reaches Node.
 */
function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * Determine whether the request was made over HTTPS
 */
function isSecureRequest(req: IncomingMessage): boolean {
  if ("encrypted" in req.socket && req.socket.encrypted === true) {
    return true;
  }
  return req.headers["x-forwarded-proto"] === "https";
}

/**
 * Session manager for the remote CMS
 *
 * Handles credential verification, token signing/verification,
 * cookie handling, and login rate limiting.
 */
export class SessionManager {
  private readonly username: string;
  private readonly password: string;
  private readonly secret: Buffer;
  private readonly sessionTtl: number;
  private readonly failedAttempts = new Map<string, FailedAttempt>();

  constructor(remoteCms: ResolvedRemoteCmsConfig, secret?: string) {
    this.username = remoteCms.username;
    this.password = remoteCms.password;
    this.sessionTtl = remoteCms.sessionTtl;

    const resolvedSecret = secret ?? remoteCms.secret;
    this.secret = resolvedSecret
      ? Buffer.from(resolvedSecret, "utf8")
      : randomBytes(32);
  }

  /**
   * Verify credentials using timing-safe comparison
   */
  verifyCredentials(username: string, password: string): boolean {
    if (!this.username || !this.password) return false;
    return (
      safeEquals(username, this.username) && safeEquals(password, this.password)
    );
  }

  /**
   * Create a signed session token for a username
   */
  createSessionToken(username: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
      sub: username,
      iat: now,
      exp: now + this.sessionTtl,
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = base64UrlEncode(
      createHmac("sha256", this.secret).update(encodedPayload).digest()
    );
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verify a session token
   *
   * @returns The authenticated username, or null if the token is invalid or expired
   */
  verifySessionToken(token: string): string | null {
    const separatorIndex = token.indexOf(".");
    if (separatorIndex === -1) return null;

    const encodedPayload = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);

    let payload: SessionPayload;
    try {
      payload = JSON.parse(
        base64UrlDecode(encodedPayload).toString("utf8")
      ) as SessionPayload;
    } catch {
      return null;
    }

    const expectedSignature = base64UrlEncode(
      createHmac("sha256", this.secret).update(encodedPayload).digest()
    );

    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length) return null;
    if (!timingSafeEqual(provided, expected)) return null;

    // Verify payload contents match what we signed
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.sub;
  }

  /**
   * Check whether a request carries a valid session cookie
   */
  isAuthenticated(req: IncomingMessage): boolean {
    const token = this.extractToken(req);
    return token !== null && this.verifySessionToken(token) !== null;
  }

  /**
   * Check whether a raw cookie header string contains a valid session
   *
   * Use this when you only have the cookie string (e.g. from a Web Fetch
   * API `Request`) to avoid casting a plain object to `IncomingMessage`.
   */
  isAuthenticatedFromCookie(cookieHeader: string | null | undefined): boolean {
    if (!cookieHeader) return false;
    const token = this.extractTokenFromCookieHeader(cookieHeader);
    return token !== null && this.verifySessionToken(token) !== null;
  }

  /**
   * Extract the session token from the request cookie header
   */
  extractToken(req: IncomingMessage): string | null {
    return this.extractTokenFromCookieHeader(req.headers.cookie ?? null);
  }

  /**
   * Extract the session token from a raw cookie header string
   */
  extractTokenFromCookieHeader(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    for (const pair of cookieHeader.split(";")) {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex === -1) continue;

      const name = pair.slice(0, separatorIndex).trim();
      if (name !== SESSION_COOKIE_NAME) continue;

      return pair.slice(separatorIndex + 1).trim();
    }

    return null;
  }

  /**
   * Build a Set-Cookie header value for the session
   */
  buildSessionCookie(token: string, req: IncomingMessage): string {
    const attributes = [
      `${SESSION_COOKIE_NAME}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${this.sessionTtl}`,
    ];
    if (isSecureRequest(req)) {
      attributes.push("Secure");
    }
    return attributes.join("; ");
  }

  /**
   * Build a Set-Cookie header value that clears the session
   */
  buildClearCookieHeader(): string {
    return [
      `${SESSION_COOKIE_NAME}=`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=0",
    ].join("; ");
  }

  /**
   * Apply the session cookie to a response
   */
  setSessionCookie(
    res: ServerResponse,
    token: string,
    req: IncomingMessage
  ): void {
    const previous = res.getHeader("Set-Cookie");
    const cookie = this.buildSessionCookie(token, req);
    res.setHeader(
      "Set-Cookie",
      previous
        ? [...(Array.isArray(previous) ? previous : [String(previous)]), cookie]
        : cookie
    );
  }

  /**
   * Clear the session cookie on a response
   */
  clearSessionCookie(res: ServerResponse): void {
    res.setHeader("Set-Cookie", this.buildClearCookieHeader());
  }

  /**
   * Check whether login attempts from this IP are allowed
   */
  isRateLimited(req: IncomingMessage): boolean {
    const ip = getClientIp(req);
    const attempt = this.failedAttempts.get(ip);
    if (!attempt) return false;

    if (Date.now() >= attempt.resetAt) {
      this.failedAttempts.delete(ip);
      return false;
    }

    return attempt.count >= RATE_LIMIT_MAX_ATTEMPTS;
  }

  /**
   * Record a failed login attempt for the client IP
   */
  recordFailedAttempt(req: IncomingMessage): void {
    const ip = getClientIp(req);
    const now = Date.now();
    const attempt = this.failedAttempts.get(ip);

    if (!attempt || now >= attempt.resetAt) {
      this.failedAttempts.set(ip, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
      return;
    }

    attempt.count += 1;
  }

  /**
   * Clear failed attempts for the client IP (after successful login)
   */
  resetFailedAttempts(req: IncomingMessage): void {
    this.failedAttempts.delete(getClientIp(req));
  }

  /**
   * Seconds remaining until the rate limit window resets (for Retry-After)
   */
  rateLimitRetryAfter(req: IncomingMessage): number {
    const attempt = this.failedAttempts.get(getClientIp(req));
    if (!attempt) return 0;
    return Math.max(1, Math.ceil((attempt.resetAt - Date.now()) / 1000));
  }
}

/**
 * Create a session manager from resolved remote CMS config
 *
 * @param remoteCms - Resolved remote CMS configuration
 * @param secret - Optional explicit signing secret; falls back to
 *   remoteCms.secret, then to a random per-process secret
 * @returns SessionManager instance (callers must ensure credentials exist)
 */
export function createSessionManager(
  remoteCms: ResolvedRemoteCmsConfig,
  secret?: string
): SessionManager {
  return new SessionManager(remoteCms, secret);
}
