/**
 * Smart Zoom Types
 */

export type ZoomStyle = 'smooth' | 'crash' | 'expo' | 'linear'

export type ZoomTriggerType =
  | 'sentence-start'
  | 'exclamation'
  | 'question'
  | 'keyword'
  | 'topic-transition'
  | 'speaker-change'
  | 'emphasis'
  | 'ai-detected'

export interface ZoomPoint {
  frame: number
  intensity: number // 0-1
  type: ZoomTriggerType
  description: string
}

export interface SmartZoomConfig {
  style: ZoomStyle
  intensity: number // 0-1
  frequency: 'conservative' | 'moderate' | 'aggressive'
  maxZoom: number // 1.1-2.0
  includeTopicTransitions: boolean
  includeSpeakerChanges: boolean
  includeEmphasis: boolean
  includePunctuation: boolean
  useAI: boolean
  triggerStyleOverrides?: Partial<Record<ZoomTriggerType, ZoomStyle>>
}
