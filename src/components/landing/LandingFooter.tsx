/**
 * @fileoverview Shared footer component for landing and legal pages
 *
 * A consistent footer with copyright, legal links, and GitHub link.
 *
 * ## Features:
 * - Copyright notice with current year
 * - Links to Terms and Privacy pages
 * - GitHub repository link
 * - Responsive design (stacks on mobile)
 * - Dark mode support
 *
 * ## Usage:
 * Used on landing page, privacy policy, and terms of use pages.
 *
 * @module components/landing/LandingFooter
 */

import Link from "next/link";

/**
 * Footer component with copyright and navigation links.
 *
 * Displays copyright information, links to legal pages (Terms, Privacy),
 * and a link to the GitHub repository.
 *
 * @component
 * @example
 * ```tsx
 * <LandingFooter />
 * ```
 *
 * @returns Footer with copyright text, legal links, and GitHub link
 */
export function LandingFooter(): React.ReactElement {
  return (
    <footer className="border-t border-zinc-200 px-4 py-8 sm:px-6 lg:px-8 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Copyright © {new Date().getFullYear()} Writenex
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/terms"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Privacy
          </Link>
          <a
            href="https://github.com/erlandv/writenex"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg
              className="h-5 w-5"
              role="img"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span className="text-sm">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
