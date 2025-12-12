/**
 * @fileoverview Terms of Use page for Writenex
 *
 * This page outlines the terms and conditions for using Writenex products:
 * - Writenex Editor: Free, client-side Markdown editor
 * - @writenex/astro: Visual editor integration for Astro content collections
 *
 * Since both products run locally (browser/filesystem), the terms focus on:
 * - Software provided "as-is"
 * - User responsibility for data backup
 * - Acceptable use guidelines
 * - Open source licensing
 *
 * @module app/terms/page
 */

import type { Metadata } from "next";
import { createBreadcrumbSchema } from "@/app/lib/jsonld";
import { LandingHeader, LandingFooter } from "@/components/landing";

/**
 * Metadata for the Terms of Use page.
 */
export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Writenex Terms of Use. Understand the terms for using Writenex Editor and @writenex/astro.",
  alternates: {
    canonical: "https://writenex.com/terms",
  },
  openGraph: {
    title: "Terms of Use | Writenex",
    description:
      "Writenex Terms of Use. Understand the terms for using Writenex Editor and @writenex/astro.",
    type: "website",
  },
};

/**
 * Terms of Use page component.
 *
 * @returns The Terms of Use page with all sections
 */
export default function TermsOfUsePage(): React.ReactElement {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://writenex.com" },
    { name: "Terms of Use", url: "https://writenex.com/terms" },
  ]);

  const lastUpdated = "December 11, 2025";

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

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <h1>Terms of Use</h1>

          <p className="lead text-zinc-600 dark:text-zinc-400">
            Last updated: {lastUpdated}
          </p>

          <p>
            Welcome to Writenex. By accessing and using this website,
            applications, or software packages, you agree to be bound by these
            Terms of Use. Please read them carefully.
          </p>

          <h2>1. Acceptance of Terms</h2>

          <p>
            By using any Writenex product, you agree to these Terms of Use. If
            you do not agree with any part of these terms, you should not use
            the services.
          </p>

          <h2>2. Description of Services</h2>

          <p>Writenex provides the following products:</p>

          <h3>Writenex Editor</h3>

          <p>
            A free, web-based Markdown editor that runs entirely in your
            browser. The editor allows you to:
          </p>

          <ul>
            <li>Create and edit Markdown documents</li>
            <li>Store documents locally in your browser</li>
            <li>Export documents to Markdown (.md) and HTML formats</li>
            <li>Access version history of your documents</li>
            <li>Use the application offline after initial load</li>
          </ul>

          <h3>@writenex/astro</h3>

          <p>
            An npm package that provides a visual editor for Astro content
            collections. This package:
          </p>

          <ul>
            <li>Runs entirely on your local development environment</li>
            <li>Provides WYSIWYG editing for your Astro content files</li>
            <li>Reads and writes directly to your local filesystem</li>
            <li>Is disabled by default in production builds</li>
            <li>Does not transmit any data to external servers</li>
          </ul>

          <h2>3. No Account Required</h2>

          <p>
            Writenex products do not require registration or an account. You can
            use all features immediately without providing any personal
            information.
          </p>

          <h2>4. Local Data Storage</h2>

          <h3>Writenex Editor</h3>

          <p>
            All your documents and data are stored locally in your browser using
            IndexedDB. This means:
          </p>

          <ul>
            <li>
              <strong>You are responsible for backing up your data.</strong> We
              recommend regularly exporting important documents.
            </li>
            <li>
              <strong>Data loss can occur</strong> if you clear your browser
              data, uninstall the PWA, or switch devices.
            </li>
            <li>
              <strong>We cannot recover lost data.</strong> Since data is stored
              only on your device, we have no backup copies.
            </li>
          </ul>

          <h3>@writenex/astro</h3>

          <p>Content is stored in your local project filesystem. This means:</p>

          <ul>
            <li>
              <strong>You are responsible for your project files.</strong> Use
              version control (Git) to track changes.
            </li>
            <li>
              <strong>The package modifies files directly.</strong> Changes are
              written to your content directory.
            </li>
            <li>
              <strong>Version history is stored locally.</strong> Shadow copies
              are saved in your project&apos;s .writenex directory.
            </li>
          </ul>

          <h3>Data Portability</h3>

          <p>
            You can export your documents at any time. For Writenex Editor, use
            the export feature. For @writenex/astro, your content files are
            already in standard Markdown format in your project.
          </p>

          <h2>5. Acceptable Use</h2>

          <p>
            You agree to use Writenex products only for lawful purposes. You may
            not:
          </p>

          <ul>
            <li>Use the services for any illegal activity</li>
            <li>Attempt to interfere with or disrupt the services</li>
            <li>
              Attempt to gain unauthorized access to any systems or networks
            </li>
            <li>
              Use automated systems to access the services in a harmful way
            </li>
          </ul>

          <h2>6. Intellectual Property</h2>

          <h3>Your Content</h3>

          <p>
            You retain full ownership of all content you create using Writenex
            products. Since your content is stored locally and never transmitted
            to us, we have no claim or access to it.
          </p>

          <h3>Our Software</h3>

          <p>
            All Writenex software, including Writenex Editor and
            @writenex/astro, is open source and available on{" "}
            <a
              href="https://github.com/erlandv/writenex"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{" "}
            under the MIT License. You are free to use, modify, and distribute
            the software in accordance with the license terms.
          </p>

          <h2>7. Disclaimer of Warranties</h2>

          <p>
            <strong>
              WRITENEX PRODUCTS ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND.
            </strong>
          </p>

          <p>We do not warrant that:</p>

          <ul>
            <li>The services will be uninterrupted or error-free</li>
            <li>Defects will be corrected</li>
            <li>
              The services are free of viruses or other harmful components
            </li>
            <li>The services will meet your specific requirements</li>
          </ul>

          <p>
            You use Writenex products at your own risk. We make no guarantees
            about the reliability, availability, or suitability of the services.
          </p>

          <h2>8. Limitation of Liability</h2>

          <p>
            To the maximum extent permitted by law, Writenex and its creators
            shall not be liable for any:
          </p>

          <ul>
            <li>Loss of data, documents, or content files</li>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits, revenue, or business opportunities</li>
            <li>
              Damages arising from your use or inability to use the services
            </li>
            <li>
              Damages resulting from modifications to your project files by
              @writenex/astro
            </li>
          </ul>

          <h2>9. Service and Package Availability</h2>

          <p>
            We strive to maintain availability, but we do not guarantee
            uninterrupted access. We may:
          </p>

          <ul>
            <li>Modify or discontinue services at any time</li>
            <li>
              Perform maintenance that may temporarily affect availability
            </li>
            <li>Update features or packages without prior notice</li>
            <li>Deprecate or remove npm packages</li>
          </ul>

          <p>
            Writenex Editor works offline after initial load. @writenex/astro
            runs entirely locally and does not depend on our servers.
          </p>

          <h2>10. @writenex/astro Specific Terms</h2>

          <p>When using @writenex/astro, you additionally acknowledge that:</p>

          <ul>
            <li>
              <strong>Filesystem access:</strong> The package reads and writes
              files in your project directory. You are responsible for ensuring
              proper backups.
            </li>
            <li>
              <strong>Development use:</strong> The package is intended for
              development environments. Enabling it in production is at your own
              risk.
            </li>
            <li>
              <strong>No telemetry:</strong> The package does not collect usage
              data or send information to external servers.
            </li>
            <li>
              <strong>Compatibility:</strong> We do not guarantee compatibility
              with all Astro versions or configurations.
            </li>
          </ul>

          <h2>11. Changes to Terms</h2>

          <p>
            We may update these Terms of Use from time to time. Changes will be
            posted on this page with an updated date. Your continued use of
            Writenex products after changes constitutes acceptance of the new
            terms.
          </p>

          <h2>12. Governing Law</h2>

          <p>
            These Terms of Use are governed by applicable law. Any disputes
            arising from these terms or your use of Writenex products shall be
            resolved in accordance with applicable legal procedures.
          </p>

          <h2>13. Contact</h2>

          <p>
            If you have questions about these Terms of Use, you can reach us
            through our{" "}
            <a
              href="https://github.com/erlandv/writenex"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              GitHub repository
            </a>
            .
          </p>

          <hr />

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            These Terms of Use are effective as of {lastUpdated}.
          </p>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
