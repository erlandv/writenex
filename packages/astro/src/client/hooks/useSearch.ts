/**
 * @fileoverview Search hook for editor
 *
 * Provides search and replace functionality for markdown content.
 *
 * @module @writenex/astro/client/hooks/useSearch
 */

import { useCallback, useState } from "react";
import type { SearchOptions } from "../components/SearchReplace";

/**
 * Search state and handlers
 */
export interface UseSearchResult {
  /** Whether search panel is open */
  isSearchOpen: boolean;
  /** Open search panel */
  openSearch: () => void;
  /** Close search panel */
  closeSearch: () => void;
  /** Toggle search panel */
  toggleSearch: () => void;
  /** Current search query */
  searchQuery: string;
  /** Array of match positions */
  searchMatches: number[];
  /** Current active match index (1-based) */
  searchActiveIndex: number;
  /** Total number of matches */
  totalMatches: number;
  /** Perform search */
  handleFind: (query: string, options: SearchOptions) => number;
  /** Navigate to next match */
  handleNextMatch: () => void;
  /** Navigate to previous match */
  handlePreviousMatch: () => void;
  /** Replace current match */
  handleReplace: (
    replacement: string,
    content: string,
    setContent: (content: string) => void
  ) => void;
  /** Replace all matches */
  handleReplaceAll: (
    replacement: string,
    content: string,
    setContent: (content: string) => void
  ) => number;
}

/**
 * Hook for search and replace functionality
 *
 * @param getContent - Function to get current content
 * @returns Search state and handlers
 */
export function useSearch(getContent: () => string): UseSearchResult {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);

  const handleFind = useCallback(
    (query: string, options: SearchOptions): number => {
      setSearchQuery(query);

      if (!query) {
        setSearchMatches([]);
        setSearchActiveIndex(0);
        return 0;
      }

      const content = getContent();
      let pattern: RegExp;

      try {
        let regexPattern = options.regex
          ? query
          : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        if (options.wholeWord) {
          regexPattern = `\\b${regexPattern}\\b`;
        }

        pattern = new RegExp(regexPattern, options.caseSensitive ? "g" : "gi");
      } catch {
        // Invalid regex
        setSearchMatches([]);
        setSearchActiveIndex(0);
        return 0;
      }

      const matches: number[] = [];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        matches.push(match.index);
      }

      setSearchMatches(matches);
      setSearchActiveIndex(matches.length > 0 ? 1 : 0);
      return matches.length;
    },
    [getContent]
  );

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setSearchActiveIndex((prev) =>
      prev >= searchMatches.length ? 1 : prev + 1
    );
  }, [searchMatches.length]);

  const handlePreviousMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setSearchActiveIndex((prev) =>
      prev <= 1 ? searchMatches.length : prev - 1
    );
  }, [searchMatches.length]);

  const handleReplace = useCallback(
    (
      replacement: string,
      content: string,
      setContent: (content: string) => void
    ) => {
      if (searchMatches.length === 0) return;

      const matchIndex = searchMatches[searchActiveIndex - 1];
      if (matchIndex === undefined) return;

      const beforeMatch = content.substring(0, matchIndex);
      const afterMatch = content.substring(matchIndex + searchQuery.length);
      const newContent = beforeMatch + replacement + afterMatch;

      setContent(newContent);

      // Re-run search to update matches
      // Matches after the replacement point need to be adjusted
      const adjustment = replacement.length - searchQuery.length;
      const newMatches = searchMatches
        .filter((_, i) => i !== searchActiveIndex - 1)
        .map((pos, i) => {
          if (i >= searchActiveIndex - 1) {
            return pos + adjustment;
          }
          return pos;
        });

      setSearchMatches(newMatches);
      if (searchActiveIndex > newMatches.length) {
        setSearchActiveIndex(newMatches.length > 0 ? 1 : 0);
      }
    },
    [searchMatches, searchActiveIndex, searchQuery]
  );

  const handleReplaceAll = useCallback(
    (
      replacement: string,
      content: string,
      setContent: (content: string) => void
    ): number => {
      if (searchMatches.length === 0) return 0;

      let newContent = content;
      let count = 0;

      // Replace from end to start to preserve indices
      [...searchMatches].reverse().forEach((index) => {
        newContent =
          newContent.substring(0, index) +
          replacement +
          newContent.substring(index + searchQuery.length);
        count++;
      });

      setContent(newContent);
      setSearchMatches([]);
      setSearchActiveIndex(0);

      return count;
    },
    [searchMatches, searchQuery]
  );

  return {
    isSearchOpen,
    openSearch,
    closeSearch,
    toggleSearch,
    searchQuery,
    searchMatches,
    searchActiveIndex,
    totalMatches: searchMatches.length,
    handleFind,
    handleNextMatch,
    handlePreviousMatch,
    handleReplace,
    handleReplaceAll,
  };
}
