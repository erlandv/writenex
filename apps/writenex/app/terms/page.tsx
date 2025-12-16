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

  const lastUpdated = "December 13, 2025";

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
            Welcome to Writenex. By accessing or using any Writenex website,
            application, or software package, including open source
            distributions and local installations, you agree to these Terms of
            Use. If you do not agree to these terms, you should not use Writenex
            products.
          </p>

          <h2>1. Acceptance of Terms</h2>

          <p>
            By using any Writenex product, you acknowledge that you have read,
            understood, and agreed to these Terms of Use. Your agreement applies
            regardless of whether you create an account or are required to click
            an explicit acceptance button.
          </p>

          <h2>2. Description of Services</h2>

          <p>
            Writenex provides the following products and features, which may
            evolve over time.
          </p>

          <h3>Writenex Editor</h3>

          <p>
            Writenex Editor is a free, web based Markdown editor that runs
            entirely in your browser. It allows you to:
          </p>

          <ul>
            <li>Create and edit Markdown documents</li>
            <li>Store documents locally in your browser</li>
            <li>Export documents to Markdown (.md) and HTML formats</li>
            <li>Access local version history for document recovery</li>
            <li>Use the editor offline after the initial load</li>
          </ul>

          <h3>@writenex/astro</h3>

          <p>
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              @writenex/astro
            </code>{" "}
            is an npm package that provides a visual editor for{" "}
            <a
              href="https://docs.astro.build/en/guides/content-collections/"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              Astro Content Collections
            </a>
            . The package:
          </p>

          <ul>
            <li>Runs entirely in your local development environment</li>
            <li>Provides visual editing for Astro content files</li>
            <li>Reads from and writes to your local filesystem</li>
            <li>Is disabled by default in production builds</li>
            <li>Does not transmit data to external servers</li>
          </ul>

          <h2>3. No Account Required</h2>

          <p>
            Writenex products do not require registration or user accounts. You
            may use all features without providing personal information.
          </p>

          <h2>4. Local Data Storage</h2>

          <p>
            Writenex products are designed to store data locally by default.
          </p>

          <h3>Writenex Editor</h3>

          <p>
            All documents and related data are stored locally in your browser
            using IndexedDB. By using the editor, you acknowledge that:
          </p>

          <ul>
            <li>
              You are responsible for backing up your data by exporting
              documents
            </li>
            <li>
              Data may be lost if you clear browser data, reinstall the browser,
              or switch devices
            </li>
            <li>
              We cannot recover lost data because no server side backups exist
            </li>
          </ul>

          <h3>@writenex/astro</h3>

          <p>
            Content edited through{" "}
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              @writenex/astro
            </code>{" "}
            is stored directly in your local project filesystem. By using the
            package, you acknowledge that:
          </p>

          <ul>
            <li>
              You are responsible for managing and backing up your project files
            </li>
            <li>
              The package writes changes directly to your content directories
            </li>
            <li>
              Local version history is stored in the{" "}
              <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                .writenex
              </code>{" "}
              directory within your project
            </li>
            <li>
              We cannot recover lost data because no server side backups exist
            </li>
          </ul>

          <h3>Data Portability</h3>

          <p>
            You may export your data at any time. Writenex Editor provides
            export functionality, and{" "}
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              @writenex/astro
            </code>{" "}
            stores content in standard Markdown files within your project.
          </p>

          <h2>5. Acceptable Use</h2>

          <p>
            You agree to use Writenex products only for lawful purposes. You may
            not:
          </p>

          <ul>
            <li>Use the products for illegal activities</li>
            <li>Interfere with or disrupt the operation of the products</li>
            <li>Attempt to gain unauthorized access to systems or networks</li>
            <li>Use automated access in a manner that causes harm or abuse</li>
          </ul>

          <h2>6. Intellectual Property</h2>

          <h3>Your Content</h3>

          <p>
            You retain full ownership of all content you create using Writenex
            products. Because content is stored locally and not transmitted to
            us, Writenex does not claim ownership of or access to your content.
          </p>

          <h3>Our Software</h3>

          <p>
            Writenex software is open source and available on GitHub under the{" "}
            <a
              href="https://pitt.libguides.com/openlicensing/MIT"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              MIT License
            </a>
            . The MIT License governs the use, modification, and distribution of
            the software itself. These Terms of Use apply to your use of
            Writenex products and do not replace or modify the applicable open
            source licenses.
          </p>

          <h3>Name, Logo, and Branding</h3>

          <p>
            The Writenex name, logo, and visual identity are not covered by the
            MIT License.
          </p>

          <p>
            Permission to use, modify, and distribute the Writenex source code
            under the MIT License does not grant permission to use the Writenex
            name, logo, or branding in a way that suggests endorsement,
            affiliation, or official status.
          </p>

          <p>
            You may refer to Writenex in a descriptive manner, such as when
            attributing the original project or describing compatibility, but
            you may not present modified versions, forks, or derivative works as
            official Writenex products.
          </p>

          <h2>7. Disclaimer of Warranties</h2>

          <p>
            <strong>
              WRITENEX PRODUCTS ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE"
              BASIS WITHOUT WARRANTIES OF ANY KIND.
            </strong>
          </p>

          <p>We do not warrant that:</p>

          <ul>
            <li>The products will be uninterrupted or error free</li>
            <li>Defects will be corrected</li>
            <li>
              The products or their dependencies are free from harmful
              components
            </li>
            <li>The products will meet your specific requirements</li>
          </ul>

          <p>
            You use Writenex products at your own risk. We make no guarantees
            about the reliability, availability, or suitability of the services.
          </p>

          <h2>8. Limitation of Liability</h2>

          <p>
            To the maximum extent permitted by applicable law, Writenex and its
            creators are not liable for any:
          </p>

          <ul>
            <li>Loss of data, documents, or project files</li>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits, revenue, or business opportunities</li>
            <li>
              Damages arising from your use or inability to use the products
            </li>
            <li>
              Damages resulting from filesystem modifications performed by
              <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                @writenex/astro
              </code>
            </li>
          </ul>

          <h2>9. Service and Package Availability</h2>

          <p>
            Writenex does not guarantee continuous or uninterrupted
            availability. We may:
          </p>

          <ul>
            <li>Modify, suspend, or discontinue products at any time</li>
            <li>Perform maintenance that affects availability</li>
            <li>Update features or packages without prior notice</li>
            <li>Deprecate or remove npm packages</li>
          </ul>

          <p>
            Offline availability does not imply guarantees regarding data
            persistence or recovery.
          </p>

          <h2>10. @writenex/astro Specific Terms</h2>

          <p>
            When using{" "}
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              @writenex/astro
            </code>
            , you acknowledge and agree that:
          </p>

          <ul>
            <li>
              The package reads and writes files within your project directory
            </li>
            <li>
              You are responsible for system permissions granted to the package
            </li>
            <li>The package is intended for development use</li>
            <li>
              Enabling the package in production environments is at your own
              risk
            </li>
            <li>
              Compatibility with all Astro versions or configurations is not
              guaranteed
            </li>
          </ul>

          <h2>11. Changes to Terms</h2>

          <p>
            We may update these Terms of Use from time to time. Updated terms
            will be posted on this page with a revised{" "}
            <strong>"Last updated"</strong> date. Continued use of Writenex
            products after changes constitutes acceptance of the updated terms.
          </p>

          <h2>12. Governing Law</h2>

          <p>
            These Terms of Use are governed by applicable law. Any disputes
            arising from these terms or your use of Writenex products shall be
            resolved in accordance with applicable legal procedures.
          </p>

          <h2>13. Contact</h2>

          <p>
            If you have questions about these Terms of Use, you can contact us
            through the Writenex GitHub repository at{" "}
            <a
              href="https://github.com/erlandv/writenex"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              https://github.com/erlandv/writenex
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
