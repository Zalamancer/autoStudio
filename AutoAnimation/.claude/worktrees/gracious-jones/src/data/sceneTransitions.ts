/**
 * Scene Transition Presets — cinematic effects for scene-to-scene transitions.
 *
 * Each preset defines a transition type and recommended duration.
 * The AI orchestrator selects presets based on emotional context of adjacent dialogue.
 */

export type CinematicTransitionType =
  | 'cut'
  | 'crossfade'
  | 'wipe-left'
  | 'wipe-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-up'
  // New cinematic types
  | 'morph'
  | 'glitch'
  | 'whip-pan'
  | 'light-leak'
  | 'parallax-slide'
  | 'dramatic-zoom'
  | 'ink-wash'

export interface TransitionPreset {
  id: string
  type: CinematicTransitionType
  label: string
  description: string
  /** Recommended duration in ms */
  durationMs: number
  /** Emotion affinity — which dialogue emotions work best with this transition */
  emotionAffinity: string[]
  /** CSS/keyframe parameters for the renderer */
  params: Record<string, number | string>
}

export const TRANSITION_PRESETS: TransitionPreset[] = [
  {
    id: 'tr-cut',
    type: 'cut',
    label: 'Hard Cut',
    description: 'Instant switch — great for comedy and fast pacing',
    durationMs: 0,
    emotionAffinity: ['joy', 'surprise', 'anger'],
    params: {},
  },
  {
    id: 'tr-crossfade',
    type: 'crossfade',
    label: 'Crossfade',
    description: 'Smooth blend between scenes — universal and elegant',
    durationMs: 500,
    emotionAffinity: ['sadness', 'joy', 'neutral'],
    params: {},
  },
  {
    id: 'tr-morph',
    type: 'morph',
    label: 'Morph Dissolve',
    description: 'Scale + blur dissolve that morphs into the next scene',
    durationMs: 600,
    emotionAffinity: ['surprise', 'joy', 'neutral'],
    params: { blurMax: 8, scaleFrom: 1.05 },
  },
  {
    id: 'tr-glitch',
    type: 'glitch',
    label: 'Glitch',
    description: 'Digital glitch effect — tech, drama, or surprise moments',
    durationMs: 400,
    emotionAffinity: ['surprise', 'anger', 'fear'],
    params: { sliceCount: 5, offsetMax: 20 },
  },
  {
    id: 'tr-whip-pan',
    type: 'whip-pan',
    label: 'Whip Pan',
    description: 'Fast horizontal motion blur — energetic scene changes',
    durationMs: 300,
    emotionAffinity: ['surprise', 'joy', 'anger'],
    params: { blurAmount: 30, direction: 'right' },
  },
  {
    id: 'tr-light-leak',
    type: 'light-leak',
    label: 'Light Leak',
    description: 'Warm light flash — cinematic and nostalgic feel',
    durationMs: 700,
    emotionAffinity: ['joy', 'sadness', 'neutral'],
    params: { color: '#ffd700', intensity: 0.8 },
  },
  {
    id: 'tr-parallax-slide',
    type: 'parallax-slide',
    label: 'Parallax Slide',
    description: 'Layered slide with depth effect — professional look',
    durationMs: 500,
    emotionAffinity: ['neutral', 'joy', 'surprise'],
    params: { layers: 3, direction: 'left' },
  },
  {
    id: 'tr-dramatic-zoom',
    type: 'dramatic-zoom',
    label: 'Dramatic Zoom',
    description: 'Rapid zoom with radial blur — tension and impact',
    durationMs: 400,
    emotionAffinity: ['anger', 'fear', 'surprise'],
    params: { zoomScale: 2.5, blurRadius: 12 },
  },
  {
    id: 'tr-ink-wash',
    type: 'ink-wash',
    label: 'Ink Wash',
    description: 'Ink spread wipe — artistic and contemplative',
    durationMs: 800,
    emotionAffinity: ['sadness', 'disgust', 'neutral'],
    params: { spread: 'radial', color: '#000000' },
  },
  {
    id: 'tr-wipe-left',
    type: 'wipe-left',
    label: 'Wipe Left',
    description: 'Horizontal wipe from right to left',
    durationMs: 400,
    emotionAffinity: ['neutral', 'joy'],
    params: {},
  },
  {
    id: 'tr-wipe-right',
    type: 'wipe-right',
    label: 'Wipe Right',
    description: 'Horizontal wipe from left to right',
    durationMs: 400,
    emotionAffinity: ['neutral', 'joy'],
    params: {},
  },
  {
    id: 'tr-zoom-in',
    type: 'zoom-in',
    label: 'Zoom In',
    description: 'Zoom into the next scene with fade',
    durationMs: 500,
    emotionAffinity: ['surprise', 'fear'],
    params: {},
  },
  {
    id: 'tr-zoom-out',
    type: 'zoom-out',
    label: 'Zoom Out',
    description: 'Zoom out revealing the next scene',
    durationMs: 500,
    emotionAffinity: ['joy', 'neutral'],
    params: {},
  },
  {
    id: 'tr-slide-up',
    type: 'slide-up',
    label: 'Slide Up',
    description: 'Next scene slides up from bottom',
    durationMs: 400,
    emotionAffinity: ['joy', 'surprise'],
    params: {},
  },
]

/**
 * Emotion → transition type mapping for AI auto-selection.
 * Returns the best transition type for a given emotion context.
 */
const EMOTION_TRANSITION_MAP: Record<string, CinematicTransitionType[]> = {
  joy:       ['crossfade', 'light-leak', 'parallax-slide'],
  sadness:   ['crossfade', 'ink-wash', 'light-leak'],
  anger:     ['cut', 'glitch', 'dramatic-zoom', 'whip-pan'],
  fear:      ['dramatic-zoom', 'glitch', 'zoom-in'],
  surprise:  ['whip-pan', 'morph', 'glitch'],
  disgust:   ['ink-wash', 'cut', 'glitch'],
  neutral:   ['crossfade', 'parallax-slide', 'wipe-left'],
}

/**
 * Select the best transition based on the outgoing scene's emotion.
 */
export function selectTransitionForEmotion(emotion: string): TransitionPreset {
  const normalized = emotion.toLowerCase().replace(/[^a-z]/g, '')

  // Find the emotion category
  let category = 'neutral'
  for (const [cat, _types] of Object.entries(EMOTION_TRANSITION_MAP)) {
    if (normalized.includes(cat)) {
      category = cat
      break
    }
  }

  const preferredTypes = EMOTION_TRANSITION_MAP[category] || EMOTION_TRANSITION_MAP.neutral
  // Pick randomly from preferred types for variety
  const selectedType = preferredTypes[Math.floor(Math.random() * preferredTypes.length)]

  const preset = TRANSITION_PRESETS.find((p) => p.type === selectedType)
  return preset || TRANSITION_PRESETS[1] // fallback to crossfade
}

/**
 * Get a transition preset by type.
 */
export function getTransitionPreset(type: CinematicTransitionType): TransitionPreset | undefined {
  return TRANSITION_PRESETS.find((p) => p.type === type)
}
