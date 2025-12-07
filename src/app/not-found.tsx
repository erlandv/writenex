/**
 * @fileoverview Custom 404 Not Found page for Writenex
 *
 * A branded 404 page that provides a friendly message when users
 * navigate to a non-existent route. Includes navigation options
 * to help users find their way back.
 *
 * ## Features:
 * - Minimalist design focused on the error message
 * - Clear messaging about the error
 * - Navigation options (home, editor)
 * - Dark mode support
 *
 * @module app/not-found
 */

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, PenLine } from "lucide-react";

/**
 * Metadata for the 404 page.
 */
export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Custom 404 Not Found page component.
 *
 * Displays a friendly error message with navigation options
 * when users land on a non-existent route.
 *
 * @returns The 404 page with navigation options
 */
export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 sm:px-6 lg:px-8 dark:bg-zinc-900">
      <div className="text-center">
        {/* 404 Number */}
        <p className="mb-4 text-8xl font-bold text-blue-600 sm:text-9xl dark:text-blue-500">
          404
        </p>

        {/* Heading */}
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Navigation Options */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-5 py-3 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white transition-colors hover:bg-blue-700"
          >
            <PenLine className="h-4 w-4" />
            Open Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
