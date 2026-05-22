export type SchemaVariableType =
  | 'text'
  | 'text-multiline'
  | 'number'
  | 'color'
  | 'boolean'
  | 'image'
  | 'character'
  | 'voice'
  | 'select'
  | 'font'
  | 'transform'
  | 'color-palette'
  | 'audio'

export interface SchemaVariableValidation {
  min?: number
  max?: number
  step?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  required?: boolean
}

export interface SchemaSelectOption {
  label: string
  value: string
}

export interface SchemaVariable {
  key: string
  label: string
  type: SchemaVariableType
  value: unknown
  defaultValue: unknown
  description?: string
  group: string
  order: number
  validation?: SchemaVariableValidation
  options?: SchemaSelectOption[]
  source: 'auto' | 'manual'
  tags?: string[]
}

export type BindingTargetType =
  | 'canvas'
  | 'editor'
  | 'character-config'
  | 'multi-character'
  | 'text-overlay'
  | 'shape'
  | 'html-template'
  | 'animation'
  | 'media'
  | 'video-layer'
  | 'svg-object'
  | 'keyframe'
  | 'voice'
  | 'timeline'
  | 'playback'
  | 'rig'
  | 'character-3d'
  | 'rig-3d'

export type BindingTransform =
  | 'direct'
  | 'voice-regenerate'
  | 'character-swap'
  | 'image-upload'

export interface SchemaBinding {
  variableKey: string
  mode: 'snapshot-path' | 'store-action'
  snapshotPath?: string
  targetStore?: BindingTargetType
  action?: string
  entityId?: string
  property?: string
  transform?: BindingTransform
}

export interface ProjectSchema {
  version: number
  variables: SchemaVariable[]
  bindings: SchemaBinding[]
  groupOrder: string[]
  updatedAt: string
}
