import { getMotionGraphic } from './registry'

/**
 * Determines whether a template should use the React motion graphics engine
 * or the legacy HTML iframe engine.
 */
export function resolveTemplateType(id: string): 'react' | 'html' {
  return getMotionGraphic(id) ? 'react' : 'html'
}
