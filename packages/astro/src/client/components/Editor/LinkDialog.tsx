/**
 * @fileoverview Custom Link Dialog Component for @writenex/astro
 *
 * This component provides a custom dialog for inserting and editing links
 * in the MDXEditor. It has two modes:
 * 1. Preview mode: A floating popover showing the link URL with quick actions
 * 2. Edit mode: A modal dialog for inserting new links or editing existing ones
 *
 * ## Features:
 * - Floating preview popover for existing links (click to see URL)
 * - Copy, edit, and remove actions in preview mode
 * - Modal dialog for new/edit with URL validation
 * - Optional title field for hover text
 * - Works with MDXEditor's link plugin system
 * - Focus trap for keyboard accessibility
 *
 * @module @writenex/astro/client/components/Editor/LinkDialog
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { usePublisher, useCellValue } from "@mdxeditor/editor";
import {
  linkDialogState$,
  cancelLinkEdit$,
  updateLink$,
  switchFromPreviewToLinkEdit$,
  removeLink$,
} from "@mdxeditor/editor";
import { Link as LinkIcon, Trash2, Edit2, Copy, X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import "./LinkDialog.css";

/**
 * Link dialog state when showing a preview of an existing link.
 */
interface LinkDialogStatePreview {
  type: "preview";
  url: string;
  title: string;
  rectangle: DOMRect;
}

/**
 * Link dialog state when editing or inserting a link.
 */
interface LinkDialogStateEdit {
  type: "edit";
  url: string;
  title: string;
  rectangle: DOMRect;
}

/**
 * Link dialog state when the dialog is closed.
 */
interface LinkDialogStateInactive {
  type: "inactive";
}

/**
 * Union type for all possible link dialog states.
 */
type LinkDialogState =
  | LinkDialogStatePreview
  | LinkDialogStateEdit
  | LinkDialogStateInactive;

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Custom Link Dialog component for MDXEditor.
 *
 * This component is passed to MDXEditor's linkDialogPlugin as a custom dialog.
 * It renders differently based on state:
 *
 * - Preview: Floating popover positioned near the link with URL preview,
 *   copy button, edit button, and remove button
 * - Edit: Modal dialog with URL input, title input, and save/cancel buttons
 * - Inactive: Returns null (nothing rendered)
 *
 * @component
 * @example
 * ```tsx
 * // Used in MDXEditor plugin configuration
 * linkDialogPlugin({
 *   LinkDialog: LinkDialog,
 * })
 * ```
 */
export function LinkDialog(): React.ReactElement {
  const state = useCellValue(linkDialogState$) as LinkDialogState;
  const cancelLinkEdit = usePublisher(cancelLinkEdit$);
  const updateLink = usePublisher(updateLink$);
  const switchFromPreviewToLinkEdit = usePublisher(
    switchFromPreviewToLinkEdit$
  );
  const removeLink = usePublisher(removeLink$);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [prevType, setPrevType] = useState(state.type);
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);

  // Store the trigger element when dialog opens in edit mode
  useEffect(() => {
    if (state.type === "edit") {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [state.type]);

  // Focus trap for accessibility (only for edit mode, not preview)
  const { containerRef } = useFocusTrap({
    enabled: state.type === "edit",
    onEscape: cancelLinkEdit,
    returnFocusTo: triggerRef.current,
  });

  // Reset or populate form when state changes
  if (state.type !== prevType) {
    setPrevType(state.type);
    if (state.type === "edit") {
      setUrl(state.url);
      setTitle(state.title);
      setIsUrlValid(true);
      setIsEditMode(!!state.url);
    }
  }

  // Focus first input when edit dialog opens (useFocusTrap handles escape key)
  useEffect(() => {
    if (state.type === "edit" && containerRef.current) {
      const firstInput = containerRef.current.querySelector("input");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
      }
    }
  }, [state.type, containerRef]);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setUrl(newUrl);
      setIsUrlValid(newUrl === "" || isValidUrl(newUrl));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!isValidUrl(url)) {
      setIsUrlValid(false);
      return;
    }
    updateLink({ url, title, text: undefined });
  }, [updateLink, url, title]);

  const handleCopy = useCallback(() => {
    if (state.type === "preview") {
      navigator.clipboard.writeText(state.url).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1500);
      });
    }
  }, [state]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        cancelLinkEdit();
      }
    },
    [cancelLinkEdit]
  );

  if (state.type === "inactive") {
    return <></>;
  }

  // PREVIEW MODE: Render as a floating popover
  if (state.type === "preview") {
    return (
      <div
        className="wn-link-preview"
        style={{
          top: (state.rectangle?.top ?? 0) + (state.rectangle?.height ?? 0) + 8,
          left: state.rectangle?.left ?? 0,
        }}
      >
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="wn-link-preview-url"
          title={state.url}
        >
          {state.url}
        </a>

        <div className="wn-link-preview-divider" />

        <button
          onClick={handleCopy}
          className="wn-link-preview-btn"
          title={copySuccess ? "Copied!" : "Copy URL"}
        >
          <Copy size={16} />
        </button>

        <button
          onClick={() => switchFromPreviewToLinkEdit()}
          className="wn-link-preview-btn"
          title="Edit Link"
        >
          <Edit2 size={16} />
        </button>

        <button
          onClick={() => removeLink()}
          className="wn-link-preview-btn wn-link-preview-btn--danger"
          title="Remove Link"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  // EDIT MODE: Render as a Modal Dialog
  return (
    <div
      className="wn-link-dialog-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-dialog-title"
    >
      <div className="wn-link-dialog" ref={containerRef}>
        {/* Header */}
        <div className="wn-link-dialog-header">
          <h2 id="link-dialog-title" className="wn-link-dialog-title">
            {isEditMode ? "Edit Link" : "Insert Link"}
          </h2>
          <button
            className="wn-link-dialog-close"
            onClick={() => cancelLinkEdit()}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="wn-link-dialog-content">
          <div className="wn-link-dialog-field">
            <label className="wn-link-dialog-label" htmlFor="link-url-input">
              URL
            </label>
            <div className="wn-link-dialog-input-wrapper">
              <LinkIcon size={16} className="wn-link-dialog-input-icon" />
              <input
                id="link-url-input"
                type="text"
                className={`wn-link-dialog-input wn-link-dialog-input--with-icon ${!isUrlValid ? "wn-link-dialog-input--error" : ""}`}
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                aria-invalid={!isUrlValid}
                aria-describedby={!isUrlValid ? "link-url-error" : undefined}
              />
            </div>
            {!isUrlValid && (
              <p
                id="link-url-error"
                className="wn-link-dialog-error"
                role="alert"
              >
                Please enter a valid URL (e.g. https://example.com)
              </p>
            )}
          </div>

          <div className="wn-link-dialog-field">
            <label className="wn-link-dialog-label" htmlFor="link-title-input">
              Title (Optional)
            </label>
            <input
              id="link-title-input"
              type="text"
              className="wn-link-dialog-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hover text"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="wn-link-dialog-footer">
          <button
            className="wn-btn-secondary"
            onClick={() => cancelLinkEdit()}
            type="button"
          >
            Cancel
          </button>
          <button
            className="wn-btn-primary"
            onClick={handleSave}
            disabled={!url || !isUrlValid}
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
