/**
 * @fileoverview Link Dialog Component
 *
 * This component provides dialogs for inserting and editing links in the
 * markdown editor. It has two modes:
 * 1. **Preview mode**: A floating popover showing the link URL with quick actions
 * 2. **Edit mode**: A modal dialog for inserting new links or editing existing ones
 *
 * ## Features:
 * - Floating preview popover for existing links (click to see URL)
 * - Copy, edit, and remove actions in preview mode
 * - Modal dialog for new/edit with URL validation
 * - Optional title field for hover text
 * - Works with MDXEditor's link plugin system
 *
 * @module components/editor/LinkDialog
 * @see {@link MarkdownEditor} - Configures linkDialogPlugin with this dialog
 */

import React, { useState, useCallback } from "react";
import { usePublisher, useCellValue } from "@mdxeditor/editor";
import {
  linkDialogState$,
  cancelLinkEdit$,
  updateLink$,
  switchFromPreviewToLinkEdit$,
  removeLink$,
} from "@mdxeditor/editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { Link as LinkIcon, Trash2, Edit2, Copy } from "lucide-react";
import { cn, isValidUrl } from "@/lib/utils";

/**
 * Link dialog state when showing a preview of an existing link.
 * @interface LinkDialogStatePreview
 */
interface LinkDialogStatePreview {
  type: "preview";
  url: string;
  title: string;
  rectangle: DOMRect;
}

/**
 * Link dialog state when editing or inserting a link.
 * @interface LinkDialogStateEdit
 */
interface LinkDialogStateEdit {
  type: "edit";
  url: string;
  title: string;
  rectangle: DOMRect;
}

/**
 * Link dialog state when the dialog is closed.
 * @interface LinkDialogStateInactive
 */
interface LinkDialogStateInactive {
  type: "inactive";
}

/**
 * Union type for all possible link dialog states.
 * @typedef {LinkDialogStatePreview | LinkDialogStateEdit | LinkDialogStateInactive} LinkDialogState
 */
type LinkDialogState =
  | LinkDialogStatePreview
  | LinkDialogStateEdit
  | LinkDialogStateInactive;

/**
 * Link dialog component for MDXEditor.
 *
 * This component is passed to MDXEditor's linkDialogPlugin as a custom dialog.
 * It renders differently based on state:
 *
 * - **Preview**: Floating popover positioned near the link with URL preview,
 *   copy button, edit button, and remove button
 * - **Edit**: Modal dialog with URL input, title input, and save/cancel buttons
 * - **Inactive**: Returns null (nothing rendered)
 *
 * @component
 * @example
 * ```tsx
 * // Used in MDXEditor plugin configuration
 * linkDialogPlugin({
 *   LinkDialog: LinkDialog,
 * })
 * ```
 *
 * @returns Preview popover, edit dialog, or null based on state
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

  if (state.type !== prevType) {
    setPrevType(state.type);
    if (state.type === "edit") {
      setUrl(state.url);
      setTitle(state.title);
      setIsUrlValid(true); // Reset validation on open
      setIsEditMode(!!state.url); // Determine if we are editing an existing link
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsUrlValid(isValidUrl(newUrl));
  };

  const handleSave = useCallback(() => {
    if (!isValidUrl(url)) {
      setIsUrlValid(false);
      return;
    }
    updateLink({ url, title, text: undefined });
  }, [updateLink, url, title]);

  const handleCopy = useCallback(() => {
    if (state.type === "preview") {
      navigator.clipboard.writeText(state.url);
    }
  }, [state]);

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      cancelLinkEdit();
    }
  };

  if (state.type === "inactive") {
    return <></>;
  }

  // PREVIEW MODE: Render as a simple popover/tooltip
  if (state.type === "preview") {
    return (
      <div
        className="animate-in fade-in zoom-in-95 fixed z-50 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg duration-100 dark:border-zinc-800 dark:bg-zinc-900"
        style={{
          top: (state.rectangle?.top ?? 0) + (state.rectangle?.height ?? 0) + 8,
          left: state.rectangle?.left ?? 0,
        }}
      >
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[250px] truncate px-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          title={state.url}
        >
          {state.url}
        </a>

        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

        <SimpleTooltip content="Copy URL" delayDuration={0}>
          <button
            onClick={handleCopy}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-black/10 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
          >
            <Copy className="h-4 w-4" />
          </button>
        </SimpleTooltip>

        <SimpleTooltip content="Edit Link" delayDuration={0}>
          <button
            onClick={() => switchFromPreviewToLinkEdit()}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-black/10 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </SimpleTooltip>

        <SimpleTooltip content="Remove Link" delayDuration={0}>
          <button
            onClick={() => removeLink()}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </SimpleTooltip>
      </div>
    );
  }

  // EDIT MODE: Render as a Modal Dialog
  return (
    <Dialog open={state.type === "edit"} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Link" : "Insert Link"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute top-2.5 left-3 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <Input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                className={cn(
                  "pl-9",
                  !isUrlValid &&
                    "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                )}
                autoFocus
              />
            </div>
            {!isUrlValid && (
              <p className="text-xs text-red-500">
                Please enter a valid URL (e.g. https://example.com)
              </p>
            )}
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
          <Button variant="outline" onClick={() => cancelLinkEdit()}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!url || !isUrlValid}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
