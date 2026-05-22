/**
 * Plugin Registry — singleton service that manages all loaded plugins.
 *
 * Plugins register via `registerPlugin(manifest, implementations, lifecycle)`.
 * The editor queries the registry to discover contributed panels, layers,
 * export formats, effects, templates, and AI providers.
 */

import type {
  PluginManifest,
  PluginImplementations,
  PluginLifecycle,
  RegisteredPlugin,
  PluginPanel,
  PluginLayer,
  PluginExportFormat,
  PluginEffect,
  PluginTemplate,
  PluginAIProvider,
} from '@/types/plugin'

// ── Change listener type ────────────────────────────────────────────────────

type ChangeListener = () => void

// ── Registry Class ──────────────────────────────────────────────────────────

class PluginRegistryImpl {
  /** Map of plugin ID → RegisteredPlugin */
  private plugins = new Map<string, RegisteredPlugin>()

  /** Listeners notified whenever the registry changes */
  private listeners = new Set<ChangeListener>()

  // ── Registration ────────────────────────────────────────────────────────

  /**
   * Register a plugin with its manifest, implementations, and optional lifecycle.
   * Calls `lifecycle.init()` automatically if present.
   */
  async registerPlugin(
    manifest: PluginManifest,
    implementations: PluginImplementations,
    lifecycle: PluginLifecycle = {}
  ): Promise<void> {
    if (this.plugins.has(manifest.id)) {
      console.warn(`[PluginRegistry] Plugin "${manifest.id}" is already registered. Skipping.`)
      return
    }

    // Validate that declared extensionPoints match provided implementations
    this._validateExtensionPoints(manifest, implementations)

    const registered: RegisteredPlugin = {
      manifest,
      implementations,
      lifecycle,
      active: false,
    }

    this.plugins.set(manifest.id, registered)

    // Run init lifecycle
    if (lifecycle.init) {
      try {
        await lifecycle.init()
      } catch (err) {
        console.error(`[PluginRegistry] Plugin "${manifest.id}" init() failed:`, err)
      }
    }

    this._notify()
  }

  /**
   * Unregister a plugin by its ID.
   * Calls `lifecycle.deactivate()` then `lifecycle.destroy()` if present.
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return

    // Run deactivate + destroy lifecycle
    if (plugin.active && plugin.lifecycle.deactivate) {
      try {
        await plugin.lifecycle.deactivate()
      } catch (err) {
        console.error(`[PluginRegistry] Plugin "${pluginId}" deactivate() failed:`, err)
      }
    }

    if (plugin.lifecycle.destroy) {
      try {
        await plugin.lifecycle.destroy()
      } catch (err) {
        console.error(`[PluginRegistry] Plugin "${pluginId}" destroy() failed:`, err)
      }
    }

    this.plugins.delete(pluginId)
    this._notify()
  }

  // ── Activation ──────────────────────────────────────────────────────────

  /**
   * Activate a plugin by ID. Calls `lifecycle.activate()` if present.
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || plugin.active) return

    if (plugin.lifecycle.activate) {
      try {
        await plugin.lifecycle.activate()
      } catch (err) {
        console.error(`[PluginRegistry] Plugin "${pluginId}" activate() failed:`, err)
        return
      }
    }

    plugin.active = true
    this._notify()
  }

  /**
   * Deactivate a plugin by ID. Calls `lifecycle.deactivate()` if present.
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || !plugin.active) return

    if (plugin.lifecycle.deactivate) {
      try {
        await plugin.lifecycle.deactivate()
      } catch (err) {
        console.error(`[PluginRegistry] Plugin "${pluginId}" deactivate() failed:`, err)
      }
    }

    plugin.active = false
    this._notify()
  }

  /**
   * Toggle a plugin's active state.
   */
  async togglePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return

    if (plugin.active) {
      await this.deactivatePlugin(pluginId)
    } else {
      await this.activatePlugin(pluginId)
    }
  }

  // ── Queries ─────────────────────────────────────────────────────────────

  /** Get all registered plugins */
  getAllPlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values())
  }

  /** Get only active plugins */
  getActivePlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.active)
  }

  /** Get a specific plugin by ID */
  getPlugin(pluginId: string): RegisteredPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /** Check if a plugin is registered */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  // ── Extension Point Aggregators ─────────────────────────────────────────
  // These collect contributions from ALL active plugins.

  /** Get all panel extensions from active plugins */
  getPluginPanels(): (PluginPanel & { pluginId: string })[] {
    const result: (PluginPanel & { pluginId: string })[] = []
    for (const plugin of this.plugins.values()) {
      if (!plugin.active) continue
      for (const panel of plugin.implementations.panels ?? []) {
        result.push({ ...panel, pluginId: plugin.manifest.id })
      }
    }
    return result
  }

  /** Get all layer extensions from active plugins */
  getPluginLayers(): (PluginLayer & { pluginId: string })[] {
    const result: (PluginLayer & { pluginId: string })[] = []
    for (const plugin of this.plugins.values()) {
      if (!plugin.active) continue
      for (const layer of plugin.implementations.layers ?? []) {
        result.push({ ...layer, pluginId: plugin.manifest.id })
      }
    }
    // Sort by zIndex so higher layers render later (on top)
    return result.sort((a, b) => a.zIndex - b.zIndex)
  }

  /** Get all export format extensions from active plugins */
  getPluginExportFormats(): (PluginExportFormat & { pluginId: string })[] {
    const result: (PluginExportFormat & { pluginId: string })[] = []
    for (const plugin of this.plugins.values()) {
      if (!plugin.active) continue
      for (const fmt of plugin.implementations.exportFormats ?? []) {
        result.push({ ...fmt, pluginId: plugin.manifest.id })
      }
    }
    return result
  }

  /** Get all effect extensions from active plugins */
  getPluginEffects(): (PluginEffect & { pluginId: string })[] {
    const result: (PluginEffect & { pluginId: string })[] = []
    for (const plugin of this.plugins.values()) {
      if (!plugin.active) continue
      for (const effect of plugin.implementations.effects ?? []) {
        result.push({ ...effect, pluginId: plugin.manifest.id })
      }
    }
    return result
  }

  /** Get all template extensions from active plugins */
  getPluginTemplates(): (PluginTemplate & { pluginId: string })[] {
    const result: (PluginTemplate & { pluginId: string })[] = []
    for (const plugin of this.plugins.values()) {
      if (!plugin.active) continue
      for (const tpl of plugin.implementations.templates ?? []) {
        result.push({ ...tpl, pluginId: plugin.manifest.id })
      }
    }
    return result
  }

  /** Get all AI provider extensions from active plugins */
  getPluginAIProviders(): (PluginAIProvider & { pluginId: string })[] {
    const result: (PluginAIProvider & { pluginId: string })[] = []
    for (const plugin of this.plugins.values()) {
      if (!plugin.active) continue
      for (const provider of plugin.implementations.aiProviders ?? []) {
        result.push({ ...provider, pluginId: plugin.manifest.id })
      }
    }
    return result
  }

  // ── Change Notification ─────────────────────────────────────────────────

  /** Subscribe to registry changes. Returns an unsubscribe function. */
  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Get a snapshot version counter (for React useSyncExternalStore) */
  getSnapshot(): RegisteredPlugin[] {
    return this.getAllPlugins()
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private _notify(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (err) {
        console.error('[PluginRegistry] Listener error:', err)
      }
    }
  }

  private _validateExtensionPoints(
    manifest: PluginManifest,
    implementations: PluginImplementations
  ): void {
    for (const point of manifest.extensionPoints) {
      switch (point) {
        case 'panel':
          if (!implementations.panels?.length) {
            console.warn(
              `[PluginRegistry] Plugin "${manifest.id}" declares "panel" extension point but provides no panels.`
            )
          }
          break
        case 'layer':
          if (!implementations.layers?.length) {
            console.warn(
              `[PluginRegistry] Plugin "${manifest.id}" declares "layer" extension point but provides no layers.`
            )
          }
          break
        case 'export-format':
          if (!implementations.exportFormats?.length) {
            console.warn(
              `[PluginRegistry] Plugin "${manifest.id}" declares "export-format" extension point but provides no export formats.`
            )
          }
          break
        case 'effect':
          if (!implementations.effects?.length) {
            console.warn(
              `[PluginRegistry] Plugin "${manifest.id}" declares "effect" extension point but provides no effects.`
            )
          }
          break
        case 'template':
          if (!implementations.templates?.length) {
            console.warn(
              `[PluginRegistry] Plugin "${manifest.id}" declares "template" extension point but provides no templates.`
            )
          }
          break
        case 'ai-provider':
          if (!implementations.aiProviders?.length) {
            console.warn(
              `[PluginRegistry] Plugin "${manifest.id}" declares "ai-provider" extension point but provides no AI providers.`
            )
          }
          break
      }
    }
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────

/** Global plugin registry singleton */
export const pluginRegistry = new PluginRegistryImpl()
