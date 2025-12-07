/**
 * @fileoverview Search and Replace Panel Component
 *
 * This component provides search and replace functionality for the markdown
 * editor. It supports various search options including case sensitivity,
 * whole word matching, and regular expressions.
 *
 * ## Features:
 * - Real-time search with match highlighting (via MDXEditor search plugin)
 * - Case sensitive, whole word, and regex search options
 * - Replace single match or replace all
 * - Match navigation (previous/next)
 * - Keyboard shortcuts: Enter (next), Shift+Enter (previous), Escape (close)
 * - Replace disabled in read-only mode
 *
 * ## Architecture:
 * - Works with MDXEditor's searchPlugin for highlighting
 * - Uses SearchBridge component to sync state with editor
 * - Actual match finding done in MarkdownEditor component
 *
 * @module components/editor/SearchReplacePanel
 * @see {@link MarkdownEditor} - Contains search logic and SearchBridge
 * @see {@link Header} - Contains button to toggle this panel
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  WholeWord,
  Regex,
  Replace,
  ReplaceAll,
} from "lucide-react";
import { Button } from "@writenex/ui" // button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@writenex/ui" // tooltip";
import { useEditorStore } from "@writenex/store";
import { cn } from "@writenex/utils";

/**
 * Props for the SearchReplacePanel component
 *
 * @interface SearchReplacePanelProps
 */
interface SearchReplacePanelProps {
  /**
   * Callback to perform a search with the given query and options.
   * Returns the number of matches found.
   *
   * @param query - The search query string
   * @param options - Search options (caseSensitive, wholeWord, regex)
   * @returns Number of matches found
   */
  onFind: (query: string, options: SearchOptions) => number;

  /** Callback to navigate to the next match */
  onNextMatch: () => void;

  /** Callback to navigate to the previous match */
  onPreviousMatch: () => void;

  /**
   * Callback to replace the current match with the given text.
   * @param replacement - The replacement text
   */
  onReplace: (replacement: string) => void;

  /**
   * Callback to replace all matches with the given text.
   * Returns the number of replacements made.
   *
   * @param replacement - The replacement text
   * @returns Number of replacements made
   */
  onReplaceAll: (replacement: string) => number;

  /** The current match index (1-based) */
  currentMatch: number;

  /** Total number of matches found */
  totalMatches: number;
}

/**
 * Search options configuration.
 *
 * @interface SearchOptions
 */
export interface SearchOptions {
  /** Whether to match case exactly */
  caseSensitive: boolean;
  /** Whether to match whole words only */
  wholeWord: boolean;
  /** Whether to treat query as a regular expression */
  regex: boolean;
}

/**
 * Search and Replace panel component.
 *
 * Renders a floating panel in the top-right corner of the editor with:
 * - Search input with clear button
 * - Toggle buttons for search options (case, word, regex)
 * - Match counter and navigation buttons
 * - Replace input with replace/replace-all buttons
 *
 * The panel auto-focuses the search input when opened and handles
 * keyboard navigation (Enter, Shift+Enter, Escape).
 *
 * @component
 * @example
 * ```tsx
 * function Editor() {
 *   const [matches, setMatches] = useState([]);
 *   const [currentIndex, setCurrentIndex] = useState(0);
 *
 *   const handleFind = (query, options) => {
 *     const found = findMatches(content, query, options);
 *     setMatches(found);
 *     return found.length;
 *   };
 *
 *   return (
 *     <SearchReplacePanel
 *       onFind={handleFind}
 *       onNextMatch={() => setCurrentIndex(i => i + 1)}
 *       onPreviousMatch={() => setCurrentIndex(i => i - 1)}
 *       onReplace={handleReplace}
 *       onReplaceAll={handleReplaceAll}
 *       currentMatch={currentIndex + 1}
 *       totalMatches={matches.length}
 *     />
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @returns Panel element or null if panel is closed
 *
 * @see {@link MarkdownEditor} - Parent component with search logic
 */
export function SearchReplacePanel({
  onFind,
  onNextMatch,
  onPreviousMatch,
  onReplace,
  onReplaceAll,
  currentMatch,
  totalMatches,
}: SearchReplacePanelProps): React.ReactElement | null {
  const {
    isSearchOpen,
    setSearchOpen,
    isReadOnly,
    searchQuery,
    setSearchQuery,
  } = useEditorStore();
  const [replaceQuery, setReplaceQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when panel opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) return;

      if (e.key === "Escape") {
        setSearchOpen(false);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onNextMatch();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        onPreviousMatch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setSearchOpen, onNextMatch, onPreviousMatch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onFind(value, { caseSensitive, wholeWord, regex });
    },
    [caseSensitive, wholeWord, regex, onFind, setSearchQuery]
  );

  const handleOptionsChange = useCallback(
    (option: "caseSensitive" | "wholeWord" | "regex", value: boolean) => {
      let newCaseSensitive = caseSensitive;
      let newWholeWord = wholeWord;
      let newRegex = regex;

      switch (option) {
        case "caseSensitive":
          newCaseSensitive = value;
          setCaseSensitive(value);
          break;
        case "wholeWord":
          newWholeWord = value;
          setWholeWord(value);
          break;
        case "regex":
          newRegex = value;
          setRegex(value);
          break;
      }

      onFind(searchQuery, {
        caseSensitive: newCaseSensitive,
        wholeWord: newWholeWord,
        regex: newRegex,
      });
    },
    [caseSensitive, wholeWord, regex, searchQuery, onFind]
  );

  const handleReplace = useCallback(() => {
    if (!isReadOnly) {
      onReplace(replaceQuery);
    }
  }, [isReadOnly, onReplace, replaceQuery]);

  const handleReplaceAll = useCallback(() => {
    if (!isReadOnly) {
      const count = onReplaceAll(replaceQuery);
      // ARIA announcement
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = `Replaced ${count} occurrences`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }
  }, [isReadOnly, onReplaceAll, replaceQuery]);

  if (!isSearchOpen) return null;

  return (
    <div
      className="absolute top-0 right-0 left-0 z-40 max-w-full border border-zinc-200 bg-white p-2 text-zinc-900 shadow-lg sm:right-0 sm:left-auto sm:max-w-none sm:rounded-bl-lg sm:p-3 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      role="search"
      aria-label="Search and replace"
    >
      <div className="flex flex-col gap-2">
        {/* Search Row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search Input and Options */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <div className="relative flex-1 sm:flex-none">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded border border-zinc-200 bg-white py-1.5 pr-7 pl-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-48 sm:py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                aria-label="Search query"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    handleSearchChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer rounded-b-lg p-0.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Search Options */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 cursor-pointer text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200",
                    caseSensitive &&
                      "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  )}
                  onClick={() =>
                    handleOptionsChange("caseSensitive", !caseSensitive)
                  }
                  aria-pressed={caseSensitive}
                  aria-label="Case sensitive"
                >
                  <CaseSensitive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Case sensitive</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 cursor-pointer text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200",
                    wholeWord &&
                      "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  )}
                  onClick={() => handleOptionsChange("wholeWord", !wholeWord)}
                  aria-pressed={wholeWord}
                  aria-label="Whole word"
                >
                  <WholeWord className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Whole word</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 cursor-pointer text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200",
                    regex &&
                      "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  )}
                  onClick={() => handleOptionsChange("regex", !regex)}
                  aria-pressed={regex}
                  aria-label="Regular expression"
                >
                  <Regex className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Regular expression</TooltipContent>
            </Tooltip>
          </div>

          {/* Match counter and navigation */}
          <div className="flex items-center justify-between gap-1.5 sm:justify-start sm:gap-2">
            <span className="min-w-[70px] text-center text-sm text-zinc-500 sm:min-w-[60px] dark:text-zinc-400">
              {totalMatches > 0
                ? `${currentMatch} of ${totalMatches}`
                : "No results"}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200",
                  totalMatches === 0
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                )}
                onClick={onPreviousMatch}
                disabled={totalMatches === 0}
                aria-label="Previous match"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200",
                  totalMatches === 0
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                )}
                onClick={onNextMatch}
                disabled={totalMatches === 0}
                aria-label="Next match"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Replace Row */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Replace..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              disabled={isReadOnly}
              className={cn(
                "w-full rounded border border-zinc-200 bg-white py-1.5 pr-7 pl-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-48 sm:py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400",
                isReadOnly && "cursor-not-allowed opacity-50"
              )}
              aria-label="Replace query"
            />
            {replaceQuery && !isReadOnly && (
              <button
                onClick={() => setReplaceQuery("")}
                className="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer rounded-b-lg p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                aria-label="Clear replace"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200",
                  isReadOnly || totalMatches === 0
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                )}
                onClick={handleReplace}
                disabled={isReadOnly || totalMatches === 0}
                aria-label="Replace current match"
              >
                <Replace className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadOnly ? "Replace disabled in read-only mode" : "Replace"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-400 dark:hover:text-zinc-200",
                  isReadOnly || totalMatches === 0
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                )}
                onClick={handleReplaceAll}
                disabled={isReadOnly || totalMatches === 0}
                aria-label="Replace all matches"
              >
                <ReplaceAll className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadOnly
                ? "Replace all disabled in read-only mode"
                : "Replace all"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
