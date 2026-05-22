export interface InterpolateOptions {
  /** Easing function applied to the normalized t value within each segment */
  easing?: (t: number) => number
  /** Behaviour when value is below the first input stop. Default: 'clamp' */
  extrapolateLeft?: 'clamp' | 'extend'
  /** Behaviour when value is above the last input stop. Default: 'clamp' */
  extrapolateRight?: 'clamp' | 'extend'
}

/**
 * Multi-stop interpolation with optional easing and extrapolation.
 * Replaces Remotion's `interpolate()`.
 *
 * @param value - Current input value (e.g. frame number)
 * @param inputRange - Ascending array of input stops
 * @param outputRange - Corresponding output values (same length as inputRange)
 * @param options - Optional easing and extrapolation configuration
 * @returns Interpolated output value
 */
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
  options?: InterpolateOptions,
): number {
  if (inputRange.length !== outputRange.length || inputRange.length < 2) {
    throw new Error('inputRange and outputRange must have the same length (>= 2)')
  }

  const easing = options?.easing
  const extrapolateLeft = options?.extrapolateLeft ?? 'clamp'
  const extrapolateRight = options?.extrapolateRight ?? 'clamp'

  // Below the first stop
  if (value <= inputRange[0]) {
    if (extrapolateLeft === 'extend') {
      const t = (value - inputRange[0]) / (inputRange[1] - inputRange[0])
      const easedT = easing ? easing(Math.max(0, Math.min(1, t))) : t
      // For extension, use the raw (possibly negative) t but apply easing direction
      const effectiveT = easing ? easedT + (t - Math.max(0, Math.min(1, t))) : t
      return outputRange[0] + effectiveT * (outputRange[1] - outputRange[0])
    }
    return outputRange[0]
  }

  // Above the last stop
  if (value >= inputRange[inputRange.length - 1]) {
    if (extrapolateRight === 'extend') {
      const lastIdx = inputRange.length - 1
      const t =
        (value - inputRange[lastIdx - 1]) /
        (inputRange[lastIdx] - inputRange[lastIdx - 1])
      const easedT = easing ? easing(Math.max(0, Math.min(1, t))) : t
      const effectiveT = easing ? easedT + (t - Math.max(0, Math.min(1, t))) : t
      return (
        outputRange[lastIdx - 1] +
        effectiveT * (outputRange[lastIdx] - outputRange[lastIdx - 1])
      )
    }
    return outputRange[outputRange.length - 1]
  }

  // Find the segment
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (value >= inputRange[i] && value <= inputRange[i + 1]) {
      const t = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i])
      const easedT = easing ? easing(t) : t
      return outputRange[i] + easedT * (outputRange[i + 1] - outputRange[i])
    }
  }

  return outputRange[outputRange.length - 1]
}
