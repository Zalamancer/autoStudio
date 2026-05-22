import type { Point2D } from './canvas'

export type Viseme = 'Aa' | 'D' | 'Ee' | 'F' | 'L' | 'M' | 'O' | 'R' | 'S' | 'U' | 'W' | 'Rest'

export type EmotionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'disgusted'

export interface SpriteFrame {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface SpriteSheet {
  id: string
  imageUrl: string
  frames: SpriteFrame[]
  frameWidth: number
  frameHeight: number
}

export interface SpriteAnimation {
  id: string
  name: string
  frameIds: string[]
  loop: boolean
  fps: number
}

export interface PuppetPart {
  id: string
  name: string
  spriteSheet: SpriteSheet
  anchor: Point2D
  parentId: string | null
  defaultFrame: string
}

export interface Expression {
  id: string
  name: string
  emotion: EmotionType
  intensity: 1 | 2 | 3 | 4
  partStates: Record<string, {
    frameId: string
    offset: Point2D
    rotation: number
    scale: Point2D
    opacity: number
  }>
}

export interface VisemeData {
  viseme: Viseme
  startTime: number
  endTime: number
  intensity: number
}

export interface Puppet {
  id: string
  name: string
  thumbnail: string
  parts: PuppetPart[]
  expressions: Expression[]
  visemes: Record<Viseme, string> // Viseme to frame ID mapping
  defaultExpression: string
}

export interface CharacterState {
  availablePuppets: Puppet[]
  selectedPuppetId: string | null
  isLoading: boolean
}
