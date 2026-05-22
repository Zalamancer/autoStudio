export interface HoldEffectResult {
  scaleOffset: number
  yOffset: number
  glowIntensity: number
}

export function computeHoldEffect(
  effect: 'pulse' | 'glow' | 'float' | 'breathe' | undefined,
  holdT: number,
  amplitude: number = 0.05,
  speed: number = 1,
): HoldEffectResult {
  'worklet'
  if (!effect) return { scaleOffset: 0, yOffset: 0, glowIntensity: 0 }

  const wave = Math.sin(holdT * Math.PI * 2 * speed)

  switch (effect) {
    case 'pulse':
      return { scaleOffset: wave * amplitude, yOffset: 0, glowIntensity: 0 }
    case 'breathe':
      return { scaleOffset: wave * amplitude * 0.5, yOffset: 0, glowIntensity: 0 }
    case 'float':
      return { scaleOffset: 0, yOffset: wave * (amplitude * 100), glowIntensity: 0 }
    case 'glow':
      return { scaleOffset: 0, yOffset: 0, glowIntensity: 8 + wave * 12 }
    default:
      return { scaleOffset: 0, yOffset: 0, glowIntensity: 0 }
  }
}
