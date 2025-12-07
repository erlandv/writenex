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
 *
 * @module components/editor/EditorShortcuts
 * @see {@link KEYBOARD_SHORTCUTS} - Centralized shortcut definitions
 * @see {@link useKeyboardShortcuts} - Global shortcuts (document management, etc.)
 * @see {@link KeyboardShortcutsModal} - UI showing all available shortcuts
 */

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { usePublisher, openNewImageDialog$ } from "@mdxeditor/editor";

/**
 * A Lexical plugin component that registers custom keyboard shortcuts.
 *
 * This component is added to the editor via MDXEditor's plugin system
 * (addComposerChild$). It uses Lexical's command listener pattern to
 * intercept keyboard events and trigger formatting/insert actions.
 *
 * The component renders nothing visually - it only registers event handlers.
 *
 * @component
 * @example
 * ```tsx
 * // Registered via MDXEditor plugin
 * const shortcutsPlugin = () => ({
 *   init: (realm) => {
 *     realm.pub(addComposerChild$, EditorShortcuts);
 *   }
 * });
 *
 * // Used in MDXEditor
 * <MDXEditor
 *   plugins={[shortcutsPlugin()]}
 * />
 * ```
 *
 * @returns null - This is a headless component
 *
 * @see {@link shortcutsPlugin} - Plugin wrapper for MDXEditor integration
 */

export const EditorShortcuts = () => {
  const [editor] = useLexicalComposerContext();
  const openImageDialog = usePublisher(openNewImageDialog$);

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
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
            event.preventDefault();
            const level = code.replace("Digit", "");
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () =>
                  $createHeadingNode(`h${level}` as HeadingTagType)
                );
              }
            });
            return true;
          }
        }

        // Insert Image: Ctrl+Alt+I
        if (ctrlKey && altKey && !shiftKey) {
          if (code === "KeyI") {
            event.preventDefault();
            openImageDialog();
            return true;
          }
        }

        // Lists & Blockquote & Strikethrough & Inline Code
        if (ctrlKey && shiftKey && !altKey) {
          // Ordered List: Ctrl+Shift+7
          if (code === "Digit7") {
            event.preventDefault();
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            return true;
          }
          // Unordered List: Ctrl+Shift+8
          if (code === "Digit8") {
            event.preventDefault();
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            return true;
          }
          // Checklist: Ctrl+Shift+9
          if (code === "Digit9") {
            event.preventDefault();
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
            return true;
          }
          // Blockquote: Ctrl+Shift+Q
          if (code === "KeyQ") {
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
              }
            });
            return true;
          }
          // Strikethrough: Ctrl+Shift+S
          if (code === "KeyS") {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
            return true;
          }
          // Inline Code: Ctrl+Shift+C
          if (code === "KeyC") {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, openImageDialog]);

  return null;
};
