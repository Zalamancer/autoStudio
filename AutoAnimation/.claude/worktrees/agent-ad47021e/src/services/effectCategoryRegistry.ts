import { STYLE_EFFECT_REGISTRY, type StyleEffectRegistryEntry } from '@/types/styleEffects'
import type { EffectBrowserCategory } from '@/types/audioExpanded'

const EFFECT_CATEGORIES: EffectBrowserCategory[] = [
  { id: 'basic', label: 'Basic', icon: 'Square', description: 'Essential visual effects' },
  { id: 'artistic', label: 'Artistic', icon: 'Palette', description: 'Painterly and hand-drawn styles' },
  { id: 'retro', label: 'Retro', icon: 'Film', description: 'Vintage and nostalgic effects' },
  { id: 'advanced', label: 'Advanced', icon: 'Settings', description: 'Complex multi-layer effects' },
  { id: 'elemental', label: 'Elemental', icon: 'Flame', description: 'Fire, ice, water, earth effects' },
  { id: 'supernatural', label: 'Supernatural', icon: 'Sparkles', description: 'Magic, ethereal, ghostly effects' },
  { id: 'nature', label: 'Nature', icon: 'Leaf', description: 'Organic and natural world effects' },
  { id: 'transformation', label: 'Transformation', icon: 'RefreshCw', description: 'Shape-shifting and morphing effects' },
  { id: 'action', label: 'Action', icon: 'Zap', description: 'Dynamic motion and impact effects' },
  { id: 'distortion', label: 'Distortion', icon: 'WaveSine', description: 'Warping and bending effects' },
  { id: 'facial', label: 'Facial', icon: 'ScanFace', description: 'Face detection and overlay effects' },
  { id: 'novelty', label: 'Novelty', icon: 'PartyPopper', description: 'Fun and playful effects' },
  { id: 'transition', label: 'Transition', icon: 'ArrowRightLeft', description: 'Scene transition effects' },
  { id: 'cinema', label: 'Cinema', icon: 'Clapperboard', description: 'Cinematic look and color grading' },
]

/**
 * Get all effect categories.
 */
export function getEffectCategories(): EffectBrowserCategory[] {
  return EFFECT_CATEGORIES
}

/**
 * Get effects by category ID.
 */
export function getEffectsByCategory(categoryId: string): StyleEffectRegistryEntry[] {
  return STYLE_EFFECT_REGISTRY.filter(e => e.category === categoryId)
}

/**
 * Search effects by query string across labels, categories, and preset names.
 */
export function searchEffects(query: string): StyleEffectRegistryEntry[] {
  if (!query.trim()) return STYLE_EFFECT_REGISTRY

  const q = query.toLowerCase()
  return STYLE_EFFECT_REGISTRY.filter(e =>
    e.label.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q) ||
    e.type.toLowerCase().includes(q) ||
    e.presets.some(p => p.label.toLowerCase().includes(q))
  )
}
