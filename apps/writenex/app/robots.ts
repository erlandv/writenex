import type { MetadataRoute } from "next";

/**
 * Generate robots.txt for SEO.
 * Allows all crawlers to index the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://writenex.com/sitemap.xml",
  };
}
