/**
 * @fileoverview Application Header Component for Writenex Astro
 *
 * This component provides the main header bar with logo, branding, and
 * a unified toolbar for editor operations.
 *
 * @module @writenex/astro/client/components/Header
 */

import { useState, useRef, useEffect } from "react";
import {
  Keyboard,
  Settings,
  Folder,
  Info,
  Search,
  Sun,
  Moon,
  Monitor,
  History,
} from "lucide-react";
import { useTheme, type Theme } from "../../context/ThemeContext";
import "./Header.css";

/**
 * Writenex Logo SVG component
 */
function LogoIcon(): React.ReactElement {
  return (
    <svg
      width="56"
      height="56"
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
  /** Whether the search panel is open */
  isSearchOpen?: boolean;
  /** Callback to toggle search panel */
  onToggleSearch?: () => void;
  /** Whether the version history panel is open */
  isVersionHistoryOpen?: boolean;
  /** Callback to toggle version history panel */
  onToggleVersionHistory?: () => void;
  /** Whether version history is available (content selected) */
  versionHistoryEnabled?: boolean;
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
 * Theme option configuration
 */
const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Theme switcher dropdown component
 */
function ThemeSwitcher(): React.ReactElement {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="wn-theme-switcher" ref={dropdownRef}>
      <button
        type="button"
        className={`wn-toolbar-btn ${isOpen ? "wn-toolbar-btn--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ThemeIcon size={14} />
      </button>

      {isOpen && (
        <div className="wn-theme-dropdown" role="listbox" aria-label="Theme">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`wn-theme-option ${isSelected ? "wn-theme-option--selected" : ""}`}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
              >
                <Icon size={14} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  isSearchOpen = false,
  onToggleSearch,
  isVersionHistoryOpen = false,
  onToggleVersionHistory,
  versionHistoryEnabled = false,
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
            <div className="wn-header-title-row">
              <span className="wn-header-logo-text">Writenex</span>
              <span className="wn-header-badge">Astro</span>
            </div>
            <span className="wn-header-tagline">
              Edit your Astro content visually.
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Toolbar */}
      <div className="wn-toolbar">
        {/* Group 1: Panels & Actions */}
        <ToolbarButton
          icon={<Folder size={14} />}
          label="Toggle Explorer"
          onClick={onToggleSidebar}
          active={isSidebarOpen}
        />
        <ToolbarButton
          icon={<Info size={14} />}
          label="Toggle Frontmatter"
          onClick={onToggleFrontmatter}
          active={isFrontmatterOpen}
        />
        <ToolbarButton
          icon={<Search size={14} />}
          label="Search & Replace (Ctrl+F)"
          onClick={onToggleSearch}
          active={isSearchOpen}
        />
        <ToolbarButton
          icon={<History size={14} />}
          label="Version History"
          onClick={onToggleVersionHistory}
          active={isVersionHistoryOpen}
          disabled={!versionHistoryEnabled}
        />

        <ToolbarSeparator />

        {/* Group 2: Preferences */}
        <ThemeSwitcher />
        <ToolbarButton
          icon={<Keyboard size={14} />}
          label="Keyboard Shortcuts (Ctrl+/)"
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
