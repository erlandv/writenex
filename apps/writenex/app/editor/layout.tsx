/**
 * @fileoverview Editor layout component for the Writenex editor route
 *
 * This layout wraps the editor page and provides editor-specific metadata,
 * PWA configuration, and JSON-LD structured data for SEO.
 *
 * ## Features:
 * - PWA metadata (manifest, apple-web-app, theme-color)
 * - Editor-specific SEO metadata
 * - JSON-LD structured data (WebApplication, Breadcrumb)
 * - Viewport configuration for theme colors
 *
 * ## Architecture:
 * This layout is nested under the root layout and only applies to the
 * /editor route. It adds PWA-specific configuration while inheriting
 * theme and tooltip providers from the root layout.
 *
 * @module app/editor/layout
 * @see {@link webApplicationSchema} - JSON-LD schema for the web app
 * @see {@link createBreadcrumbSchema} - Breadcrumb schema generator
 */

import type { Metadata, Viewport } from "next";
import { webApplicationSchema, createBreadcrumbSchema } from "@/app/lib/jsonld";

/**
 * Viewport configuration for theme-aware status bar colors.
 * Provides different colors for light and dark mode preferences.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * Editor-specific metadata for SEO and PWA optimization.
 * Includes manifest configuration for installable PWA experience,
 * Apple Web App settings, and social media cards.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  title: "Markdown Editor",
  description:
    "The Markdown editor that stays out of your way. Write visually in a clean editor, and we'll handle the perfect Markdown export for you.",
  keywords: [
    "markdown editor",
    "online markdown editor",
    "WYSIWYG markdown editor",
    "markdown editor online free",
    "write markdown online",
    "markdown to html",
    "export markdown",
  ],
  alternates: {
    canonical: "https://writenex.com/editor",
  },
  // PWA metadata
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Writenex",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Markdown Editor | Writenex",
    description:
      "The Markdown editor that stays out of your way. Write visually in a clean editor, and we'll handle the perfect Markdown export for you.",
    type: "website",
    locale: "en_US",
    siteName: "Writenex",
    url: "https://writenex.com/editor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Markdown Editor | Writenex",
    description:
      "The Markdown editor that stays out of your way. Write visually in a clean editor, and we'll handle the perfect Markdown export for you.",
  },
};

/**
 * Breadcrumb JSON-LD schema for the editor page.
 * Helps search engines understand the site hierarchy.
 */
const breadcrumbSchema = createBreadcrumbSchema([
  { name: "Home", url: "https://writenex.com" },
  { name: "Editor", url: "https://writenex.com/editor" },
]);

/**
 * Editor layout component that wraps the editor page.
 *
 * Injects JSON-LD structured data for SEO while passing through
 * children (the editor page content). This layout is automatically
 * applied by Next.js App Router to all routes under /editor.
 *
 * @component
 * @example
 * ```tsx
 * // This layout is automatically applied by Next.js App Router
 * // to pages in the /editor route
 * export default function EditorPage() {
 *   return <div>Editor content</div>;
 * }
 * ```
 *
 * @param props - Component props
 * @param props.children - Child components to render (the editor page)
 * @returns Fragment containing JSON-LD scripts and children
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
