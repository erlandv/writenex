/**
 * @fileoverview Landing page for @imjp/writenex-astro integration
 *
 * Comprehensive documentation and marketing page for the Astro visual editor integration.
 * Showcases features, installation, configuration, Fields API, and usage examples.
 *
 * @module app/astro/page
 */

import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Code,
  Database,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  Hash,
  History,
  Image,
  Keyboard,
  List,
  Plus,
  Rocket,
  Save,
  Search,
  Settings,
  SwitchCamera,
  Terminal,
  Type,
  Upload,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { codeToHtml } from "shiki";
import { LandingFooter, LandingHeader } from "@/app/components/landing";
import { createBreadcrumbSchema } from "@/app/lib/jsonld";

export const metadata: Metadata = {
  title: "@imjp/writenex-astro - Visual Editor for Astro Content Collections",
  description:
    "WYSIWYG editor for Astro content collections with Fields API. 25+ field types, zero config, auto-discovery, image upload, version history.",
  keywords: [
    "astro content editor",
    "astro content collections",
    "astro markdown editor",
    "astro wysiwyg",
    "astro integration",
    "astro visual editor",
    "fields api",
  ],
  alternates: {
    canonical: "https://writenex.com/astro",
  },
  openGraph: {
    title: "@imjp/writenex-astro - Visual Editor for Astro Content Collections",
    description:
      "WYSIWYG editor for Astro content collections with Fields API. 25+ field types, zero config, auto-discovery.",
    type: "website",
  },
};

// =============================================================================
// DATA
// =============================================================================

const features = [
  {
    icon: Rocket,
    title: "Fields API",
    description:
      "TypeScript-first builder pattern with 25+ field types. Get full autocomplete and type safety for your content schema.",
  },
  {
    icon: FolderOpen,
    title: "Zero Config",
    description:
      "Auto-detects your content collections from the src/content folder. Just install and start editing with no setup required.",
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
    icon: Database,
    title: "Validation",
    description:
      "Built-in validation rules for required fields, min/max values, string lengths, and regex patterns.",
  },
];

const fieldCategories = [
  {
    name: "Text Fields",
    fields: [
      { name: "text", description: "Single or multi-line text input" },
      { name: "slug", description: "URL-friendly slug with auto-generation" },
      { name: "url", description: "URL input with validation" },
    ],
  },
  {
    name: "Number Fields",
    fields: [
      { name: "number", description: "Numeric input for decimals" },
      { name: "integer", description: "Whole number input" },
    ],
  },
  {
    name: "Selection Fields",
    fields: [
      { name: "select", description: "Dropdown selection from options" },
      { name: "multiselect", description: "Multi-select with checkboxes" },
      { name: "checkbox", description: "Boolean toggle" },
    ],
  },
  {
    name: "Date & Time",
    fields: [
      { name: "date", description: "Date picker" },
      { name: "datetime", description: "Date and time picker" },
    ],
  },
  {
    name: "File & Media",
    fields: [
      { name: "image", description: "Image upload with preview" },
      { name: "file", description: "File upload for documents" },
    ],
  },
  {
    name: "Structured",
    fields: [
      { name: "object", description: "Nested group of fields" },
      { name: "array", description: "List of items with same schema" },
      { name: "blocks", description: "List of items with different types" },
    ],
  },
  {
    name: "Reference",
    fields: [
      { name: "relationship", description: "Reference to another collection" },
      { name: "pathReference", description: "Reference to a file path" },
    ],
  },
  {
    name: "Content",
    fields: [
      { name: "markdoc", description: "Markdoc rich content" },
      { name: "mdx", description: "MDX content with components" },
      { name: "child", description: "Child document content" },
    ],
  },
  {
    name: "Advanced",
    fields: [
      { name: "conditional", description: "Conditional field display" },
      { name: "cloudImage", description: "Cloud-hosted image (future)" },
      { name: "ignored", description: "Skip field from forms" },
    ],
  },
];

const shortcuts = [
  { keys: "Alt + N", action: "New content" },
  { keys: "Ctrl/Cmd + S", action: "Save" },
  { keys: "Ctrl/Cmd + P", action: "Open preview" },
  { keys: "Ctrl/Cmd + /", action: "Show shortcuts help" },
  { keys: "Ctrl/Cmd + Shift + R", action: "Refresh content" },
  { keys: "Escape", action: "Close modal" },
];

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

// =============================================================================
// COMPONENTS
// =============================================================================

function HeroSection(): React.ReactElement {
  return (
    <section className="px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
          <Terminal className="h-4 w-4" />
          Astro Integration
        </div>

        <h1 className="mb-6 text-4xl leading-tight font-bold text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
          Visual Editor for
          <br />
          <span className="text-brand-500 dark:text-brand-400">
            Astro Content Collections
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
          TypeScript-first Fields API with 25+ field types. Zero config,
          auto-discovery, WYSIWYG editing, and version history.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://www.npmjs.com/package/@imjp/writenex-astro"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-lg font-normal text-white transition-colors"
          >
            View on npm
            <ExternalLink className="h-5 w-5" />
          </a>
          <a
            href="https://github.com/jaainil/writenex/wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-5 py-3 text-lg font-normal text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            GitHub
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

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
              @imjp/writenex-astro{"\n\n"}
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

// =============================================================================
// FIELDS API SECTIONS
// =============================================================================

function FieldsAPIHeroSection(): React.ReactElement {
  return (
    <section className="bg-gradient-to-b from-brand-500/5 to-transparent px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Fields API
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          TypeScript-first builder pattern for defining content schema fields.
          Full autocomplete, type safety, and 25+ field types.
        </p>
      </div>
    </section>
  );
}

function FieldsAPIIntroSection(): React.ReactElement {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h3 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Imports
        </h3>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Import the Fields API from the config module:
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
          <div className="flex items-center gap-2 border-b border-zinc-700 px-4 py-3">
            <Code className="h-4 w-4 text-zinc-400" />
            <span className="font-mono text-sm text-zinc-400">typescript</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-sm text-zinc-100">
            <code>
              <span className="text-zinc-500">
                // Import from the config module
              </span>
              {"\n"}
              <span className="text-blue-400">import</span> {"{"} defineConfig,
              collection, singleton, fields {"}"}{" "}
              <span className="text-blue-400">from</span>{" "}
              <span className="text-green-400">
                "@imjp/writenex-astro/config"
              </span>
              ;{"\n\n"}
              <span className="text-zinc-500">
                // Or use the @imjp namespace
              </span>
              {"\n"}
              <span className="text-blue-400">import</span> {"{"} defineConfig,
              collection, singleton, fields {"}"}{" "}
              <span className="text-blue-400">from</span>{" "}
              <span className="text-green-400">
                "@imjp/writenex-astro/config"
              </span>
              ;
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

async function FieldsAPIExampleSection(): Promise<React.ReactElement> {
  const basicExample = `import { defineConfig, collection, fields } from "@imjp/writenex-astro/config";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      filePattern: "{slug}.md",
      previewUrl: "/blog/{slug}",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: "Slug" } }),
        description: fields.text({ label: "Description", multiline: true }),
        publishedAt: fields.date({ label: "Published Date" }),
        heroImage: fields.image({ label: "Hero Image" }),
        tags: fields.multiselect({ 
          label: "Tags", 
          options: ["javascript", "typescript", "react", "astro"] 
        }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        body: fields.mdx({ label: "Content", validation: { isRequired: true } }),
      },
    }),
  ],
});`;

  const highlightedCode = await codeToHtml(basicExample, {
    lang: "typescript",
    theme: "github-dark",
  });

  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <h3 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Basic Example
        </h3>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 border-b border-zinc-700 bg-[#24292e] px-4 py-3">
            <FileText className="h-4 w-4 text-zinc-400" />
            <span className="font-mono text-sm text-zinc-400">
              writenex.config.ts
            </span>
          </div>
          <div
            className="overflow-x-auto text-sm [&>pre]:p-4"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </div>
      </div>
    </section>
  );
}

function CollectionVsSingletonSection(): React.ReactElement {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h3 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          collection() vs singleton()
        </h3>

        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Both patterns below work —{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">
            defineConfig
          </code>{" "}
          auto-resolves{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">
            fields.*()
          </code>{" "}
          objects in either case. Using{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">
            collection()
          </code>{" "}
          is recommended for better TypeScript inference.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-brand-500" />
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                collection()
              </h4>
            </div>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              For multi-item content like blog posts, documentation pages, or
              products.
            </p>
            <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              collection({"{"}
              <br />
              &nbsp;&nbsp;name: "blog",
              <br />
              &nbsp;&nbsp;path: "src/content/blog",
              <br />
              &nbsp;&nbsp;schema: {"{ /* fields */ }"}
              <br />
              {"}"})
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" />
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                singleton()
              </h4>
            </div>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              For single-item content like site settings, about page, or global
              configuration.
            </p>
            <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              singleton({"{"}
              <br />
              &nbsp;&nbsp;name: "settings",
              <br />
              &nbsp;&nbsp;path: "src/content/settings.json",
              <br />
              &nbsp;&nbsp;schema: {"{ /* fields */ }"}
              <br />
              {"}"})
            </div>
          </div>
        </div>

        {/* Both patterns block */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h4 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Both patterns are valid
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Pattern A — raw object
              </p>
              <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                defineConfig({"{"}
                <br />
                &nbsp;&nbsp;collections: [{"{"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;name: "blog",
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;schema: {"{"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;title: fields.text(...),{" "}
                <span className="text-green-400">{"// ✅"}</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;{"}"},<br />
                &nbsp;&nbsp;{"}"}],
                <br />
                {"}"})
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-500">
                Pattern B — collection() (recommended)
              </p>
              <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                defineConfig({"{"}
                <br />
                &nbsp;&nbsp;collections: [<br />
                &nbsp;&nbsp;&nbsp;&nbsp;collection({"{"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: "blog",
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;schema: {"{"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;title:
                fields.text(...),{" "}
                <span className="text-green-400">{"// ✅"}</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"}"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;{"}"}),
                <br />
                &nbsp;&nbsp;],
                <br />
                {"}"})
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldTypesGridSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <h3 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          25+ Field Types
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fieldCategories.map((category) => (
            <div
              key={category.name}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {category.name}
              </h4>
              <div className="space-y-2">
                {category.fields.map((field) => (
                  <div key={field.name} className="flex items-start gap-2">
                    <Code className="mt-0.5 h-3 w-3 shrink-0 text-brand-500" />
                    <div>
                      <code className="text-xs font-mibold text-brand-500">
                        {field.name}
                      </code>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {field.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function TextFieldsSection(): Promise<React.ReactElement> {
  const textCode = `fields.text({ label: "Title" })
fields.text({ label: "Description", multiline: true })
fields.text({ 
  label: "Bio",
  multiline: true,
  placeholder: "Tell us about yourself...",
  validation: { 
    isRequired: true,
    minLength: 10,
    maxLength: 500 
  }
})`;

  const slugCode = `fields.slug({ label: "URL Slug" })
fields.slug({ 
  name: { label: "Name Slug", placeholder: "my-page" },
  pathname: { label: "URL Path", placeholder: "/pages/" }
})`;

  const urlCode = `fields.url({ label: "Website" })
fields.url({ 
  label: "GitHub Profile",
  placeholder: "https://github.com/username",
  validation: { isRequired: true }
})`;

  const highlightedText = await codeToHtml(textCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  const highlightedSlug = await codeToHtml(slugCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  const highlightedUrl = await codeToHtml(urlCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Type className="h-5 w-5 text-brand-500" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Text Fields
            </h3>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.text()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Single or multi-line text input with validation support.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.slug()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                URL-friendly slug with auto-generation from title.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedSlug }}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.url()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                URL input with validation.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedUrl }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function SelectionFieldsSection(): Promise<React.ReactElement> {
  const selectCode = `fields.select({ 
  label: "Status",
  options: ["draft", "published", "archived"],
  defaultValue: "draft"
})`;

  const multiselectCode = `fields.multiselect({ 
  label: "Tags",
  options: ["javascript", "typescript", "react", "node"],
  defaultValue: ["javascript"]
})`;

  const checkboxCode = `fields.checkbox({ label: "Published" })
fields.checkbox({ 
  label: "Featured",
  defaultValue: false
})`;

  const highlightedSelect = await codeToHtml(selectCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  const highlightedMultiselect = await codeToHtml(multiselectCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  const highlightedCheckbox = await codeToHtml(checkboxCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <List className="h-5 w-5 text-brand-500" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Selection Fields
            </h3>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.select()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Dropdown selection from predefined options.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedSelect }}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.multiselect()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Multi-select with checkboxes or multi-select UI.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedMultiselect }}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.checkbox()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Boolean toggle switch.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedCheckbox }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function StructuredFieldsSection(): Promise<React.ReactElement> {
  const objectCode = `fields.object({
  label: "Author",
  fields: {
    name: fields.text({ label: "Name" }),
    email: fields.url({ label: "Email" }),
    bio: fields.text({ label: "Bio", multiline: true }),
  }
})`;

  const arrayCode = `fields.array({
  label: "Tags",
  itemField: fields.text({ label: "Tag" }),
  itemLabel: "Tag"
})

fields.array({
  label: "Links",
  itemField: fields.object({
    fields: {
      title: fields.text({ label: "Title" }),
      url: fields.url({ label: "URL" }),
    }
  }),
  itemLabel: "Link"
})`;

  const blocksCode = `fields.blocks({
  label: "Content Blocks",
  blockTypes: {
    paragraph: {
      label: "Paragraph",
      fields: {
        text: fields.text({ label: "Text", multiline: true })
      }
    },
    quote: {
      label: "Quote",
      fields: {
        text: fields.text({ label: "Quote" }),
        attribution: fields.text({ label: "Attribution" })
      }
    },
    image: {
      label: "Image",
      fields: {
        src: fields.image({ label: "Image" }),
        caption: fields.text({ label: "Caption" })
      }
    }
  },
  itemLabel: "Block"
})`;

  const highlightedObject = await codeToHtml(objectCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  const highlightedArray = await codeToHtml(arrayCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  const highlightedBlocks = await codeToHtml(blocksCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-brand-500" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Structured Fields
            </h3>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.object()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Nested group of fields for complex data structures.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedObject }}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.array()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                List of items with the same schema.
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedArray }}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                fields.blocks()
              </h4>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                List of items with different block types (paragraphs, quotes,
                images, etc.).
              </p>
              <div
                className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: highlightedBlocks }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function ValidationSection(): Promise<React.ReactElement> {
  const validationCode = `fields.text({
  label: "Title",
  validation: {
    isRequired: true,
    minLength: 3,
    maxLength: 100,
    pattern: "^[A-Za-z]",
    patternDescription: "Must start with a letter"
  }
})

fields.number({
  label: "Price",
  validation: {
    isRequired: true,
    min: 0,
    max: 10000
  }
})

fields.integer({
  label: "Year",
  validation: { min: 1900, max: 2100 }
})`;

  const highlightedCode = await codeToHtml(validationCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-brand-500" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Validation
          </h3>
        </div>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          All fields support validation options for data integrity.
        </p>
        <div
          className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />

        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Validation Options
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Option
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Type
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Applies To
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                <tr>
                  <td className="px-4 py-3">isRequired</td>
                  <td className="px-4 py-3">boolean</td>
                  <td className="px-4 py-3">All fields</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">min</td>
                  <td className="px-4 py-3">number</td>
                  <td className="px-4 py-3">number, integer</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">max</td>
                  <td className="px-4 py-3">number</td>
                  <td className="px-4 py-3">number, integer</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">minLength</td>
                  <td className="px-4 py-3">number</td>
                  <td className="px-4 py-3">text, url</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">maxLength</td>
                  <td className="px-4 py-3">number</td>
                  <td className="px-4 py-3">text, url</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">pattern</td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3">text, slug</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">patternDescription</td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3">text, slug</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

async function MigrationSection(): Promise<React.ReactElement> {
  const beforeCode = `export default defineConfig({
  collections: [
    {
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: { type: "string", required: true },
        description: { type: "string" },
        pubDate: { type: "date", required: true },
        draft: { type: "boolean", default: false },
        tags: { type: "array", items: "string" },
        heroImage: { type: "image" },
      },
    },
  ],
});`;

  const afterCode = `import { defineConfig, collection, fields } from "@imjp/writenex-astro/config";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        description: fields.text({ label: "Description" }),
        pubDate: fields.date({ label: "Published Date", validation: { isRequired: true } }),
        draft: fields.checkbox({ label: "Draft", defaultValue: false }),
        tags: fields.array({ label: "Tags", itemField: fields.text({ label: "Tag" }) }),
        heroImage: fields.image({ label: "Hero Image" }),
      },
    }),
  ],
});`;

  const highlightedBefore = await codeToHtml(beforeCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  const highlightedAfter = await codeToHtml(afterCode, {
    lang: "typescript",
    theme: "github-dark",
  });

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-brand-500" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Migration from Plain Schema
          </h3>
        </div>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Upgrade your existing plain schema config to the Fields API.
        </p>

        <div className="mb-8">
          <h4 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Before (Plain Schema)
          </h4>
          <div
            className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: highlightedBefore }}
          />
        </div>

        <div className="mb-8">
          <h4 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            After (Fields API)
          </h4>
          <div
            className="overflow-hidden rounded-xl border border-zinc-200 text-sm dark:border-zinc-700 [&>pre]:p-4"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: highlightedAfter }}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Type Mapping
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Plain Schema
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    Fields API
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                <tr>
                  <td className="px-4 py-3">type: "string"</td>
                  <td className="px-4 py-3">fields.text()</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">type: "number"</td>
                  <td className="px-4 py-3">fields.number()</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">type: "boolean"</td>
                  <td className="px-4 py-3">fields.checkbox()</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">type: "date"</td>
                  <td className="px-4 py-3">fields.date()</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">type: "array"</td>
                  <td className="px-4 py-3">
                    fields.array({"{ itemField: ... }"})
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">type: "object"</td>
                  <td className="px-4 py-3">
                    fields.object({"{ fields: ... }"})
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">type: "image"</td>
                  <td className="px-4 py-3">fields.image()</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// LEGACY SECTIONS (Kept for backward compatibility)
// =============================================================================

function ImageStrategiesSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
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

function SecuritySection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/20">
          <h2 className="mb-3 text-xl font-bold text-amber-900 dark:text-amber-200">
            Production Safe
          </h2>
          <p className="mb-4 text-amber-800 dark:text-amber-300">
            @imjp/writenex-astro is disabled by default in production builds.
            The editor only runs during development to prevent accidental
            exposure of filesystem write access.
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

function CTASection(): React.ReactElement {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Ready to Get Started?
        </h2>
        <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
          Add @imjp/writenex-astro to your project and start editing visually.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://github.com/jaainil/writenex/wiki"
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

export default async function AstroPage(): Promise<React.ReactElement> {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://writenex.com" },
    { name: "@imjp/writenex-astro", url: "https://writenex.com/astro" },
  ]);

  const fieldsApiExample = await FieldsAPIExampleSection();
  const textFields = await TextFieldsSection();
  const selectionFields = await SelectionFieldsSection();
  const structuredFields = await StructuredFieldsSection();
  const validation = await ValidationSection();
  const migration = await MigrationSection();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
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

        {/* Fields API Documentation */}
        <FieldsAPIHeroSection />
        <FieldsAPIIntroSection />
        {fieldsApiExample}
        <CollectionVsSingletonSection />
        <FieldTypesGridSection />
        {textFields}
        {selectionFields}
        {structuredFields}
        {validation}
        {migration}

        {/* Legacy Sections */}
        <ImageStrategiesSection />
        <ShortcutsSection />
        <SecuritySection />
        <CTASection />
        <RelatedSection />
      </main>
      <LandingFooter />
    </div>
  );
}
