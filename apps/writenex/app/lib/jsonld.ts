/**
 * @fileoverview JSON-LD Structured Data Schemas
 *
 * Provides structured data schemas for SEO optimization.
 * These schemas help search engines understand the content
 * and can result in rich snippets in search results.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 *
 * @module lib/jsonld
 */

const SITE_URL = "https://writenex.com";
const SITE_NAME = "Writenex";

/**
 * WebSite schema - basic site information
 * Provides site name and search potential
 */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Free online Markdown editor with WYSIWYG editing. Write visually, export to .md or HTML. No sign-up required.",
  inLanguage: "en-US",
};

/**
 * Organization schema - brand information
 * Provides logo, name, and social links
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  sameAs: ["https://github.com/erlandv/writenex"],
};

/**
 * SoftwareApplication schema for landing page
 * Describes Writenex as a software application
 */
export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  description:
    "Free online Markdown editor with WYSIWYG editing. Write visually, export to .md or HTML. Auto-save, version history, multiple documents. No sign-up required.",
  url: SITE_URL,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web Browser",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "WYSIWYG Markdown editing - write visually",
    "Export to .md and HTML formats",
    "Auto-save with version history",
    "Multiple document tabs",
    "Focus mode for distraction-free writing",
    "Works offline - no internet required",
    "No account or sign-up needed",
    "30+ keyboard shortcuts",
    "Dark mode support",
  ],
  screenshot: `${SITE_URL}/opengraph-image.png`,
  softwareVersion: "1.0",
  author: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
};

/**
 * WebApplication schema for editor page
 * Describes the editor as a web application
 */
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: `${SITE_NAME} Editor`,
  description:
    "The Markdown editor that stays out of your way. Write visually in a clean editor, and we'll handle the perfect Markdown export for you.",
  url: `${SITE_URL}/editor`,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web Browser",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "WYSIWYG Markdown editing",
    "Source mode with syntax highlighting",
    "Split view with diff comparison",
    "Auto-save every 3 seconds",
    "Version history with restore",
    "Multiple document tabs",
    "Search and replace with regex",
    "Focus mode",
    "Export to Markdown and HTML",
    "30+ keyboard shortcuts",
  ],
  author: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
};

/**
 * BreadcrumbList schema generator
 * Creates breadcrumb schema for any page
 *
 * @param items - Array of breadcrumb items with name and url
 * @returns BreadcrumbList schema object
 */
export function createBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQ schema for landing page
 * Provides FAQ rich snippets in search results
 */
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Writenex really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Writenex is completely free to use. There are no hidden fees, premium tiers, or paywalls. All features are available to everyone at no cost.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to create an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No account or sign-up is required. Just open the editor and start writing immediately. Your documents are saved locally in your browser.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data safe and private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, your data stays 100% private. All documents are stored locally in your browser using IndexedDB. Nothing is sent to any server. Your words never leave your device.",
      },
    },
    {
      "@type": "Question",
      name: "What formats can I export to?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can export your documents to Markdown (.md) or HTML (.html) formats. You can also copy the content as Markdown or HTML directly to your clipboard.",
      },
    },
    {
      "@type": "Question",
      name: "Does it work offline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Writenex works completely offline after the initial load. Your documents are stored locally, so you can write anytime, anywhere, even without an internet connection.",
      },
    },
    {
      "@type": "Question",
      name: "Can I recover previous versions of my document?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Writenex automatically saves versions of your document as you write. You can access the version history panel to view, compare, and restore any previous version.",
      },
    },
  ],
};
