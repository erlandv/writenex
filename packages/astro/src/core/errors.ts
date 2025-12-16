/**
 * @fileoverview Custom error classes for @writenex/astro
 *
 * This module provides categorized error types for better error handling,
 * debugging, and user-facing error messages across the integration.
 *
 * ## Error Categories:
 * - Configuration errors (invalid config, missing files)
 * - Filesystem errors (read/write failures, permissions)
 * - Content errors (parsing, validation, not found)
 * - API errors (request handling, validation)
 * - Version history errors (manifest, storage)
 *
 * @module @writenex/astro/core/errors
 */

/**
 * Error codes for categorization and i18n support
 */
export enum WritenexErrorCode {
  // Configuration errors (1xx)
  CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
  CONFIG_INVALID = "CONFIG_INVALID",
  CONFIG_PARSE_ERROR = "CONFIG_PARSE_ERROR",

  // Filesystem errors (2xx)
  FS_READ_ERROR = "FS_READ_ERROR",
  FS_WRITE_ERROR = "FS_WRITE_ERROR",
  FS_DELETE_ERROR = "FS_DELETE_ERROR",
  FS_PERMISSION_DENIED = "FS_PERMISSION_DENIED",
  FS_PATH_NOT_FOUND = "FS_PATH_NOT_FOUND",
  FS_PATH_TRAVERSAL = "FS_PATH_TRAVERSAL",

  // Content errors (3xx)
  CONTENT_NOT_FOUND = "CONTENT_NOT_FOUND",
  CONTENT_PARSE_ERROR = "CONTENT_PARSE_ERROR",
  CONTENT_VALIDATION_ERROR = "CONTENT_VALIDATION_ERROR",
  CONTENT_ALREADY_EXISTS = "CONTENT_ALREADY_EXISTS",
  CONTENT_INVALID_SLUG = "CONTENT_INVALID_SLUG",
  CONTENT_CONFLICT = "CONTENT_CONFLICT",

  // Collection errors (4xx)
  COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
  COLLECTION_EMPTY = "COLLECTION_EMPTY",
  COLLECTION_DISCOVERY_ERROR = "COLLECTION_DISCOVERY_ERROR",

  // API errors (5xx)
  API_BAD_REQUEST = "API_BAD_REQUEST",
  API_METHOD_NOT_ALLOWED = "API_METHOD_NOT_ALLOWED",
  API_INTERNAL_ERROR = "API_INTERNAL_ERROR",
  API_TIMEOUT = "API_TIMEOUT",

  // Image errors (6xx)
  IMAGE_INVALID_TYPE = "IMAGE_INVALID_TYPE",
  IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE",
  IMAGE_UPLOAD_ERROR = "IMAGE_UPLOAD_ERROR",
  IMAGE_NOT_FOUND = "IMAGE_NOT_FOUND",

  // Version history errors (7xx)
  VERSION_NOT_FOUND = "VERSION_NOT_FOUND",
  VERSION_MANIFEST_CORRUPT = "VERSION_MANIFEST_CORRUPT",
  VERSION_LOCK_TIMEOUT = "VERSION_LOCK_TIMEOUT",
  VERSION_SAVE_ERROR = "VERSION_SAVE_ERROR",
  VERSION_RESTORE_ERROR = "VERSION_RESTORE_ERROR",

  // Pattern errors (8xx)
  PATTERN_INVALID = "PATTERN_INVALID",
  PATTERN_MISSING_TOKEN = "PATTERN_MISSING_TOKEN",

  // Unknown
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * HTTP status codes mapped to error categories
 */
export const ERROR_HTTP_STATUS: Record<WritenexErrorCode, number> = {
  // Configuration errors - 500 (server misconfiguration)
  [WritenexErrorCode.CONFIG_NOT_FOUND]: 500,
  [WritenexErrorCode.CONFIG_INVALID]: 500,
  [WritenexErrorCode.CONFIG_PARSE_ERROR]: 500,

  // Filesystem errors
  [WritenexErrorCode.FS_READ_ERROR]: 500,
  [WritenexErrorCode.FS_WRITE_ERROR]: 500,
  [WritenexErrorCode.FS_DELETE_ERROR]: 500,
  [WritenexErrorCode.FS_PERMISSION_DENIED]: 403,
  [WritenexErrorCode.FS_PATH_NOT_FOUND]: 404,
  [WritenexErrorCode.FS_PATH_TRAVERSAL]: 400,

  // Content errors
  [WritenexErrorCode.CONTENT_NOT_FOUND]: 404,
  [WritenexErrorCode.CONTENT_PARSE_ERROR]: 500,
  [WritenexErrorCode.CONTENT_VALIDATION_ERROR]: 400,
  [WritenexErrorCode.CONTENT_ALREADY_EXISTS]: 409,
  [WritenexErrorCode.CONTENT_INVALID_SLUG]: 400,
  [WritenexErrorCode.CONTENT_CONFLICT]: 409,

  // Collection errors
  [WritenexErrorCode.COLLECTION_NOT_FOUND]: 404,
  [WritenexErrorCode.COLLECTION_EMPTY]: 404,
  [WritenexErrorCode.COLLECTION_DISCOVERY_ERROR]: 500,

  // API errors
  [WritenexErrorCode.API_BAD_REQUEST]: 400,
  [WritenexErrorCode.API_METHOD_NOT_ALLOWED]: 405,
  [WritenexErrorCode.API_INTERNAL_ERROR]: 500,
  [WritenexErrorCode.API_TIMEOUT]: 504,

  // Image errors
  [WritenexErrorCode.IMAGE_INVALID_TYPE]: 400,
  [WritenexErrorCode.IMAGE_TOO_LARGE]: 413,
  [WritenexErrorCode.IMAGE_UPLOAD_ERROR]: 500,
  [WritenexErrorCode.IMAGE_NOT_FOUND]: 404,

  // Version history errors
  [WritenexErrorCode.VERSION_NOT_FOUND]: 404,
  [WritenexErrorCode.VERSION_MANIFEST_CORRUPT]: 500,
  [WritenexErrorCode.VERSION_LOCK_TIMEOUT]: 503,
  [WritenexErrorCode.VERSION_SAVE_ERROR]: 500,
  [WritenexErrorCode.VERSION_RESTORE_ERROR]: 500,

  // Pattern errors
  [WritenexErrorCode.PATTERN_INVALID]: 400,
  [WritenexErrorCode.PATTERN_MISSING_TOKEN]: 400,

  // Unknown
  [WritenexErrorCode.UNKNOWN_ERROR]: 500,
};

/**
 * Base error class for all Writenex errors
 *
 * Provides structured error information including error code,
 * HTTP status, and optional context data for debugging.
 */
export class WritenexError extends Error {
  /** Error code for categorization */
  readonly code: WritenexErrorCode;

  /** HTTP status code for API responses */
  readonly httpStatus: number;

  /** Additional context data for debugging */
  readonly context?: Record<string, unknown>;

  /** Original error if this wraps another error */
  readonly cause?: Error;

  constructor(
    code: WritenexErrorCode,
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = "WritenexError";
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code];
    this.context = options?.context;
    this.cause = options?.cause;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WritenexError);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: this.message,
      code: this.code,
      ...(this.context ? { context: this.context } : {}),
    };
  }

  /**
   * Create a user-friendly error message
   */
  toUserMessage(): string {
    return this.message;
  }
}

// =============================================================================
// Configuration Errors
// =============================================================================

/**
 * Error thrown when configuration file is not found
 */
export class ConfigNotFoundError extends WritenexError {
  constructor(searchPaths: string[]) {
    super(
      WritenexErrorCode.CONFIG_NOT_FOUND,
      `Configuration file not found. Searched: ${searchPaths.join(", ")}`,
      { context: { searchPaths } }
    );
    this.name = "ConfigNotFoundError";
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigInvalidError extends WritenexError {
  constructor(errors: string[], configPath?: string) {
    super(
      WritenexErrorCode.CONFIG_INVALID,
      `Invalid configuration: ${errors.join("; ")}`,
      { context: { errors, configPath } }
    );
    this.name = "ConfigInvalidError";
  }
}

/**
 * Error thrown when configuration file cannot be parsed
 */
export class ConfigParseError extends WritenexError {
  constructor(configPath: string, cause?: Error) {
    super(
      WritenexErrorCode.CONFIG_PARSE_ERROR,
      `Failed to parse configuration file: ${configPath}`,
      { context: { configPath }, cause }
    );
    this.name = "ConfigParseError";
  }
}

// =============================================================================
// Filesystem Errors
// =============================================================================

/**
 * Error thrown when file read operation fails
 */
export class FileReadError extends WritenexError {
  constructor(filePath: string, cause?: Error) {
    super(WritenexErrorCode.FS_READ_ERROR, `Failed to read file: ${filePath}`, {
      context: { filePath },
      cause,
    });
    this.name = "FileReadError";
  }
}

/**
 * Error thrown when file write operation fails
 */
export class FileWriteError extends WritenexError {
  constructor(filePath: string, cause?: Error) {
    super(
      WritenexErrorCode.FS_WRITE_ERROR,
      `Failed to write file: ${filePath}`,
      { context: { filePath }, cause }
    );
    this.name = "FileWriteError";
  }
}

/**
 * Error thrown when file delete operation fails
 */
export class FileDeleteError extends WritenexError {
  constructor(filePath: string, cause?: Error) {
    super(
      WritenexErrorCode.FS_DELETE_ERROR,
      `Failed to delete file: ${filePath}`,
      { context: { filePath }, cause }
    );
    this.name = "FileDeleteError";
  }
}

/**
 * Error thrown when path is not found
 */
export class PathNotFoundError extends WritenexError {
  constructor(path: string, type: "file" | "directory" = "file") {
    super(
      WritenexErrorCode.FS_PATH_NOT_FOUND,
      `${type === "directory" ? "Directory" : "File"} not found: ${path}`,
      { context: { path, type } }
    );
    this.name = "PathNotFoundError";
  }
}

/**
 * Error thrown when path traversal attack is detected
 */
export class PathTraversalError extends WritenexError {
  constructor(requestedPath: string, basePath: string) {
    super(
      WritenexErrorCode.FS_PATH_TRAVERSAL,
      "Invalid path: attempted path traversal detected",
      { context: { requestedPath, basePath } }
    );
    this.name = "PathTraversalError";
  }
}

// =============================================================================
// Content Errors
// =============================================================================

/**
 * Error thrown when content item is not found
 */
export class ContentNotFoundError extends WritenexError {
  constructor(collection: string, contentId: string) {
    super(
      WritenexErrorCode.CONTENT_NOT_FOUND,
      `Content '${contentId}' not found in collection '${collection}'`,
      { context: { collection, contentId } }
    );
    this.name = "ContentNotFoundError";
  }
}

/**
 * Error thrown when content parsing fails
 */
export class ContentParseError extends WritenexError {
  constructor(filePath: string, cause?: Error) {
    super(
      WritenexErrorCode.CONTENT_PARSE_ERROR,
      `Failed to parse content file: ${filePath}`,
      { context: { filePath }, cause }
    );
    this.name = "ContentParseError";
  }
}

/**
 * Error thrown when content validation fails
 */
export class ContentValidationError extends WritenexError {
  constructor(errors: string[], contentId?: string) {
    super(
      WritenexErrorCode.CONTENT_VALIDATION_ERROR,
      `Content validation failed: ${errors.join("; ")}`,
      { context: { errors, contentId } }
    );
    this.name = "ContentValidationError";
  }
}

/**
 * Error thrown when content already exists
 */
export class ContentAlreadyExistsError extends WritenexError {
  constructor(collection: string, slug: string) {
    super(
      WritenexErrorCode.CONTENT_ALREADY_EXISTS,
      `Content with slug '${slug}' already exists in collection '${collection}'`,
      { context: { collection, slug } }
    );
    this.name = "ContentAlreadyExistsError";
  }
}

/**
 * Error thrown when content was modified externally (conflict detection)
 *
 * This error includes both the server version and the client's expected mtime
 * to help resolve the conflict.
 */
export class ContentConflictError extends WritenexError {
  /** Current content on disk */
  readonly serverContent: string;
  /** Server's current mtime */
  readonly serverMtime: number;
  /** Client's expected mtime */
  readonly clientMtime: number;

  constructor(
    collection: string,
    contentId: string,
    serverContent: string,
    serverMtime: number,
    clientMtime: number
  ) {
    super(
      WritenexErrorCode.CONTENT_CONFLICT,
      `Content '${contentId}' in '${collection}' was modified externally. ` +
        `Expected mtime: ${clientMtime}, actual: ${serverMtime}`,
      {
        context: {
          collection,
          contentId,
          serverMtime,
          clientMtime,
          timeDiff: serverMtime - clientMtime,
        },
      }
    );
    this.name = "ContentConflictError";
    this.serverContent = serverContent;
    this.serverMtime = serverMtime;
    this.clientMtime = clientMtime;
  }

  /**
   * Override toJSON to include conflict-specific data
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      serverContent: this.serverContent,
      serverMtime: this.serverMtime,
      clientMtime: this.clientMtime,
    };
  }
}

// =============================================================================
// Collection Errors
// =============================================================================

/**
 * Error thrown when collection is not found
 */
export class CollectionNotFoundError extends WritenexError {
  constructor(collectionName: string) {
    super(
      WritenexErrorCode.COLLECTION_NOT_FOUND,
      `Collection '${collectionName}' not found`,
      { context: { collectionName } }
    );
    this.name = "CollectionNotFoundError";
  }
}

/**
 * Error thrown when collection discovery fails
 */
export class CollectionDiscoveryError extends WritenexError {
  constructor(contentPath: string, cause?: Error) {
    super(
      WritenexErrorCode.COLLECTION_DISCOVERY_ERROR,
      `Failed to discover collections in: ${contentPath}`,
      { context: { contentPath }, cause }
    );
    this.name = "CollectionDiscoveryError";
  }
}

// =============================================================================
// API Errors
// =============================================================================

/**
 * Error thrown for bad API requests
 */
export class ApiBadRequestError extends WritenexError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(WritenexErrorCode.API_BAD_REQUEST, message, { context: details });
    this.name = "ApiBadRequestError";
  }
}

/**
 * Error thrown when HTTP method is not allowed
 */
export class ApiMethodNotAllowedError extends WritenexError {
  constructor(method: string, allowedMethods: string[]) {
    super(
      WritenexErrorCode.API_METHOD_NOT_ALLOWED,
      `Method ${method} not allowed. Allowed: ${allowedMethods.join(", ")}`,
      { context: { method, allowedMethods } }
    );
    this.name = "ApiMethodNotAllowedError";
  }
}

/**
 * Error thrown for API timeout
 */
export class ApiTimeoutError extends WritenexError {
  constructor(operation: string, timeoutMs: number) {
    super(
      WritenexErrorCode.API_TIMEOUT,
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      { context: { operation, timeoutMs } }
    );
    this.name = "ApiTimeoutError";
  }
}

// =============================================================================
// Image Errors
// =============================================================================

/**
 * Error thrown when image type is invalid
 */
export class ImageInvalidTypeError extends WritenexError {
  constructor(filename: string, supportedTypes: string[]) {
    super(
      WritenexErrorCode.IMAGE_INVALID_TYPE,
      `Invalid image type for '${filename}'. Supported: ${supportedTypes.join(", ")}`,
      { context: { filename, supportedTypes } }
    );
    this.name = "ImageInvalidTypeError";
  }
}

/**
 * Error thrown when image is too large
 */
export class ImageTooLargeError extends WritenexError {
  constructor(filename: string, size: number, maxSize: number) {
    super(
      WritenexErrorCode.IMAGE_TOO_LARGE,
      `Image '${filename}' is too large (${formatBytes(size)}). Maximum: ${formatBytes(maxSize)}`,
      { context: { filename, size, maxSize } }
    );
    this.name = "ImageTooLargeError";
  }
}

/**
 * Error thrown when image upload fails
 */
export class ImageUploadError extends WritenexError {
  constructor(filename: string, cause?: Error) {
    super(
      WritenexErrorCode.IMAGE_UPLOAD_ERROR,
      `Failed to upload image: ${filename}`,
      { context: { filename }, cause }
    );
    this.name = "ImageUploadError";
  }
}

/**
 * Error thrown when image is not found
 */
export class ImageNotFoundError extends WritenexError {
  constructor(imagePath: string) {
    super(WritenexErrorCode.IMAGE_NOT_FOUND, `Image not found: ${imagePath}`, {
      context: { imagePath },
    });
    this.name = "ImageNotFoundError";
  }
}

// =============================================================================
// Version History Errors
// =============================================================================

/**
 * Error thrown when version is not found
 */
export class VersionNotFoundError extends WritenexError {
  constructor(collection: string, contentId: string, versionId: string) {
    super(
      WritenexErrorCode.VERSION_NOT_FOUND,
      `Version '${versionId}' not found for content '${contentId}' in '${collection}'`,
      { context: { collection, contentId, versionId } }
    );
    this.name = "VersionNotFoundError";
  }
}

/**
 * Error thrown when version manifest is corrupt
 */
export class VersionManifestCorruptError extends WritenexError {
  constructor(manifestPath: string, cause?: Error) {
    super(
      WritenexErrorCode.VERSION_MANIFEST_CORRUPT,
      `Version manifest is corrupt: ${manifestPath}`,
      { context: { manifestPath }, cause }
    );
    this.name = "VersionManifestCorruptError";
  }
}

/**
 * Error thrown when version lock times out
 */
export class VersionLockTimeoutError extends WritenexError {
  constructor(storagePath: string, timeoutMs: number) {
    super(
      WritenexErrorCode.VERSION_LOCK_TIMEOUT,
      `Timeout waiting for version lock on ${storagePath} after ${timeoutMs}ms`,
      { context: { storagePath, timeoutMs } }
    );
    this.name = "VersionLockTimeoutError";
  }
}

/**
 * Error thrown when version save fails
 */
export class VersionSaveError extends WritenexError {
  constructor(collection: string, contentId: string, cause?: Error) {
    super(
      WritenexErrorCode.VERSION_SAVE_ERROR,
      `Failed to save version for '${contentId}' in '${collection}'`,
      { context: { collection, contentId }, cause }
    );
    this.name = "VersionSaveError";
  }
}

/**
 * Error thrown when version restore fails
 */
export class VersionRestoreError extends WritenexError {
  constructor(
    collection: string,
    contentId: string,
    versionId: string,
    cause?: Error
  ) {
    super(
      WritenexErrorCode.VERSION_RESTORE_ERROR,
      `Failed to restore version '${versionId}' for '${contentId}' in '${collection}'`,
      { context: { collection, contentId, versionId }, cause }
    );
    this.name = "VersionRestoreError";
  }
}

// =============================================================================
// Pattern Errors
// =============================================================================

/**
 * Error thrown when file pattern is invalid
 */
export class PatternInvalidError extends WritenexError {
  constructor(pattern: string, reason: string) {
    super(
      WritenexErrorCode.PATTERN_INVALID,
      `Invalid file pattern '${pattern}': ${reason}`,
      { context: { pattern, reason } }
    );
    this.name = "PatternInvalidError";
  }
}

/**
 * Error thrown when required pattern token is missing
 */
export class PatternMissingTokenError extends WritenexError {
  constructor(pattern: string, missingToken: string) {
    super(
      WritenexErrorCode.PATTERN_MISSING_TOKEN,
      `Pattern '${pattern}' is missing required token: {${missingToken}}`,
      { context: { pattern, missingToken } }
    );
    this.name = "PatternMissingTokenError";
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if an error is a WritenexError
 */
export function isWritenexError(error: unknown): error is WritenexError {
  return error instanceof WritenexError;
}

/**
 * Wrap an unknown error as a WritenexError
 *
 * Useful for catch blocks where the error type is unknown.
 */
export function wrapError(
  error: unknown,
  defaultCode: WritenexErrorCode = WritenexErrorCode.UNKNOWN_ERROR
): WritenexError {
  if (isWritenexError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;

  return new WritenexError(defaultCode, message, { cause });
}

/**
 * Create error from Node.js filesystem error
 */
export function fromNodeError(
  error: NodeJS.ErrnoException,
  filePath: string
): WritenexError {
  switch (error.code) {
    case "ENOENT":
      return new PathNotFoundError(filePath);
    case "EACCES":
    case "EPERM":
      return new WritenexError(
        WritenexErrorCode.FS_PERMISSION_DENIED,
        `Permission denied: ${filePath}`,
        { context: { filePath, errno: error.code }, cause: error }
      );
    case "EISDIR":
      return new WritenexError(
        WritenexErrorCode.FS_READ_ERROR,
        `Expected file but found directory: ${filePath}`,
        { context: { filePath }, cause: error }
      );
    case "ENOTDIR":
      return new WritenexError(
        WritenexErrorCode.FS_READ_ERROR,
        `Expected directory but found file: ${filePath}`,
        { context: { filePath }, cause: error }
      );
    default:
      return new FileReadError(filePath, error);
  }
}
