/**
 * @fileoverview Image-related type definitions for @writenex/astro
 *
 * This file contains all TypeScript type definitions related to image discovery
 * and image metadata.
 *
 * @module @writenex/astro/types/image
 */

/**
 * Discovered image metadata
 *
 * Represents an image file found during content folder scanning.
 */
export interface DiscoveredImage {
  /** Original filename (e.g., "hero.jpg") */
  filename: string;
  /** Relative path for markdown (e.g., "./images/hero.jpg") */
  relativePath: string;
  /** Absolute filesystem path */
  absolutePath: string;
  /** File size in bytes */
  size: number;
  /** File extension (lowercase, with dot, e.g., ".jpg") */
  extension: string;
}

/**
 * Options for image discovery
 */
export interface ImageDiscoveryOptions {
  /** Maximum recursion depth (default: 5) */
  maxDepth?: number;
  /** Additional extensions to include beyond defaults */
  additionalExtensions?: string[];
}

/**
 * Result of image discovery operation
 */
export interface ImageDiscoveryResult {
  /** Whether discovery was successful */
  success: boolean;
  /** Discovered images */
  images: DiscoveredImage[];
  /** Error message if failed */
  error?: string;
}
