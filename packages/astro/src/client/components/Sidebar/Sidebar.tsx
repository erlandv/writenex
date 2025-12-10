/**
 * @fileoverview Sidebar component for collection and content navigation
 *
 * This component provides a collapsible sidebar panel for navigating
 * collections and content items. Similar to TocPanel in Writenex Editor.
 *
 * @module @writenex/astro/client/components/Sidebar
 */

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
import "./Sidebar.css";

/**
 * Props for CollectionItem component
 */
interface CollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

/**
 * Individual collection item in the sidebar
 */
const CollectionItem = memo(function CollectionItem({
  collection,
  isSelected,
  onSelect,
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
    <li>
      <button className={className} onClick={handleClick}>
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
  onSelect: (id: string) => void;
}

/**
 * Individual content item in the sidebar
 */
const ContentListItem = memo(function ContentListItem({
  item,
  isSelected,
  onSelect,
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
    <li>
      <button className={className} onClick={handleClick}>
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
            <div className="wn-sidebar-loading">Loading...</div>
          ) : collections.length === 0 ? (
            <div className="wn-sidebar-empty">
              <span className="wn-sidebar-empty-text">
                No collections found
              </span>
            </div>
          ) : (
            <ul className="wn-collection-list">
              {collections.map((col) => (
                <CollectionItem
                  key={col.name}
                  collection={col}
                  isSelected={selectedCollection === col.name}
                  onSelect={onSelectCollection}
                />
              ))}
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
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="wn-search-input"
                  />
                  {searchQuery && (
                    <button
                      className="wn-search-clear"
                      onClick={() => setSearchQuery("")}
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="wn-filter-tabs">
                  <button
                    className={`wn-filter-tab ${filterDraft === "all" ? "wn-filter-tab--active" : ""}`}
                    onClick={() => setFilterDraft("all")}
                  >
                    All ({contentItems.length})
                  </button>
                  <button
                    className={`wn-filter-tab ${filterDraft === "published" ? "wn-filter-tab--active" : ""}`}
                    onClick={() => setFilterDraft("published")}
                  >
                    <CheckCircle size={10} />
                    {publishedCount}
                  </button>
                  <button
                    className={`wn-filter-tab ${filterDraft === "draft" ? "wn-filter-tab--active" : ""}`}
                    onClick={() => setFilterDraft("draft")}
                  >
                    <FileEdit size={10} />
                    {draftCount}
                  </button>
                </div>
              </div>
            )}

            {/* Content List */}
            {contentLoading ? (
              <div className="wn-sidebar-loading">Loading...</div>
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
              <ul className="wn-content-list">
                {filteredItems.map((item) => (
                  <ContentListItem
                    key={item.id}
                    item={item}
                    isSelected={selectedContent === item.id}
                    onSelect={onSelectContent}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
