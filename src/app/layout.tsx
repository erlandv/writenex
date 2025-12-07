/**
 * @fileoverview Root layout component for the Writenex application
 *
 * This is the top-level layout that wraps all pages in the application.
 * It provides essential configuration including:
 * - Font loading (Plus Jakarta Sans for UI, Agave Nerd Font for code)
 * - Theme provider for light/dark mode support
 * - Tooltip provider for consistent tooltip behavior
 * - SEO metadata and JSON-LD structured data
 * - Accessibility features (skip to content link)
 * - Flash-free theme initialization script
 *
 * ## Architecture:
 * The layout uses Next.js 15+ App Router conventions with:
 * - Server-side metadata generation for SEO
 * - Client-side theme hydration via inline script (prevents flash)
 * - Provider composition pattern for context distribution
 *
 * @module app/layout
 * @see {@link ThemeProvider} - Theme context provider for dark/light mode
 * @see {@link TooltipProvider} - Radix UI tooltip context
 * @see {@link websiteSchema} - JSON-LD schema for SEO
 */

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { websiteSchema, organizationSchema } from "@/lib/jsonld";
import { TOOLTIP_DELAY } from "@/lib/constants";
import "./globals.css";

/**
 * Plus Jakarta Sans font configuration.
 * Auto self-hosted by Next.js for optimal performance.
 * Used as the primary UI font throughout the application.
 */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

/**
 * Agave Nerd Font configuration.
 * Self-hosted monospace font used for code blocks and the editor.
 * Includes Nerd Font icons for enhanced terminal/code display.
 */
const agaveNerdFont = localFont({
  src: "../../public/fonts/agave-nerd/AgaveNerdFontMono-Regular.woff2",
  variable: "--font-agave",
  display: "swap",
  fallback: [
    "ui-monospace",
    "Cascadia Code",
    "Menlo",
    "Consolas",
    "Courier New",
    "monospace",
  ],
});

/**
 * Global metadata configuration for SEO optimization.
 * Provides default title, description, keywords, and social media cards.
 * Individual pages can override these values using the template pattern.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  title: {
    default: "Free Online Markdown Editor | WYSIWYG & Export to .md - Writenex",
    template: "%s | Writenex",
  },
  description:
    "Write Markdown visually with our free WYSIWYG editor. No syntax needed. Export to .md or HTML. Auto-save, version history, multiple documents. No sign-up required.",
  keywords: [
    "markdown editor",
    "markdown editor online",
    "WYSIWYG markdown editor",
    "free markdown editor",
    "online markdown editor",
    "markdown editor with preview",
    "write markdown online",
    "export markdown",
  ],
  authors: [{ name: "Writenex" }],
  creator: "Writenex",
  metadataBase: new URL("https://writenex.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Writenex",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Root layout component that wraps all pages in the application.
 *
 * Provides the HTML structure with theme-aware class names, font CSS variables,
 * JSON-LD structured data for SEO, and flash-free theme initialization.
 * The theme initialization script runs before React hydration to prevent
 * flash of incorrect theme (FOIT).
 *
 * @component
 * @example
 * ```tsx
 * // This layout is automatically applied by Next.js App Router
 * // to all pages in the application
 * export default function Page() {
 *   return <main>Page content</main>;
 * }
 * ```
 *
 * @param props - Component props
 * @param props.children - Child components to render within the layout
 * @returns The root HTML structure with providers and theme initialization
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${agaveNerdFont.variable}`}
    >
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {/* Theme initialization script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = JSON.parse(localStorage.getItem('markdown-editor-storage') || '{}').state?.theme || 'system';
                  var root = document.documentElement;
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'light') {
                    root.classList.remove('dark');
                  } else {
                    // System preference
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      root.classList.add('dark');
                    } else {
                      root.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider delayDuration={TOOLTIP_DELAY}>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
            >
              Skip to content
            </a>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
