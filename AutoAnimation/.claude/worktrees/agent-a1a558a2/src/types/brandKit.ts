import type { TextOverlay } from '@/stores/useTextOverlayStore'

export interface BrandKit {
  id: string
  name: string
  userId?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  bgColor?: string
  headingFont: string
  bodyFont: string
  logoUrl?: string
  watermarkUrl?: string
  introTemplateId?: string
  outroTemplateId?: string
  defaultVoiceId?: string
  tone: string
  captionPresetId?: string
  captionStyle?: Partial<CaptionStyleConfig>
  textOverlayDefaults?: Partial<TextOverlay>
  shapeDefaults?: { fillColor: string; strokeColor: string }
  musicMood?: string
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  watermarkOpacity?: number
  customFontUrls?: string[]
  createdAt: string
  updatedAt: string
}

export interface CaptionStyleConfig {
  style: string
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  backgroundOpacity: number
  position: string
}
