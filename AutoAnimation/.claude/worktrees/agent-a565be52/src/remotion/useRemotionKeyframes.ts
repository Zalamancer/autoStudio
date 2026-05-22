import { useFrame } from '@/engine'
import { interpolatePropertyKeyframes } from '@/services/interpolation'
import { isAngleProperty } from '@/services/keyframeProperties'
import type { KeyframeExportData } from './types'
import type { KeyframableObjectType, PropertyKeyframe } from '@/types/keyframes'
import type { EasingType } from '@/types/keyframes'

/**
 * Remotion hook: returns interpolated keyframe values for a specific object at the current frame.
 * Used inside Remotion composition components to apply keyframe animations during export.
 */
export function useRemotionKeyframeValues(
  keyframeData: KeyframeExportData | undefined,
  objectType: string,
  objectId: string
): Record<string, number> {
  const frame = useFrame()

  if (!keyframeData || keyframeData.tracks.length === 0) return {}

  const result: Record<string, number> = {}

  for (const track of keyframeData.tracks) {
    if (track.objectType !== objectType || track.objectId !== objectId) continue
    if (track.keyframes.length === 0) continue

    // Convert exported keyframes to PropertyKeyframe format
    const propertyKeyframes: PropertyKeyframe[] = track.keyframes.map((kf, i) => ({
      id: `export_${i}`,
      frame: kf.frame,
      value: kf.value,
      easing: kf.easing as EasingType,
      bezierParams: kf.bezierParams,
    }))

    const isAngle = isAngleProperty(objectType as KeyframableObjectType, track.property)
    const value = interpolatePropertyKeyframes(propertyKeyframes, frame, isAngle)

    if (value !== undefined) {
      result[track.property] = value
    }
  }

  return result
}
