/**
 * RemotionStyleFilter — Applies CSS filter effects from useStyleStore
 * as a post-processing layer in the Remotion composition.
 *
 * Wraps children in an Fill with the active style filter.
 * Supports per-frame intensity keyframes for animated filter transitions.
 */

import { Fill, useFrame } from '@/engine'
import { useStyleStore, STYLE_PRESETS } from '@/stores/useStyleStore'

export function RemotionStyleFilter({ children }: { children: React.ReactNode }) {
  const frame = useFrame()
  const { enabled, activePresetId, customFilter, intensity, intensityKeyframes } =
    useStyleStore.getState()

  if (!enabled) return <>{children}</>

  // Resolve filter string
  let baseFilter = 'none'
  if (activePresetId) {
    const preset = STYLE_PRESETS.find((p) => p.id === activePresetId)
    if (preset) baseFilter = preset.filter
  } else if (customFilter) {
    baseFilter = customFilter
  }

  if (baseFilter === 'none') return <>{children}</>

  // Interpolate intensity from keyframes
  let effectiveIntensity = intensity
  if (intensityKeyframes.length > 0) {
    effectiveIntensity = interpolateIntensity(intensityKeyframes, frame)
  }

  if (effectiveIntensity <= 0.01) return <>{children}</>

  // When intensity < 1, we reduce effect by blending with the unfiltered version
  // using opacity on the filtered layer over the unfiltered one
  if (effectiveIntensity < 0.99) {
    return (
      <Fill>
        {/* Unfiltered base */}
        {children}
        {/* Filtered overlay at reduced opacity */}
        <Fill
          style={{
            filter: baseFilter,
            opacity: effectiveIntensity,
          }}
        >
          {children}
        </Fill>
      </Fill>
    )
  }

  // Full intensity — simple filter wrapper
  return (
    <Fill style={{ filter: baseFilter }}>
      {children}
    </Fill>
  )
}

function interpolateIntensity(
  keyframes: { frame: number; intensity: number }[],
  frame: number,
): number {
  if (keyframes.length === 0) return 1
  if (frame <= keyframes[0].frame) return keyframes[0].intensity
  const last = keyframes[keyframes.length - 1]
  if (frame >= last.frame) return last.intensity

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (frame >= a.frame && frame < b.frame) {
      const t = (frame - a.frame) / (b.frame - a.frame)
      return a.intensity + (b.intensity - a.intensity) * t
    }
  }
  return last.intensity
}
