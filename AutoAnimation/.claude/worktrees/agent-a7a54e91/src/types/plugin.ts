import type { ComponentType } from 'react'
import type { TabGroupId } from './editor'

// ── Extension Points ────────────────────────────────────────────────────────

/** The six categories of extension points a plugin can contribute to */
export type ExtensionPoint =
  | 'panel'
  | 'layer'
  | 'export-format'
  | 'effect'
  | 'template'
  | 'ai-provider'

// ── Plugin Manifest ─────────────────────────────────────────────────────────

/** Declarative metadata shipped with every plugin */
export interface PluginManifest {
  /** Unique identifier (reverse-domain recommended: com.example.my-plugin) */
  id: string
  /** Human-readable name */
  name: string
  /** SemVer string */
  version: string
  /** Author name */
  author: string
  /** Short description */
  description: string
  /** Lucide icon name or emoji for display in UI */
  icon?: string
  /** Which extension points this plugin contributes to */
  extensionPoints: ExtensionPoint[]
}

// ── Extension Point Implementations ─────────────────────────────────────────

/** A panel extension adds a new tab to the left panel */
export interface PluginPanel {
  /** React component rendered when the tab is active */
  component: ComponentType
  /** Unique tab identifier (must not collide with built-in tabs) */
  tabId: string
  /** Label shown in the UI */
  tabLabel: string
  /** Which tab group this panel belongs to */
  tabGroup: TabGroupId
  /** Optional Lucide icon name for the tab card */
  tabIcon?: string
  /** Optional description shown in the card grid */
  tabDescription?: string
}

/** A layer extension renders content on the canvas */
export interface PluginLayer {
  /** React component rendered inside the canvas compositor */
  component: ComponentType<PluginLayerProps>
  /** z-index ordering relative to built-in layers (0-100, higher = on top) */
  zIndex: number
  /** Label for the 3D layer view */
  label?: string
}

/** Props passed to plugin layer components */
export interface PluginLayerProps {
  canvasWidth: number
  canvasHeight: number
}

/** An export format extension adds a new output format */
export interface PluginExportFormat {
  /** Display name (e.g. "Animated GIF", "APNG") */
  formatName: string
  /** File extension (e.g. "gif", "apng") */
  fileExtension: string
  /** Description shown in the export panel */
  description?: string
  /**
   * Export function that receives the canvas frames and produces a downloadable blob.
   * @param frames - Array of ImageData frames
   * @param fps - Frames per second
   * @param width - Canvas width
   * @param height - Canvas height
   * @returns A Blob of the exported file
   */
  exportFn: (frames: ImageData[], fps: number, width: number, height: number) => Promise<Blob>
}

/** An effect extension applies a post-processing effect to the canvas */
export interface PluginEffect {
  /** Effect name shown in the effects panel */
  name: string
  /** Short description of the effect */
  description?: string
  /** Icon name (Lucide) */
  icon?: string
  /**
   * Apply the effect to a canvas 2D context.
   * Called once per frame during playback/export.
   * @param ctx - The 2D rendering context
   * @param frame - Current frame number
   * @param totalFrames - Total frame count
   */
  apply: (ctx: CanvasRenderingContext2D, frame: number, totalFrames: number) => void
}

/** A template extension registers new HTML motion graphics templates */
export interface PluginTemplate {
  /** Unique template identifier */
  templateId: string
  /** Template name */
  name: string
  /** Category for grouping */
  category: string
  /** HTML source code */
  html: string
  /** Optional CSS source */
  css?: string
  /** Optional JS source */
  js?: string
  /** Default CONFIG values */
  defaultConfig?: Record<string, unknown>
  /** Thumbnail URL or data URI */
  thumbnail?: string
}

/** An AI provider extension adds a new AI service */
export interface PluginAIProvider {
  /** Provider identifier */
  providerId: string
  /** Display name */
  name: string
  /** Which AI capability this provides */
  capability: 'tts' | 'script' | 'image' | 'video' | '3d-model'
  /** Description */
  description?: string
  /**
   * Generate content using this provider.
   * The input/output shapes depend on the capability.
   */
  generate: (input: Record<string, unknown>) => Promise<Record<string, unknown>>
}

// ── Bundled Plugin Implementations ──────────────────────────────────────────

/** All extension implementations a plugin can provide */
export interface PluginImplementations {
  panels?: PluginPanel[]
  layers?: PluginLayer[]
  exportFormats?: PluginExportFormat[]
  effects?: PluginEffect[]
  templates?: PluginTemplate[]
  aiProviders?: PluginAIProvider[]
}

// ── Plugin Lifecycle ────────────────────────────────────────────────────────

/** Lifecycle hooks a plugin can implement */
export interface PluginLifecycle {
  /** Called when the plugin is first loaded */
  init?: () => void | Promise<void>
  /** Called when the plugin is activated (toggled on) */
  activate?: () => void | Promise<void>
  /** Called when the plugin is deactivated (toggled off) */
  deactivate?: () => void | Promise<void>
  /** Called when the plugin is unloaded/removed */
  destroy?: () => void | Promise<void>
}

// ── Registered Plugin ───────────────────────────────────────────────────────

/** A fully registered plugin in the registry */
export interface RegisteredPlugin {
  manifest: PluginManifest
  implementations: PluginImplementations
  lifecycle: PluginLifecycle
  /** Current activation state */
  active: boolean
}

// ── Plugin Store State ──────────────────────────────────────────────────────

/** Per-plugin settings storage */
export interface PluginSettings {
  [pluginId: string]: Record<string, unknown>
}
