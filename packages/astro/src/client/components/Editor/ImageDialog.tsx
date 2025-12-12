/**
 * @fileoverview Custom Image Dialog Component for @writenex/astro
 *
 * This component provides a custom dialog for inserting and editing images
 * in the MDXEditor. It replaces the default MDXEditor image dialog with
 * a styled version that matches the Writenex design system.
 * Includes focus trap for accessibility compliance.
 *
 * ## Features:
 * - Tab interface for switching between upload and URL modes
 * - Drag-and-drop ready file upload zone
 * - Alt text and title fields for accessibility
 * - URL validation with error feedback
 * - Works with MDXEditor's image plugin system
 * - Focus trap for keyboard accessibility
 *
 * @module @writenex/astro/client/components/Editor/ImageDialog
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { usePublisher, useCellValue } from "@mdxeditor/editor";
import {
  insertImage$,
  closeImageDialog$,
  imageDialogState$,
  saveImage$,
} from "@mdxeditor/editor";
import { Image as ImageIcon, Link as LinkIcon, Upload, X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import "./ImageDialog.css";

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
 * Custom Image Dialog component for MDXEditor.
 *
 * This component is passed to MDXEditor's imagePlugin as a custom dialog.
 * It handles both inserting new images and editing existing ones.
 *
 * @component
 * @example
 * ```tsx
 * // Used in MDXEditor plugin configuration
 * imagePlugin({
 *   imageUploadHandler: handleUpload,
 *   imagePreviewHandler: handlePreview,
 *   ImageDialog: ImageDialog,
 * })
 * ```
 */
export function ImageDialog(): React.ReactElement {
  const insertImage = usePublisher(insertImage$);
  const saveImage = usePublisher(saveImage$);
  const closeImageDialog = usePublisher(closeImageDialog$);
  const state = useCellValue(imageDialogState$);

  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [src, setSrc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [title, setTitle] = useState("");
  const [prevType, setPrevType] = useState(state.type);
  const [isUrlValid, setIsUrlValid] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Store the trigger element when dialog opens
  useEffect(() => {
    if (state.type !== "inactive") {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [state.type]);

  // Focus trap for accessibility
  const { containerRef } = useFocusTrap({
    enabled: state.type !== "inactive",
    onEscape: closeImageDialog,
    returnFocusTo: triggerRef.current,
  });

  // Reset or populate form when state changes
  if (state.type !== prevType) {
    setPrevType(state.type);
    if (state.type === "editing") {
      setMode(state.initialValues.src ? "url" : "upload");
      setSrc(state.initialValues.src || "");
      setAltText(state.initialValues.altText || "");
      setTitle(state.initialValues.title || "");
      setFile(null);
      setIsUrlValid(true);
    } else if (state.type === "new") {
      setMode("upload");
      setSrc("");
      setAltText("");
      setTitle("");
      setFile(null);
      setIsUrlValid(true);
    }
  }

  // Focus first input when dialog opens (useFocusTrap handles escape key)
  useEffect(() => {
    if (state.type !== "inactive" && containerRef.current) {
      const firstInput = containerRef.current.querySelector("input, button");
      if (firstInput instanceof HTMLElement) {
        setTimeout(() => firstInput.focus(), 50);
      }
    }
  }, [state.type, containerRef]);

  const handleSrcChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSrc = e.target.value;
      setSrc(newSrc);
      setIsUrlValid(newSrc === "" || isValidUrl(newSrc));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (mode === "url" && !isValidUrl(src)) {
      setIsUrlValid(false);
      return;
    }

    if (state.type === "editing") {
      const payload: {
        altText: string;
        title: string;
        file?: FileList;
        src?: string;
      } = {
        altText,
        title,
      };

      if (mode === "upload" && file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        payload.file = dt.files;
      } else if (mode === "url" && src) {
        payload.src = src;
      }

      saveImage(payload);
    } else {
      if (mode === "upload" && file) {
        insertImage({ file, altText, title });
      } else if (mode === "url" && src) {
        insertImage({ src, altText, title });
      }
    }
    closeImageDialog();
  }, [
    mode,
    src,
    file,
    altText,
    title,
    state.type,
    insertImage,
    saveImage,
    closeImageDialog,
  ]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        setFile(e.target.files[0]);
      }
    },
    []
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeImageDialog();
      }
    },
    [closeImageDialog]
  );

  const isOpen = state.type !== "inactive";
  const canSave = mode === "upload" ? !!file : !!src && isUrlValid;

  if (!isOpen) return <></>;

  return (
    <div
      className="wn-image-dialog-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-dialog-title"
    >
      <div className="wn-image-dialog" ref={containerRef}>
        {/* Header */}
        <div className="wn-image-dialog-header">
          <h2 id="image-dialog-title" className="wn-image-dialog-title">
            {state.type === "editing" ? "Edit Image" : "Insert Image"}
          </h2>
          <button
            className="wn-image-dialog-close"
            onClick={() => closeImageDialog()}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="wn-image-dialog-tabs">
          <button
            className={`wn-image-dialog-tab ${mode === "upload" ? "wn-image-dialog-tab--active" : ""}`}
            onClick={() => setMode("upload")}
            type="button"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            className={`wn-image-dialog-tab ${mode === "url" ? "wn-image-dialog-tab--active" : ""}`}
            onClick={() => setMode("url")}
            type="button"
          >
            <LinkIcon size={16} />
            URL
          </button>
        </div>

        {/* Content */}
        <div className="wn-image-dialog-content">
          {mode === "upload" ? (
            <div
              className="wn-image-dialog-dropzone"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="wn-image-dialog-file-input"
                accept="image/*"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="wn-image-dialog-file-info">
                  <p className="wn-image-dialog-file-name">{file.name}</p>
                  <p className="wn-image-dialog-file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <>
                  <ImageIcon
                    size={32}
                    className="wn-image-dialog-dropzone-icon"
                  />
                  <p className="wn-image-dialog-dropzone-text">
                    Click to select an image
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="wn-image-dialog-field">
              <label
                className="wn-image-dialog-label"
                htmlFor="image-url-input"
              >
                Image URL
              </label>
              <input
                id="image-url-input"
                type="text"
                className={`wn-image-dialog-input ${!isUrlValid ? "wn-image-dialog-input--error" : ""}`}
                value={src}
                onChange={handleSrcChange}
                placeholder="https://example.com/image.png"
                aria-invalid={!isUrlValid}
                aria-describedby={!isUrlValid ? "image-url-error" : undefined}
              />
              {!isUrlValid && (
                <p
                  id="image-url-error"
                  className="wn-image-dialog-error"
                  role="alert"
                >
                  Please enter a valid image URL
                </p>
              )}
            </div>
          )}

          <div className="wn-image-dialog-field">
            <label className="wn-image-dialog-label" htmlFor="image-alt-input">
              Alt Text
            </label>
            <input
              id="image-alt-input"
              type="text"
              className="wn-image-dialog-input"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Description for accessibility"
            />
          </div>

          <div className="wn-image-dialog-field">
            <label
              className="wn-image-dialog-label"
              htmlFor="image-title-input"
            >
              Title (Optional)
            </label>
            <input
              id="image-title-input"
              type="text"
              className="wn-image-dialog-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hover text"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="wn-image-dialog-footer">
          <button
            className="wn-btn-secondary"
            onClick={() => closeImageDialog()}
            type="button"
          >
            Cancel
          </button>
          <button
            className="wn-btn-primary"
            onClick={handleSave}
            disabled={!canSave}
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
