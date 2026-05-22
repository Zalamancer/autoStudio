export interface OneClickApp {
  id: string
  name: string
  description: string
  category: AppCategory
  icon: string
  color: string
  thumbnail?: string
  orchestratorConfig: AppOrchestratorConfig
  inputFields: AppInputField[]
  tags: string[]
}

export type AppCategory =
  | 'camera'
  | 'enhance'
  | 'face'
  | 'ads'
  | 'games'
  | 'editing'
  | 'asmr'
  | 'trending'
  | 'extras'
  | 'education'

export interface AppOrchestratorConfig {
  defaultPrompt?: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  duration?: number
  fps?: number
  enableMusic?: boolean
  enableCaptions?: boolean
  enableStockMedia?: boolean
  enableSvgObjects?: boolean
  enableMotionGraphics?: boolean
  stylePreset?: string
  effectsPreset?: string[]
  cameraPreset?: string
  customSteps?: string[]
}

export interface AppInputField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'toggle' | 'image'
  placeholder?: string
  options?: { label: string; value: string }[]
  default?: any
  required?: boolean
}

export interface AppExecution {
  appId: string
  inputs: Record<string, any>
  status: 'idle' | 'running' | 'completed' | 'error'
  progress: number
  result?: any
  error?: string
}
