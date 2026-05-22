export interface MotionGraphicProps<TConfig = Record<string, unknown>> {
  config: TConfig
  /** Current frame local to this component's range */
  frame: number
  fps: number
  durationInFrames: number
  width: number
  height: number
  /** Normalized progress 0..1 */
  progress: number
}

export interface FieldDescriptor {
  key: string
  label: string
  type: 'text' | 'color' | 'number' | 'boolean' | 'text-array' | 'select'
  defaultValue: unknown
  group: string
  options?: string[] // for 'select' type
  min?: number       // for 'number' type
  max?: number       // for 'number' type
}
