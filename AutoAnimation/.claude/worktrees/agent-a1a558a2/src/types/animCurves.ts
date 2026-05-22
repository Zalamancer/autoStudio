/**
 * Per-property keyframe types for the 3D animation curve editor.
 * Allows editing individual bone properties (position.x, rotation.y, etc.)
 * independently with cubic bezier handles.
 */
import type { EasingType, CubicBezierParams } from './keyframes'

export interface BonePropertyKeyframe {
  id: string
  frame: number
  value: number
  easing: EasingType
  bezierParams?: CubicBezierParams
}

export interface BonePropertyTrack {
  id: string
  boneName: string
  /** Property path: 'position.x', 'position.y', 'position.z',
   *  'rotation.x', 'rotation.y', 'rotation.z' (euler degrees),
   *  'scale.x', 'scale.y', 'scale.z' */
  property: string
  keyframes: BonePropertyKeyframe[]
}

/** Color coding for curve editor display */
export const PROPERTY_COLORS: Record<string, string> = {
  'position.x': '#ef4444', // red
  'position.y': '#22c55e', // green
  'position.z': '#3b82f6', // blue
  'rotation.x': '#f97316', // orange
  'rotation.y': '#a855f7', // purple
  'rotation.z': '#06b6d4', // cyan
  'scale.x': '#f43f5e',    // rose
  'scale.y': '#84cc16',    // lime
  'scale.z': '#6366f1',    // indigo
}

export const ALL_BONE_PROPERTIES = [
  'position.x', 'position.y', 'position.z',
  'rotation.x', 'rotation.y', 'rotation.z',
  'scale.x', 'scale.y', 'scale.z',
] as const

export type BonePropertyPath = typeof ALL_BONE_PROPERTIES[number]
