// ── PowerPoint Import Types ──

export interface TextBoxData {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fontColor: string
  bold: boolean
  italic: boolean
  alignment: 'left' | 'center' | 'right'
  rotation: number
}

export interface ShapeData {
  type: 'rectangle' | 'roundRect' | 'ellipse' | 'triangle' | 'arrow' | 'star' | 'unknown'
  x: number
  y: number
  width: number
  height: number
  fillColor: string
  strokeColor: string
  strokeWidth: number
  rotation: number
}

export interface ImageData {
  dataUrl: string
  x: number
  y: number
  width: number
  height: number
  filename: string
}

export interface TransitionData {
  type: 'fade' | 'push' | 'wipe' | 'split' | 'dissolve' | 'none'
  duration: number
}

export interface ThemeData {
  colors: Record<string, string>
  fonts: {
    heading: string
    body: string
  }
}

export interface SlideData {
  index: number
  textBoxes: TextBoxData[]
  shapes: ShapeData[]
  images: ImageData[]
  background: {
    type: 'solid' | 'gradient' | 'image' | 'none'
    color?: string
    imageDataUrl?: string
  }
  speakerNotes: string
  transition: TransitionData
}

export interface PresentationData {
  slides: SlideData[]
  slideWidth: number
  slideHeight: number
  theme: ThemeData
}
