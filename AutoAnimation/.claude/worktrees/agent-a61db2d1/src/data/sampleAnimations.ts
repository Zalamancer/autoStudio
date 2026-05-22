import type { AnimationItem } from '@/stores/useAnimationStore'
import {
  generateWaveLoop,
  generateRipple,
  generateStarfield,
  generateConfetti,
  generateSparkles,
  generateFloatingHearts,
  generateFireEffect,
  generateSnowfall,
  generateFlowingWave,
} from './lottieGenerators'

/**
 * Self-contained Lottie animations — all generated programmatically.
 * Zero external file dependencies.
 */
export const sampleAnimations: AnimationItem[] = [
  // Backgrounds
  {
    id: 'bg-wave',
    name: 'Wave Loop',
    url: '',
    animationData: generateWaveLoop(),
    category: 'background',
    tags: ['particles', 'wave', 'floating', 'minimal'],
    description: 'Gentle wave loop animation',
  },
  {
    id: 'bg-ripple',
    name: 'Ripple Loading',
    url: '',
    animationData: generateRipple(),
    category: 'background',
    tags: ['shapes', 'geometric', 'abstract', 'ripple'],
    description: 'Ripple loading animation',
  },
  // Overlays
  {
    id: 'overlay-stars',
    name: 'Starfield',
    url: '',
    animationData: generateStarfield(),
    category: 'overlay',
    tags: ['stars', 'space', 'night', 'dark'],
    description: 'Twinkling starfield effect',
  },
  {
    id: 'overlay-confetti',
    name: 'Confetti',
    url: '',
    animationData: generateConfetti(),
    category: 'overlay',
    tags: ['confetti', 'celebration', 'party', 'colorful'],
    description: 'Falling confetti celebration',
  },
  {
    id: 'overlay-sparkles',
    name: 'Sparkle Stars',
    url: '',
    animationData: generateSparkles(),
    category: 'overlay',
    tags: ['sparkle', 'shine', 'magic', 'glitter', 'stars'],
    description: 'Magical sparkle star effect',
  },
  {
    id: 'overlay-hearts',
    name: 'Floating Hearts',
    url: '',
    animationData: generateFloatingHearts(),
    category: 'overlay',
    tags: ['hearts', 'love', 'romantic', 'confetti'],
    description: 'Heart confetti celebration',
  },
  {
    id: 'overlay-fire',
    name: 'Fire Effect',
    url: '',
    animationData: generateFireEffect(),
    category: 'overlay',
    tags: ['fire', 'flame', 'hot', 'energy'],
    description: 'Animated fire flames',
  },
  {
    id: 'overlay-snow',
    name: 'Snowfall',
    url: '',
    animationData: generateSnowfall(),
    category: 'overlay',
    tags: ['snow', 'winter', 'cold', 'weather'],
    description: 'Weather snowfall effect',
  },
  {
    id: 'overlay-wave',
    name: 'Wave Animation',
    url: '',
    animationData: generateFlowingWave(),
    category: 'overlay',
    tags: ['wave', 'motion', 'particles', 'flow'],
    description: 'Flowing wave animation overlay',
  },
]
