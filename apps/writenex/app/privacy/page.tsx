/**
 * @fileoverview Privacy Policy page for Writenex
 *
 * This page explains Writenex's privacy practices in clear, simple terms.
 * Covers both Writenex Editor and @writenex/astro package.
 *
 * ## Key Points:
 * - No data collection - everything stays local (browser/filesystem)
 * - No analytics or tracking
 * - No cookies (except localStorage for preferences)
 * - No server communication for user content
 * - No telemetry in npm packages
 *
 * @module app/privacy/page
 */

import type { Metadata } from "next";
import { createBreadcrumbSchema } from "@/app/lib/jsonld";
import { LandingHeader, LandingFooter } from "@/components/landing";

/**
 * Metadata for the Privacy Policy page.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Writenex Privacy Policy. Learn how we protect your privacy - your data stays local, we collect nothing.",
  alternates: {
    canonical: "https://writenex.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Writenex",
    description:
      "Writenex Privacy Policy. Your data stays local - we collect nothing.",
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
          <h1>Privacy Policy</h1>

          <p className="lead text-zinc-600 dark:text-zinc-400">
            Last updated: {lastUpdated}
          </p>

          <p>
            At Writenex, we believe your content is yours and yours alone. This
            Privacy Policy explains how we handle your data across all Writenex
            products - which is simple: we do not collect it.
          </p>

          <h2>The Short Version</h2>

          <ul>
            <li>
              <strong>We do not collect your data.</strong> Your content never
              leaves your device.
            </li>
            <li>
              <strong>We do not use analytics or tracking.</strong> No Google
              Analytics, no cookies for tracking, no telemetry.
            </li>
            <li>
              <strong>We do not require an account.</strong> No email, no
              password, no personal information needed.
            </li>
            <li>
              <strong>Your content stays local.</strong> Writenex Editor stores
              data in your browser. @writenex/astro stores data in your project
              files.
            </li>
          </ul>

          <h2>Data Storage</h2>

          <h3>Writenex Editor</h3>

          <p>
            Writenex Editor stores the following data in your browser&apos;s
            local storage (IndexedDB):
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

          <h3>@writenex/astro</h3>

          <p>
            @writenex/astro is an npm package that runs entirely on your local
            machine. It stores:
          </p>

          <ul>
            <li>
              <strong>Content files:</strong> Your Markdown content in your
              project&apos;s src/content directory
            </li>
            <li>
              <strong>Version history:</strong> Shadow copies in your
              project&apos;s .writenex/versions directory
            </li>
            <li>
              <strong>Images:</strong> Uploaded images in your project
              (colocated with content or in public folder)
            </li>
          </ul>

          <p>
            All data remains in your local project directory. The package does
            not send any data to external servers, does not include telemetry,
            and does not phone home.
          </p>

          <h3>How to Delete Your Data</h3>

          <p>Since all data is stored locally, you have full control:</p>

          <ul>
            <li>
              <strong>Writenex Editor:</strong> Use the delete option in the
              document tabs menu, or clear your browser&apos;s site data for
              writenex.com
            </li>
            <li>
              <strong>@writenex/astro:</strong> Delete files from your project
              directory, or remove the .writenex folder to clear version history
            </li>
          </ul>

          <h2>No Tracking or Analytics</h2>

          <p>We do not use:</p>

          <ul>
            <li>Google Analytics or any analytics service</li>
            <li>Tracking pixels or beacons</li>
            <li>Third-party cookies</li>
            <li>Fingerprinting or any identification technology</li>
            <li>Telemetry in our npm packages</li>
            <li>Usage data collection of any kind</li>
          </ul>

          <h2>Service Worker and Offline Usage</h2>

          <p>
            Writenex Editor uses a Service Worker to enable offline
            functionality. The Service Worker:
          </p>

          <ul>
            <li>Caches application assets (HTML, CSS, JavaScript, fonts)</li>
            <li>Enables the app to work without an internet connection</li>
            <li>
              Does <strong>not</strong> collect or transmit any user data
            </li>
          </ul>

          <h2>npm Package Privacy</h2>

          <p>@writenex/astro is distributed via npm. When you install it:</p>

          <ul>
            <li>
              npm may collect installation statistics (this is npm&apos;s
              policy, not ours)
            </li>
            <li>
              The package itself does not send any data to Writenex or any third
              party
            </li>
            <li>
              The package runs entirely locally and only accesses your local
              filesystem
            </li>
            <li>
              No network requests are made by the package except to serve the
              local editor UI
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

          <h3>Writenex Editor</h3>

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

          <h3>@writenex/astro</h3>

          <p>Security considerations for the npm package:</p>

          <ul>
            <li>
              The package only runs during development (disabled in production
              by default)
            </li>
            <li>Filesystem access is limited to your project directory</li>
            <li>
              The editor UI is served locally and not exposed to the internet
            </li>
            <li>
              You should use version control (Git) to track and recover content
              changes
            </li>
          </ul>

          <p>
            <strong>Important:</strong> Do not enable @writenex/astro in
            production without proper authentication, as it provides filesystem
            write access.
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
