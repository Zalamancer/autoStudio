export type TransitionType =
  | 'fade-in'
  | 'fade-out'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'dissolve'
  | 'wipe-left'
  | 'wipe-right'
  | 'cut'

export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier'

export interface TransitionPreset {
  id: TransitionType
  name: string
  category: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe' | 'cut'
  description: string
}

export interface TransitionConfig {
  type: TransitionType
  duration: number // seconds, 0.1 to 2.0
  easing: EasingType
  cubicBezierValues?: [number, number, number, number] // only when easing is 'cubic-bezier'
}

export const TRANSITION_PRESETS: TransitionPreset[] = [
  { id: 'fade-in', name: 'Fade In', category: 'fade', description: 'Gradually appears from transparent' },
  { id: 'fade-out', name: 'Fade Out', category: 'fade', description: 'Gradually disappears to transparent' },
  { id: 'slide-left', name: 'Slide Left', category: 'slide', description: 'Slides in from the right' },
  { id: 'slide-right', name: 'Slide Right', category: 'slide', description: 'Slides in from the left' },
  { id: 'slide-up', name: 'Slide Up', category: 'slide', description: 'Slides in from the bottom' },
  { id: 'slide-down', name: 'Slide Down', category: 'slide', description: 'Slides in from the top' },
  { id: 'zoom-in', name: 'Zoom In', category: 'zoom', description: 'Scales up from a small size' },
  { id: 'zoom-out', name: 'Zoom Out', category: 'zoom', description: 'Scales down from a large size' },
  { id: 'dissolve', name: 'Dissolve', category: 'dissolve', description: 'Cross-fade between clips' },
  { id: 'wipe-left', name: 'Wipe Left', category: 'wipe', description: 'Wipes from right to left' },
  { id: 'wipe-right', name: 'Wipe Right', category: 'wipe', description: 'Wipes from left to right' },
  { id: 'cut', name: 'Cut', category: 'cut', description: 'Instant transition with no effect' },
]

export const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'cubic-bezier', label: 'Cubic Bezier' },
]

export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  type: 'fade-in',
  duration: 0.5,
  easing: 'ease-in-out',
}
