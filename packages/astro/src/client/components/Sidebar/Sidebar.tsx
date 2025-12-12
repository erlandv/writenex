/**
 * @fileoverview Sidebar component for collection and content navigation
 *
 * This component provides a collapsible sidebar panel for navigating
 * collections and content items. Similar to TocPanel in Writenex Editor.
 *
 * Features:
 * - Arrow key navigation for collections and content lists
 * - ARIA tab pattern for filter tabs
 * - Screen reader announcements for search results
 * - Proper aria-current for selected items
 *
 * @module @writenex/astro/client/components/Sidebar
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  FileEdit,
  Folder,
  Plus,
  CheckCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import type { Collection, ContentSummary } from "../../hooks/useApi";
import { useArrowNavigation } from "../../hooks/useArrowNavigation";
import { useAnnounce } from "../../hooks/useAnnounce";
import "./Sidebar.css";

/**
 * Props for CollectionItem component
 */
interface CollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (name: string) => void;
  id: string;
}

/**
 * Individual collection item in the sidebar
 */
const CollectionItem = memo(function CollectionItem({
  collection,
  isSelected,
  isFocused,
  onSelect,
  id,
}: CollectionItemProps) {
  const handleClick = useCallback(() => {
    onSelect(collection.name);
  }, [collection.name, onSelect]);

  const className = [
    "wn-collection-item",
    isSelected ? "wn-collection-item--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li role="option" aria-selected={isFocused} id={id}>
      <button
        className={className}
        onClick={handleClick}
        tabIndex={isFocused ? 0 : -1}
        aria-current={isSelected ? "true" : undefined}
      >
        <Folder size={16} />
        <span className="wn-collection-item-name">{collection.name}</span>
        <span className="wn-collection-item-count">{collection.count}</span>
      </button>
    </li>
  );
});

/**
 * Props for ContentListItem component
 */
interface ContentItemProps {
  item: ContentSummary;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (id: string) => void;
  id: string;
}

/**
 * Individual content item in the sidebar
 */
const ContentListItem = memo(function ContentListItem({
  item,
  isSelected,
  isFocused,
  onSelect,
  id,
}: ContentItemProps) {
  const handleClick = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  const className = [
    "wn-content-item",
    isSelected ? "wn-content-item--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li role="option" aria-selected={isFocused} id={id}>
      <button
        className={className}
        onClick={handleClick}
        tabIndex={isFocused ? 0 : -1}
        aria-current={isSelected ? "true" : undefined}
      >
        <div className="wn-content-item-header">
          <span className="wn-content-item-title">{item.title}</span>
          {item.draft && <span className="wn-badge-draft">Draft</span>}
        </div>
        {item.pubDate && (
          <span className="wn-content-item-date">
            {formatDate(item.pubDate)}
          </span>
        )}
      </button>
    </li>
  );
});

/**
 * Format date string to readable format
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Props for Sidebar component
 */
interface SidebarProps {
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** List of collections */
  collections: Collection[];
  /** Whether collections are loading */
  collectionsLoading: boolean;
  /** Currently selected collection name */
  selectedCollection: string | null;
  /** Callback when a collection is selected */
  onSelectCollection: (name: string) => void;
  /** List of content items in selected collection */
  contentItems: ContentSummary[];
  /** Whether content is loading */
  contentLoading: boolean;
  /** Currently selected content ID */
  selectedContent: string | null;
  /** Callback when content is selected */
  onSelectContent: (id: string) => void;
  /** Callback to create new content */
  onCreateContent: () => void;
  /** Callback to refresh collections */
  onRefreshCollections: () => void;
  /** Callback to refresh content */
  onRefreshContent: () => void;
}

/**
 * Collapsible sidebar panel for collection and content navigation.
 *
 * @component
 */
export function Sidebar({
  isOpen,
  onClose,
  collections,
  collectionsLoading,
  selectedCollection,
  onSelectCollection,
  contentItems,
  contentLoading,
  selectedContent,
  onSelectContent,
  onCreateContent,
  onRefreshCollections,
  onRefreshContent,
}: SidebarProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDraft, setFilterDraft] = useState<"all" | "published" | "draft">(
    "all"
  );

  // Focus indices for arrow navigation
  const [collectionFocusIndex, setCollectionFocusIndex] = useState(0);
  const [contentFocusIndex, setContentFocusIndex] = useState(0);
  const [tabFocusIndex, setTabFocusIndex] = useState(0);

  // Refs for list containers
  const collectionListRef = useRef<HTMLUListElement>(null);
  const contentListRef = useRef<HTMLUListElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Announcement hook for search results
  const { announce } = useAnnounce();

  // Previous filtered items count for announcements
  const prevFilteredCountRef = useRef<number | null>(null);

  useEffect(() => {
    onRefreshCollections();
  }, [onRefreshCollections]);

  useEffect(() => {
    if (selectedCollection) {
      onRefreshContent();
    }
  }, [selectedCollection, onRefreshContent]);

  useEffect(() => {
    setSearchQuery("");
  }, [selectedCollection]);

  const draftCount = useMemo(
    () => contentItems.filter((item) => item.draft).length,
    [contentItems]
  );

  const publishedCount = useMemo(
    () => contentItems.filter((item) => !item.draft).length,
    [contentItems]
  );

  const filteredItems = useMemo(() => {
    let items = contentItems;

    if (filterDraft === "published") {
      items = items.filter((item) => !item.draft);
    } else if (filterDraft === "draft") {
      items = items.filter((item) => item.draft);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
      );
    }

    return items;
  }, [contentItems, searchQuery, filterDraft]);

  // Generate IDs for collection items
  const collectionIds = useMemo(
    () => collections.map((col) => `wn-collection-${col.name}`),
    [collections]
  );

  // Generate IDs for content items
  const contentIds = useMemo(
    () => filteredItems.map((item) => `wn-content-${item.id}`),
    [filteredItems]
  );

  // Tab IDs for filter tabs
  const tabIds = useMemo(
    () => ["wn-tab-all", "wn-tab-published", "wn-tab-draft"],
    []
  );

  // Arrow navigation for collections
  const { handleKeyDown: handleCollectionKeyDown } = useArrowNavigation({
    items: collectionIds,
    currentIndex: collectionFocusIndex,
    onIndexChange: setCollectionFocusIndex,
    onSelect: (index) => {
      if (collections[index]) {
        onSelectCollection(collections[index].name);
      }
    },
    orientation: "vertical",
    loop: true,
    enabled: collections.length > 0,
  });

  // Arrow navigation for content items
  const { handleKeyDown: handleContentKeyDown } = useArrowNavigation({
    items: contentIds,
    currentIndex: contentFocusIndex,
    onIndexChange: setContentFocusIndex,
    onSelect: (index) => {
      if (filteredItems[index]) {
        onSelectContent(filteredItems[index].id);
      }
    },
    orientation: "vertical",
    loop: true,
    enabled: filteredItems.length > 0,
  });

  // Arrow navigation for filter tabs (horizontal)
  const { handleKeyDown: handleTabKeyDown } = useArrowNavigation({
    items: tabIds,
    currentIndex: tabFocusIndex,
    onIndexChange: setTabFocusIndex,
    onSelect: (index) => {
      const filters: Array<"all" | "published" | "draft"> = [
        "all",
        "published",
        "draft",
      ];
      const filter = filters[index];
      if (filter) {
        setFilterDraft(filter);
      }
    },
    orientation: "horizontal",
    loop: true,
    enabled: true,
  });

  // Update tab focus index when filter changes
  useEffect(() => {
    const filterToIndex = { all: 0, published: 1, draft: 2 };
    setTabFocusIndex(filterToIndex[filterDraft]);
  }, [filterDraft]);

  // Reset content focus index when filtered items change
  useEffect(() => {
    setContentFocusIndex(0);
  }, [filteredItems.length]);

  // Announce search results when they change
  useEffect(() => {
    // Only announce if we have a search query and the count has changed
    if (searchQuery.trim()) {
      const currentCount = filteredItems.length;
      if (prevFilteredCountRef.current !== currentCount) {
        const message =
          currentCount === 0
            ? "No results found"
            : currentCount === 1
              ? "1 result found"
              : `${currentCount} results found`;
        announce(message, "polite");
      }
      prevFilteredCountRef.current = currentCount;
    } else {
      prevFilteredCountRef.current = null;
    }
  }, [filteredItems.length, searchQuery, announce]);

  const sidebarClassName = [
    "wn-sidebar",
    isOpen ? "wn-sidebar--open" : "wn-sidebar--closed",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={sidebarClassName}
      role="navigation"
      aria-label="Content navigation"
      aria-hidden={!isOpen}
    >
      <div className="wn-sidebar-inner">
        {/* Header */}
        <div className="wn-sidebar-header">
          <h2 className="wn-sidebar-title">
            <Folder size={16} />
            Explorer
          </h2>
          <button
            className="wn-sidebar-close"
            onClick={onClose}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X size={12} />
          </button>
        </div>

        {/* Collections Section */}
        <div className="wn-sidebar-section">
          <div className="wn-sidebar-section-header">
            <span className="wn-sidebar-section-title">Collections</span>
            <div className="wn-sidebar-section-actions">
              <button
                className="wn-sidebar-icon-btn"
                onClick={onRefreshCollections}
                title="Refresh collections"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {collectionsLoading ? (
            <div className="wn-sidebar-loading" aria-busy="true">
              Loading...
            </div>
          ) : collections.length === 0 ? (
            <div className="wn-sidebar-empty">
              <span className="wn-sidebar-empty-text">
                No collections found
              </span>
            </div>
          ) : (
            <ul
              className="wn-collection-list"
              role="listbox"
              aria-label="Collections"
              ref={collectionListRef}
              onKeyDown={handleCollectionKeyDown}
            >
              {collections.map((col, index) => {
                const itemId = collectionIds[index];
                if (!itemId) return null;
                return (
                  <CollectionItem
                    key={col.name}
                    collection={col}
                    isSelected={selectedCollection === col.name}
                    isFocused={index === collectionFocusIndex}
                    onSelect={onSelectCollection}
                    id={itemId}
                  />
                );
              })}
            </ul>
          )}
        </div>

        {/* Content Section */}
        {selectedCollection && (
          <div className="wn-sidebar-content">
            <div
              className="wn-sidebar-section-header"
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span className="wn-sidebar-section-title">
                {selectedCollection}
              </span>
              <div className="wn-sidebar-section-actions">
                <button
                  className="wn-sidebar-icon-btn"
                  onClick={onRefreshContent}
                  title="Refresh content"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  className="wn-sidebar-icon-btn wn-sidebar-icon-btn--primary"
                  onClick={onCreateContent}
                  title="New content"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            {contentItems.length > 0 && (
              <div className="wn-sidebar-search">
                <div className="wn-search-input-wrapper">
                  <Search size={14} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="wn-search-input"
                    aria-label="Search content"
                  />
                  {searchQuery && (
                    <button
                      className="wn-search-clear"
                      onClick={() => setSearchQuery("")}
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div
                  className="wn-filter-tabs"
                  role="tablist"
                  aria-label="Filter content"
                  ref={tabListRef}
                  onKeyDown={handleTabKeyDown}
                >
                  <button
                    id={tabIds[0]}
                    className={`wn-filter-tab ${filterDraft === "all" ? "wn-filter-tab--active" : ""}`}
                    onClick={() => setFilterDraft("all")}
                    role="tab"
                    aria-selected={filterDraft === "all"}
                    tabIndex={tabFocusIndex === 0 ? 0 : -1}
                  >
                    All ({contentItems.length})
                  </button>
                  <button
                    id={tabIds[1]}
                    className={`wn-filter-tab ${filterDraft === "published" ? "wn-filter-tab--active" : ""}`}
                    onClick={() => setFilterDraft("published")}
                    role="tab"
                    aria-selected={filterDraft === "published"}
                    tabIndex={tabFocusIndex === 1 ? 0 : -1}
                  >
                    <CheckCircle size={10} aria-hidden="true" />
                    {publishedCount}
                  </button>
                  <button
                    id={tabIds[2]}
                    className={`wn-filter-tab ${filterDraft === "draft" ? "wn-filter-tab--active" : ""}`}
                    onClick={() => setFilterDraft("draft")}
                    role="tab"
                    aria-selected={filterDraft === "draft"}
                    tabIndex={tabFocusIndex === 2 ? 0 : -1}
                  >
                    <FileEdit size={10} aria-hidden="true" />
                    {draftCount}
                  </button>
                </div>
              </div>
            )}

            {/* Content List */}
            {contentLoading ? (
              <div className="wn-sidebar-loading" aria-busy="true">
                Loading...
              </div>
            ) : contentItems.length === 0 ? (
              <div className="wn-sidebar-empty">
                <span className="wn-sidebar-empty-text">No content yet.</span>
                <button
                  className="wn-sidebar-empty-link"
                  onClick={onCreateContent}
                >
                  Create your first post
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="wn-sidebar-empty">
                <span className="wn-sidebar-empty-text">
                  No matching content.
                </span>
                <button
                  className="wn-sidebar-empty-link"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterDraft("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul
                className="wn-content-list"
                role="listbox"
                aria-label="Content items"
                ref={contentListRef}
                onKeyDown={handleContentKeyDown}
              >
                {filteredItems.map((item, index) => {
                  const itemId = contentIds[index];
                  if (!itemId) return null;
                  return (
                    <ContentListItem
                      key={item.id}
                      item={item}
                      isSelected={selectedContent === item.id}
                      isFocused={index === contentFocusIndex}
                      onSelect={onSelectContent}
                      id={itemId}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
