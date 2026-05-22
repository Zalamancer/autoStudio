export { registerMotionGraphic, getMotionGraphic, getAllMotionGraphics, getMotionGraphicsByCategory } from './registry'
export { resolveTemplateType } from './resolver'

/**
 * Lazy-load all 1,935 kinetic typography templates.
 * Templates are split into a separate chunk and loaded on demand.
 * Call this once before you need getAllMotionGraphics() to return a full list.
 * getMotionGraphic(id) will also work after templates are loaded.
 */
let _loadPromise: Promise<void> | null = null

export function ensureTemplatesLoaded(): Promise<void> {
  if (!_loadPromise) {
    _loadPromise = import('./loadTemplates').then(() => {})
  }
  return _loadPromise
}

export function areTemplatesLoaded(): boolean {
  return _loadPromise !== null
}
