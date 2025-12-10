/**
 * @fileoverview HTML Export Utilities
 *
 * This module provides functions for converting Markdown content to HTML
 * in various formats: fragment (for embedding) and full page (standalone).
 *
 * ## Features:
 * - Markdown to HTML fragment conversion
 * - Full HTML page generation with inline styling
 * - Clipboard copy functionality
 * - File download functionality
 *
 * ## Styling:
 * The full HTML page includes minimal, responsive typography that renders
 * well in any browser without external dependencies.
 *
 * @module lib/exportHtml
 * @see {@link Header} - Uses these utilities for export menu actions
 */

import { marked } from "marked";

/**
 * Inline CSS styles for the full HTML page export.
 * Provides minimal, readable typography that works without external dependencies.
 */
const HTML_STYLES = [
  "* { box-sizing: border-box; }",
  "body {",
  "  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;",
  "  line-height: 1.6;",
  "  max-width: 65ch;",
  "  margin: 2rem auto;",
  "  padding: 0 1rem;",
  "  color: #1a1a1a;",
  "  background: #ffffff;",
  "}",
  "h1, h2, h3, h4, h5, h6 {",
  "  line-height: 1.3;",
  "  margin-top: 1.5em;",
  "  margin-bottom: 0.5em;",
  "  font-weight: 600;",
  "}",
  "h1 { font-size: 2em; margin-top: 0; }",
  "h2 { font-size: 1.5em; }",
  "h3 { font-size: 1.25em; }",
  "h4 { font-size: 1.1em; }",
  "p { margin: 1em 0; }",
  "a { color: #335DFF; text-decoration: underline; }",
  "a:hover { color: #1a3fd4; }",
  "pre {",
  "  background: #f5f5f5;",
  "  padding: 1rem;",
  "  overflow-x: auto;",
  "  border-radius: 6px;",
  "  font-size: 0.9em;",
  "}",
  "code {",
  "  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Liberation Mono', Menlo, monospace;",
  "  background: #f5f5f5;",
  "  padding: 0.2em 0.4em;",
  "  border-radius: 3px;",
  "  font-size: 0.9em;",
  "}",
  "pre code { background: none; padding: 0; font-size: inherit; }",
  "blockquote {",
  "  border-left: 4px solid #e5e5e5;",
  "  margin: 1em 0;",
  "  margin-left: 0;",
  "  padding-left: 1rem;",
  "  color: #666;",
  "  font-style: italic;",
  "}",
  "img { max-width: 100%; height: auto; border-radius: 6px; }",
  "table { border-collapse: collapse; width: 100%; margin: 1em 0; }",
  "th, td { border: 1px solid #e5e5e5; padding: 0.75rem; text-align: left; }",
  "th { background: #f9f9f9; font-weight: 600; }",
  "tr:nth-child(even) { background: #fafafa; }",
  "ul, ol { margin: 1em 0; padding-left: 2em; }",
  "li { margin: 0.25em 0; }",
  "li > ul, li > ol { margin: 0.25em 0; }",
  "hr { border: none; border-top: 2px solid #e5e5e5; margin: 2em 0; }",
  "ul.contains-task-list { list-style: none; padding-left: 0; }",
  "li.task-list-item { display: flex; align-items: flex-start; gap: 0.5em; }",
  "input[type='checkbox'] { margin-top: 0.3em; }",
].join("\n");

/**
 * Configure marked options for consistent HTML output.
 */
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: false, // Don't convert \n to <br>
});

/**
 * Strip frontmatter from markdown content.
 * Frontmatter is YAML wrapped in --- delimiters at the start of the file.
 *
 * @param markdown - The markdown content that may contain frontmatter
 * @returns The markdown content with frontmatter removed
 *
 * @example
 * ```ts
 * const content = stripFrontmatter(`---
 * title: My Post
 * ---
 * # Hello`);
 * // Returns: "# Hello"
 * ```
 */
export function stripFrontmatter(markdown: string): string {
  const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n?/;
  return markdown.replace(frontmatterRegex, "").trim();
}

/**
 * Convert markdown to HTML fragment.
 * Returns only the content HTML without html/head/body wrapper.
 * Suitable for embedding in existing pages or pasting into CMS.
 *
 * @param markdown - The markdown content to convert
 * @returns HTML string (fragment only)
 *
 * @example
 * ```ts
 * const html = markdownToHtmlFragment("# Hello\n\nWorld");
 * // Returns: "<h1>Hello</h1>\n<p>World</p>"
 * ```
 */
export function markdownToHtmlFragment(markdown: string): string {
  const contentWithoutFrontmatter = stripFrontmatter(markdown);
  return marked.parse(contentWithoutFrontmatter) as string;
}

/**
 * Convert markdown to a complete HTML page with styling.
 * Includes DOCTYPE, html, head, and body elements with inline CSS.
 * The resulting HTML file can be opened directly in any browser.
 *
 * @param markdown - The markdown content to convert
 * @param title - The document title (used in <title> tag)
 * @returns Complete HTML document string
 *
 * @example
 * ```ts
 * const html = markdownToHtmlPage("# Hello", "My Document");
 * // Returns complete HTML with <!DOCTYPE html>, styling, etc.
 * ```
 */
export function markdownToHtmlPage(markdown: string, title: string): string {
  const htmlContent = markdownToHtmlFragment(markdown);
  const escapedTitle = escapeHtml(title);

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${escapedTitle}</title>`,
    "  <style>",
    HTML_STYLES,
    "  </style>",
    "</head>",
    "<body>",
    "  <article>",
    htmlContent,
    "  </article>",
    "</body>",
    "</html>",
  ].join("\n");
}

/**
 * Escape HTML special characters to prevent XSS in the title.
 *
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
}

/**
 * Copy HTML fragment to clipboard.
 * Shows a screen reader announcement on success.
 *
 * @param html - The HTML string to copy
 * @returns Promise that resolves when copy is complete
 * @throws Error if clipboard access fails
 *
 * @example
 * ```ts
 * const html = markdownToHtmlFragment(markdown);
 * await copyHtmlToClipboard(html);
 * ```
 */
export async function copyHtmlToClipboard(html: string): Promise<void> {
  await navigator.clipboard.writeText(html);

  // Announce to screen readers
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.className = "sr-only";
  announcement.textContent = "HTML copied to clipboard";
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

/**
 * Download HTML content as a file.
 * Creates a temporary download link and triggers the download.
 *
 * @param html - The HTML string to download
 * @param filename - The filename (should end in .html)
 *
 * @example
 * ```ts
 * const html = markdownToHtmlPage(markdown, "My Doc");
 * downloadHtml(html, "my-doc.html");
 * ```
 */
export function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Sanitize a string to be used as a filename.
 * Removes/replaces characters that are invalid in filenames.
 *
 * @param name - The original name
 * @returns A safe filename string
 *
 * @example
 * ```ts
 * sanitizeFilename("My Doc: The Best!"); // "My Doc - The Best"
 * ```
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "-") // Replace invalid chars with dash
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/-+/g, "-") // Collapse multiple dashes
    .replace(/^-|-$/g, "") // Remove leading/trailing dashes
    .trim()
    .slice(0, 100); // Limit length
}
