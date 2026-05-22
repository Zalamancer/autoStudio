import React, { useRef, useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { useEditorStore, useCanvasStore, useKeyframeStore, useTimelineStore } from '@/stores'
import { useCameraStore } from '@/stores/useCameraStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useDialoguePlayback } from '@/hooks/useDialoguePlayback'
import { useKeyframePlayback } from '@/hooks/useKeyframePlayback'
import { useMotionTracking } from '@/hooks/useMotionTracking'
import { useAudioReactivePreview } from '@/hooks/useAudioReactivePreview'
import { CharacterComposite } from './CharacterComposite'
import { MultiCharacterLayer } from './CharacterLayer'
import { CaptionOverlay } from './CaptionOverlay'
import { RetentionHookLayer } from './RetentionHookLayer'
import { PanelErrorBoundary } from '@/components/PanelErrorBoundary'
import { LottieLayers } from './LottieLayer'
import { MediaLayer } from './MediaLayer'
import { VideoLayer } from './VideoLayer'
import { TextOverlayLayer } from './TextOverlayLayer'
const ThreeCanvas = lazy(() => import('./ThreeCanvas').then((m) => ({ default: m.ThreeCanvas })))
import { SVGObjectLayer } from './SVGObjectLayer'
import { ShapeLayer } from './ShapeLayer'
import { ArtCurveLayer } from './ArtCurveLayer'
import { AudioLayer } from './AudioLayer'
import { HTMLTemplateLayer } from './HTMLTemplateLayer'
import { MotionGraphicLayer } from './MotionGraphicLayer'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { PixelArtCharacterLayer } from './PixelArtCharacterLayer'
import { AvatarCharacterLayer } from './AvatarCharacterLayer'
import { AnnotationLayer } from './AnnotationLayer'
import { WhiteboardLayer, WhiteboardBackground } from './WhiteboardLayer'
import { WhiteboardTextItemLayer } from './WhiteboardTextItemLayer'
import { WhiteboardDrawingOverlay } from './WhiteboardDrawingOverlay'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { WhiteboardToolbar } from './WhiteboardToolbar'
import { AudioReactiveLayer } from './AudioReactiveLayer'
import { CrowdLayer } from './CrowdLayer'
import { ParticleLayer } from './ParticleLayer'
import { MixedMediaLayer } from './MixedMediaLayer'
import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { BoneOverlay } from './BoneOverlay'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useArtCurveStore } from '@/stores/useArtCurveStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { Maximize2, ChevronDown, Layers, Clapperboard, Bot, PenTool } from 'lucide-react'
import { PixiCanvas } from '@/pixi/PixiCanvas'
import { MediaMoveableProxies } from '@/pixi/MoveableProxy'
import { ShapeMoveableProxies } from '@/pixi/ShapeMoveableProxy'
import { TextMoveableProxies } from '@/pixi/TextMoveableProxy'
import { CharacterMoveableProxies } from '@/pixi/CharacterMoveableProxy'
import type { AspectRatio } from '@/types'

import { CanvasOverlayRouter } from './CanvasOverlayRouter'
import { CanvasContextMenu } from './CanvasContextMenu'
import { BoilingLineFilters } from './BoilingLineFilters'
import { StyleEffectFilters } from './StyleEffectFilters'
import { PathEditorOverlay } from './PathEditorOverlay'
import { MaskEditorOverlay } from './MaskEditorOverlay'
import { usePathStore } from '@/stores/usePathStore'
import { useMaskStore } from '@/stores/useMaskStore'

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.25
const ZOOM_MAX = 3.0

// Even spacing per layer rank (not raw z-index) so layers are uniformly distributed in 3D
const DEPTH_PX_PER_LAYER = 50

const aspectRatioValues: Record<AspectRatio, number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1,
  '4:3': 4 / 3,
  '21:9': 21 / 9,
}

const canvasDimensions: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '21:9']

// ── 3D Layer Wrapper ──────────────────────────────────────────────────
/** Thin wrapper so overlay mounts independently of parent renders */
function PathEditorOverlayWrapper() {
  const activePathId = usePathStore((s) => s.activeEditingPathId)
  if (!activePathId) return null
  return <PathEditorOverlay />
}

function MaskEditorOverlayWrapper() {
  const activeMaskId = useMaskStore((s) => s.activeEditingMaskId)
  if (!activeMaskId) return null
  return <MaskEditorOverlay />
}

// `order` = ordinal rank (0, 1, 2, ...) for even depth spacing
// `zIndex` = original z-index shown in the label for reference
function Layer3DWrapper({
  order,
  zIndex,
  label,
  is3DView,
  spreadFactor,
  children,
}: {
  order: number
  zIndex: number
  label: string
  is3DView: boolean
  spreadFactor: number
  children: React.ReactNode
}) {
  if (!is3DView) return <>{children}</>

  const depth = order * DEPTH_PX_PER_LAYER * spreadFactor

  return (
    <div
      style={{
        transform: `translateZ(${depth}px)`,
        transformStyle: 'preserve-3d',
        position: 'relative',
        transition: 'transform 0.4s ease-out',
      }}
    >
      {children}
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: 0,
          fontSize: '10px',
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-overlay-heavy)',
          padding: '2px 6px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'opacity 0.3s ease-in 0.15s',
        }}
      >
        {label} <span style={{ color: '#4ade80' }}>z:{zIndex}</span>
      </div>
    </div>
  )
}

/**
 * CameraPreviewWrapper — Live preview equivalent of CameraTransformWrapper.
 * Applies virtual camera zoom/pan/rotation/shake/focus-pull transforms to child layers.
 * Uses timeline currentFrame instead of Remotion's useFrame.
 *
 * Subscribes to currentFrame internally so that VideoCanvas does NOT
 * re-render on every frame change. Only this wrapper re-renders, and since
 * children are stable React elements from the parent, React skips
 * re-rendering them.
 *
 * Uses the store's getCameraAtFrame() method which combines:
 * - Keyframe interpolation (zoom/pan/rotation)
 * - Camera shake effects (additive displacement + rotation)
 * - Focus pull effects (zoom + pan toward a focal point)
 */
const CameraPreviewWrapper = React.memo(function CameraPreviewWrapper({
  enabled,
  canvasWidth,
  canvasHeight,
  is3DView,
  children,
}: {
  enabled: boolean
  canvasWidth: number
  canvasHeight: number
  is3DView: boolean
  children: React.ReactNode
}) {
  const frame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)
  const hasKeyframes = useCameraStore((s) => s.keyframes.length > 0)
  const hasShakes = useCameraStore((s) => s.shakes.length > 0)
  const hasFocusPull = useCameraStore((s) => s.focusPull !== null)

  const hasEffects = hasKeyframes || hasShakes || hasFocusPull

  if (!enabled || !hasEffects || is3DView) {
    return <>{children}</>
  }

  // Use the store's getCameraAtFrame which includes shake + focus pull
  const { zoom, panX, panY, rotation } = useCameraStore.getState().getCameraAtFrame(frame, fps)

  // Convert panX/panY from percentage (-50 to 50) to pixels
  const translateX = (panX / 100) * canvasWidth
  const translateY = (panY / 100) * canvasHeight

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        transformOrigin: 'center center',
        transform: `scale(${zoom}) translate(${-translateX}px, ${-translateY}px) rotate(${rotation}deg)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
})

/** Isolated FPS counter — has its own RAF loop and state, never triggers parent re-render */
function FpsCounter() {
  const [fps, setFps] = useState(0)
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })

  useEffect(() => {
    let rafId: number
    const tick = () => {
      fpsRef.current.frames++
      const now = performance.now()
      const elapsed = now - fpsRef.current.lastTime
      if (elapsed >= 1000) {
        setFps(Math.round((fpsRef.current.frames * 1000) / elapsed))
        fpsRef.current.frames = 0
        fpsRef.current.lastTime = now
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const fpsColor = fps >= 55 ? '#4ade80' : fps >= 28 ? '#facc15' : '#f87171'

  return (
    <div
      className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold pointer-events-none select-none"
      style={{
        zIndex: 42,
        backgroundColor: 'var(--color-overlay-heavy)',
        color: fpsColor,
      }}
    >
      {fps} FPS
    </div>
  )
}

export function VideoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isOrbiting, setIsOrbiting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [aspectDropdownOpen, setAspectDropdownOpen] = useState(false)
  const aspectDropdownRef = useRef<HTMLDivElement>(null)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const orbitStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 })

  // ── Context menu state ──
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Find and select the element under the cursor before opening the menu.
    // Walk up from the click target to find the nearest interactive canvas element.
    let el = e.target as HTMLElement | null
    const root = e.currentTarget as HTMLElement
    let clickable: HTMLElement | null = null
    while (el && el !== root) {
      if (el.dataset.canvasElement || el.classList.contains('cursor-move') || el.classList.contains('cursor-pointer')) {
        clickable = el
        break
      }
      el = el.parentElement
    }
    // Left-click the element to trigger its selection handler
    if (clickable) {
      clickable.click()
    }

    // Open context menu after a microtask so the selection state updates first
    Promise.resolve().then(() => {
      setContextMenu({ x: e.clientX, y: e.clientY })
    })
  }, [])

  // ── Marquee (box) selection state ──
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(
    null,
  )
  const marqueeRef = useRef(marquee)
  marqueeRef.current = marquee
  const marqueeCanvasRef = useRef<HTMLDivElement>(null)

  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio)
  const activeCanvasOverlay = useEditorStore((s) => s.activeCanvasOverlay)
  const toggleCanvasOverlay = useEditorStore((s) => s.toggleCanvasOverlay)
  const closeCanvasOverlay = useEditorStore((s) => s.closeCanvasOverlay)
  const copilotToggle = useCopilotStore((s) => s.toggle)
  const copilotIsOpen = useCopilotStore((s) => s.isOpen)
  const copilotPhase = useCopilotStore((s) => s.phase)
  const usePixiRenderer = useEditorStore((s) => s.usePixiRenderer)

  const selectedCharacterId = useCanvasStore((s) => s.selectedCharacterId)
  const selectCharacter = useCanvasStore((s) => s.selectCharacter)
  const setCanvasDimensions = useCanvasStore((s) => s.setCanvasDimensions)
  const canvasZoom = useCanvasStore((s) => s.canvasZoom)
  const canvasPanX = useCanvasStore((s) => s.canvasPanX)
  const canvasPanY = useCanvasStore((s) => s.canvasPanY)
  const setCanvasZoom = useCanvasStore((s) => s.setCanvasZoom)
  const setCanvasPan = useCanvasStore((s) => s.setCanvasPan)
  const resetCanvasView = useCanvasStore((s) => s.resetCanvasView)
  const is3DView = useCanvasStore((s) => s.is3DView)
  const orbitRotationX = useCanvasStore((s) => s.orbitRotationX)
  const orbitRotationY = useCanvasStore((s) => s.orbitRotationY)
  const layerSpreadFactor = useCanvasStore((s) => s.layerSpreadFactor)
  const toggle3DView = useCanvasStore((s) => s.toggle3DView)
  const setOrbitRotation = useCanvasStore((s) => s.setOrbitRotation)
  const resetOrbitRotation = useCanvasStore((s) => s.resetOrbitRotation)
  const setLayerSpreadFactor = useCanvasStore((s) => s.setLayerSpreadFactor)

  // Multi-character dialogue state
  const multiCharacters = useMultiCharacterStore((s) => s.characters)
  const activeDialogueCharId = useMultiCharacterStore((s) => s.activeCharacterId)
  const selectDialogueCharacter = useMultiCharacterStore((s) => s.selectDialogueCharacter)
  const addDialogueCharacter = useMultiCharacterStore((s) => s.addDialogueCharacter)
  const isMultiCharacterMode = multiCharacters.length > 0
  // If any dialogue character uses rigged mode, fall back to DOM rendering for all
  // characters so RigPlaybackViewer bone animations work. PixiMultiCharacterLayer only
  // supports sprite-based rendering (no bone deformation pipeline).
  const hasRiggedCharacters = multiCharacters.some((c) => c.renderMode === 'rigged')

  // Saved characters store for drag-and-drop
  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const selectSavedCharacter = useSavedCharactersStore((s) => s.selectCharacter)

  // Media store for drop handling + deselection
  const addMediaToCanvas = useMediaStore((s) => s.addToCanvas)
  const setSelectedCanvasItemId = useMediaStore((s) => s.setSelectedCanvasItemId)

  // Text overlay deselection
  const setSelectedTextId = useTextOverlayStore((s) => s.setSelectedId)

  // Shape deselection
  const setSelectedShapeId = useShapeStore((s) => s.setSelectedShapeId)

  // Video deselection
  const setSelectedVideoId = useVideoLayerStore((s) => s.setSelectedVideoId)

  // Art curve deselection
  const setSelectedArtCurveId = useArtCurveStore((s) => s.setSelectedCompositionId)

  // HTML template deselection
  const setSelectedTemplateId = useHTMLTemplateLayerStore((s) => s.setSelectedTemplateId)

  // SVG object deselection
  const selectSVGObject = useSVGObjectStore((s) => s.selectObject)

  // Animation deselection
  const setSelectedActiveId = useAnimationStore((s) => s.setSelectedActiveId)

  // Pixel art character deselection
  const selectPixelArtCharacter = usePixelArtCharacterStore((s) => s.selectPixelArtCharacter)

  // 3D character store for drop handling + lazy-load gating
  const add3DCharacter = use3DCharacterStore((s) => s.add3DCharacter)
  const has3DCharacters = use3DCharacterStore((s) => s.characters.length > 0)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)

  // Record mode indicator
  const isRecordMode = useKeyframeStore((s) => s.isRecordMode)

  // Virtual camera — live preview transforms
  const cameraEnabled = useCameraStore((s) => s.enabled)

  // Rig mode for bone overlay (only in rig editing mode — playback uses RigPlaybackViewer's built-in overlay)
  const isRigMode = useRigStore((s) => s.isRigMode)
  const activeRig = useRigStore((s) => (s.activeRigId ? s.rigs[s.activeRigId] : null))

  // Character position in logical canvas coords (for bone overlay alignment)
  const charGroupTransform = useCharacterPartsStore((s) => s.transforms.group)

  // Compute BoneOverlay offset and scale.
  // In multi-character dialogue mode the character uses pixel-based positioning
  // with a fixed BASE_CHARACTER_SIZE (200) × scale, so the image-pixel → logical mapping
  // is completely different from the single-character percentage-based model.
  const boneOverlayProps = (() => {
    if (!activeRig) return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 }

    const BASE_CHARACTER_SIZE = 200

    if (isMultiCharacterMode && activeDialogueCharId) {
      // Find the active dialogue character that owns this rig
      const dChar = multiCharacters.find((c) => c.id === activeDialogueCharId)
      if (dChar) {
        const displayW = BASE_CHARACTER_SIZE * dChar.scale
        const displayH = BASE_CHARACTER_SIZE * dChar.scale
        // Image-pixel → logical: scale image dimensions into the displayW×displayH box
        const sx = displayW / activeRig.imageWidth
        const sy = displayH / activeRig.imageHeight
        // Top-left of the character box in logical canvas space
        const ox = dChar.position.x - displayW / 2
        const oy = dChar.position.y - displayH / 2
        return { offsetX: ox, offsetY: oy, scaleX: sx, scaleY: sy }
      }
    }

    // Single-character mode: CSS positions at center (gx, gy), image renders at native size × scale
    const gx = charGroupTransform.x
    const gy = charGroupTransform.y
    const sx = charGroupTransform.scaleX
    const sy = charGroupTransform.scaleY
    return {
      offsetX: gx - (activeRig.imageWidth * sx) / 2,
      offsetY: gy - (activeRig.imageHeight * sy) / 2,
      scaleX: sx,
      scaleY: sy,
    }
  })()

  // Coordinate audio playback for multi-character dialogue lines
  useDialoguePlayback()

  // Apply keyframe interpolation during playback/scrub
  useKeyframePlayback()

  // Apply real-time webcam face tracking to characters (Perform mode)
  useMotionTracking()

  // Apply audio-reactive property overrides during live preview
  useAudioReactivePreview()

  const ratio = aspectRatioValues[aspectRatio]
  const dimensions = canvasDimensions[aspectRatio]

  // Update canvas dimensions when aspect ratio changes
  useEffect(() => {
    setCanvasDimensions(dimensions.width, dimensions.height)
  }, [dimensions.width, dimensions.height, setCanvasDimensions])

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement
        if (parent) {
          setContainerSize({
            width: parent.clientWidth,
            height: parent.clientHeight,
          })
        }
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Close aspect ratio dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (aspectDropdownRef.current && !aspectDropdownRef.current.contains(e.target as Node)) {
        setAspectDropdownOpen(false)
      }
    }
    if (aspectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [aspectDropdownOpen])

  // Calculate canvas display size to fit container while maintaining aspect ratio
  const calculateCanvasSize = () => {
    const maxWidth = containerSize.width - 32 // padding
    const maxHeight = containerSize.height - 32

    let width = maxWidth
    let height = width / ratio

    if (height > maxHeight) {
      height = maxHeight
      width = height * ratio
    }

    return { width, height }
  }

  const canvasSize = calculateCanvasSize()

  // Scale factor from logical canvas dimensions to display-fitted size.
  // All child layers render in logical coordinates (matching Remotion export);
  // this CSS scale shrinks them to fit the viewport.
  const logicalToDisplayScale = canvasSize.width / dimensions.width

  // Fit canvas to fill the container area at maximum visible size
  const fitToView = useCallback(() => {
    setCanvasZoom(1)
    setCanvasPan(0, 0)
  }, [setCanvasZoom, setCanvasPan])

  // Store latest zoom/pan/3D values in refs so the native wheel handler always sees current state
  const zoomRef = useRef(canvasZoom)
  const panXRef = useRef(canvasPanX)
  const panYRef = useRef(canvasPanY)
  const is3DViewRef = useRef(is3DView)
  const spreadRef = useRef(layerSpreadFactor)
  useEffect(() => {
    zoomRef.current = canvasZoom
  }, [canvasZoom])
  useEffect(() => {
    panXRef.current = canvasPanX
  }, [canvasPanX])
  useEffect(() => {
    panYRef.current = canvasPanY
  }, [canvasPanY])
  useEffect(() => {
    is3DViewRef.current = is3DView
  }, [is3DView])
  useEffect(() => {
    spreadRef.current = layerSpreadFactor
  }, [layerSpreadFactor])

  // Attach a non-passive native wheel listener so we can preventDefault on Ctrl+scroll
  // (React's onWheel is passive by default and can't block browser zoom)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (is3DViewRef.current) {
        // In 3D mode: Ctrl+scroll adjusts layer spread, normal scroll adjusts zoom
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const delta = -e.deltaY * 0.003
          const newSpread = Math.max(0.2, Math.min(3.0, spreadRef.current + delta))
          setLayerSpreadFactor(newSpread)
        } else {
          e.preventDefault()
          const delta = -e.deltaY * 0.002
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current + delta))
          setCanvasZoom(newZoom)
        }
      } else {
        // 2D mode: existing behavior
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const delta = -e.deltaY * 0.002
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current + delta))
          setCanvasZoom(newZoom)
        } else if (e.shiftKey) {
          e.preventDefault()
          setCanvasPan(panXRef.current - e.deltaY, panYRef.current)
        } else {
          if (zoomRef.current > 1) {
            e.preventDefault()
            setCanvasPan(panXRef.current - e.deltaX, panYRef.current - e.deltaY)
          }
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [setCanvasZoom, setCanvasPan, setLayerSpreadFactor])

  // Middle-mouse-button drag for panning (2D mode)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const isHandTool = useWhiteboardStore.getState().enabled && useWhiteboardStore.getState().activeBrush === 'hand'

      if (is3DView && e.button === 0) {
        // Left-click drag to orbit in 3D mode
        e.preventDefault()
        setIsOrbiting(true)
        orbitStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          rotX: orbitRotationX,
          rotY: orbitRotationY,
        }
      } else if (e.button === 1 || (e.button === 0 && isHandTool)) {
        // Middle mouse button or hand tool — pan
        e.preventDefault()
        setIsPanning(true)
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: canvasPanX,
          panY: canvasPanY,
        }
      }
    },
    [is3DView, orbitRotationX, orbitRotationY, canvasPanX, canvasPanY],
  )

  // Pan drag (2D)
  useEffect(() => {
    if (!isPanning) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setCanvasPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy)
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    // Also stop panning if window loses focus (tab switch, alt-tab, etc.)
    const handleBlur = () => setIsPanning(false)
    const handleVisibilityChange = () => {
      if (document.hidden) setIsPanning(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPanning, setCanvasPan])

  // Orbit drag (3D)
  useEffect(() => {
    if (!isOrbiting) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - orbitStartRef.current.x
      const dy = e.clientY - orbitStartRef.current.y
      const sensitivity = 0.3
      const newRotY = orbitStartRef.current.rotY + dx * sensitivity
      const newRotX = orbitStartRef.current.rotX - dy * sensitivity
      setOrbitRotation(newRotX, newRotY)
    }

    const handleMouseUp = () => {
      setIsOrbiting(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isOrbiting, setOrbitRotation])

  // ── Marquee selection ──────────────────────────────────────────────────
  const handleMarqueeStart = useCallback(
    (e: React.MouseEvent) => {
      if (is3DView || e.button !== 0) return

      // Don't start marquee if hand tool is active (panning instead)
      const wbState = useWhiteboardStore.getState()
      if (wbState.enabled && (wbState.activeBrush === 'hand' || wbState.drawingActive)) return

      // Don't start marquee if clicking on an interactive canvas element.
      // Check the click target and ancestors for: data-canvas-element attribute,
      // Moveable control handles, or elements with cursor-move/cursor-pointer class.
      let el = e.target as HTMLElement | null
      const canvasRoot = e.currentTarget as HTMLElement
      while (el && el !== canvasRoot) {
        if (
          el.dataset.canvasElement ||
          el.classList.contains('moveable-control-box') ||
          el.classList.contains('moveable-control') ||
          el.classList.contains('moveable-line') ||
          el.classList.contains('moveable-rotation') ||
          el.classList.contains('cursor-move') ||
          el.classList.contains('cursor-pointer')
        )
          return
        el = el.parentElement
      }

      const canvasEl = marqueeCanvasRef.current
      if (!canvasEl) return

      const rect = canvasEl.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * dimensions.width
      const y = ((e.clientY - rect.top) / rect.height) * dimensions.height

      setMarquee({ startX: x, startY: y, currentX: x, currentY: y })
    },
    [is3DView, dimensions.width, dimensions.height],
  )

  // Attach mousemove/mouseup listeners only when marquee starts (marquee goes from null → non-null).
  // Use a ref for the latest marquee value so the mouseup handler always reads the current position.
  const marqueeActiveRef = useRef(false)

  useEffect(() => {
    const isActive = marquee !== null
    const wasActive = marqueeActiveRef.current
    marqueeActiveRef.current = isActive

    // Only attach listeners on the null→active transition
    if (!isActive || wasActive) return

    const canvasEl = marqueeCanvasRef.current
    if (!canvasEl) return

    const canvasRect = canvasEl.getBoundingClientRect()

    const handleMouseMove = (e: MouseEvent) => {
      const x = ((e.clientX - canvasRect.left) / canvasRect.width) * dimensions.width
      const y = ((e.clientY - canvasRect.top) / canvasRect.height) * dimensions.height
      setMarquee((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null))
    }

    const handleMouseUp = () => {
      const m = marqueeRef.current
      if (!m) {
        setMarquee(null)
        return
      }

      // Compute marquee rect in screen coordinates
      const scaleX = canvasRect.width / dimensions.width
      const scaleY = canvasRect.height / dimensions.height

      const marqueeScreen = {
        left: canvasRect.left + Math.min(m.startX, m.currentX) * scaleX,
        top: canvasRect.top + Math.min(m.startY, m.currentY) * scaleY,
        right: canvasRect.left + Math.max(m.startX, m.currentX) * scaleX,
        bottom: canvasRect.top + Math.max(m.startY, m.currentY) * scaleY,
      }

      const mWidth = marqueeScreen.right - marqueeScreen.left
      const mHeight = marqueeScreen.bottom - marqueeScreen.top

      // Only process if the user actually dragged (not just clicked)
      if (mWidth > 3 && mHeight > 3) {
        // DOM-based hit testing: find all interactive canvas elements
        const candidates = canvasEl.querySelectorAll<HTMLElement>(
          '.absolute.cursor-move, .absolute.cursor-pointer, [data-canvas-element]',
        )

        let bestElement: HTMLElement | null = null
        let bestZIndex = -Infinity

        for (const el of candidates) {
          const elRect = el.getBoundingClientRect()
          if (elRect.width < 2 || elRect.height < 2) continue

          // Check intersection in screen coordinates
          const intersects = !(
            elRect.right < marqueeScreen.left ||
            elRect.left > marqueeScreen.right ||
            elRect.bottom < marqueeScreen.top ||
            elRect.top > marqueeScreen.bottom
          )

          if (intersects) {
            const z = parseInt(getComputedStyle(el).zIndex) || 0
            if (z >= bestZIndex) {
              bestZIndex = z
              bestElement = el
            }
          }
        }

        if (bestElement) {
          bestElement.click()
        }
      }

      setMarquee(null)
      // Clean up listeners
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marquee !== null, dimensions.width, dimensions.height])

  // ── Drop handlers for media from panels ──────────────────────────────
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes('application/x-media-asset') ||
      e.dataTransfer.types.includes('application/x-saved-character') ||
      e.dataTransfer.types.includes('application/x-saved-3d-character')
    ) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setIsDragOver(true)
    }
  }, [])

  const handleCanvasDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      // Handle media asset drop
      const mediaData = e.dataTransfer.getData('application/x-media-asset')
      if (mediaData) {
        try {
          const { id } = JSON.parse(mediaData)
          addMediaToCanvas(id)
        } catch {
          // ignore invalid data
        }
        return
      }

      // Handle saved 3D character drop
      const char3DData = e.dataTransfer.getData('application/x-saved-3d-character')
      if (char3DData) {
        try {
          const { id: savedChar3DId } = JSON.parse(char3DData)
          const savedChar3D = saved3DCharacters.find((c) => c.id === savedChar3DId)
          if (!savedChar3D) return

          add3DCharacter({
            name: savedChar3D.name,
            saved3DCharacterId: savedChar3D.id,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: 1,
            zIndex: 0,
            visible: true,
            locked: false,
            activeAnimationId: null,
            animationSpeed: 1,
            voiceId: null,
            color: '',
          })
        } catch {
          // ignore invalid data
        }
        return
      }

      // Handle saved character drop
      const charData = e.dataTransfer.getData('application/x-saved-character')
      if (charData) {
        try {
          const { id: savedCharId } = JSON.parse(charData)
          const savedChar = savedCharacters.find((c) => c.id === savedCharId)
          if (!savedChar) return

          // Calculate drop position in logical canvas pixels (e.g. 0-1920 for x on 16:9)
          const canvasEl = e.currentTarget as HTMLElement
          const rect = canvasEl.getBoundingClientRect()
          const dropX = ((e.clientX - rect.left) / rect.width) * dimensions.width
          const dropY = ((e.clientY - rect.top) / rect.height) * dimensions.height

          // Create a dialogue character linked to the saved character
          const newId = addDialogueCharacter({
            name: savedChar.name,
            savedCharacterId: savedChar.id,
            position: { x: Math.round(dropX), y: Math.round(dropY) },
            scale: 1,
            zIndex: multiCharacters.length,
            visible: true,
            locked: false,
            voiceId: null,
            color: '',
          })

          // Select both the saved character and the new dialogue character
          selectSavedCharacter(savedChar.id)
          selectDialogueCharacter(newId)
        } catch {
          // ignore invalid data
        }
      }
    },
    [
      addMediaToCanvas,
      savedCharacters,
      saved3DCharacters,
      add3DCharacter,
      addDialogueCharacter,
      multiCharacters.length,
      selectSavedCharacter,
      selectDialogueCharacter,
      dimensions.width,
      dimensions.height,
    ],
  )

  const handleCanvasClick = (e?: React.MouseEvent) => {
    if (is3DView) return // No selection changes in 3D mode
    selectCharacter(null)
    if (isMultiCharacterMode) {
      selectDialogueCharacter(null)
    }
    // Deselect text overlays, media items, shapes, art curves, HTML templates, and SVG objects
    setSelectedTextId(null)
    setSelectedCanvasItemId(null)
    setSelectedShapeId(null)
    setSelectedVideoId(null)
    setSelectedArtCurveId(null)
    setSelectedTemplateId(null)
    useMotionGraphicStore.getState().setSelectedInstanceId(null)
    selectSVGObject(null)
    setSelectedActiveId(null)
    selectPixelArtCharacter(null)
    // Deselect whiteboard items
    useWhiteboardStore.getState().setSelectedTextItemId(null)
    useWhiteboardStore.getState().setSelectedStrokeId(null)

    // Check if click is near any whiteboard stroke (for stroke selection)
    if (e && useWhiteboardStore.getState().enabled && useWhiteboardStore.getState().activeBrush === 'cursor') {
      const canvasEl = e.currentTarget as HTMLElement
      const rect = canvasEl.getBoundingClientRect()
      const clickX = ((e.clientX - rect.left) / rect.width) * dimensions.width
      const clickY = ((e.clientY - rect.top) / rect.height) * dimensions.height
      const threshold = 15

      const strokes = useWhiteboardStore.getState().config.strokes
      for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i]
        const match = stroke.path.match(/-?[0-9]*\.?[0-9]+/g)
        if (!match || match.length < 2) continue
        for (let j = 0; j < match.length - 1; j += 2) {
          const sx = parseFloat(match[j])
          const sy = parseFloat(match[j + 1])
          if (Math.hypot(clickX - sx, clickY - sy) < threshold) {
            useWhiteboardStore.getState().setSelectedStrokeId(stroke.id)
            const { setRightPanelTab } = useEditorStore.getState()
            setRightPanelTab('whiteboard-stroke-properties')
            return // stop at first (topmost) hit
          }
        }
      }
    }

    // Empty canvas click → show background color tab
    useEditorStore.getState().setRightPanelTab('whiteboard-bg-color')
  }

  const handleFullscreen = () => {
    const canvas = document.querySelector('.video-canvas-container')
    if (canvas) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        canvas.requestFullscreen()
      }
    }
  }

  const zoomIn = () => setCanvasZoom(Math.min(ZOOM_MAX, canvasZoom + ZOOM_STEP))
  const zoomOut = () => setCanvasZoom(Math.max(ZOOM_MIN, canvasZoom - ZOOM_STEP))
  const zoomPercent = Math.round(canvasZoom * 100)

  // FPS counter extracted to isolated component to avoid re-rendering the entire canvas tree

  // Determine cursor based on mode
  const wbEnabled = useWhiteboardStore((s) => s.enabled)
  const wbToggleEnabled = useWhiteboardStore((s) => s.toggleEnabled)
  const wbActiveBrush = useWhiteboardStore((s) => s.activeBrush)
  const getCursor = () => {
    if (is3DView) return isOrbiting ? 'grabbing' : 'grab'
    if (isPanning) return 'grabbing'
    if (wbEnabled && wbActiveBrush === 'hand') return 'grab'
    return undefined
  }

  return (
    <div
      className="flex-1 min-h-0 flex flex-col video-canvas-container"
      style={{ backgroundColor: 'var(--canvas-wrapper-bg)' }}
    >
      {/* Top Bar: Aspect Ratio Dropdown + Canvas Zoom + Fullscreen */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--canvas-topbar-border)' }}
      >
        {/* Left: Aspect Ratio Dropdown */}
        <div ref={aspectDropdownRef} className="relative">
          <button
            onClick={() => setAspectDropdownOpen(!aspectDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors"
          >
            <span className="text-green-400">{aspectRatio}</span>
            <ChevronDown
              size={14}
              className={`text-zinc-500 transition-transform ${aspectDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {aspectDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[100px]">
              {aspectRatios.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setAspectRatio(r)
                    setAspectDropdownOpen(false)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                    r === aspectRatio
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: AI Director + Copilot */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleCanvasOverlay('ai-director')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeCanvasOverlay === 'ai-director'
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
            title="AI Director"
          >
            <Clapperboard size={14} />
            <span>AI Director</span>
          </button>
          <button
            onClick={copilotToggle}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              copilotIsOpen
                ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
            title="AI Copilot (⌘K)"
          >
            <Bot size={14} />
            <span>Copilot</span>
            {copilotPhase === 'thinking' && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right: Zoom + 3D View + Fit to View + Fullscreen */}
        <div className="flex items-center gap-1">
          {/* Zoom Controls — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={zoomOut}
              disabled={canvasZoom <= ZOOM_MIN}
              className="flex items-center justify-center w-7 h-7 rounded text-zinc-400 hover:bg-zinc-700/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom out"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span
              className="text-xs text-zinc-400 font-mono w-10 text-center cursor-pointer hover:text-white transition-colors"
              onClick={resetCanvasView}
              title="Reset to 100%"
            >
              {zoomPercent}%
            </span>
            <button
              onClick={zoomIn}
              disabled={canvasZoom >= ZOOM_MAX}
              className="flex items-center justify-center w-7 h-7 rounded text-zinc-400 hover:bg-zinc-700/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom in"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div className="w-px h-4 bg-zinc-700 mx-0.5" />
            {/* 3D View Toggle */}
            <button
              onClick={toggle3DView}
              className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
                is3DView
                  ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
                  : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
              }`}
              title={is3DView ? 'Exit 3D layer view (3)' : '3D layer view (3)'}
            >
              <Layers size={14} />
            </button>

            {/* Reset orbit (only in 3D mode) */}
            {is3DView && (
              <button
                onClick={resetOrbitRotation}
                className="px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                title="Reset 3D rotation"
              >
                Reset
              </button>
            )}

            {/* Whiteboard Toggle */}
            <button
              onClick={wbToggleEnabled}
              className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
                wbEnabled
                  ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                  : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
              }`}
              title={wbEnabled ? 'Disable whiteboard mode' : 'Enable whiteboard mode'}
            >
              <PenTool size={14} />
            </button>

            <button
              onClick={fitToView}
              className="flex items-center justify-center w-7 h-7 rounded text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition-colors"
              title="Fit to view"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 5V2a1 1 0 011-1h3M9 1h3a1 1 0 011 1v3M13 9v3a1 1 0 01-1 1H9M5 13H2a1 1 0 01-1-1V9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={handleFullscreen}
            className="flex items-center justify-center w-7 h-7 rounded text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden relative rounded-xl"
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        style={{
          backgroundColor: 'var(--canvas-viewport-bg)',
          cursor: getCursor(),
          perspective: is3DView ? '1200px' : undefined,
        }}
      >
        {/* Canvas Overlay System */}
        {activeCanvasOverlay && <CanvasOverlayRouter overlayId={activeCanvasOverlay} onClose={closeCanvasOverlay} />}
        <div
          style={{
            transform: is3DView
              ? `scale(${canvasZoom * 0.7}) rotateX(${orbitRotationX}deg) rotateY(${orbitRotationY}deg)`
              : `scale(${canvasZoom}) translate(${canvasPanX / canvasZoom}px, ${canvasPanY / canvasZoom}px)`,
            transformOrigin: 'center center',
            transformStyle: is3DView ? 'preserve-3d' : undefined,
            transition: isPanning || isOrbiting ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          <div
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            <div
              ref={marqueeCanvasRef}
              data-export-canvas
              className={`relative ${isDragOver ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-900' : ''}`}
              style={{
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: 'var(--color-surface-low)',
                transform: `scale(${logicalToDisplayScale})`,
                transformOrigin: 'top left',
                transformStyle: is3DView ? 'preserve-3d' : undefined,
              }}
              onClick={handleCanvasClick}
              onMouseDown={handleMarqueeStart}
              onDragOver={is3DView ? undefined : handleCanvasDragOver}
              onDragLeave={is3DView ? undefined : handleCanvasDragLeave}
              onDrop={is3DView ? undefined : handleCanvasDrop}
            >
              {/* SVG filter definitions for boiling-line hand-drawn effect */}
              <BoilingLineFilters />
              {/* SVG filter definitions for style effects (woodcut, cel-shade, etc.) */}
              <StyleEffectFilters />

              {/* Canvas content (no overflow clip — objects beyond bounds are visible) */}
              <div
                className="absolute inset-0"
                style={{
                  overflow: 'visible',
                  transformStyle: is3DView ? 'preserve-3d' : undefined,
                  pointerEvents: is3DView ? 'none' : undefined,
                }}
              >
                {/* Virtual Camera Transform — wraps all layers for live preview zoom/pan/rotation */}
                <CameraPreviewWrapper
                  enabled={cameraEnabled}
                  canvasWidth={dimensions.width}
                  canvasHeight={dimensions.height}
                  is3DView={is3DView}
                >
                  <PanelErrorBoundary panelName="Canvas Layers">
                    {/* PixiJS Canvas (WebGL2 — renders media sprites when enabled) */}
                    {usePixiRenderer && !is3DView && <PixiCanvas width={dimensions.width} height={dimensions.height} />}

                    {/* Grid / checkerboard background */}
                    <Layer3DWrapper
                      order={1}
                      zIndex={0}
                      label="Grid"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `
                        linear-gradient(to right, #3f3f46 1px, transparent 1px),
                        linear-gradient(to bottom, #3f3f46 1px, transparent 1px)
                      `,
                          backgroundSize: '20px 20px',
                        }}
                      />
                    </Layer3DWrapper>

                    {/* Background Lottie Animations (z-index: -1) */}
                    <Layer3DWrapper
                      order={0}
                      zIndex={-1}
                      label="BG Lottie"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <LottieLayers type="background" canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Whiteboard background — always visible, independent of whiteboard toggle */}
                    <Layer3DWrapper
                      order={0.4}
                      zIndex={0}
                      label="WB Background"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <WhiteboardBackground canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Whiteboard strokes + hand (z-index: 0 — behind everything except BG) */}
                    <Layer3DWrapper
                      order={0.5}
                      zIndex={0}
                      label="Whiteboard"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <WhiteboardLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                      <WhiteboardTextItemLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                      <WhiteboardDrawingOverlay canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* HTML Template iframes (z-index: 1) */}
                    <Layer3DWrapper
                      order={2}
                      zIndex={1}
                      label="HTML Templates"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <HTMLTemplateLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* React Motion Graphics (z-index: 1.5 — above HTML templates) */}
                    <Layer3DWrapper
                      order={2.5}
                      zIndex={1.5}
                      label="Motion Graphics"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <MotionGraphicLayer />
                    </Layer3DWrapper>

                    {/* Art Curves (z-index: 6.3 — between shapes and SVG objects) */}
                    <Layer3DWrapper
                      order={6.3}
                      zIndex={6.3}
                      label="Art Curves"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <ArtCurveLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* SVG Object Animation (z-index: 6.5 — above everything except characters, text, captions) */}
                    <Layer3DWrapper
                      order={6.5}
                      zIndex={6.5}
                      label="SVG Objects"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <SVGObjectLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Media Images (z-index: 5) */}
                    {usePixiRenderer && !is3DView ? (
                      /* PixiJS mode: media rendered on WebGL canvas, proxies provide Moveable handles */
                      <MediaMoveableProxies />
                    ) : (
                      <Layer3DWrapper
                        order={5}
                        zIndex={5}
                        label="Media"
                        is3DView={is3DView}
                        spreadFactor={layerSpreadFactor}
                      >
                        <MediaLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                      </Layer3DWrapper>
                    )}

                    {/* Shapes (z-index: 6) */}
                    {usePixiRenderer && !is3DView ? (
                      <ShapeMoveableProxies />
                    ) : (
                      <Layer3DWrapper
                        order={6}
                        zIndex={6}
                        label="Shapes"
                        is3DView={is3DView}
                        spreadFactor={layerSpreadFactor}
                      >
                        <ShapeLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                      </Layer3DWrapper>
                    )}

                    {/* Crowd / Background Characters (z-index: 4) */}
                    <Layer3DWrapper
                      order={3.5}
                      zIndex={4}
                      label="Crowd"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <CrowdLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* AI Animation Videos (z-index: 3) */}
                    <Layer3DWrapper
                      order={4}
                      zIndex={3}
                      label="Video"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <VideoLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Character Rendering */}
                    {usePixiRenderer && !is3DView && !isRigMode && !hasRiggedCharacters ? (
                      /* PixiJS mode: characters rendered on GPU canvas, proxies provide selection/drag handles.
                   Falls back to DOM when any character uses rigged mode (bone deformation not supported
                   in PixiMultiCharacterLayer). */
                      <CharacterMoveableProxies />
                    ) : (
                      <Layer3DWrapper
                        order={7}
                        zIndex={7}
                        label="Characters"
                        is3DView={is3DView}
                        spreadFactor={layerSpreadFactor}
                      >
                        {isMultiCharacterMode ? (
                          multiCharacters.map((dChar) => (
                            <MultiCharacterLayer
                              key={dChar.id}
                              character={dChar}
                              isSelected={activeDialogueCharId === dChar.id}
                              containerWidth={dimensions.width}
                              containerHeight={dimensions.height}
                            />
                          ))
                        ) : (
                          <CharacterComposite
                            isSelected={selectedCharacterId === 'composite'}
                            containerWidth={dimensions.width}
                            containerHeight={dimensions.height}
                          />
                        )}
                      </Layer3DWrapper>
                    )}

                    {/* Pixel Art Characters (z-index: 7.25 — between 2D and 3D characters) */}
                    <Layer3DWrapper
                      order={7.25}
                      zIndex={7.25}
                      label="Pixel Art"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <PixelArtCharacterLayer />
                    </Layer3DWrapper>

                    {/* Avatar Characters (z-index: 7.3 — between pixel art and 3D characters) */}
                    <Layer3DWrapper
                      order={7.3}
                      zIndex={7.3}
                      label="Avatars"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <AvatarCharacterLayer />
                    </Layer3DWrapper>

                    {/* 3D Characters (z-index: 7.5 — between 2D characters and text) */}
                    {has3DCharacters && (
                      <Layer3DWrapper
                        order={7.5}
                        zIndex={7.5}
                        label="3D Characters"
                        is3DView={is3DView}
                        spreadFactor={layerSpreadFactor}
                      >
                        <Suspense fallback={null}>
                          <ThreeCanvas
                            canvasWidth={dimensions.width}
                            canvasHeight={dimensions.height}
                            eventSource={containerRef}
                          />
                        </Suspense>
                      </Layer3DWrapper>
                    )}

                    {/* Text Overlays (z-index: 8) */}
                    {usePixiRenderer && !is3DView ? (
                      <TextMoveableProxies />
                    ) : (
                      <Layer3DWrapper
                        order={8}
                        zIndex={8}
                        label="Text"
                        is3DView={is3DView}
                        spreadFactor={layerSpreadFactor}
                      >
                        <TextOverlayLayer
                          canvasWidth={dimensions.width}
                          canvasHeight={dimensions.height}
                          logicalWidth={dimensions.width}
                        />
                      </Layer3DWrapper>
                    )}

                    {/* Annotations (z-index: 9 -- between text and overlay lottie) */}
                    <Layer3DWrapper
                      order={8.5}
                      zIndex={9}
                      label="Annotations"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <AnnotationLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Whiteboard strokes — kept as reference, now rendered at bottom */}

                    {/* Particle Effects (z-index: 9.5 — above annotations, below overlay lottie) */}
                    <Layer3DWrapper
                      order={8.75}
                      zIndex={9.5}
                      label="Particles"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <ParticleLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Audio-Reactive Visualizers (z-index: 9.75 — above particles, below overlay lottie) */}
                    <Layer3DWrapper
                      order={8.9}
                      zIndex={9.75}
                      label="Audio Reactive"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <AudioReactiveLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Mixed Media Overlay (z-index: 9.8 — above audio reactive, below overlay lottie) */}
                    <Layer3DWrapper
                      order={8.95}
                      zIndex={9.8}
                      label="Mixed Media"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <MixedMediaLayer canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Overlay Lottie Animations (z-index: 10) */}
                    <Layer3DWrapper
                      order={9}
                      zIndex={10}
                      label="Overlay Lottie"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <LottieLayers type="overlay" canvasWidth={dimensions.width} canvasHeight={dimensions.height} />
                    </Layer3DWrapper>

                    {/* Audio Playback (hidden, synced with timeline) */}
                    <AudioLayer />

                    {/* Caption Overlay — rendered on PixiJS canvas when enabled, otherwise DOM */}
                    {!(usePixiRenderer && !is3DView) && (
                      <Layer3DWrapper
                        order={11}
                        zIndex={20}
                        label="Captions"
                        is3DView={is3DView}
                        spreadFactor={layerSpreadFactor}
                      >
                        <CaptionOverlay />
                      </Layer3DWrapper>
                    )}

                    <Layer3DWrapper
                      order={12}
                      zIndex={21}
                      label="RetentionHooks"
                      is3DView={is3DView}
                      spreadFactor={layerSpreadFactor}
                    >
                      <RetentionHookLayer />
                    </Layer3DWrapper>
                  </PanelErrorBoundary>
                </CameraPreviewWrapper>

                {/* Bone Overlay for 2D Rigging — rendered LAST so it receives pointer events above all other layers */}
                {isRigMode && (
                  <BoneOverlay
                    canvasWidth={dimensions.width}
                    canvasHeight={dimensions.height}
                    logicalWidth={dimensions.width}
                    logicalHeight={dimensions.height}
                    offsetX={boneOverlayProps.offsetX}
                    offsetY={boneOverlayProps.offsetY}
                    scaleX={boneOverlayProps.scaleX}
                    scaleY={boneOverlayProps.scaleY}
                  />
                )}

                {/* Path Editor Overlay */}
                <PathEditorOverlayWrapper />

                {/* Mask Editor Overlay */}
                <MaskEditorOverlayWrapper />
              </div>

              {/* Marquee selection rectangle */}
              {marquee && (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(marquee.startX, marquee.currentX),
                    top: Math.min(marquee.startY, marquee.currentY),
                    width: Math.abs(marquee.currentX - marquee.startX),
                    height: Math.abs(marquee.currentY - marquee.startY),
                    border: '1px solid rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 50,
                  }}
                />
              )}

              {/* UI Overlays — hidden in 3D mode */}
              {!is3DView && (
                <>
                  {/* Pasteboard overlay — dims the area outside the canvas bounds using box-shadow */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      boxShadow: '0 0 0 9999px rgba(24, 24, 27, 0.75)',
                      zIndex: 40,
                    }}
                  />

                  {/* Canvas border */}
                  <div
                    className={`absolute inset-0 rounded-lg pointer-events-none border ${
                      isRecordMode ? 'border-red-500/60' : 'border-zinc-700/50'
                    }`}
                    style={{ zIndex: 41 }}
                  />

                  {/* FPS Counter — isolated to avoid re-rendering canvas tree */}
                  <FpsCounter />

                  {/* Record mode indicator */}
                  {isRecordMode && (
                    <div
                      className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded text-red-400 text-[10px] font-bold pointer-events-none select-none"
                      style={{ zIndex: 42 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      REC
                    </div>
                  )}

                  {/* Drop indicator overlay */}
                  {isDragOver && (
                    <div className="absolute inset-0 bg-green-500/10 border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center z-50 pointer-events-none">
                      <div className="bg-black/60 px-4 py-2 rounded-lg">
                        <span className="text-green-400 text-sm font-medium">Drop to add to canvas</span>
                      </div>
                    </div>
                  )}

                  {/* Safe Area Guide */}
                  <div
                    className="absolute inset-[5%] border border-dashed border-zinc-700/30 rounded pointer-events-none"
                    style={{ zIndex: 42 }}
                  />

                  {/* Center Crosshair */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ zIndex: 42 }}
                  >
                    <div className="w-4 h-px bg-zinc-600/50" />
                    <div className="w-px h-4 bg-zinc-600/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </>
              )}

              {/* 3D mode: subtle canvas outline for spatial reference */}
              {is3DView && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none border border-zinc-600/30"
                  style={{ zIndex: 0 }}
                />
              )}
            </div>
          </div>
          {/* close layout wrapper for logical-to-display scale */}

          {/* Whiteboard toolbar — outside the scaled canvas so it's at 1:1 size */})
          <WhiteboardToolbar />
        </div>
      </div>

      {/* Custom context menu */}
      {contextMenu && <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} />}
    </div>
  )
}
