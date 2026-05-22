// Re-export portable types from @proanimate/core
export type { MotionGraphicProps, FieldDescriptor } from '@proanimate/core'

// Keep web-only types that depend on React
export interface MotionGraphicRegistration<TConfig = Record<string, unknown>> {
  id: string
  title: string
  description: string
  tags: string[]
  category: string
  component: React.ComponentType<import('@proanimate/core').MotionGraphicProps<TConfig>>
  configSchema: import('@proanimate/core').FieldDescriptor[]
  defaultConfig: TConfig
}
