/**
 * @fileoverview Configuration panel modal
 *
 * Modal component displaying Writenex Astro configuration settings,
 * including image settings, editor settings, and discovered collections.
 * Includes focus trap for accessibility compliance.
 *
 * @module @writenex/astro/client/components/ConfigPanel
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Settings,
  Folder,
  Image,
  Info,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import type { Collection, WritenexClientConfig } from "../../hooks/useApi";
import { useSharedApi } from "../../context/ApiContext";
import {
  openInEditor,
  getAvailableEditors,
  getPreferredEditor,
  setPreferredEditor,
  type EditorType,
} from "../../utils/openInEditor";
import "./ConfigPanel.css";

/**
 * Props for the ConfigPanel component
 */
interface ConfigPanelProps {
  /** Current configuration */
  config: WritenexClientConfig | null;
  /** Discovered collections */
  collections: Collection[];
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Configuration panel modal component
 *
 * @component
 * @example
 * ```tsx
 * <ConfigPanel
 *   config={config}
 *   collections={collections}
 *   isOpen={showConfig}
 *   onClose={() => setShowConfig(false)}
 * />
 * ```
 */
export function ConfigPanel({
  config,
  collections,
  isOpen,
  onClose,
}: ConfigPanelProps): React.ReactElement | null {
  const api = useSharedApi();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [configPath, setConfigPath] = useState<string | null>(null);
  const [hasConfigFile, setHasConfigFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEditor, setSelectedEditor] =
    useState<EditorType>(getPreferredEditor());
  const [showEditorDropdown, setShowEditorDropdown] = useState(false);

  // Fetch config path when modal opens
  useEffect(() => {
    if (isOpen) {
      api
        .getConfigPath()
        .then((data) => {
          setConfigPath(data.configPath);
          setHasConfigFile(data.hasConfigFile);
        })
        .catch(() => {
          setConfigPath(null);
          setHasConfigFile(false);
        });
    }
  }, [isOpen, api]);

  // Store the trigger element when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus trap for accessibility
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: onClose,
    returnFocusTo: triggerRef.current,
  });

  const handleOpenInEditor = useCallback(() => {
    if (configPath) {
      openInEditor(configPath, selectedEditor);
      setPreferredEditor(selectedEditor);
    }
  }, [configPath, selectedEditor]);

  const handleCopyPath = useCallback(() => {
    if (configPath) {
      navigator.clipboard.writeText(configPath).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [configPath]);

  const handleEditorSelect = useCallback((editor: EditorType) => {
    setSelectedEditor(editor);
    setPreferredEditor(editor);
    setShowEditorDropdown(false);
  }, []);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="wn-config-overlay" onClick={handleOverlayClick}>
      <div
        ref={containerRef}
        className="wn-config-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-panel-title"
      >
        {/* Header */}
        <div className="wn-config-header">
          <h2 id="config-panel-title" className="wn-config-title">
            <Settings size={16} />
            Configuration
          </h2>
          <button
            className="wn-config-close"
            onClick={onClose}
            title="Close"
            aria-label="Close configuration panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="wn-config-content">
          {/* Configuration File - Primary action at top */}
          <section className="wn-config-section">
            <div className="wn-config-help">
              <h3 className="wn-config-help-title">Configuration File</h3>
              {hasConfigFile && configPath ? (
                <>
                  <p className="wn-config-help-text">
                    Configuration loaded from{" "}
                    <code className="wn-config-help-code">
                      {configPath.split("/").pop()}
                    </code>
                  </p>
                  <div className="wn-config-actions">
                    <div className="wn-config-editor-select">
                      <button
                        className="wn-config-btn wn-config-btn--primary"
                        onClick={handleOpenInEditor}
                        title={`Open in ${getAvailableEditors().find((e) => e.name === selectedEditor)?.displayName}`}
                      >
                        <ExternalLink size={14} />
                        Open in Editor
                      </button>
                      <button
                        className="wn-config-btn wn-config-btn--dropdown"
                        onClick={() =>
                          setShowEditorDropdown(!showEditorDropdown)
                        }
                        aria-label="Select editor"
                        aria-expanded={showEditorDropdown}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {showEditorDropdown && (
                        <div className="wn-config-dropdown">
                          {getAvailableEditors().map((editor) => (
                            <button
                              key={editor.name}
                              className={`wn-config-dropdown-item ${selectedEditor === editor.name ? "wn-config-dropdown-item--active" : ""}`}
                              onClick={() =>
                                handleEditorSelect(editor.name as EditorType)
                              }
                            >
                              {editor.displayName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="wn-config-btn wn-config-btn--secondary"
                      onClick={handleCopyPath}
                      title="Copy file path"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy Path"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="wn-config-help-text">
                  No configuration file found. Using default settings.
                </p>
              )}
            </div>
          </section>

          {/* Image Settings */}
          <section className="wn-config-section">
            <h3 className="wn-config-section-title">
              <Image size={14} />
              Image Settings
            </h3>
            <div className="wn-config-items">
              <ConfigItem
                label="Strategy"
                value={config?.images?.strategy ?? "colocated"}
                valueClass={getStrategyClass(config?.images?.strategy)}
                description={getStrategyDescription(config?.images?.strategy)}
              />
              {config?.images?.publicPath && (
                <ConfigItem
                  label="Public Path"
                  value={config.images.publicPath}
                />
              )}
              {config?.images?.storagePath && (
                <ConfigItem
                  label="Storage Path"
                  value={config.images.storagePath}
                />
              )}
            </div>
          </section>

          {/* Editor Settings */}
          <section className="wn-config-section">
            <h3 className="wn-config-section-title">
              <Info size={14} />
              Editor Settings
            </h3>
            <div className="wn-config-items">
              <ConfigItem
                label="Autosave"
                value={
                  config?.editor?.autosave !== false ? "Enabled" : "Disabled"
                }
                valueClass={
                  config?.editor?.autosave !== false
                    ? "wn-config-item-value--emerald"
                    : "wn-config-item-value--muted"
                }
              />
              <ConfigItem
                label="Interval"
                value={`${(config?.editor?.autosaveInterval ?? 3000) / 1000}s`}
              />
            </div>
          </section>

          {/* Collections */}
          <section className="wn-config-section">
            <h3 className="wn-config-section-title">
              <Folder size={14} />
              Collections ({collections.length})
            </h3>
            {collections.length === 0 ? (
              <p className="wn-config-empty">No collections discovered</p>
            ) : (
              <div className="wn-config-collections">
                {collections.map((col) => (
                  <CollectionCard key={col.name} collection={col} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Get CSS class for strategy value
 */
function getStrategyClass(strategy?: string): string {
  switch (strategy) {
    case "colocated":
      return "wn-config-item-value--violet";
    case "public":
      return "wn-config-item-value--emerald";
    default:
      return "wn-config-item-value--amber";
  }
}

/**
 * Get description for strategy value
 */
function getStrategyDescription(strategy?: string): string {
  switch (strategy) {
    case "colocated":
      return "Images stored alongside content files";
    case "public":
      return "Images stored in public folder";
    default:
      return "Custom storage path";
  }
}

/**
 * Config item component
 */
function ConfigItem({
  label,
  value,
  valueClass = "",
  description,
}: {
  label: string;
  value: string;
  valueClass?: string;
  description?: string;
}): React.ReactElement {
  return (
    <div className="wn-config-item">
      <span className="wn-config-item-label">{label}</span>
      <div>
        <span className={`wn-config-item-value ${valueClass}`}>{value}</span>
        {description && (
          <p className="wn-config-item-description">{description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Collection card component
 */
function CollectionCard({
  collection,
}: {
  collection: Collection;
}): React.ReactElement {
  return (
    <div className="wn-config-collection">
      <div className="wn-config-collection-header">
        <span className="wn-config-collection-name">{collection.name}</span>
        <span className="wn-config-collection-count">
          {collection.count} items
        </span>
      </div>
      <div className="wn-config-collection-details">
        <p className="wn-config-collection-detail">
          <span>Path:</span> {collection.path}
        </p>
        <p className="wn-config-collection-detail">
          <span>Pattern:</span> {collection.filePattern}
        </p>
        {collection.schema && (
          <p className="wn-config-collection-detail wn-config-collection-detail--blue">
            <span>Schema:</span> {Object.keys(collection.schema).length} fields
            detected
          </p>
        )}
        {collection.previewUrl && (
          <p className="wn-config-collection-detail wn-config-collection-detail--violet">
            <span>Preview:</span> {collection.previewUrl}
          </p>
        )}
      </div>
    </div>
  );
}
