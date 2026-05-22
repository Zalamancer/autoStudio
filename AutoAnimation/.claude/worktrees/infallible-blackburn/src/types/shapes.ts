import type { BlendMode } from './blendModes'
import type { BlurType } from './blurEffect'
import type { GradientFill } from './gradient'

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star'

export interface CanvasShape {
  id: string
  type: ShapeType
  name: string
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  fill: string | GradientFill   // backward compatible: string = solid color
  stroke: string
  strokeWidth: number
  opacity: number
  zIndex: number
  visible: boolean
  startFrame: number
  endFrame: number
  borderRadius?: number
  points?: number       // star point count (default 5)
  innerRadius?: number  // star inner radius ratio 0-1 (default 0.4)
  blendMode?: BlendMode
  blur?: number
  blurType?: BlurType
  motionBlurAngle?: number
  maskId?: string
  pathId?: string
  pathAutoRotate?: boolean
  /** ID of another shape to morph into (shape morphing target) */
  morphTargetId?: string
  /** Custom SVG path `d` string (overrides the type-based shape) */
  svgPath?: string
}
