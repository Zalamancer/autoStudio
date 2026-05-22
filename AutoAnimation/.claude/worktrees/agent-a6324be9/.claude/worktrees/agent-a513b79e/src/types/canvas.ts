export interface Point2D {
  x: number
  y: number
}

export interface Transform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

export interface Character {
  id: string
  puppetId: string
  name: string
  transform: Transform
  expression: string
  intensity: number
  visible: boolean
  locked: boolean
}

export interface CanvasState {
  characters: Character[]
  selectedCharacterId: string | null
  canvasWidth: number
  canvasHeight: number
}

export interface CompositorLayer {
  id: string
  type: 'video' | 'sprite' | 'text' | 'image' | 'effect'
  zIndex: number
  opacity: number
  transform: Transform
  visible: boolean
  blendMode: GlobalCompositeOperation
}
