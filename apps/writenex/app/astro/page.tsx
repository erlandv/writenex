/**
 * @fileoverview Landing page for @writenex/astro integration
 *
 * Comprehensive documentation and marketing page for the Astro visual editor integration.
 * Showcases features, installation, configuration, and usage examples.
 *
 * @module app/astro/page
 */

import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Rocket,
  FolderOpen,
  Image,
  Settings,
  History,
  Search,
  Keyboard,
  Eye,
  Save,
  FileText,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { codeToHtml } from "shiki";
import { createBreadcrumbSchema } from "@/app/lib/jsonld";
import { LandingHeader, LandingFooter } from "@/components/landing";

/**
 * Page-specific metadata for SEO optimization.
 */
export const metadata: Metadata = {
  title: "@writenex/astro - Visual Editor for Astro Content Collections",
  description:
    "WYSIWYG editor for Astro content collections. Zero config, auto-discovery, image upload, version history. Edit your markdown visually from the dev server.",
  keywords: [
    "astro content editor",
    "astro content collections",
    "astro markdown editor",
    "astro wysiwyg",
    "astro integration",
    "astro visual editor",
  ],
  alternates: {
    canonical: "https://writenex.com/astro",
  },
  openGraph: {
    title: "@writenex/astro - Visual Editor for Astro Content Collections",
    description:
      "WYSIWYG editor for Astro content collections. Zero config, auto-discovery, image upload, version history.",
    type: "website",
  },
};

// =============================================================================
// DATA
// =============================================================================

/**
 * Detailed features for the features grid.
 */
const features = [
  {
    icon: Rocket,
    title: "Zero Config",
    description:
      "Auto-detects your content collections from the src/content folder. Just install and start editing with no setup required.",
  },
  {
    icon: FolderOpen,
    title: "Filesystem-based",
    description:
      "Reads and writes directly to your content files. No database or sync layer. Everything stays inside your repository.",
  },
  {
    icon: Settings,
    title: "Smart Schema Detection",
    description:
      "Identifies your frontmatter fields from existing content. Creates ready-to-use forms for titles, dates, tags, and more.",
  },
  {
    icon: Image,
    title: "Image Upload",
    description:
      "Drag and drop images with colocated or public storage options. Files are placed next to your content or in the public folder.",
  },
  {
    icon: History,
    title: "Version History",
    description:
      "Creates automatic shadow copies on save. Restore any earlier version with one click and keep your work protected.",
  },
  {
    icon: Save,
    title: "Autosave",
    description:
      "Saves your work automatically at a configurable interval. Every change is stored instantly so progress is never lost.",
  },
  {
    icon: Search,
    title: "Search and Filter",
    description:
      "Locate content quickly with built-in search and draft filters. Navigate large collections with confidence and ease.",
  },
  {
    icon: Eye,
    title: "Preview Links",
    description:
      "Open a live preview of your content in the browser. Check how updates look without leaving your editing flow.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description:
      "Speed up your workflow with keyboard shortcuts. Press Ctrl+S to save, Alt+N to create new content, and more.",
  },
];

/**
 * Schema field types for the configuration section.
 */
const schemaTypes = [
  { type: "string", component: "Text input", example: '"Hello World"' },
  { type: "number", component: "Number input", example: "42" },
  { type: "boolean", component: "Toggle switch", example: "true" },
  { type: "date", component: "Date picker", example: '"2024-01-15"' },
  { type: "array", component: "Tag input", example: '["astro", "tutorial"]' },
  { type: "image", component: "Image uploader", example: '"./hero.jpg"' },
];

/**
 * Keyboard shortcuts for the shortcuts section.
 */
const shortcuts = [
  { keys: "Alt + N", action: "New content" },
  { keys: "Ctrl/Cmd + S", action: "Save" },
  { keys: "Ctrl/Cmd + P", action: "Open preview" },
  { keys: "Ctrl/Cmd + /", action: "Show shortcuts help" },
  { keys: "Ctrl/Cmd + Shift + R", action: "Refresh content" },
  { keys: "Escape", action: "Close modal" },
];

/**
 * Image strategies for the image strategies section.
 */
const imageStrategies = [
  {
    name: "Colocated",
    description:
      "Images stored alongside content files in a folder with the same name. Best for content-specific images.",
    structure: `src/content/blog/
├── my-post.md
└── my-post/
    ├── hero.jpg
    └── diagram.png`,
    reference: "![Alt](./my-post/hero.jpg)",
    isDefault: true,
  },
  {
    name: "Public",
    description:
      "Images stored in the public directory. Best for shared images used across multiple content items.",
    structure: `public/
└── images/
    └── blog/
        └── my-post-hero.jpg`,
    reference: "![Alt](/images/blog/my-post-hero.jpg)",
    isDefault: false,
  },
];

/**
 * File patterns for the file patterns section.
 */
const filePatterns = [
  { pattern: "{slug}.md", example: "my-post.md", useCase: "Simple (default)" },
  {
    pattern: "{slug}/index.md",
    example: "my-post/index.md",
    useCase: "Folder-based",
  },
  {
    pattern: "{date}-{slug}.md",
    example: "2024-01-15-my-post.md",
    useCase: "Date-prefixed",
  },
  {
    pattern: "{year}/{slug}.md",
    example: "2024/my-post.md",
    useCase: "Year folders",
  },
  {
    pattern: "{year}/{month}/{slug}.md",
    example: "2024/06/my-post.md",
    useCase: "Year/month folders",
  },
  {
    pattern: "{lang}/{slug}.md",
    example: "en/my-post.md",
    useCase: "Multi-language",
  },
  {
    pattern: "{category}/{slug}.md",
    example: "tutorials/my-post.md",
    useCase: "Category folders",
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Hero section with main headline and quick start.
 */
function HeroSection(): React.ReactElement {
  return (
    <section className="px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
          <Terminal className="h-4 w-4" />
          Astro Integration
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-4xl leading-tight font-bold text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
          Visual Editor for
          <br />
          <span className="text-brand-500 dark:text-brand-400">
            Astro Content Collections
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
          Write markdown visually, manage frontmatter with smart auto-generated
          forms, and edit content straight from your dev server.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://www.npmjs.com/package/@writenex/astro"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-lg font-normal text-white transition-colors"
          >
            View on npm
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Quick start section with installation steps.
 */
function QuickStartSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Quick Start
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Get up and running in under a minute.
          </p>
        </div>

        {/* Terminal style code block */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
          <div className="flex items-center gap-2 border-b border-zinc-700 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 font-mono text-sm text-zinc-400">
              terminal
            </span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-sm text-zinc-100">
            <code>
              <span className="text-zinc-500"># Install the integration</span>
              {"\n"}
              <span className="text-green-400">npx</span> astro add
              @writenex/astro{"\n\n"}
              <span className="text-zinc-500"># Start your dev server</span>
              {"\n"}
              <span className="text-green-400">astro</span> dev{"\n\n"}
              <span className="text-zinc-500"># Open the editor</span>
              {"\n"}
              <span className="text-brand-400">
                http://localhost:4321/_writenex
              </span>
            </code>
          </pre>
        </div>

        <p className="mt-8 text-center text-zinc-600 dark:text-zinc-400">
          That&apos;s it! Writenex will auto-discover your content collections
          and you can start editing.
        </p>
      </div>
    </section>
  );
}

/**
 * Features grid section.
 */
function FeaturesSection(): React.ReactElement {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Everything You Need
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            A complete editing experience for your Astro content collections.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="bg-info-500/10 dark:bg-info-500/20 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <feature.icon className="text-info-500 dark:text-info-400 h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Configuration code example for Shiki highlighting.
 */
const configCode = `import { defineConfig } from "@writenex/astro";

export default defineConfig({
  collections: [
    {
      name: "blog",
      path: "src/content/blog",
      filePattern: "{slug}.md",
      previewUrl: "/blog/{slug}",
      schema: {
        title: { type: "string", required: true },
        description: { type: "string" },
        pubDate: { type: "date", required: true },
        heroImage: { type: "image" },
        tags: { type: "array", items: "string" },
        draft: { type: "boolean", default: false },
      },
    },
  ],
  images: {
    strategy: "colocated", // or "public"
  },
});`;

/**
 * Props for CodeBlock component.
 */
interface CodeBlockProps {
  /** Pre-highlighted HTML from Shiki */
  html: string;
}

/**
 * Server-rendered code block with Shiki syntax highlighting.
 * Uses suppressHydrationWarning to prevent mismatch errors from Shiki output.
 */
function CodeBlock({ html }: CodeBlockProps): React.ReactElement {
  return (
    <div
      className="overflow-x-auto text-sm [&>pre]:p-4"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Configuration section with code examples.
 */
async function ConfigurationSection(): Promise<React.ReactElement> {
  const highlightedCode = await codeToHtml(configCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Configuration
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Zero config by default, fully customizable when needed.
          </p>
        </div>

        {/* Config example with Shiki syntax highlighting */}
        <div className="mb-8 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 border-b border-zinc-700 bg-[#24292e] px-4 py-3">
            <FileText className="h-4 w-4 text-zinc-400" />
            <span className="font-mono text-sm text-zinc-400">
              writenex.config.ts
            </span>
          </div>
          <CodeBlock html={highlightedCode} />
        </div>

        {/* Schema types table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Schema Field Types
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Type
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Form Component
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Example Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {schemaTypes.map((item) => (
                  <tr key={item.type}>
                    <td className="px-4 py-3">
                      <code className="text-info-500 dark:text-info-400 rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                        {item.type}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {item.component}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {item.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Image strategies section.
 */
function ImageStrategiesSection(): React.ReactElement {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Image Strategies
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Choose how images are stored in your project.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {imageStrategies.map((strategy) => (
            <div
              key={strategy.name}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {strategy.name}
                </h3>
                {strategy.isDefault && (
                  <span className="bg-info-500/10 text-info-600 dark:bg-info-500/20 dark:text-info-400 rounded-full px-2 py-0.5 text-xs font-medium">
                    Default
                  </span>
                )}
              </div>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                {strategy.description}
              </p>
              <div className="mb-3 rounded-lg bg-zinc-900 p-3 dark:bg-zinc-800">
                <pre className="overflow-x-auto font-mono text-xs text-zinc-300">
                  {strategy.structure}
                </pre>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Reference:{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                  {strategy.reference}
                </code>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * File patterns section.
 */
function FilePatternsSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            File Patterns
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Flexible file naming with automatic token resolution.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Pattern
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Example Output
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Use Case
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filePatterns.map((item) => (
                  <tr key={item.pattern}>
                    <td className="px-4 py-3">
                      <code className="text-info-500 dark:text-info-400 rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                        {item.pattern}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {item.example}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {item.useCase}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Patterns are auto-detected from existing content or can be configured
          explicitly.
        </p>
      </div>
    </section>
  );
}

/**
 * Keyboard shortcuts section.
 */
function ShortcutsSection(): React.ReactElement {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Keyboard Shortcuts
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Familiar shortcuts for efficient editing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <span className="text-zinc-600 dark:text-zinc-400">
                {shortcut.action}
              </span>
              <kbd className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Security section.
 */
function SecuritySection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/20">
          <h2 className="mb-3 text-xl font-bold text-amber-900 dark:text-amber-200">
            Production Safe
          </h2>
          <p className="mb-4 text-amber-800 dark:text-amber-300">
            @writenex/astro is disabled by default in production builds. The
            editor only runs during development to prevent accidental exposure
            of filesystem write access.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            If you need to enable it for staging environments, use the{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono dark:bg-amber-900/50">
              allowProduction: true
            </code>{" "}
            option with proper authentication.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * CTA section.
 */
function CTASection(): React.ReactElement {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Ready to Get Started?
        </h2>
        <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
          Add @writenex/astro to your project and start editing visually.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://github.com/erlandv/writenex/tree/main/packages/astro#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-lg font-normal text-white transition-colors"
          >
            View Full Documentation
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Related section linking to Writenex Editor.
 */
function RelatedSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Looking for a Standalone Editor?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Try Writenex Editor - a free WYSIWYG markdown editor that works
                in your browser. No sign-up required.
              </p>
            </div>
            <Link
              href="/editor"
              className="bg-brand-500 hover:bg-brand-600 inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 font-normal text-white transition-colors"
            >
              Open Editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// PAGE
// =============================================================================

/**
 * @writenex/astro landing page component.
 *
 * @returns The complete Astro integration landing page
 */
export default async function AstroPage(): Promise<React.ReactElement> {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://writenex.com" },
    { name: "@writenex/astro", url: "https://writenex.com/astro" },
  ]);

  const configSection = await ConfigurationSection();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <LandingHeader />
      <main>
        <HeroSection />
        <QuickStartSection />
        <FeaturesSection />
        {configSection}
        <ImageStrategiesSection />
        <FilePatternsSection />
        <ShortcutsSection />
        <SecuritySection />
        <CTASection />
        <RelatedSection />
      </main>
      <LandingFooter />
    </div>
  );
}
