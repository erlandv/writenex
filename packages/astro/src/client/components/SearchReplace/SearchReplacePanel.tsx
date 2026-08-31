/**
 * @fileoverview Search and Replace Panel Component
 *
 * Provides search and replace functionality for the markdown editor.
 * Supports case sensitivity, whole word matching, and regular expressions.
 *
 * @module @writenex/astro/client/components/SearchReplace
 */

import {
  CaseSensitive,
  ChevronDown,
  ChevronUp,
  Regex,
  Replace,
  ReplaceAll,
  WholeWord,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import "./SearchReplacePanel.css";

/**
 * Search options configuration
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
 * Props for the SearchReplacePanel component
 */
interface SearchReplacePanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Callback to perform search */
  onSearch: (query: string, options: SearchOptions) => number;
  /** Callback to navigate to next match */
  onNextMatch: () => void;
  /** Callback to navigate to previous match */
  onPreviousMatch: () => void;
  /** Callback to replace current match */
  onReplace: (replacement: string) => void;
  /** Callback to replace all matches */
  onReplaceAll: (replacement: string) => number;
  /** Current match index (1-based) */
  currentMatch: number;
  /** Total number of matches */
  totalMatches: number;
  /** Whether editor is read-only */
  readOnly?: boolean;
}

/**
 * Search and Replace panel component
 *
 * @component
 */
export function SearchReplacePanel({
  isOpen,
  onClose,
  onSearch,
  onNextMatch,
  onPreviousMatch,
  onReplace,
  onReplaceAll,
  currentMatch,
  totalMatches,
  readOnly = false,
}: SearchReplacePanelProps): React.ReactElement | null {
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose, onNextMatch, onPreviousMatch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearch(value, { caseSensitive, wholeWord, regex });
    },
    [caseSensitive, wholeWord, regex, onSearch]
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

      onSearch(searchQuery, {
        caseSensitive: newCaseSensitive,
        wholeWord: newWholeWord,
        regex: newRegex,
      });
    },
    [caseSensitive, wholeWord, regex, searchQuery, onSearch]
  );

  const handleReplace = useCallback(() => {
    if (!readOnly && totalMatches > 0) {
      onReplace(replaceQuery);
    }
  }, [readOnly, totalMatches, onReplace, replaceQuery]);

  const handleReplaceAll = useCallback(() => {
    if (!readOnly && totalMatches > 0) {
      const count = onReplaceAll(replaceQuery);
      // ARIA announcement
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "wn-sr-only";
      announcement.textContent = `Replaced ${count} occurrences`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }
  }, [readOnly, totalMatches, onReplaceAll, replaceQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="wn-search-panel"
      role="search"
      aria-label="Search and replace"
    >
      <div className="wn-search-panel-content">
        {/* Search Row */}
        <div className="wn-search-row">
          {/* Search Input */}
          <div className="wn-search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="wn-search-input"
              aria-label="Search query"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  handleSearchChange("");
                  searchInputRef.current?.focus();
                }}
                className="wn-search-clear"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search Options */}
          <div className="wn-search-options">
            <button
              className={`wn-search-option ${caseSensitive ? "wn-search-option--active" : ""}`}
              onClick={() =>
                handleOptionsChange("caseSensitive", !caseSensitive)
              }
              aria-pressed={caseSensitive}
              aria-label="Case sensitive"
              title="Case sensitive"
            >
              <CaseSensitive size={16} />
            </button>
            <button
              className={`wn-search-option ${wholeWord ? "wn-search-option--active" : ""}`}
              onClick={() => handleOptionsChange("wholeWord", !wholeWord)}
              aria-pressed={wholeWord}
              aria-label="Whole word"
              title="Whole word"
            >
              <WholeWord size={16} />
            </button>
            <button
              className={`wn-search-option ${regex ? "wn-search-option--active" : ""}`}
              onClick={() => handleOptionsChange("regex", !regex)}
              aria-pressed={regex}
              aria-label="Regular expression"
              title="Regular expression"
            >
              <Regex size={16} />
            </button>
          </div>

          {/* Match Counter */}
          <span className="wn-search-counter">
            {totalMatches > 0
              ? `${currentMatch} of ${totalMatches}`
              : "No results"}
          </span>

          {/* Navigation */}
          <div className="wn-search-nav">
            <button
              className="wn-search-nav-btn"
              onClick={onPreviousMatch}
              disabled={totalMatches === 0}
              aria-label="Previous match"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp size={16} />
            </button>
            <button
              className="wn-search-nav-btn"
              onClick={onNextMatch}
              disabled={totalMatches === 0}
              aria-label="Next match"
              title="Next match (Enter)"
            >
              <ChevronDown size={16} />
            </button>
            <button
              className="wn-search-nav-btn"
              onClick={onClose}
              aria-label="Close search"
              title="Close (Escape)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Replace Row */}
        <div className="wn-search-row">
          <div className="wn-search-input-wrapper">
            <input
              type="text"
              placeholder="Replace..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              disabled={readOnly}
              className={`wn-search-input ${readOnly ? "wn-search-input--disabled" : ""}`}
              aria-label="Replace query"
            />
            {replaceQuery && !readOnly && (
              <button
                onClick={() => setReplaceQuery("")}
                className="wn-search-clear"
                aria-label="Clear replace"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Replace Actions */}
          <div className="wn-search-actions">
            <button
              className="wn-search-action-btn"
              onClick={handleReplace}
              disabled={readOnly || totalMatches === 0}
              aria-label="Replace current match"
              title={
                readOnly ? "Replace disabled in read-only mode" : "Replace"
              }
            >
              <Replace size={16} />
            </button>
            <button
              className="wn-search-action-btn"
              onClick={handleReplaceAll}
              disabled={readOnly || totalMatches === 0}
              aria-label="Replace all matches"
              title={
                readOnly
                  ? "Replace all disabled in read-only mode"
                  : "Replace all"
              }
            >
              <ReplaceAll size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
