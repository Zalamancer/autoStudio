import type { AnimatableProps } from './types/motionDesign'

const ANIM_DEFAULTS: Required<AnimatableProps> = {
  opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, blur: 0,
}

const ANIM_KEYS: (keyof AnimatableProps)[] = [
  'opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'rotation', 'blur',
]

export function lerp(a: number, b: number, t: number): number {
  'worklet'
  return a + (b - a) * t
}

export function interpolateProps(
  from: Partial<AnimatableProps>,
  to: Partial<AnimatableProps>,
  t: number,
): Required<AnimatableProps> {
  'worklet'
  const result = { ...ANIM_DEFAULTS }
  for (let i = 0; i < ANIM_KEYS.length; i++) {
    const key = ANIM_KEYS[i]
    const a = from[key] ?? ANIM_DEFAULTS[key]
    const b = to[key] ?? ANIM_DEFAULTS[key]
    result[key] = lerp(a, b, t)
  }
  return result
}

export function interpolateConfig(
  value: string,
  config: Record<string, unknown>,
): string {
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = config[key]
    return v != null ? String(v) : ''
  })
}
