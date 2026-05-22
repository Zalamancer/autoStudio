import { lazy, Suspense, memo } from 'react'
import { Loader2 } from 'lucide-react'
import type { CanvasOverlayId } from '@/types'

const overlayMap: Record<CanvasOverlayId, React.LazyExoticComponent<React.ComponentType<{ onClose: () => void }>>> = {
  'ai-director': lazy(() => import('../overlays/AIDirectorOverlay')),
  'character-generator': lazy(() => import('../overlays/CharacterGeneratorOverlay')),
  'character-3d-import': lazy(() => import('../overlays/Character3DImportOverlay')),
  'script-generator': lazy(() => import('../overlays/ScriptGeneratorOverlay')),
  'voice-generator': lazy(() => import('../overlays/VoiceGeneratorOverlay')),
  'dialogue-editor': lazy(() => import('../overlays/DialogueEditorOverlay')),
  'text-creator': lazy(() => import('../overlays/TextCreatorOverlay')),
  'animation-browser': lazy(() => import('../overlays/AnimationBrowserOverlay')),
  'media-browser': lazy(() => import('../overlays/MediaBrowserOverlay')),
  'video-browser': lazy(() => import('../overlays/VideoBrowserOverlay')),
  'template-browser': lazy(() => import('../overlays/TemplateBrowserOverlay')),
  'svg-art-generator': lazy(() => import('../overlays/SVGArtGeneratorOverlay')),
  'transition-picker': lazy(() => import('../overlays/TransitionPickerOverlay')),
  'caption-designer': lazy(() => import('../overlays/CaptionDesignerOverlay')),
  'audio-studio': lazy(() => import('../overlays/AudioStudioOverlay')),
  'screen-recorder': lazy(() => import('../overlays/ScreenRecorderOverlay')),
  'content-calendar': lazy(() => import('../overlays/ContentCalendarOverlay')),
  'background-browser': lazy(() => import('../overlays/BackgroundBrowserOverlay')),
}

interface CanvasOverlayRouterProps {
  overlayId: CanvasOverlayId
  onClose: () => void
}

export const CanvasOverlayRouter = memo(function CanvasOverlayRouter({ overlayId, onClose }: CanvasOverlayRouterProps) {
  const OverlayComponent = overlayMap[overlayId]
  if (!OverlayComponent) return null

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 md:absolute md:inset-3 z-50 bg-zinc-800/95 backdrop-blur-sm md:border border-zinc-700/50 md:rounded-xl shadow-2xl flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      }
    >
      <OverlayComponent onClose={onClose} />
    </Suspense>
  )
})
