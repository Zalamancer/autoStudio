import type { TimingTemplate } from '@/types/timingTemplate'
import type { CanvasObjectRef } from '@/types/keyframes'
import { useKeyframeStore } from '@/stores/useKeyframeStore'

/**
 * Apply a timing template to a canvas object.
 *
 * @param template - The template to apply
 * @param objectRef - Target object
 * @param startFrame - Absolute frame where the animation starts
 * @param duration - Duration in frames (overrides template default if provided)
 * @param currentValues - Current property values for relative mode
 */
export function applyTimingTemplate(
  template: TimingTemplate,
  objectRef: CanvasObjectRef,
  startFrame: number,
  duration?: number,
  currentValues?: Record<string, number>,
): void {
  const store = useKeyframeStore.getState()
  const dur = duration ?? template.defaultDuration

  // Optionally clear existing keyframes for affected properties
  if (template.replacesExisting) {
    for (const track of template.tracks) {
      const existingTrack = store.getTracksForObject(objectRef)
        .find(t => t.property === track.property)
      if (existingTrack) {
        for (const kf of existingTrack.keyframes) {
          if (kf.frame >= startFrame && kf.frame <= startFrame + dur) {
            store.removeKeyframe(kf.id)
          }
        }
      }
    }
  }

  // Apply template keyframes
  for (const track of template.tracks) {
    for (const kf of track.keyframes) {
      const absoluteFrame = Math.round(startFrame + kf.relativePosition * dur)

      let value: number
      switch (kf.valueMode) {
        case 'absolute':
          value = kf.value
          break
        case 'relative':
          value = (currentValues?.[track.property] ?? 0) + kf.value
          break
        case 'normalized':
          value = kf.value
          break
      }

      store.setKeyframe(objectRef, track.property, absoluteFrame, value)

      // Apply easing to the keyframe we just created
      const allTracks = store.getTracksForObject(objectRef)
      const targetTrack = allTracks.find(t => t.property === track.property)
      if (targetTrack) {
        const createdKf = targetTrack.keyframes.find(k => k.frame === absoluteFrame)
        if (createdKf) {
          store.updateKeyframeEasing(createdKf.id, kf.easing, kf.bezierParams)
        }
      }
    }
  }
}

/**
 * Extract keyframes from an object and create a timing template.
 */
export function extractTimingTemplate(
  objectRef: CanvasObjectRef,
  name: string,
  category: TimingTemplate['category'],
): TimingTemplate {
  const store = useKeyframeStore.getState()
  const tracks = store.getTracksForObject(objectRef)

  if (tracks.length === 0) {
    throw new Error('Object has no keyframes to extract')
  }

  // Find global frame range
  let minFrame = Infinity
  let maxFrame = -Infinity
  for (const track of tracks) {
    for (const kf of track.keyframes) {
      minFrame = Math.min(minFrame, kf.frame)
      maxFrame = Math.max(maxFrame, kf.frame)
    }
  }
  const duration = maxFrame - minFrame

  // Convert to relative timing
  const templateTracks = tracks.map(track => ({
    property: track.property,
    keyframes: track.keyframes.map(kf => ({
      relativePosition: duration > 0 ? (kf.frame - minFrame) / duration : 0,
      value: kf.value,
      valueMode: 'absolute' as const,
      easing: kf.easing,
      bezierParams: kf.bezierParams,
    })),
  }))

  return {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    category,
    description: `Extracted from ${objectRef.objectType} "${objectRef.objectId}"`,
    compatibleTypes: 'all',
    tracks: templateTracks,
    defaultDuration: duration,
    stretchable: true,
    replacesExisting: true,
    source: 'user',
  }
}

/**
 * Apply a template to multiple objects with stagger delay.
 */
export function applyStaggeredTemplate(
  template: TimingTemplate,
  objects: CanvasObjectRef[],
  startFrame: number,
  staggerFrames: number,
  duration?: number,
  currentValues?: Map<string, Record<string, number>>,
): void {
  for (let i = 0; i < objects.length; i++) {
    const objStartFrame = startFrame + i * staggerFrames
    const objId = `${objects[i].objectType}:${objects[i].objectId}`
    applyTimingTemplate(template, objects[i], objStartFrame, duration, currentValues?.get(objId))
  }
}
