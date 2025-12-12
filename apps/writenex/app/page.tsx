/**
 * @fileoverview Landing page for the Writenex application
 *
 * SEO-optimized landing page that showcases the key features and value
 * propositions of the Markdown editor. The page is designed to convert
 * visitors into users by highlighting the editor's simplicity and power.
 *
 * ## Features:
 * - Hero section with main value proposition
 * - Feature grid highlighting key capabilities
 * - "How It Works" section with 3-step process
 * - FAQ accordion for common questions
 * - Multiple CTAs driving to the editor
 *
 * ## SEO:
 * - Optimized metadata for search engines
 * - JSON-LD structured data (SoftwareApplication, FAQ, Breadcrumb)
 * - Semantic HTML structure with proper heading hierarchy
 *
 * ## Architecture:
 * The page is composed of multiple section components for maintainability.
 * All sections are server-rendered for optimal SEO and performance.
 *
 * @module app/page
 * @see {@link softwareApplicationSchema} - JSON-LD schema for the app
 * @see {@link faqSchema} - JSON-LD schema for FAQ section
 * @see {@link FAQAccordion} - Client-side FAQ component
 */

import Link from "next/link";
import type { Metadata } from "next";
import {
  Eye,
  History,
  Download,
  ArrowRight,
  FileText,
  Sparkles,
  Keyboard,
  Zap,
  MousePointer,
  PenLine,
  Share2,
} from "lucide-react";
import {
  softwareApplicationSchema,
  createBreadcrumbSchema,
  faqSchema,
} from "@/app/lib/jsonld";
import {
  FAQAccordion,
  LandingHeader,
  LandingFooter,
} from "@/components/landing";

// =============================================================================
// METADATA
// =============================================================================

/**
 * Page-specific metadata for SEO optimization.
 * Overrides the default metadata from the root layout with landing page specific
 * title, description, and social media cards.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  title: "Free Markdown Editor: Write Visually, Export Instantly | Writenex",
  description:
    "Write visually with our free WYSIWYG Markdown editor. Forget the syntax, export clean .md instantly. Includes auto-save and version history. No sign-up required.",
  keywords: [
    "markdown editor",
    "markdown editor online",
    "WYSIWYG markdown editor",
    "free markdown editor",
    "online markdown editor",
    "write markdown online",
  ],
  alternates: {
    canonical: "https://writenex.com",
  },
  openGraph: {
    title: "Free Markdown Editor: Write Visually, Export Instantly | Writenex",
    description:
      "Write visually with our free WYSIWYG Markdown editor. Forget the syntax, export clean .md instantly. Includes auto-save and version history. No sign-up required.",
    type: "website",
    locale: "en_US",
    siteName: "Writenex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Markdown Editor: Write Visually, Export Instantly | Writenex",
    description:
      "Write visually with our free WYSIWYG Markdown editor. Forget the syntax, export clean .md instantly. Includes auto-save and version history. No sign-up required.",
  },
};

// =============================================================================
// DATA
// =============================================================================

/**
 * Feature cards data for the features grid section.
 * Each feature includes an icon, title, and description highlighting
 * a key capability of the Writenex editor.
 */
const features = [
  {
    icon: Eye,
    title: "WYSIWYG Editing",
    description:
      "See your changes instantly. Forget about complex syntax tags. Just start typing and let it flow.",
  },
  {
    icon: Download,
    title: "Export to Markdown",
    description:
      "Get your words out fast. Download clean markdown files instantly, ready for publishing.",
  },
  {
    icon: History,
    title: "Version History",
    description:
      "Never lose a single thought. We auto-save everything and keep your full version history safe.",
  },
  {
    icon: FileText,
    title: "Multiple Documents",
    description:
      "Keep all your drafts open. Switch between multiple documents instantly to stay in the zone.",
  },
  {
    icon: Sparkles,
    title: "Focus Mode",
    description:
      "Block out all the noise. Hide the interface and focus purely on your writing flow and words.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description:
      "Keep your hands on the keys. Fly through every editing task using simple, efficient power shortcuts.",
  },
];

/**
 * Steps data for the "How It Works" section.
 * Describes the 3-step process from opening the editor to exporting content.
 */
const steps = [
  {
    icon: MousePointer,
    step: "1",
    title: "Open the Editor",
    description: "No sign-up. Just click and you're in.",
  },
  {
    icon: PenLine,
    step: "2",
    title: "Write Visually",
    description: "Type naturally with toolbar or shortcuts.",
  },
  {
    icon: Share2,
    step: "3",
    title: "Export Instantly",
    description: "Download as .md or .html. Copy to clipboard.",
  },
];

/**
 * FAQ data for the FAQ accordion section.
 * Common questions and answers about Writenex features, pricing, and privacy.
 * This data is also used to generate the FAQ JSON-LD schema in `lib/jsonld.ts`.
 */
const faqs = [
  {
    question: "Is Writenex 100% free?",
    answer:
      "Absolutely! Writenex is free forever, no catch. That means no ads, no hidden fees, no premium tiers, and no paywalls. Enjoy all features without paying a dime.",
  },
  {
    question: "Do I need to sign up for an account?",
    answer:
      "Nope, no account, no sign-up. Just open the editor and start typing right away. We save all your documents directly in your browser.",
  },
  {
    question: "How safe and private is my data?",
    answer:
      "Totally safe and private. Your data never leaves your device because everything is stored 100% locally in your browser. We never send anything to a server.",
  },
  {
    question: "What file formats can I export?",
    answer:
      "You can export your work as clean Markdown (.md) or HTML (.html) files. Plus, you can instantly copy the Markdown or HTML straight to your clipboard.",
  },
  {
    question: "Can I write when I'm offline?",
    answer:
      "Yes, absolutely. Once it loads the first time, you can write anytime, anywhere, even without WiFi. All your documents are stored locally, right where you need them.",
  },
  {
    question: "Can I recover previous versions of my document?",
    answer:
      "Yes! Writenex automatically saves every version as you type. Just open the version history panel to view, compare, or quickly restore any previous draft.",
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Hero section with main headline, value proposition, and primary CTA.
 *
 * The hero section is the first thing visitors see and communicates
 * the core value of Writenex: effortless Markdown writing.
 *
 * @component
 * @returns Hero section with badge, headline, subheadline, and CTA button
 */
function HeroSection(): React.ReactElement {
  return (
    <section className="px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <Zap className="h-4 w-4" />
          Free Forever • No Sign Up
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-4xl leading-tight font-bold text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
          Write Markdown,
          <br />
          <span className="tracking-wider text-blue-600 dark:text-blue-400">
            Effortlessly
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
          Just focus on your words. Write visually in a clean editor, and
          we&apos;ll handle the perfect Markdown export for you.
        </p>

        {/* CTA */}
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-lg font-normal text-white transition-colors hover:bg-blue-700"
        >
          Start Writing Now
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

/**
 * Features grid section showcasing Writenex capabilities.
 *
 * Displays a responsive grid of feature cards, each highlighting
 * a key capability like WYSIWYG editing, export, version history, etc.
 *
 * @component
 * @returns Section with header and 3-column responsive feature grid
 */
function FeaturesSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Everything You Need to Just Write
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            The Markdown editor that stays out of your way. Simple, powerful,
            and distraction-free.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {feature.title}
              </h3>
              <p className="leading-relaxed tracking-wide text-zinc-600 dark:text-zinc-400">
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
 * Call-to-action section encouraging users to start writing.
 *
 * A simple, focused section that reinforces the free, no-signup
 * nature of Writenex and provides another opportunity to convert.
 *
 * @component
 * @returns CTA section with headline, subtext, and button
 */
function CTASection(): React.ReactElement {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Ready to Write?
        </h2>
        <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
          It&apos;s free, no sign up needed. Just click and start typing
          immediately.
        </p>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-lg font-normal text-white transition-colors hover:bg-blue-700"
        >
          Start Typing Now
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

/**
 * "How It Works" section explaining the 3-step process.
 *
 * Visualizes the simple workflow: open editor, write, export.
 * Includes connector lines between steps on larger screens.
 *
 * @component
 * @returns Section with header, 3-step process visualization, and CTA
 */
function HowItWorksSection(): React.ReactElement {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Three simple steps to beautiful Markdown.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {/* Connector line (hidden on mobile, shown on md+) */}
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-[60%] hidden h-0.5 w-[80%] bg-linear-to-r from-blue-200 to-blue-100 md:block dark:from-blue-800 dark:to-blue-900" />
              )}

              {/* Step icon */}
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
                <step.icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {step.step}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {step.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-lg font-normal text-white transition-colors hover:bg-blue-700"
          >
            Open Editor
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ section with expandable accordion questions.
 *
 * Addresses common questions about pricing, privacy, features,
 * and usage. Uses the FAQAccordion client component for interactivity.
 *
 * @component
 * @returns Section with header and FAQ accordion
 * @see {@link FAQAccordion} - Interactive accordion component
 */
function FAQSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        {/* FAQ list */}
        <FAQAccordion faqs={faqs} />
      </div>
    </section>
  );
}

/**
 * Related section linking to @writenex/astro.
 */
function RelatedSection(): React.ReactElement {
  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Building with Astro?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                @writenex/astro brings visual editing to your content
                collections. Zero config, auto-discovery, and version history.
              </p>
            </div>
            <Link
              href="/astro"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-normal text-white transition-colors hover:bg-purple-700"
            >
              Learn More
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
 * Landing page component that showcases Writenex features and drives users to the editor.
 *
 * Composes all landing page sections and injects JSON-LD structured data
 * for SEO. The page is fully server-rendered for optimal performance.
 *
 * @component
 * @example
 * ```tsx
 * // This page is automatically rendered by Next.js App Router
 * // when visiting the root URL (/)
 * ```
 *
 * @returns The complete landing page with all sections and JSON-LD scripts
 */
export default function LandingPage(): React.ReactElement {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://writenex.com" },
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
        <RelatedSection />
      </main>
      <LandingFooter />
    </div>
  );
}
