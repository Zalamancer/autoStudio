import { useEffect, useRef, memo } from 'react'
import { usePixiApp } from './usePixiApp'
import { PixiMediaLayer } from './PixiMediaLayer'
import { PixiShapeLayer } from './PixiShapeLayer'
import { PixiCharacterComposite } from './PixiCharacterComposite'
import { PixiMultiCharacterLayer } from './PixiMultiCharacterLayer'
import { PixiTextOverlayLayer } from './PixiTextOverlayLayer'
import { PixiCaptionOverlay } from './PixiCaptionOverlay'
import { PixiImageStoryLayer } from './PixiImageStoryLayer'
import { PixiRenderLoop } from './PixiRenderLoop'
import { useCanvasStore } from '@/stores'
import { useImageStoryStore } from '@/stores/useImageStoryStore'

interface PixiCanvasProps {
  width: number
  height: number
}

/**
 * PixiCanvas is the React wrapper that mounts the PixiJS Application canvas,
 * initializes all PixiJS layers, and starts the unified render loop.
 *
 * It renders a transparent <canvas> at z-index 0 (behind DOM overlays).
 * The canvas fills its container and all PixiJS sprites are drawn here.
 */
export const PixiCanvas = memo(function PixiCanvas({ width, height }: PixiCanvasProps) {
  const { containerRef, app, ready } = usePixiApp({ width, height })
  const renderLoopRef = useRef<PixiRenderLoop | null>(null)
  const textLayerRef = useRef<PixiTextOverlayLayer | null>(null)
  const captionLayerRef = useRef<PixiCaptionOverlay | null>(null)

  // Initialize layers and render loop once app is ready
  useEffect(() => {
    if (!app || !ready) return

    // Enable sortable children on stage so zIndex ordering works
    app.stage.sortableChildren = true

    // Create all layers in z-order (bottom to top)
    // Each layer gets a z-index matching the DOM layer ordering in VideoCanvas.tsx
    const mediaLayer = new PixiMediaLayer(app.stage)
    mediaLayer.setZIndex(5)
    const shapeLayer = new PixiShapeLayer(app.stage)
    shapeLayer.setZIndex(6)
    const characterComposite = new PixiCharacterComposite(app.stage)
    characterComposite.setZIndex(7)
    const multiCharacterLayer = new PixiMultiCharacterLayer(app.stage)
    multiCharacterLayer.setZIndex(7)
    const textOverlayLayer = new PixiTextOverlayLayer(app.stage)
    textOverlayLayer.setZIndex(8)
    const captionOverlay = new PixiCaptionOverlay(app.stage)
    captionOverlay.setZIndex(9)

    textLayerRef.current = textOverlayLayer
    captionLayerRef.current = captionOverlay

    // Create and start render loop
    const renderLoop = new PixiRenderLoop(app)
    renderLoop.setMediaLayer(mediaLayer)
    renderLoop.setShapeLayer(shapeLayer)
    renderLoop.setCharacterComposite(characterComposite)
    renderLoop.setMultiCharacterLayer(multiCharacterLayer)
    renderLoop.setTextOverlayLayer(textOverlayLayer)
    renderLoop.setCaptionOverlay(captionOverlay)

    // Image Story layer (conditional — only when an image story plan exists)
    let imageStoryLayer: PixiImageStoryLayer | null = null
    const imageStoryPlan = useImageStoryStore.getState().plan
    if (imageStoryPlan) {
      const { canvasWidth: cw, canvasHeight: ch } = useCanvasStore.getState()
      const fps = 30 // Default FPS; updated by orchestrator if different
      imageStoryLayer = new PixiImageStoryLayer(app.stage, cw, ch, fps)
      imageStoryLayer.setZIndex(4) // Between media (5) and shapes (6)
      renderLoop.setImageStoryLayer(imageStoryLayer)
    }

    // Set initial canvas dimensions
    // logicalWidth/Height = export resolution (e.g. 1920×1080)
    // width/height = display CSS pixels on screen (e.g. 1073×604)
    const { canvasWidth, canvasHeight } = useCanvasStore.getState()
    renderLoop.setLogicalDimensions(canvasWidth, canvasHeight)
    renderLoop.setDisplayDimensions(width, height)
    textOverlayLayer.setDimensions(width, height, canvasWidth)
    captionOverlay.setDimensions(width, height)

    renderLoop.start()
    renderLoopRef.current = renderLoop

    return () => {
      renderLoop.destroy()
      mediaLayer.destroy()
      shapeLayer.destroy()
      characterComposite.destroy()
      multiCharacterLayer.destroy()
      textOverlayLayer.destroy()
      captionOverlay.destroy()
      imageStoryLayer?.destroy()
      renderLoopRef.current = null
      textLayerRef.current = null
      captionLayerRef.current = null
    }
  }, [app, ready])

  // Keep render loop canvas dimensions in sync
  useEffect(() => {
    const { canvasWidth, canvasHeight } = useCanvasStore.getState()
    renderLoopRef.current?.setLogicalDimensions(canvasWidth, canvasHeight)
    renderLoopRef.current?.setDisplayDimensions(width, height)
    textLayerRef.current?.setDimensions(width, height, canvasWidth)
    captionLayerRef.current?.setDimensions(width, height)
  })

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none', // Let clicks pass through to MoveableProxy divs
      }}
    />
  )
})
