/**
 * @fileoverview Image Dialog Component
 *
 * This component provides a dialog for inserting and editing images in the
 * markdown editor. It supports two modes: file upload (stored in IndexedDB)
 * and URL (external images).
 *
 * ## Features:
 * - Tab interface for switching between upload and URL modes
 * - Drag-and-drop ready file upload zone
 * - Alt text and title fields for accessibility
 * - URL validation with error feedback
 * - Works with MDXEditor's image plugin system
 *
 * ## Storage:
 * Uploaded images are stored in IndexedDB and referenced via `idb://<id>` URLs.
 * The imagePlugin's handlers convert these URLs for preview and export.
 *
 * @module components/editor/ImageDialog
 * @see {@link Header} - Contains export logic that converts idb:// URLs
 * @see {@link MarkdownEditor} - Configures imagePlugin with this dialog
 */

import React, { useState, useRef } from "react";
import { usePublisher, useCellValue } from "@mdxeditor/editor";
import {
  insertImage$,
  closeImageDialog$,
  imageDialogState$,
  saveImage$,
} from "@mdxeditor/editor";
import { Button } from "@writenex/ui" // button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@writenex/ui" // dialog";
import { Input } from "@writenex/ui" // input";
import { cn, isValidUrl } from "@writenex/utils";
import { Image as ImageIcon, Link as LinkIcon, Upload } from "lucide-react";

/**
 * Image dialog component for MDXEditor.
 *
 * This component is passed to MDXEditor's imagePlugin as a custom dialog.
 * It handles both inserting new images and editing existing ones.
 *
 * ## State Management:
 * Uses MDXEditor's cell-based state (imageDialogState$) to:
 * - Detect when dialog should open (type !== 'inactive')
 * - Distinguish between 'new' and 'editing' modes
 * - Get initial values when editing existing images
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
 *
 * @returns Dialog element for image insertion/editing
 */

export function ImageDialog() {
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

  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSrc = e.target.value;
    setSrc(newSrc);
    setIsUrlValid(isValidUrl(newSrc));
  };

  const handleSave = () => {
    if (mode === "url" && !isValidUrl(src)) {
      setIsUrlValid(false);
      return;
    }

    if (state.type === "editing") {
      // For editing, we use saveImage
      // Note: saveImage expects FileList for file, but we have File
      // We need to construct a FileList-like object or just pass what it expects if types allow
      // Looking at types, saveImage takes SaveImageParameters which has file?: FileList

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
        // Create a DataTransfer to get a FileList
        const dt = new DataTransfer();
        dt.items.add(file);
        payload.file = dt.files;
      } else if (mode === "url" && src) {
        payload.src = src;
      }

      saveImage(payload);
    } else {
      // For new images
      if (mode === "upload" && file) {
        insertImage({ file, altText, title });
      } else if (mode === "url" && src) {
        insertImage({ src, altText, title });
      }
    }
    closeImageDialog();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog
      open={state.type !== "inactive"}
      onOpenChange={(open) => {
        if (!open) closeImageDialog();
      }}
    >
      <DialogContent className="sm:max-w-[400px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {state.type === "editing" ? "Edit Image" : "Insert Image"}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="mt-2 flex rounded-md bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => setMode("upload")}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm py-1.5 text-sm font-medium transition-all",
              mode === "upload"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            onClick={() => setMode("url")}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm py-1.5 text-sm font-medium transition-all",
              mode === "url"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <LinkIcon className="h-4 w-4" />
            URL
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 py-2">
          {mode === "upload" ? (
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-300 p-6 transition-colors hover:bg-black/5 dark:border-zinc-700 dark:hover:bg-white/5"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="text-center">
                  <p className="max-w-[200px] truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-zinc-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Click to select an image
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Image URL
              </label>
              <Input
                type="text"
                value={src}
                onChange={handleSrcChange}
                placeholder="https://example.com/image.png"
                className={
                  !isUrlValid
                    ? "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                    : ""
                }
              />
              {!isUrlValid && (
                <p className="text-xs text-red-500">
                  Please enter a valid image URL
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Alt Text
            </label>
            <Input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Description for accessibility"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title (Optional)
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hover text"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => closeImageDialog()}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={mode === "upload" ? !file : !src || !isUrlValid}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
