import type { EasingType, CubicBezierParams, KeyframableObjectType } from './keyframes'

export interface TimingTemplateKeyframe {
  /** Relative position within the template, 0-1 (0 = start, 1 = end) */
  relativePosition: number
  /** Relative value: either absolute or delta from default */
  value: number
  /** How to interpret the value */
  valueMode: 'absolute' | 'relative' | 'normalized'
  easing: EasingType
  bezierParams?: CubicBezierParams
}

export interface TimingTemplateTrack {
  property: string
  keyframes: TimingTemplateKeyframe[]
}

export interface TimingTemplate {
  id: string
  name: string
  category: 'entrance' | 'exit' | 'emphasis' | 'transition' | 'loop' | 'custom'
  description: string
  /** Which object types this template is compatible with */
  compatibleTypes: KeyframableObjectType[] | 'all'
  /** Which properties this template animates */
  tracks: TimingTemplateTrack[]
  /** Default duration in frames (used when no duration specified) */
  defaultDuration: number
  /** Whether the template can be time-stretched */
  stretchable: boolean
  /** Whether applying this clears existing keyframes for the affected properties */
  replacesExisting: boolean
  /** Preview: mini keyframe diagram data for thumbnail rendering */
  preview?: { property: string; points: number[] }[]
  /** Source: 'builtin' or 'user' */
  source: 'builtin' | 'user'
}
