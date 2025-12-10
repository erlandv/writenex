/**
 * @fileoverview Application Header Component for Writenex Astro
 *
 * This component provides the main header bar with logo, branding, and
 * a unified toolbar for editor operations.
 *
 * @module @writenex/astro/client/components/Header
 */

import { Keyboard, Settings, PanelLeft, PanelRight } from "lucide-react";
import "./Header.css";

/**
 * Writenex Logo SVG component
 */
function LogoIcon(): React.ReactElement {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="#335DFF"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20.18 4.22l3.7 0c0.05,0 0.08,0.02 0.1,0.06 0.03,0.03 0.03,0.08 0,0.12l-5.78 10.31c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.89 -3.28c-0.03,-0.04 -0.03,-0.08 -0.01,-0.12l3.98 -7.03c0.02,-0.04 0.06,-0.06 0.1,-0.06zm-6.13 6.34l3.24 5.65c0.03,0.04 0.03,0.09 0,0.12l-1.9 3.39c-0.02,0.04 -0.05,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-3.17 -5.68 -3.12 5.68c-0.02,0.04 -0.06,0.06 -0.1,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-1.92 -3.38c-0.03,-0.04 -0.03,-0.09 0,-0.13l3.26 -5.66 -3.48 -6.15c-0.02,-0.04 -0.02,-0.09 0,-0.12 0.02,-0.04 0.06,-0.06 0.1,-0.06l3.74 0c0.05,0 0.08,0.02 0.11,0.06l1.51 2.7 1.53 -2.7c0.02,-0.04 0.06,-0.06 0.1,-0.06l3.84 0c0.04,0 0.08,0.02 0.1,0.06 0.02,0.03 0.02,0.08 0,0.12l-3.54 6.16zm-10.06 -6.28l3.99 7.01c0.02,0.04 0.02,0.08 0,0.12l-1.91 3.31c-0.03,0.04 -0.06,0.06 -0.11,0.06 -0.04,0 -0.08,-0.02 -0.1,-0.06l-5.84 -10.32c-0.03,-0.04 -0.03,-0.09 0,-0.12 0.02,-0.04 0.05,-0.06 0.1,-0.06l3.76 0c0.05,0 0.09,0.02 0.11,0.06z" />
    </svg>
  );
}

/**
 * Props for the Header component
 */
interface HeaderProps {
  /** Whether the sidebar is open */
  isSidebarOpen?: boolean;
  /** Callback to toggle sidebar */
  onToggleSidebar?: () => void;
  /** Whether the frontmatter panel is open */
  isFrontmatterOpen?: boolean;
  /** Callback to toggle frontmatter panel */
  onToggleFrontmatter?: () => void;
  /** Callback when keyboard shortcuts button is clicked */
  onKeyboardShortcuts?: () => void;
  /** Callback when settings button is clicked */
  onSettings?: () => void;
}

/**
 * Visual separator for grouping toolbar buttons.
 */
function ToolbarSeparator(): React.ReactElement {
  return <div className="wn-toolbar-separator" />;
}

/**
 * Toolbar button component with icon
 */
function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}): React.ReactElement {
  const className = [
    "wn-toolbar-btn",
    active ? "wn-toolbar-btn--active" : "",
    disabled ? "wn-toolbar-btn--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={className}
    >
      {icon}
    </button>
  );
}

/**
 * Placeholder icons for toolbar - will be replaced with actual icons later
 */
function PlaceholderIcon({ char }: { char: string }): React.ReactElement {
  return <span className="wn-placeholder-icon">{char}</span>;
}

/**
 * Main application header with logo and unified toolbar.
 *
 * @component
 */
export function Header({
  isSidebarOpen = true,
  onToggleSidebar,
  isFrontmatterOpen = true,
  onToggleFrontmatter,
  onKeyboardShortcuts,
  onSettings,
}: HeaderProps): React.ReactElement {
  return (
    <header className="wn-header">
      {/* Left side: Logo and branding */}
      <div className="wn-header-left">
        <div className="wn-header-brand">
          <LogoIcon />
          <div className="wn-header-title">
            <span className="wn-header-logo-text">Writenex</span>
            <span className="wn-header-badge">Astro</span>
          </div>
        </div>
      </div>

      {/* Right side: Toolbar */}
      <div className="wn-toolbar">
        {/* Group 1: Panel toggles */}
        <ToolbarButton
          icon={<PanelLeft size={14} />}
          label="Toggle Sidebar"
          onClick={onToggleSidebar}
          active={isSidebarOpen}
        />
        <ToolbarButton
          icon={<PanelRight size={14} />}
          label="Toggle Frontmatter Panel"
          onClick={onToggleFrontmatter}
          active={isFrontmatterOpen}
        />

        <ToolbarSeparator />

        {/* Group 2: File operations (placeholder) */}
        <ToolbarButton
          icon={<PlaceholderIcon char="N" />}
          label="New Content (placeholder)"
        />
        <ToolbarButton
          icon={<PlaceholderIcon char="S" />}
          label="Save (placeholder)"
        />

        <ToolbarSeparator />

        {/* Group 3: View options (placeholder) */}
        <ToolbarButton
          icon={<PlaceholderIcon char="E" />}
          label="Edit Mode (placeholder)"
        />
        <ToolbarButton
          icon={<PlaceholderIcon char="P" />}
          label="Preview Mode (placeholder)"
        />
        <ToolbarButton
          icon={<PlaceholderIcon char="2" />}
          label="Split View (placeholder)"
        />

        <ToolbarSeparator />

        {/* Group 4: Search and navigation (placeholder) */}
        <ToolbarButton
          icon={<PlaceholderIcon char="F" />}
          label="Find (placeholder)"
        />
        <ToolbarButton
          icon={<PlaceholderIcon char="R" />}
          label="Replace (placeholder)"
        />

        <ToolbarSeparator />

        {/* Group 5: Help and settings */}
        <ToolbarButton
          icon={<Keyboard size={14} />}
          label="Keyboard Shortcuts"
          onClick={onKeyboardShortcuts}
        />
        <ToolbarButton
          icon={<Settings size={14} />}
          label="Settings"
          onClick={onSettings}
        />
      </div>
    </header>
  );
}
