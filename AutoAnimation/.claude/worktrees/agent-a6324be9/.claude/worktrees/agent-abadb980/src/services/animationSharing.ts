/**
 * animationSharing.ts — Normalize, denormalize, and collect animations
 * across all character rigs so any animation can play on any character.
 *
 * Joint names must match across rigs for animations to transfer.
 * Deltas for joints that don't exist on the target rig are silently
 * skipped by RigPlaybackViewer (fine for auto-rigged characters which
 * share the same joint naming scheme).
 */

import type { SerializedRigData, SerializedAnimation } from '@bonerigging/core'
import type { RigData } from '@/types/rig'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GlobalAnimationEntry {
  /** ID of the rig this animation originated from */
  sourceRigId: string
  /** Index within the source rig's animations[] array */
  originalIndex: number
  /** The animation data (denormalized to the target rig's imageHeight) */
  animation: SerializedAnimation
  /** True if this animation already belongs to the target rig (no scaling needed) */
  isNative: boolean
}

// ---------------------------------------------------------------------------
// Normalize / Denormalize
// ---------------------------------------------------------------------------

/**
 * Divide all keyframe delta x/y values by sourceImageHeight to produce a
 * height-relative animation. This allows proportional scaling when the
 * animation is later applied to a character with a different imageHeight.
 */
export function normalizeAnimation(
  anim: SerializedAnimation,
  sourceImageHeight: number,
): SerializedAnimation {
  if (!sourceImageHeight || sourceImageHeight <= 0) return anim

  // Deep-clone so we don't mutate the original
  const clone = JSON.parse(JSON.stringify(anim)) as SerializedAnimation

  // Walk keyframes (shape: anim.keyframes[] with each having deltas: Record<jointName, {x,y}>)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyframes = (clone as any).keyframes as
    | Array<{ deltas?: Record<string, { x: number; y: number }> }>
    | undefined

  if (!keyframes) return clone

  for (const kf of keyframes) {
    if (!kf.deltas) continue
    for (const joint of Object.keys(kf.deltas)) {
      kf.deltas[joint].x /= sourceImageHeight
      kf.deltas[joint].y /= sourceImageHeight
    }
  }

  return clone
}

/**
 * Multiply all keyframe delta x/y values by targetImageHeight to
 * scale a normalized animation to a specific character's dimensions.
 */
export function denormalizeAnimation(
  normalizedAnim: SerializedAnimation,
  targetImageHeight: number,
): SerializedAnimation {
  if (!targetImageHeight || targetImageHeight <= 0) return normalizedAnim

  const clone = JSON.parse(JSON.stringify(normalizedAnim)) as SerializedAnimation

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyframes = (clone as any).keyframes as
    | Array<{ deltas?: Record<string, { x: number; y: number }> }>
    | undefined

  if (!keyframes) return clone

  for (const kf of keyframes) {
    if (!kf.deltas) continue
    for (const joint of Object.keys(kf.deltas)) {
      kf.deltas[joint].x *= targetImageHeight
      kf.deltas[joint].y *= targetImageHeight
    }
  }

  return clone
}

// ---------------------------------------------------------------------------
// Collect all animations across rigs
// ---------------------------------------------------------------------------

/**
 * Iterate all rigs, parse each one's boneriggingSerializedData, and collect
 * every animation. Foreign animations are normalized by their source
 * imageHeight then denormalized to the target rig's imageHeight.
 *
 * @param rigs       All rigs from the store
 * @param targetRigId  The rig we want to play animations on
 * @returns Array of GlobalAnimationEntry (native animations first, then foreign)
 */
export function collectAllAnimations(
  rigs: Record<string, RigData>,
  targetRigId: string,
): GlobalAnimationEntry[] {
  const entries: GlobalAnimationEntry[] = []
  const targetRig = rigs[targetRigId]
  if (!targetRig) return entries

  const targetImageHeight = targetRig.imageHeight

  // Parse target's serialized data for its imageHeight used in serialized anims
  let targetSerializedImageHeight = targetImageHeight
  if (targetRig.boneriggingSerializedData) {
    try {
      const parsed = JSON.parse(targetRig.boneriggingSerializedData)
      if (typeof parsed.imageHeight === 'number') {
        targetSerializedImageHeight = parsed.imageHeight as number
      }
    } catch { /* ignore */ }
  }

  for (const [rigId, rig] of Object.entries(rigs)) {
    if (!rig.boneriggingSerializedData) continue

    let parsed: SerializedRigData
    try {
      parsed = JSON.parse(rig.boneriggingSerializedData) as SerializedRigData
    } catch {
      continue
    }

    const animations = parsed.animations ?? []
    if (animations.length === 0) continue

    const isNative = rigId === targetRigId

    // Get source image height for normalization
    let sourceImageHeight = rig.imageHeight
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (parsed as any).imageHeight === 'number') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceImageHeight = (parsed as any).imageHeight as number
    }

    for (let i = 0; i < animations.length; i++) {
      if (isNative) {
        // Native animations don't need scaling
        entries.push({
          sourceRigId: rigId,
          originalIndex: i,
          animation: animations[i],
          isNative: true,
        })
      } else {
        // Foreign: normalize by source height, then denormalize to target height
        const normalized = normalizeAnimation(animations[i], sourceImageHeight)
        const denormalized = denormalizeAnimation(normalized, targetSerializedImageHeight)
        entries.push({
          sourceRigId: rigId,
          originalIndex: i,
          animation: denormalized,
          isNative: false,
        })
      }
    }
  }

  return entries
}

/**
 * Build a merged SerializedRigData by injecting all global animations
 * into the target rig's serialized data.
 *
 * @returns The merged data + a mapping from global index → { sourceRigId, originalIndex }
 */
export function buildMergedSerializedData(
  rigs: Record<string, RigData>,
  targetRigId: string,
): { mergedData: SerializedRigData; globalEntries: GlobalAnimationEntry[] } | null {
  const targetRig = rigs[targetRigId]
  if (!targetRig?.boneriggingSerializedData) return null

  let baseParsed: SerializedRigData
  try {
    baseParsed = JSON.parse(targetRig.boneriggingSerializedData) as SerializedRigData
  } catch {
    return null
  }

  const globalEntries = collectAllAnimations(rigs, targetRigId)
  if (globalEntries.length === 0) return { mergedData: baseParsed, globalEntries }

  // Replace the animations array with the merged list
  const mergedData: SerializedRigData = {
    ...baseParsed,
    animations: globalEntries.map((e) => e.animation),
  }

  return { mergedData, globalEntries }
}
