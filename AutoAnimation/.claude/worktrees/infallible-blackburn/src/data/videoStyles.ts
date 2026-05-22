/**
 * Video Style Presets — Extended style definitions for AI Video Style Transfer.
 *
 * Each style combines CSS filters, optional SVG filter definitions,
 * and per-layer control settings. The AI orchestrator can auto-select
 * a style based on prompt context.
 */

export interface VideoStylePreset {
  id: string
  name: string
  description: string
  category: 'cinematic' | 'vintage' | 'artistic' | 'mood' | 'social'
  /** CSS filter chain applied to the composition */
  cssFilter: string
  /** Optional inline SVG filter definition (for advanced effects) */
  svgFilterDef?: string
  /** Whether this applies to background only or all layers */
  scope: 'all' | 'background-only'
  /** Preview gradient colors for the style picker */
  previewGradient: [string, string]
  /** Emotion affinity — which prompt moods match this style */
  emotionAffinity: string[]
  /** Optional overlay color + opacity for color grading */
  overlay?: { color: string; opacity: number; blendMode: string }
}

export const VIDEO_STYLE_PRESETS: VideoStylePreset[] = [
  // ── Cinematic ──
  {
    id: 'style-film-grain',
    name: 'Film Grain',
    description: 'Classic film texture with warm grain — nostalgic and authentic',
    category: 'cinematic',
    cssFilter: 'contrast(1.1) saturate(0.9) brightness(1.02) sepia(0.08)',
    scope: 'all',
    previewGradient: ['#8b7355', '#d4c5a9'],
    emotionAffinity: ['neutral', 'sadness', 'joy'],
    overlay: { color: '#d4a373', opacity: 0.05, blendMode: 'multiply' },
  },
  {
    id: 'style-anime-cel',
    name: 'Anime Cel',
    description: 'High contrast with vivid colors — anime-inspired look',
    category: 'cinematic',
    cssFilter: 'contrast(1.4) saturate(1.5) brightness(1.05)',
    scope: 'all',
    previewGradient: ['#ff6b9d', '#6b5ce7'],
    emotionAffinity: ['joy', 'surprise', 'anger'],
  },
  {
    id: 'style-teal-orange',
    name: 'Teal & Orange',
    description: 'Hollywood color grading — cinematic and professional',
    category: 'cinematic',
    cssFilter: 'contrast(1.15) saturate(1.3) hue-rotate(-10deg)',
    scope: 'all',
    previewGradient: ['#2d8e9e', '#e4915c'],
    emotionAffinity: ['neutral', 'surprise', 'joy'],
  },

  // ── Vintage ──
  {
    id: 'style-retro-vhs',
    name: 'Retro VHS',
    description: 'VHS tape distortion — 80s/90s throwback aesthetic',
    category: 'vintage',
    cssFilter: 'contrast(1.2) saturate(0.8) brightness(1.1) sepia(0.15)',
    scope: 'all',
    previewGradient: ['#4a2080', '#cc3366'],
    emotionAffinity: ['joy', 'surprise', 'neutral'],
    overlay: { color: '#ff0080', opacity: 0.03, blendMode: 'screen' },
  },
  {
    id: 'style-polaroid',
    name: 'Polaroid',
    description: 'Warm washed-out tones — instant camera nostalgia',
    category: 'vintage',
    cssFilter: 'contrast(1.1) brightness(1.1) saturate(0.75) sepia(0.2)',
    scope: 'all',
    previewGradient: ['#d4c5a9', '#f0e6d6'],
    emotionAffinity: ['joy', 'sadness', 'neutral'],
  },

  // ── Artistic ──
  {
    id: 'style-watercolor',
    name: 'Watercolor',
    description: 'Soft diffused look with muted tones — painterly aesthetic',
    category: 'artistic',
    cssFilter: 'contrast(0.85) saturate(0.7) brightness(1.15) blur(0.3px)',
    scope: 'background-only',
    previewGradient: ['#b0c4de', '#f5deb3'],
    emotionAffinity: ['sadness', 'neutral', 'joy'],
  },
  {
    id: 'style-cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'High contrast with neon glow — futuristic and bold',
    category: 'artistic',
    cssFilter: 'contrast(1.4) saturate(1.6) brightness(0.9)',
    scope: 'all',
    previewGradient: ['#0a0a2a', '#ff00ff'],
    emotionAffinity: ['surprise', 'anger', 'fear'],
    overlay: { color: '#00ffff', opacity: 0.04, blendMode: 'screen' },
  },
  {
    id: 'style-paper-cutout',
    name: 'Paper Cutout',
    description: 'High contrast with reduced colors — crafty handmade look',
    category: 'artistic',
    cssFilter: 'contrast(1.5) saturate(0.6) brightness(1.1)',
    scope: 'all',
    previewGradient: ['#f5f5dc', '#deb887'],
    emotionAffinity: ['joy', 'neutral'],
  },
  {
    id: 'style-chalkboard',
    name: 'Chalkboard',
    description: 'Inverted colors on dark background — educational feel',
    category: 'artistic',
    cssFilter: 'contrast(1.2) saturate(0) brightness(0.8) invert(0.9)',
    scope: 'background-only',
    previewGradient: ['#2d4a2d', '#b8d4b8'],
    emotionAffinity: ['neutral'],
  },

  // ── Mood ──
  {
    id: 'style-dreamy',
    name: 'Dreamy',
    description: 'Soft glow with reduced contrast — ethereal and whimsical',
    category: 'mood',
    cssFilter: 'contrast(0.85) brightness(1.15) saturate(0.8)',
    scope: 'all',
    previewGradient: ['#e8d5f5', '#f5e6d0'],
    emotionAffinity: ['joy', 'sadness', 'neutral'],
    overlay: { color: '#ffffff', opacity: 0.05, blendMode: 'soft-light' },
  },
  {
    id: 'style-noir',
    name: 'Film Noir',
    description: 'Desaturated with deep shadows — dark and mysterious',
    category: 'mood',
    cssFilter: 'contrast(1.3) brightness(0.85) saturate(0.1) sepia(0.08)',
    scope: 'all',
    previewGradient: ['#1a1a1a', '#4a4a4a'],
    emotionAffinity: ['fear', 'anger', 'sadness'],
  },

  // ── Social ──
  {
    id: 'style-instagram-clean',
    name: 'Instagram Clean',
    description: 'Bright and clean with slight warmth — social media optimized',
    category: 'social',
    cssFilter: 'contrast(1.05) brightness(1.08) saturate(1.15) sepia(0.05)',
    scope: 'all',
    previewGradient: ['#f0f0f0', '#ffecd2'],
    emotionAffinity: ['joy', 'neutral'],
  },
  {
    id: 'style-tiktok-vibrant',
    name: 'TikTok Vibrant',
    description: 'Punchy colors with high saturation — attention-grabbing',
    category: 'social',
    cssFilter: 'contrast(1.15) saturate(1.5) brightness(1.05)',
    scope: 'all',
    previewGradient: ['#fe2c55', '#25f4ee'],
    emotionAffinity: ['joy', 'surprise'],
  },
]

/**
 * Select the best video style for a given emotion/mood context.
 */
export function selectStyleForMood(mood: string): VideoStylePreset {
  const normalized = mood.toLowerCase()
  const matches = VIDEO_STYLE_PRESETS.filter((p) =>
    p.emotionAffinity.some((e) => normalized.includes(e)),
  )
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)]
  }
  return VIDEO_STYLE_PRESETS[0] // Default to film grain
}

/**
 * Get a video style preset by ID.
 */
export function getVideoStylePreset(id: string): VideoStylePreset | undefined {
  return VIDEO_STYLE_PRESETS.find((p) => p.id === id)
}
