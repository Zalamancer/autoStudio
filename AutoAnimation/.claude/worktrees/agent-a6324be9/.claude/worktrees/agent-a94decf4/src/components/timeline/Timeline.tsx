import { useRef, useState, useCallback, memo } from 'react'
import { Plus } from 'lucide-react'
import { useTimelineStore, useVoiceStore } from '@/stores'
import { TimelineControls } from './TimelineControls'
import { ZoomControls } from './ZoomControls'
import { TimeRuler } from './TimeRuler'
import { Track } from './Track'
import { Playhead } from './Playhead'
import { DialogueTrack } from './DialogueTrack'
import { ScriptSegmentTrack } from './ScriptSegmentTrack'
import { SVGObjectTrack } from './SVGObjectTrack'
import { KeyframeTrack } from './KeyframeTrack'
import { MediaTrack } from './MediaTrack'
import { TextOverlayTrack } from './TextOverlayTrack'
import { LottieTrack } from './LottieTrack'
import { ShapeTrack } from './ShapeTrack'
import { HTMLTemplateTrack } from './HTMLTemplateTrack'
import { Character3DTrack } from './Character3DTrack'
import { PixelArtCharacterTrack } from './PixelArtCharacterTrack'
import { BonePoseTrack } from './BonePoseTrack'
import { CameraTrack } from './CameraTrack'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { useCameraStore } from '@/stores/useCameraStore'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { WhiteboardStrokeTrack } from './WhiteboardStrokeTrack'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'

export const Timeline = memo(function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Drag-and-drop reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null)

  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const zoom = useTimelineStore((s) => s.zoom)
  const tracks = useTimelineStore((s) => s.tracks)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)
  const addTrack = useTimelineStore((s) => s.addTrack)
  const reorderTracks = useTimelineStore((s) => s.reorderTracks)
  const script = useVoiceStore((s) => s.script)
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)

  const pixelsPerFrame = (100 * zoom) / fps
  const totalWidth = totalFrames * pixelsPerFrame

  // Emotion track removed — emotion data is now shown per-character in the Head sub-track
  const emotionTrackHeight = 0

  // Determine dialogue tracks height: 1 main row per character with lines + up to 4 sub-tracks when expanded.
  // We use the collapsed height (1 row per character) as the base — sub-tracks expand dynamically.
  const charsWithLines = dialogueCharacters.filter((c) => dialogueLines.some((l) => l.characterId === c.id)).length
  const dialogueTrackHeight = charsWithLines * 40

  // Determine script segment track height (40px per segment)
  // A segment exists when the script has at least one [expression] cue
  const hasCues = script && /\[([\w-]+)\]/.test(script)
  const scriptSegmentCount = hasCues
    ? (script.match(/\[([\w-]+)\]/g) || []).length + (script.trimStart().startsWith('[') ? 0 : 1)
    : 0
  const scriptSegmentTrackHeight = scriptSegmentCount > 1 ? scriptSegmentCount * 40 : 0

  // Determine SVG object track height (40px per object)
  const svgObjectCount = useSVGObjectStore((s) => s.composition?.objects.length ?? 0)
  const svgObjectTrackHeight = svgObjectCount * 40

  // Determine keyframe track height (40px per object with keyframes)
  // Derive count from s.tracks instead of calling getAllObjectsWithKeyframes()
  // which returns a new array and breaks Zustand's referential equality check.
  const keyframeObjectCount = useKeyframeStore((s) => {
    const seen = new Set<string>()
    for (const track of s.tracks) {
      if (track.keyframes.length > 0) {
        seen.add(`${track.objectRef.objectType}:${track.objectRef.objectId}`)
      }
    }
    return seen.size
  })
  const keyframeTrackHeight = keyframeObjectCount * 40

  // Determine media track height (40px per canvas item — images, video, audio)
  const mediaCanvasItems = useMediaStore((s) => s.canvasItems)
  const mediaAssets = useMediaStore((s) => s.assets)
  const mediaItemCount = mediaCanvasItems.filter((item) => {
    const asset = mediaAssets.find((a) => a.id === item.assetId)
    return !!asset
  }).length
  const mediaTrackHeight = mediaItemCount * 40

  // Determine text overlay track height (40px per overlay)
  const textOverlayCount = useTextOverlayStore((s) => s.overlays.length)
  const textOverlayTrackHeight = textOverlayCount * 40

  // Determine lottie animation track height (40px per active animation)
  const lottieAnimationCount = useAnimationStore((s) => s.activeAnimations.length)
  const lottieTrackHeight = lottieAnimationCount * 40

  // Determine shape track height (40px per shape)
  const shapeCount = useShapeStore((s) => s.shapes.length)
  const shapeTrackHeight = shapeCount * 40

  // Determine HTML template track height (40px per template)
  const htmlTemplateCount = useHTMLTemplateLayerStore((s) => s.templates.length)
  const htmlTemplateTrackHeight = htmlTemplateCount * 40

  // Determine 3D character track height (40px per character)
  const character3DCount = use3DCharacterStore((s) => s.characters.length)
  const character3DTrackHeight = character3DCount * 40

  // Determine pixel art character track height (40px per character)
  const pixelArtCharacterCount = usePixelArtCharacterStore((s) => s.characters.length)
  const pixelArtCharacterTrackHeight = pixelArtCharacterCount * 40

  // Determine camera track height (40px when enabled with keyframes)
  const cameraEnabled = useCameraStore((s) => s.enabled)
  const cameraKeyframeCount = useCameraStore((s) => s.keyframes.length)
  const cameraTrackHeight = cameraEnabled && cameraKeyframeCount > 0 ? 40 : 0

  // Determine whiteboard stroke track height (40px per stroke)
  const whiteboardEnabled = useWhiteboardStore((s) => s.enabled)
  const whiteboardStrokeCount = useWhiteboardStore((s) => s.config.strokes.length)
  const whiteboardTrackHeight = whiteboardEnabled ? whiteboardStrokeCount * 40 : 0

  // Beat markers
  const beatAnalysis = useBeatSyncStore((s) => s.analysis)
  const showBeatMarkers = useBeatSyncStore((s) => s.showBeatMarkers)
  const beats = showBeatMarkers && beatAnalysis ? beatAnalysis.beats : []

  // User markers
  const markers = useTimelineStore((s) => s.markers)

  // Calculate tracks height
  const tracksHeight = tracks.reduce((sum, track) => sum + track.height, 0)

  const handleAddTrack = useCallback(() => {
    const newTrack = {
      id: `track-${Date.now()}`,
      type: 'video' as const,
      name: `Track ${tracks.length + 1}`,
      clips: [],
      locked: false,
      muted: false,
      visible: true,
      height: 48,
    }
    addTrack(newTrack)
  }, [tracks.length, addTrack])

  // --- Drag-and-drop handlers ---

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDropTargetIndex(null)
    setDropPosition(null)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'

      if (dragIndex === null || dragIndex === index) {
        // If hovering over the dragged track itself, clear indicator
        if (dragIndex === index) {
          setDropTargetIndex(null)
          setDropPosition(null)
        }
        return
      }

      // Determine if the cursor is in the top or bottom half of the track element
      const rect = e.currentTarget.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const pos = e.clientY < midY ? 'above' : 'below'

      setDropTargetIndex(index)
      setDropPosition(pos)
    },
    [dragIndex],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the track element entirely (not entering a child)
    const relatedTarget = e.relatedTarget as Node | null
    if (!e.currentTarget.contains(relatedTarget)) {
      setDropTargetIndex(null)
      setDropPosition(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()

      if (dragIndex === null || dragIndex === targetIndex) {
        handleDragEnd()
        return
      }

      // Calculate the effective toIndex based on drop position
      let toIndex = targetIndex
      if (dropPosition === 'below') {
        // If dropping below the target and source is above, the target index is correct
        // If dropping below the target and source is below, we need target + 1
        toIndex = dragIndex < targetIndex ? targetIndex : targetIndex + 1
      } else {
        // If dropping above the target and source is below, the target index is correct
        // If dropping above the target and source is above, we need target - 1... but splice handles it
        toIndex = dragIndex > targetIndex ? targetIndex : targetIndex - 1
      }

      reorderTracks(dragIndex, toIndex)
      handleDragEnd()
    },
    [dragIndex, dropPosition, reorderTracks, handleDragEnd],
  )

  return (
    <div className="h-[180px] md:h-[256px] flex-shrink-0 flex flex-col bg-zinc-800/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-2 md:px-4 py-1 md:py-2 border-b border-zinc-700/50 bg-zinc-800">
        <TimelineControls />
        <ZoomControls />
      </div>

      {/* Timeline Content */}
      <div ref={containerRef} className="flex-1 overflow-auto relative timeline-scroll">
        {/* Playhead — spans from the top of the ruler through all tracks.
            Uses sticky + height:0 so it stays visible when scrolling vertically
            and doesn't affect layout. z-20 places it above the ruler (z-10). */}
        <div className="sticky top-0 z-20 pointer-events-none" style={{ height: 0 }}>
          <div className="absolute left-40 top-0 right-0">
            <Playhead
              containerHeight={
                40 +
                tracksHeight +
                emotionTrackHeight +
                dialogueTrackHeight +
                scriptSegmentTrackHeight +
                svgObjectTrackHeight +
                keyframeTrackHeight +
                mediaTrackHeight +
                htmlTemplateTrackHeight +
                textOverlayTrackHeight +
                lottieTrackHeight +
                shapeTrackHeight +
                character3DTrackHeight +
                pixelArtCharacterTrackHeight +
                cameraTrackHeight +
                whiteboardTrackHeight +
                24
              }
            />
          </div>
        </div>

        {/* Time Ruler + Tracks share the same wide container so they scroll together */}
        <div className="relative" style={{ minWidth: totalWidth + 160 }}>
          {/* Time Ruler */}
          <div className="sticky top-0 z-10 flex">
            <div className="w-40 flex-shrink-0 bg-zinc-800 border-r border-zinc-700/50 border-b border-zinc-700 sticky left-0 z-10" />
            <TimeRuler onSeek={seekToFrame} />
          </div>
          {/* Beat Markers — vertical lines at detected beat positions */}
          {beats.length > 0 && (
            <div className="absolute top-10 left-40 right-0 bottom-0 pointer-events-none z-[1]">
              {beats.map((beatSec, i) => {
                const left = Math.round(beatSec * fps) * pixelsPerFrame
                const isStrong = i % 4 === 0
                return (
                  <div key={i} className="absolute top-0 bottom-0" style={{ left }}>
                    <div className={isStrong ? 'w-px h-full bg-pink-500/30' : 'w-px h-full bg-pink-500/15'} />
                  </div>
                )
              })}
            </div>
          )}

          {/* User Markers — vertical dashed lines at named marker positions */}
          {markers.length > 0 && (
            <div className="absolute top-10 left-40 right-0 bottom-0 pointer-events-none z-[2]">
              {markers.map((marker) => {
                const left = marker.frame * pixelsPerFrame
                return (
                  <div key={marker.id} className="absolute top-0 bottom-0" style={{ left }}>
                    <div
                      className="w-px h-full"
                      style={{
                        opacity: 0.4,
                        backgroundImage: `repeating-linear-gradient(to bottom, ${marker.color} 0px, ${marker.color} 4px, transparent 4px, transparent 8px)`,
                        backgroundSize: '1px 8px',
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Script Segment Tracks — one bar per [expression] cue segment */}
          <ScriptSegmentTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Dialogue Character Tracks */}
          <DialogueTrack pixelsPerFrame={pixelsPerFrame} />

          {/* SVG Object Tracks — one bar per Claude-generated object */}
          <SVGObjectTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Keyframe Animation Tracks — one row per object with keyframes */}
          <KeyframeTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Bone Pose Tracks — one row per rigged character */}
          <BonePoseTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Media Image Tracks — one bar per image on canvas */}
          <MediaTrack pixelsPerFrame={pixelsPerFrame} />

          {/* HTML Template Tracks — one bar per live template on canvas */}
          <HTMLTemplateTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Text Overlay Tracks — one bar per text overlay */}
          <TextOverlayTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Lottie Animation Tracks — one bar per active animation */}
          <LottieTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Shape Tracks — one bar per shape on canvas */}
          <ShapeTrack pixelsPerFrame={pixelsPerFrame} />

          {/* 3D Character Tracks — one bar per 3D character on canvas */}
          <Character3DTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Pixel Art Character Tracks — one bar per pixel art character on canvas */}
          <PixelArtCharacterTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Whiteboard Stroke Tracks — one bar per stroke/eraser */}
          <WhiteboardStrokeTrack pixelsPerFrame={pixelsPerFrame} />

          {/* Camera Keyframe Track */}
          <CameraTrack />

          {/* Tracks */}
          <div>
            {tracks.map((track, index) => (
              <Track
                key={track.id}
                track={track}
                index={index}
                pixelsPerFrame={pixelsPerFrame}
                isDragging={dragIndex === index}
                isDropTarget={dropTargetIndex === index}
                dropPosition={dropTargetIndex === index ? dropPosition : null}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {/* Add Track Button */}
          <button
            onClick={handleAddTrack}
            className="flex items-center gap-2 w-40 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors sticky left-0 bg-zinc-800"
          >
            <Plus size={16} />
            Add Track
          </button>
        </div>
      </div>
    </div>
  )
})
