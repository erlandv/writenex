/**
 * @fileoverview Shared header component for landing and legal pages
 *
 * A fixed header with the Writenex logo and CTA button. The logo
 * serves as navigation back to the homepage (standard UX convention).
 *
 * ## Features:
 * - Fixed position with frosted glass effect
 * - Clickable logo for home navigation
 * - CTA button to open the editor
 * - Responsive design
 * - Dark mode support
 *
 * ## Usage:
 * Used on landing page, privacy policy, and terms of use pages.
 *
 * @module components/landing/LandingHeader
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Fixed header component with logo, navigation, and CTA.
 *
 * Displays the Writenex logo (clickable, navigates to home), navigation
 * links, and a CTA button to open the editor. Uses a frosted glass effect
 * with backdrop blur for visual appeal.
 *
 * @component
 * @example
 * ```tsx
 * <LandingHeader />
 * ```
 *
 * @returns Fixed position header with logo, nav, and CTA
 */
export function LandingHeader(): React.ReactElement {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - clickable, navigates to home */}
          <Link href="/" className="flex items-center gap-2">
            <svg
              className="h-10 w-10 shrink-0"
              viewBox="0 0 24 24"
              fill="#335DFF"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M20.18 4.22l3.7 0c0.05,0 0.08,0.02 0.1,0.06 0.03,0.03 0.03,0.08 0,0.12l-5.78 10.31c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.89 -3.28c-0.03,-0.04 -0.03,-0.08 -0.01,-0.12l3.98 -7.03c0.02,-0.04 0.06,-0.06 0.1,-0.06zm-6.13 6.34l3.24 5.65c0.03,0.04 0.03,0.09 0,0.12l-1.9 3.39c-0.02,0.04 -0.05,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-3.17 -5.68 -3.12 5.68c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.92 -3.38c-0.03,-0.04 -0.03,-0.09 0,-0.13l3.26 -5.66 -3.48 -6.15c-0.02,-0.04 -0.02,-0.09 0,-0.12 0.02,-0.04 0.06,-0.06 0.1,-0.06l3.74 0c0.05,0 0.08,0.02 0.11,0.06l1.51 2.7 1.53 -2.7c0.02,-0.04 0.06,-0.06 0.1,-0.06l3.84 0c0.04,0 0.08,0.02 0.1,0.06 0.02,0.03 0.02,0.08 0,0.12l-3.54 6.16zm-10.06 -6.28l3.99 7.01c0.02,0.04 0.02,0.08 0,0.12l-1.91 3.31c-0.03,0.04 -0.06,0.06 -0.11,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-5.84 -10.32c-0.03,-0.04 -0.03,-0.09 0,-0.12 0.02,-0.04 0.05,-0.06 0.1,-0.06l3.76 0c0.05,0 0.09,0.02 0.11,0.06z" />
            </svg>
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Writenex
            </span>
          </Link>

          {/* Navigation and CTA */}
          <div className="flex items-center gap-6">
            {/* Nav link */}
            <Link
              href="/astro"
              className="hidden text-sm text-zinc-600 transition-colors hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              @writenex/astro
            </Link>

            {/* CTA */}
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-normal text-white transition-colors hover:bg-blue-700"
            >
              Open Editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
