import type { TimingTemplate } from '@/types/timingTemplate'

export const BUILTIN_TIMING_TEMPLATES: TimingTemplate[] = [
  // -- Entrance --
  {
    id: 'tpl-fade-in',
    name: 'Fade In',
    category: 'entrance',
    description: 'Simple opacity fade from 0 to 1',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
    ],
    defaultDuration: 15,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-slide-up',
    name: 'Slide Up',
    category: 'entrance',
    description: 'Slides in from below with fade',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 0.4, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: 100, valueMode: 'relative', easing: 'material' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'material' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-bounce-in',
    name: 'Bounce In',
    category: 'entrance',
    description: 'Scales from 0 with elastic bounce',
    compatibleTypes: ['media', 'shape', 'text', 'lottie', 'video'],
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'linear' },
        { relativePosition: 0.1, value: 1, valueMode: 'absolute', easing: 'linear' },
      ]},
      { property: 'scale', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'elastic-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'elastic-out' },
      ]},
    ],
    defaultDuration: 25,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-elastic-drop',
    name: 'Elastic Drop',
    category: 'entrance',
    description: 'Drops in from above with spring overshoot',
    compatibleTypes: 'all',
    tracks: [
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: -200, valueMode: 'relative', easing: 'spring-medium' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'spring-medium' },
      ]},
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 0.2, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
    ],
    defaultDuration: 30,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  // -- Exit --
  {
    id: 'tpl-fade-out',
    name: 'Fade Out',
    category: 'exit',
    description: 'Simple opacity fade from 1 to 0',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 1, valueMode: 'absolute', easing: 'ease-in' },
        { relativePosition: 1, value: 0, valueMode: 'absolute', easing: 'ease-in' },
      ]},
    ],
    defaultDuration: 15,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-slide-left-exit',
    name: 'Slide Left Exit',
    category: 'exit',
    description: 'Slides off to the left with fade',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0.6, value: 1, valueMode: 'absolute', easing: 'ease-in' },
        { relativePosition: 1, value: 0, valueMode: 'absolute', easing: 'ease-in' },
      ]},
      { property: 'position.x', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'relative', easing: 'ease-in' },
        { relativePosition: 1, value: -300, valueMode: 'relative', easing: 'ease-in' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  // -- Emphasis --
  {
    id: 'tpl-pulse',
    name: 'Pulse',
    category: 'emphasis',
    description: 'Quick scale pulse to draw attention',
    compatibleTypes: ['media', 'shape', 'text', 'lottie'],
    tracks: [
      { property: 'scale', keyframes: [
        { relativePosition: 0, value: 1, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 0.3, value: 1.15, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 0.6, value: 0.95, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'ease-in-out' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  {
    id: 'tpl-shake',
    name: 'Shake',
    category: 'emphasis',
    description: 'Quick horizontal shake for error/attention',
    compatibleTypes: 'all',
    tracks: [
      { property: 'position.x', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.1, value: -10, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.2, value: 10, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.3, value: -8, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.4, value: 8, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.6, value: -4, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.8, value: 2, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'linear' },
      ]},
    ],
    defaultDuration: 15,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  // -- Loop --
  {
    id: 'tpl-float',
    name: 'Float',
    category: 'loop',
    description: 'Gentle up/down floating motion',
    compatibleTypes: 'all',
    tracks: [
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'relative', easing: 'ease-in-out' },
        { relativePosition: 0.5, value: -15, valueMode: 'relative', easing: 'ease-in-out' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'ease-in-out' },
      ]},
    ],
    defaultDuration: 60,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  {
    id: 'tpl-spin',
    name: 'Spin',
    category: 'loop',
    description: 'Continuous 360-degree rotation',
    compatibleTypes: ['media', 'shape', 'lottie'],
    tracks: [
      { property: 'rotation', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'linear' },
        { relativePosition: 1, value: 360, valueMode: 'absolute', easing: 'linear' },
      ]},
    ],
    defaultDuration: 60,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-breathe',
    name: 'Breathe',
    category: 'loop',
    description: 'Gentle scale pulsing like breathing',
    compatibleTypes: ['media', 'shape', 'text', 'lottie'],
    tracks: [
      { property: 'scale', keyframes: [
        { relativePosition: 0, value: 1, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 0.5, value: 1.05, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'ease-in-out' },
      ]},
    ],
    defaultDuration: 90,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  // -- Transition --
  {
    id: 'tpl-stagger-cascade',
    name: 'Stagger Cascade',
    category: 'transition',
    description: 'Entrance with staggered delay (apply to multiple objects)',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 0.3, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: 30, valueMode: 'relative', easing: 'material' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'material' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
]
