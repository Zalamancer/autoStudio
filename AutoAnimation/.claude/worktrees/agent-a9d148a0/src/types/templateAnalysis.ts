export type AIFieldType =
  | 'color'
  | 'text'
  | 'number'
  | 'boolean'
  | 'image-url'
  | 'video-url'
  | 'text-array'
  | 'object-array'
  | 'select'
  | 'font'
  | 'gradient'

export interface AITemplateField {
  /** CONFIG key (e.g. "title", "data", "bgColor") */
  key: string
  /** Human label */
  label: string
  fieldType: AIFieldType
  defaultValue: unknown
  /** 1-sentence description */
  description: string
  /** "Content" | "Colors" | "Typography" | "Animation" | "Layout" | "Data" | "Media" */
  group: string
  min?: number
  max?: number
  step?: number
  /** "px", "ms", "%" */
  unit?: string
  /** For select fields */
  options?: string[]
  /** For object-array items — describes each object's fields */
  objectSchema?: Record<string, { type: AIFieldType; description: string }>
}

export interface AITemplateAnalysis {
  templateId: string
  /** Hash of the template HTML content, for cache invalidation */
  contentHash: string
  analyzedAt: number
  fields: AITemplateField[]
  /** Compact summary e.g. "title:text, data:object-array[{category,value}], bgColor:color" */
  compactSummary: string
  /** Whether this came from AI analysis or static parser fallback */
  source: 'ai' | 'static'
}
