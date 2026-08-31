/**
 * @fileoverview Editor Keyboard Shortcuts Plugin Component
 *
 * This component registers custom keyboard shortcuts for the Lexical editor.
 * It handles formatting, block transformations, and insert actions that aren't
 * covered by MDXEditor's default shortcuts.
 *
 * ## Registered Shortcuts (see keyboardShortcuts.ts for complete list):
 * - **Headings**: Ctrl+Alt+1-6 for H1-H6
 * - **Lists**: Ctrl+Shift+7 (ordered), Ctrl+Shift+8 (unordered), Ctrl+Shift+9 (checklist)
 * - **Formatting**: Ctrl+Shift+S (strikethrough), Ctrl+Shift+C (inline code)
 * - **Blocks**: Ctrl+Shift+Q (blockquote)
 * - **Insert**: Ctrl+Alt+I (image dialog)
 *
 * ## Architecture:
 * - Uses Lexical's command system for keyboard event handling
 * - Registered with HIGH priority to override default browser behaviors
 * - Added to editor via MDXEditor's addComposerChild$ plugin system
 * - Uses MDXEditor's rootEditor$ cell to access the Lexical editor instance
 *
 * @module components/editor/EditorShortcuts
 * @see {@link KEYBOARD_SHORTCUTS} - Centralized shortcut definitions
 * @see {@link useKeyboardShortcuts} - Global shortcuts (document management, etc.)
 * @see {@link KeyboardShortcutsModal} - UI showing all available shortcuts
 */

import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  openNewImageDialog$,
  rootEditor$,
  useCellValue,
  usePublisher,
} from "@mdxeditor/editor";
import type { LexicalEditor } from "lexical";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
} from "lexical";
import { useEffect } from "react";

export const EditorShortcuts = () => {
  const rootEditor = useCellValue(rootEditor$) as LexicalEditor | null;
  const openImageDialog = usePublisher(openNewImageDialog$);

  useEffect(() => {
    const editor = rootEditor;
    if (!editor) return;

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const { ctrlKey, altKey, shiftKey, code } = event;

        // Headings: Ctrl+Alt+1..6
        if (ctrlKey && altKey && !shiftKey) {
          if (
            [
              "Digit1",
              "Digit2",
              "Digit3",
              "Digit4",
              "Digit5",
              "Digit6",
            ].includes(code)
          ) {
            const headingLevel = parseInt(
              code.charAt(5)
            ) as unknown as HeadingTagType;
            editor.update(() => {
              $setBlocksType($getSelection(), () =>
                $createHeadingNode(headingLevel)
              );
            });
            event.preventDefault();
            return true;
          }
        }

        // Lists: Ctrl+Shift+7 (ordered), Ctrl+Shift+8 (unordered), Ctrl+Shift+9 (checklist)
        if (ctrlKey && shiftKey && !altKey) {
          if (code === "Digit7") {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            event.preventDefault();
            return true;
          }
          if (code === "Digit8") {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            event.preventDefault();
            return true;
          }
          if (code === "Digit9") {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
            event.preventDefault();
            return true;
          }
        }

        // Strikethrough: Ctrl+Shift+S
        if (ctrlKey && shiftKey && code === "KeyS") {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          event.preventDefault();
          return true;
        }

        // Inline code: Ctrl+Shift+C
        if (ctrlKey && shiftKey && code === "KeyC") {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
          event.preventDefault();
          return true;
        }

        // Blockquote: Ctrl+Shift+Q
        if (ctrlKey && shiftKey && code === "KeyQ") {
          editor.update(() => {
            $setBlocksType($getSelection(), () => $createQuoteNode());
          });
          event.preventDefault();
          return true;
        }

        // Image dialog: Ctrl+Alt+I
        if (ctrlKey && altKey && code === "KeyI") {
          openImageDialog();
          event.preventDefault();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [rootEditor, openImageDialog]);

  return null;
};
