/**
 * @fileoverview Select collection modal component
 *
 * Modal dialog for selecting a collection when creating new content
 * without a pre-selected collection. Triggered by Alt+N shortcut.
 *
 * @module @writenex/astro/client/components/SelectCollectionModal
 */

import { ChevronRight, Folder, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Collection } from "../../hooks/useApi";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import "./SelectCollectionModal.css";

/**
 * Props for SelectCollectionModal component
 */
interface SelectCollectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when a collection is selected */
  onSelect: (collectionName: string) => void;
  /** Available collections */
  collections: Collection[];
  /** Whether collections are loading */
  isLoading?: boolean;
}

/**
 * Modal dialog for selecting a collection
 *
 * @component
 */
export function SelectCollectionModal({
  isOpen,
  onClose,
  onSelect,
  collections,
  isLoading = false,
}: SelectCollectionModalProps): React.ReactElement | null {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Store the trigger element when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      setFocusedIndex(0);
    }
  }, [isOpen]);

  // Focus trap for accessibility
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: onClose,
    returnFocusTo: triggerRef.current,
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || collections.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < collections.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : collections.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (collections[focusedIndex]) {
            onSelect(collections[focusedIndex].name);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, collections, focusedIndex, onSelect]);

  // Scroll focused item into view
  useEffect(() => {
    if (listRef.current && collections.length > 0) {
      const focusedItem = listRef.current.children[focusedIndex] as HTMLElement;
      focusedItem?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex, collections.length]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleItemClick = useCallback(
    (collectionName: string) => {
      onSelect(collectionName);
    },
    [onSelect]
  );

  if (!isOpen) return null;

  return (
    <div
      className="wn-select-collection-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={containerRef}
        className="wn-select-collection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-collection-title"
      >
        {/* Header */}
        <div className="wn-select-collection-header">
          <div className="wn-select-collection-header-content">
            <Folder size={18} className="wn-select-collection-icon" />
            <h2
              id="select-collection-title"
              className="wn-select-collection-title"
            >
              Select Collection
            </h2>
          </div>
          <button
            className="wn-select-collection-close"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="wn-select-collection-body">
          <p className="wn-select-collection-hint">
            Choose a collection to create new content in:
          </p>

          {isLoading ? (
            <div className="wn-select-collection-loading">
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="wn-select-collection-empty">
              No collections found
            </div>
          ) : (
            <ul
              ref={listRef}
              className="wn-select-collection-list"
              role="listbox"
              aria-label="Collections"
            >
              {collections.map((collection, index) => (
                <li
                  key={collection.name}
                  role="option"
                  aria-selected={index === focusedIndex}
                >
                  <button
                    className={`wn-select-collection-item ${
                      index === focusedIndex
                        ? "wn-select-collection-item--focused"
                        : ""
                    }`}
                    onClick={() => handleItemClick(collection.name)}
                    tabIndex={index === focusedIndex ? 0 : -1}
                  >
                    <Folder size={16} />
                    <span className="wn-select-collection-item-name">
                      {collection.name}
                    </span>
                    <span className="wn-select-collection-item-count">
                      {collection.count} items
                    </span>
                    <ChevronRight
                      size={14}
                      className="wn-select-collection-item-arrow"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="wn-select-collection-footer">
          <span className="wn-select-collection-shortcut">
            <kbd>↑</kbd> <kbd>↓</kbd> Navigate
          </span>
          <span className="wn-select-collection-shortcut">
            <kbd>Enter</kbd> Select
          </span>
          <span className="wn-select-collection-shortcut">
            <kbd>Esc</kbd> Cancel
          </span>
        </div>
      </div>
    </div>
  );
}
