/**
 * @fileoverview Terms of Use page for Writenex
 *
 * This page outlines the terms and conditions for using Writenex.
 * Since Writenex is a free, client-side application, the terms focus on:
 * - Software provided "as-is"
 * - User responsibility for data backup
 * - Acceptable use guidelines
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
    "Writenex Terms of Use. Understand the terms for using our free Markdown editor.",
  alternates: {
    canonical: "https://writenex.com/terms",
  },
  openGraph: {
    title: "Terms of Use | Writenex",
    description:
      "Writenex Terms of Use. Understand the terms for using our free Markdown editor.",
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

  const lastUpdated = "December 5, 2025";

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
            Welcome to Writenex. By accessing and using this website and
            application, you agree to be bound by these Terms of Use. Please
            read them carefully.
          </p>

          <h2>1. Acceptance of Terms</h2>

          <p>
            By using Writenex, you agree to these Terms of Use. If you do not
            agree with any part of these terms, you should not use the service.
          </p>

          <h2>2. Description of Service</h2>

          <p>
            Writenex is a free, web-based Markdown editor that runs entirely in
            your browser. The service allows you to:
          </p>

          <ul>
            <li>Create and edit Markdown documents</li>
            <li>Store documents locally in your browser</li>
            <li>Export documents to Markdown (.md) and HTML formats</li>
            <li>Access version history of your documents</li>
            <li>Use the application offline after initial load</li>
          </ul>

          <h2>3. No Account Required</h2>

          <p>
            Writenex does not require registration or an account. You can use
            all features immediately without providing any personal information.
          </p>

          <h2>4. Local Data Storage</h2>

          <h3>Your Responsibility</h3>

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

          <h3>Data Portability</h3>

          <p>
            You can export your documents at any time in Markdown or HTML
            format. We encourage you to maintain your own backups.
          </p>

          <h2>5. Acceptable Use</h2>

          <p>
            You agree to use Writenex only for lawful purposes. You may not:
          </p>

          <ul>
            <li>Use the service for any illegal activity</li>
            <li>Attempt to interfere with or disrupt the service</li>
            <li>
              Attempt to gain unauthorized access to any systems or networks
            </li>
            <li>
              Use automated systems to access the service in a harmful way
            </li>
          </ul>

          <h2>6. Intellectual Property</h2>

          <h3>Your Content</h3>

          <p>
            You retain full ownership of all content you create using Writenex.
            Since your content is stored locally and never transmitted to us, we
            have no claim or access to it.
          </p>

          <h3>Our Software</h3>

          <p>
            The Writenex application, including its design, code, and branding,
            is protected by intellectual property laws. The source code is
            available on{" "}
            <a
              href="https://github.com/erlandv/writenex"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{" "}
            under the MIT License.
          </p>

          <h2>7. Disclaimer of Warranties</h2>

          <p>
            <strong>
              WRITENEX IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND.
            </strong>
          </p>

          <p>We do not warrant that:</p>

          <ul>
            <li>The service will be uninterrupted or error-free</li>
            <li>Defects will be corrected</li>
            <li>The service is free of viruses or other harmful components</li>
            <li>The service will meet your specific requirements</li>
          </ul>

          <p>
            You use Writenex at your own risk. We make no guarantees about the
            reliability, availability, or suitability of the service.
          </p>

          <h2>8. Limitation of Liability</h2>

          <p>
            To the maximum extent permitted by law, Writenex and its creators
            shall not be liable for any:
          </p>

          <ul>
            <li>Loss of data or documents</li>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits, revenue, or business opportunities</li>
            <li>
              Damages arising from your use or inability to use the service
            </li>
          </ul>

          <h2>9. Service Availability</h2>

          <p>
            We strive to maintain Writenex&apos;s availability, but we do not
            guarantee uninterrupted access. We may:
          </p>

          <ul>
            <li>Modify or discontinue the service at any time</li>
            <li>
              Perform maintenance that may temporarily affect availability
            </li>
            <li>Update features without prior notice</li>
          </ul>

          <p>
            Since Writenex works offline, you can continue using it even if our
            servers are temporarily unavailable.
          </p>

          <h2>10. Changes to Terms</h2>

          <p>
            We may update these Terms of Use from time to time. Changes will be
            posted on this page with an updated date. Your continued use of
            Writenex after changes constitutes acceptance of the new terms.
          </p>

          <h2>11. Governing Law</h2>

          <p>
            These Terms of Use are governed by applicable law. Any disputes
            arising from these terms or your use of Writenex shall be resolved
            in accordance with applicable legal procedures.
          </p>

          <h2>12. Contact</h2>

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
