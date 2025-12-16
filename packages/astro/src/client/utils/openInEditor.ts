/**
 * @fileoverview Utility for opening files in external editors
 *
 * Provides functionality to open files in VS Code, Cursor, and other
 * editors that support URL protocols.
 *
 * @module @writenex/astro/client/utils/openInEditor
 */

/**
 * Supported editor types
 */
export type EditorType = "vscode" | "cursor" | "vscode-insiders" | "windsurf";

/**
 * Editor configuration
 */
interface EditorConfig {
  name: string;
  protocol: string;
  displayName: string;
}

/**
 * Map of supported editors and their URL protocols
 */
const EDITORS: Record<EditorType, EditorConfig> = {
  vscode: {
    name: "vscode",
    protocol: "vscode://file",
    displayName: "VS Code",
  },
  "vscode-insiders": {
    name: "vscode-insiders",
    protocol: "vscode-insiders://file",
    displayName: "VS Code Insiders",
  },
  cursor: {
    name: "cursor",
    protocol: "cursor://file",
    displayName: "Cursor",
  },
  windsurf: {
    name: "windsurf",
    protocol: "windsurf://file",
    displayName: "Windsurf",
  },
};

/**
 * Get list of available editors
 */
export function getAvailableEditors(): EditorConfig[] {
  return Object.values(EDITORS);
}

/**
 * Build editor URL for opening a file
 *
 * @param filePath - Absolute path to the file
 * @param editor - Editor type to use
 * @param line - Optional line number to jump to
 * @param column - Optional column number
 * @returns URL string for opening the file
 */
export function buildEditorUrl(
  filePath: string,
  editor: EditorType = "vscode",
  line?: number,
  column?: number
): string {
  const editorConfig = EDITORS[editor];
  if (!editorConfig) {
    throw new Error(`Unknown editor: ${editor}`);
  }

  let url = `${editorConfig.protocol}${filePath}`;

  // Add line and column if provided
  if (line !== undefined) {
    url += `:${line}`;
    if (column !== undefined) {
      url += `:${column}`;
    }
  }

  return url;
}

/**
 * Open a file in the specified editor
 *
 * @param filePath - Absolute path to the file
 * @param editor - Editor type to use (default: vscode)
 * @param line - Optional line number to jump to
 * @returns true if the URL was opened, false otherwise
 */
export function openInEditor(
  filePath: string,
  editor: EditorType = "vscode",
  line?: number
): boolean {
  try {
    const url = buildEditorUrl(filePath, editor, line);
    window.open(url, "_self");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the preferred editor from localStorage
 */
export function getPreferredEditor(): EditorType {
  if (typeof window === "undefined") return "vscode";
  const stored = localStorage.getItem("writenex-preferred-editor");
  if (stored && stored in EDITORS) {
    return stored as EditorType;
  }
  return "vscode";
}

/**
 * Save the preferred editor to localStorage
 */
export function setPreferredEditor(editor: EditorType): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("writenex-preferred-editor", editor);
}
