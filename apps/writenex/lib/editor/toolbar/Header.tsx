/**
 * @fileoverview Application Header Component
 *
 * This component provides the main header bar with logo, branding, and
 * a unified toolbar for file operations, theme switching, search,
 * version history, and editor controls.
 *
 * ## Features:
 * - Application logo and branding
 * - File actions dropdown (import, export, copy markdown)
 * - Theme selector (light, dark, system)
 * - Quick access buttons for search, history, shortcuts
 * - Focus mode toggle for distraction-free writing
 * - Read-only mode toggle
 * - Clear editor button
 *
 * ## Image Export:
 * When exporting markdown, images stored in IndexedDB (idb:// URLs)
 * are automatically converted to base64 data URLs for portability.
 *
 * @module components/editor/Header
 * @see {@link SearchReplacePanel} - Search panel toggled from header
 * @see {@link VersionHistoryPanel} - History panel toggled from header
 * @see {@link KeyboardShortcutsModal} - Shortcuts modal opened from header
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Search,
  History,
  Keyboard,
  Lock,
  Unlock,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Maximize2,
  Clipboard,
  Code,
  FileDown,
  Globe,
  List,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/lib/ui"; // dropdown-menu";
import { SimpleTooltip } from "@/lib/ui"; // simple-tooltip";
import { IconButton } from "@/lib/ui"; // icon-button";
import { useEditorStore, getActiveDocument } from "@/lib/store";
import { cn } from "@/lib/utils";
import { getImage, saveSetting } from "@/lib/db";
import {
  markdownToHtmlFragment,
  markdownToHtmlPage,
  copyHtmlToClipboard,
  downloadHtml,
  sanitizeFilename,
} from "../exportHtml";

/**
 * Converts a Blob to a base64 data URL string.
 *
 * @param blob - The blob to convert
 * @returns Promise resolving to base64 data URL
 *
 * @example
 * ```ts
 * const base64 = await blobToBase64(imageBlob);
 * // "data:image/png;base64,iVBORw0KGgo..."
 * ```
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Processes markdown content for export by converting IndexedDB image URLs
 * to portable base64 data URLs.
 *
 * Images stored in the app use `idb://<id>` URLs. This function finds all
 * such URLs and replaces them with embedded base64 data URLs, making the
 * exported markdown self-contained and portable.
 *
 * @param content - The markdown content to process
 * @returns Promise resolving to content with embedded images
 *
 * @example
 * ```ts
 * const markdown = "![Image](idb://123)";
 * const processed = await processContentForExport(markdown);
 * // "![Image](data:image/png;base64,iVBORw0KGgo...)"
 * ```
 */
const processContentForExport = async (content: string): Promise<string> => {
  const regex = /idb:\/\/(\d+)/g;
  const matches = [...content.matchAll(regex)];

  if (matches.length === 0) return content;

  let newContent = content;

  // Get unique IDs to avoid fetching same image multiple times
  const uniqueIds = Array.from(
    new Set(
      matches
        .map((m) => m[1])
        .filter((id): id is string => id !== undefined)
        .map((id) => parseInt(id, 10))
    )
  );

  for (const id of uniqueIds) {
    try {
      const image = await getImage(id);
      if (image) {
        const base64 = await blobToBase64(image.blob);
        // Replace all occurrences of this ID
        newContent = newContent.replaceAll(`idb://${id}`, base64);
      }
    } catch (error) {
      console.error(`Failed to process image ${id} for export:`, error);
    }
  }

  return newContent;
};

/**
 * Visual separator for grouping toolbar buttons.
 *
 * @component
 * @returns Separator div element
 */
function HeaderSeparator(): React.ReactElement {
  return <div className="mx-1.5 h-6 w-px bg-zinc-200 dark:bg-white/10" />;
}

/**
 * Main application header with logo and unified toolbar.
 *
 * Contains all top-level actions organized into logical groups:
 * 1. **File & Theme**: File operations dropdown, theme selector
 * 2. **Search & History**: Quick access to search panel and version history
 * 3. **Help**: Keyboard shortcuts modal
 * 4. **Mode & Danger**: Read-only toggle, clear editor
 *
 * @component
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div className="flex flex-col h-screen">
 *       <Header />
 *       <MarkdownEditor />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Header element with toolbar
 *
 * @see {@link SearchReplacePanel} - Search panel toggled by search button
 * @see {@link VersionHistoryPanel} - History panel toggled by history button
 */
export function Header(): React.ReactElement {
  const store = useEditorStore();
  const {
    content,
    setContent,
    isReadOnly,
    toggleReadOnly,
    isFocusMode,
    toggleFocusMode,
    theme,
    setTheme,
    isSearchOpen,
    setSearchOpen,
    isVersionHistoryOpen,
    setVersionHistoryOpen,
    isTocPanelOpen,
    setTocPanelOpen,
    setShortcutsOpen,
    setClearDialogOpen,
    openOnboarding,
  } = store;

  // Get active document for filename
  const activeDocument = getActiveDocument(store);

  const handleExport = async (): Promise<void> => {
    const processedContent = await processContentForExport(content);
    const blob = new Blob([processedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = activeDocument?.title
      ? sanitizeFilename(activeDocument.title) + ".md"
      : "document.md";
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    // Record export date for backup reminder
    await saveSetting("lastExportDate", new Date().toISOString());
  };

  const handleCopyHtml = async (): Promise<void> => {
    try {
      const processedContent = await processContentForExport(content);
      const html = markdownToHtmlFragment(processedContent);
      await copyHtmlToClipboard(html);
    } catch (error) {
      console.error("Failed to copy HTML:", error);
    }
  };

  const handleExportHtml = async (): Promise<void> => {
    const processedContent = await processContentForExport(content);
    const title = activeDocument?.title || "document";
    const html = markdownToHtmlPage(processedContent, title);
    const filename = sanitizeFilename(title) + ".html";
    downloadHtml(html, filename);
    // Record export date for backup reminder
    await saveSetting("lastExportDate", new Date().toISOString());
  };

  const handleCopyMarkdown = async (): Promise<void> => {
    try {
      const processedContent = await processContentForExport(content);
      await navigator.clipboard.writeText(processedContent);
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = "Markdown copied to clipboard";
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleImport = (): void => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        setContent(text);
      }
    };
    input.click();
  };

  const handleClear = (): void => {
    if (!isReadOnly && content.length > 0) {
      setClearDialogOpen(true);
    }
  };

  // Track the resolved theme (actual light/dark being displayed)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Function to check current resolved theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setResolvedTheme(isDark ? "dark" : "light");
    };

    // Check immediately
    checkTheme();

    // Observe changes to the document class
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Show Sun/Moon based on actual displayed theme, not the setting
  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Logo */}
      <div className="flex min-w-fit items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <svg
            className="h-14 w-14 shrink-0"
            viewBox="0 0 24 24"
            fill="#335DFF"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M20.18 4.22l3.7 0c0.05,0 0.08,0.02 0.1,0.06 0.03,0.03 0.03,0.08 0,0.12l-5.78 10.31c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.89 -3.28c-0.03,-0.04 -0.03,-0.08 -0.01,-0.12l3.98 -7.03c0.02,-0.04 0.06,-0.06 0.1,-0.06zm-6.13 6.34l3.24 5.65c0.03,0.04 0.03,0.09 0,0.12l-1.9 3.39c-0.02,0.04 -0.05,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-3.17 -5.68 -3.12 5.68c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.92 -3.38c-0.03,-0.04 -0.03,-0.09 0,-0.13l3.26 -5.66 -3.48 -6.15c-0.02,-0.04 -0.02,-0.09 0,-0.12 0.02,-0.04 0.06,-0.06 0.1,-0.06l3.74 0c0.05,0 0.08,0.02 0.11,0.06l1.51 2.7 1.53 -2.7c0.02,-0.04 0.06,-0.06 0.1,-0.06l3.84 0c0.04,0 0.08,0.02 0.1,0.06 0.02,0.03 0.02,0.08 0,0.12l-3.54 6.16zm-10.06 -6.28l3.99 7.01c0.02,0.04 0.02,0.08 0,0.12l-1.91 3.31c-0.03,0.04 -0.06,0.06 -0.11,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-5.84 -10.32c-0.03,-0.04 -0.03,-0.09 0,-0.12 0.02,-0.04 0.05,-0.06 0.1,-0.06l3.76 0c0.05,0 0.09,0.02 0.11,0.06z" />
          </svg>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Writenex Editor
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Write visually, export instantly.
            </p>
          </div>
        </Link>
      </div>

      {/* Right side: Custom Toolbar (all tools unified) */}
      <div className="no-scrollbar flex max-w-[60vw] items-center gap-0.5 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 sm:max-w-none dark:border-zinc-700 dark:bg-zinc-800/50">
        {/* Group 1: File & Theme (Document/App settings) */}
        <DropdownMenu>
          <SimpleTooltip content="File Actions" side="bottom">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors",
                  "text-zinc-600 dark:text-zinc-400",
                  "hover:bg-black/10 dark:hover:bg-white/10",
                  "hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                aria-label="File actions"
              >
                <FileText className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
          </SimpleTooltip>
          <DropdownMenuContent align="end" className="flex flex-col gap-1">
            <DropdownMenuItem onClick={handleImport} disabled={isReadOnly}>
              <Upload className="mr-2 h-4 w-4" />
              Import Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyMarkdown}>
              <Clipboard className="mr-2 h-4 w-4" />
              Copy Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyHtml}>
              <Code className="mr-2 h-4 w-4" />
              Copy HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Download as .md
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportHtml}>
              <Globe className="mr-2 h-4 w-4" />
              Download as .html
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <SimpleTooltip content="Switch Theme" side="bottom">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors",
                  "text-zinc-600 dark:text-zinc-400",
                  "hover:bg-black/10 dark:hover:bg-white/10",
                  "hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                aria-label="Theme selector"
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
          </SimpleTooltip>
          <DropdownMenuContent align="end" className="flex flex-col gap-1">
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className={cn(
                theme === "light" && "bg-black/10 dark:bg-white/15"
              )}
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className={cn(theme === "dark" && "bg-black/10 dark:bg-white/15")}
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className={cn(
                theme === "system" && "bg-black/10 dark:bg-white/15"
              )}
            >
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <HeaderSeparator />

        {/* Group 2: Navigation (Content navigation) */}
        <IconButton
          icon={<List className="h-4 w-4" />}
          label="Table of Contents (Alt+T)"
          onClick={() => setTocPanelOpen(!isTocPanelOpen)}
          active={isTocPanelOpen}
        />

        <IconButton
          icon={<Search className="h-4 w-4" />}
          label="Search & Replace (Ctrl+F)"
          onClick={() => setSearchOpen(!isSearchOpen)}
          active={isSearchOpen}
        />

        <IconButton
          icon={<History className="h-4 w-4" />}
          label="Version History"
          onClick={() => setVersionHistoryOpen(!isVersionHistoryOpen)}
          active={isVersionHistoryOpen}
        />

        <HeaderSeparator />

        {/* Group 3: Help (Standalone) */}
        <IconButton
          icon={<HelpCircle className="h-4 w-4" />}
          label="Help & Tour (F1)"
          onClick={() => openOnboarding()}
        />

        <IconButton
          icon={<Keyboard className="h-4 w-4" />}
          label="Keyboard Shortcuts (Ctrl+/)"
          onClick={() => setShortcutsOpen(true)}
        />

        <HeaderSeparator />

        {/* Group 4: Focus & Mode actions (rightmost) */}
        <IconButton
          icon={<Maximize2 className="h-4 w-4" />}
          label="Focus Mode (Ctrl+Shift+E)"
          onClick={toggleFocusMode}
          active={isFocusMode}
        />

        <IconButton
          icon={
            isReadOnly ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )
          }
          label={
            isReadOnly
              ? "Read-only mode - Click to enable editing"
              : "Toggle Read-Only Mode (Ctrl+Shift+R)"
          }
          onClick={toggleReadOnly}
          active={isReadOnly}
        />

        <IconButton
          icon={<Trash2 className="h-4 w-4" />}
          label="Clear Editor (Ctrl+Shift+Delete)"
          onClick={handleClear}
          disabled={isReadOnly || content.length === 0}
          className="hover:text-red-500 dark:hover:text-red-400"
        />
      </div>
    </header>
  );
}
