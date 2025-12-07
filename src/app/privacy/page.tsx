/**
 * @fileoverview Privacy Policy page for Writenex
 *
 * This page explains Writenex's privacy practices in clear, simple terms.
 * Since Writenex is a client-side application that stores data locally,
 * the privacy policy emphasizes the absence of data collection.
 *
 * ## Key Points:
 * - No data collection - everything stays in the browser
 * - No analytics or tracking
 * - No cookies (except localStorage for preferences)
 * - No server communication for user content
 *
 * @module app/privacy/page
 */

import type { Metadata } from "next";
import { createBreadcrumbSchema } from "@/lib/jsonld";
import { LandingHeader, LandingFooter } from "@/components/landing";

/**
 * Metadata for the Privacy Policy page.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Writenex Privacy Policy. Learn how we protect your privacy - your data stays on your device, we collect nothing.",
  alternates: {
    canonical: "https://writenex.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Writenex",
    description:
      "Writenex Privacy Policy. Your data stays on your device - we collect nothing.",
    type: "website",
  },
};

/**
 * Privacy Policy page component.
 *
 * @returns The Privacy Policy page with all sections
 */
export default function PrivacyPolicyPage(): React.ReactElement {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://writenex.com" },
    { name: "Privacy Policy", url: "https://writenex.com/privacy" },
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
          <h1>Privacy Policy</h1>

          <p className="lead text-zinc-600 dark:text-zinc-400">
            Last updated: {lastUpdated}
          </p>

          <p>
            At Writenex, we believe your writing is yours and yours alone. This
            Privacy Policy explains how we handle your data - which is simple:
            we do not collect it.
          </p>

          <h2>The Short Version</h2>

          <ul>
            <li>
              <strong>We do not collect your data.</strong> Your documents never
              leave your device.
            </li>
            <li>
              <strong>We do not use analytics or tracking.</strong> No Google
              Analytics, no cookies for tracking.
            </li>
            <li>
              <strong>We do not require an account.</strong> No email, no
              password, no personal information needed.
            </li>
            <li>
              <strong>Your content stays local.</strong> Everything is stored in
              your browser using IndexedDB.
            </li>
          </ul>

          <h2>Data Storage</h2>

          <h3>What We Store Locally</h3>

          <p>
            Writenex stores the following data in your browser&apos;s local
            storage (IndexedDB):
          </p>

          <ul>
            <li>
              <strong>Documents:</strong> Your Markdown documents and their
              content
            </li>
            <li>
              <strong>Version History:</strong> Previous versions of your
              documents for recovery
            </li>
            <li>
              <strong>Images:</strong> Any images you insert into your documents
              (stored as base64)
            </li>
            <li>
              <strong>Preferences:</strong> Theme setting (light/dark/system),
              view mode, and other UI preferences
            </li>
          </ul>

          <p>
            This data is stored entirely on your device. We have no access to
            it, and it is never transmitted to any server.
          </p>

          <h3>How to Delete Your Data</h3>

          <p>Since all data is stored locally, you have full control:</p>

          <ul>
            <li>
              <strong>Individual documents:</strong> Use the delete option in
              the document tabs menu
            </li>
            <li>
              <strong>All data:</strong> Clear your browser&apos;s site data for
              writenex.com, or uninstall the PWA
            </li>
          </ul>

          <h2>No Tracking or Analytics</h2>

          <p>We do not use:</p>

          <ul>
            <li>Google Analytics or any analytics service</li>
            <li>Tracking pixels or beacons</li>
            <li>Third-party cookies</li>
            <li>Fingerprinting or any identification technology</li>
          </ul>

          <h2>Service Worker and Offline Usage</h2>

          <p>
            Writenex uses a Service Worker to enable offline functionality. The
            Service Worker:
          </p>

          <ul>
            <li>Caches application assets (HTML, CSS, JavaScript, fonts)</li>
            <li>Enables the app to work without an internet connection</li>
            <li>
              Does <strong>not</strong> collect or transmit any user data
            </li>
          </ul>

          <h2>Third-Party Services</h2>

          <p>
            Writenex is hosted on a server that may log standard web server
            access logs (IP addresses, timestamps, pages visited). These logs
            are used solely for server maintenance and security purposes and are
            not used for tracking individual users.
          </p>

          <p>
            We do not integrate with any third-party services that collect user
            data.
          </p>

          <h2>Data Security</h2>

          <p>
            Your data security is ensured by the browser&apos;s built-in
            security mechanisms:
          </p>

          <ul>
            <li>
              IndexedDB data is sandboxed and only accessible by writenex.com
            </li>
            <li>
              HTTPS encryption protects data in transit when loading the
              application
            </li>
            <li>No server-side database means no server-side breach risk</li>
          </ul>

          <p>
            <strong>Important:</strong> Since data is stored locally, you are
            responsible for backing up important documents by exporting them.
            Clearing browser data or reinstalling will delete your local data.
          </p>

          <h2>Children&apos;s Privacy</h2>

          <p>
            Writenex does not knowingly collect any information from anyone,
            including children under 13. Since we do not collect personal
            information, there is no age-related data concern.
          </p>

          <h2>Changes to This Policy</h2>

          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated &quot;Last updated&quot; date.
            Since we do not collect email addresses, we cannot notify you
            directly of changes.
          </p>

          <h2>Contact</h2>

          <p>
            If you have questions about this Privacy Policy, you can reach us
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
            This Privacy Policy is effective as of {lastUpdated}.
          </p>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
