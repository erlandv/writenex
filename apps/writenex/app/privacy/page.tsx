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
          <h1>Privacy Policy</h1>

          <p className="lead text-zinc-600 dark:text-zinc-400">
            Last updated: {lastUpdated}
          </p>

          <p>
            At Writenex, we believe your content is yours and yours alone. This
            Privacy Policy explains how data is handled when you use Writenex
            products. In short, Writenex is designed so your content stays on
            your device and is not collected or processed by us at the
            application level.
          </p>

          <h2>The Short Version</h2>

          <ul>
            <li>
              <strong>We do not collect your data.</strong> Your content does
              not leave your device.
            </li>
            <li>
              <strong>We do not sell or share data.</strong> We have no user
              data to sell or share.
            </li>
            <li>
              <strong>We do not use analytics or tracking.</strong> No cookies
              for tracking, no telemetry, no analytics services.
            </li>
            <li>
              <strong>We do not require an account.</strong> No email, no
              password, no personal information.
            </li>
            <li>
              <strong>Your content stays local.</strong> Writenex Editor stores
              data in your browser.{" "}
              <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                @writenex/astro
              </code>{" "}
              stores data in your project files.
            </li>
          </ul>

          <h2>Data Storage</h2>

          <h3>Writenex Editor</h3>

          <p>
            Writenex Editor stores the following data locally in your browser
            using local storage (IndexedDB):
          </p>

          <ul>
            <li>
              <strong>Documents:</strong> Your Markdown documents and their
              content
            </li>
            <li>
              <strong>Version History:</strong> Previous document versions for
              recovery
            </li>
            <li>
              <strong>Images:</strong> Images inserted into documents, stored as{" "}
              <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                base64
              </code>{" "}
              for local portability
            </li>
            <li>
              <strong>Preferences:</strong> Theme selection, view mode, and
              other interface preferences
            </li>
          </ul>

          <p>
            All of this data is stored entirely on your device. We do not have
            access to it, and it is never transmitted to any Writenex server.
          </p>

          <h3>@writenex/astro</h3>

          <p>
            @writenex/astro is an npm package that runs entirely on your local
            machine. It stores:
          </p>

          <ul>
            <li>
              <strong>Content files:</strong> Markdown files inside your
              project&apos;s{" "}
              <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                src/content
              </code>{" "}
              directory
            </li>
            <li>
              <strong>Version history:</strong> Shadow copies in your
              project&apos;s{" "}
              <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                .writenex/versions
              </code>{" "}
              directory
            </li>
            <li>
              <strong>Images:</strong> Uploaded images stored within your
              project, either alongside content or in the public folder
            </li>
          </ul>

          <p>
            All data remains inside your local project directory. The package
            does not include telemetry, does not send data to external servers,
            and does not communicate with Writenex services.
          </p>

          <h3>How to Delete Your Data</h3>

          <p>
            Because all data is stored locally, you have full control over
            deletion:
          </p>

          <ul>
            <li>
              <strong>Writenex Editor:</strong> Delete documents using the
              editor interface or clear site data for writenex.com in your
              browser settings
            </li>
            <li>
              <strong>@writenex/astro:</strong> Delete files from your project
              directory or remove the{" "}
              <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                .writenex
              </code>{" "}
              folder to clear version history
            </li>
          </ul>

          <p>Deletion is permanent and cannot be undone.</p>

          <h2>No Tracking or Analytics</h2>

          <p>Writenex does not use:</p>

          <ul>
            <li>Analytics services of any kind</li>
            <li>Tracking pixels or beacons</li>
            <li>Third-party cookies</li>
            <li>Fingerprinting or identification technologies</li>
            <li>Telemetry or usage reporting in npm packages</li>
            <li>Usage data collection of any kind</li>
            <li>Error tracking or crash reporting services</li>
          </ul>

          <h2>Service Worker and Offline Usage</h2>

          <p>
            Writenex Editor uses a Service Worker to support offline
            functionality. The Service Worker:
          </p>

          <ul>
            <li>
              Caches application assets such as HTML, CSS, JavaScript, and fonts
            </li>
            <li>
              Allows the editor to function without an internet connection
            </li>
            <li>Operates only within the writenex.com origin</li>
            <li>Does not collect, process, or transmit user data</li>
          </ul>

          <h2>npm Package Privacy</h2>

          <p>
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              @writenex/astro
            </code>{" "}
            is distributed via npm. When installing or using the package:
          </p>

          <ul>
            <li>
              npm itself may collect installation statistics according to npm's
              own policies
            </li>
            <li>
              The package does not send any data to Writenex or third parties
            </li>
            <li>All execution happens locally on your machine</li>
            <li>
              Network access is limited to localhost usage required to serve the
              local editor interface
            </li>
          </ul>

          <h2>Third-Party Services</h2>

          <p>
            Writenex does not integrate with third party services that collect
            user data.
          </p>

          <p>
            Our website is hosted on infrastructure that may generate standard
            web server access logs, such as IP addresses, timestamps, and
            requested pages. These logs:
          </p>

          <ul>
            <li>Are used only for basic maintenance and security</li>
            <li>Do not include document content or editor activity</li>
            <li>Are not used for analytics or user profiling</li>
          </ul>

          <h2>Data Security</h2>

          <h3>Writenex Editor</h3>

          <p>Data security relies on browser built in protections:</p>

          <ul>
            <li>
              IndexedDB data is sandboxed and accessible only to the
              writenex.com origin
            </li>
            <li>HTTPS encryption protects application assets during loading</li>
            <li>
              No server side database means there is no server side content
              storage
            </li>
          </ul>

          <p>
            Because data is stored locally, you are responsible for backing up
            important documents. Clearing browser data, uninstalling the
            browser, or using a different device will remove access to stored
            content.
          </p>

          <p>
            Browser extensions may have access to local data depending on
            permissions you grant to them.
          </p>

          <h3>@writenex/astro</h3>

          <p>Security considerations for the npm package include:</p>

          <ul>
            <li>
              The package is intended for development use and is disabled in
              production by default
            </li>
            <li>Filesystem access is limited to your project directory</li>
            <li>
              The editor interface is served locally and not exposed to the
              public internet
            </li>
            <li>
              Version control systems such as Git are recommended for backup and
              recovery
            </li>
          </ul>

          <p>
            <strong>Important:</strong> Do not enable{" "}
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              @writenex/astro
            </code>{" "}
            in production environments without proper authentication, as it
            provides write access to your filesystem.
          </p>

          <h2>Children's Privacy</h2>

          <p>
            Writenex does not knowingly collect information from anyone,
            including children under the age of 13. Because Writenex does not
            collect personal data, no age related data is processed.
          </p>

          <p>
            If you are a parent or guardian and believe a child has provided
            personal information through misuse of the service, please contact
            us.
          </p>

          <h2>Changes to This Policy</h2>

          <p>
            We may update this Privacy Policy from time to time. Any changes
            will be posted on this page with an updated{" "}
            <strong>"Last updated"</strong> date. Since we do not collect email
            addresses or user accounts, we cannot provide direct notifications
            of policy changes.
          </p>

          <h2>Contact</h2>

          <p>
            If you have questions about this Privacy Policy or Writenex's
            privacy practices, you can contact us through the Writenex GitHub
            repository at{" "}
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
            This Privacy Policy is effective as of {lastUpdated}.
          </p>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
