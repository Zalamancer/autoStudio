import { useRef, useEffect, useCallback, useState } from 'react'
import { useRigStore } from '@/stores/useRigStore'
import { useTimelineStore } from '@/stores'
import { deformMesh } from '@/services/meshDeformer'
import { renderMeshToCanvas, renderMeshWireframe } from '@/services/meshRenderer'
import { BoneRiggingPlaybackEngine } from '@/services/boneriggingPlayback'
import type { SerializedRigData } from '@bonerigging/core'
import type { MeshData } from '@/types/rig'

/**
 * Create a deep mutable copy of MeshData so deformMesh can write deformedX/Y
 * without violating Immer's frozen-object constraints.
 */
function cloneMesh(mesh: MeshData): MeshData {
  return {
    vertices: mesh.vertices.map((v) => ({ ...v })),
    triangles: mesh.triangles.map((t) => ({ ...t })),
    imageWidth: mesh.imageWidth,
    imageHeight: mesh.imageHeight,
    gridSpacing: mesh.gridSpacing,
  }
}

interface RiggedCharacterRendererProps {
  rigId: string
  characterId: string // 'primary' or dialogue character id
  width?: number
  height?: number
}

/**
 * Canvas 2D mesh renderer for a rigged 2D character.
 * Loads the source image, deforms the mesh per frame via requestAnimationFrame,
 * and renders the textured triangles onto a <canvas> element.
 */
export function RiggedCharacterRenderer({
  rigId,
  characterId,
  width,
  height,
}: RiggedCharacterRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textureRef = useRef<HTMLImageElement | null>(null)
  // Use state (not ref) so that the RAF loop effect re-runs when texture loads
  const [textureLoaded, setTextureLoaded] = useState(false)
  /** Mutable working copy of the mesh — safe to write deformedX/Y on every frame */
  const workingMeshRef = useRef<MeshData | null>(null)
  /** Track which rig mesh version we cloned from (by vertex count + triangle count) */
  const meshVersionRef = useRef('')
  /** BoneRigging playback engine for full-fidelity deformation (S&S, springs, etc.) */
  const brEngineRef = useRef<BoneRiggingPlaybackEngine | null>(null)
  const brEngineInitRef = useRef('')

  const rig = useRigStore((s) => s.rigs[rigId])
  const showWireframe = useRigStore((s) => s.showMeshWireframe)
  const isRigMode = useRigStore((s) => s.isRigMode)

  // Initialize BoneRigging playback engine if rig has bonerigging data
  useEffect(() => {
    if (!rig?.boneriggingSerializedData) {
      brEngineRef.current = null
      brEngineInitRef.current = ''
      return
    }
    // Only re-init if the data changed — use length + sampled chars as fingerprint
    const data = rig.boneriggingSerializedData
    const dataHash = `${data.length}:${data.charCodeAt(0)}:${data.charCodeAt(Math.floor(data.length / 4))}:${data.charCodeAt(Math.floor(data.length / 2))}:${data.charCodeAt(data.length - 1)}`
    if (dataHash === brEngineInitRef.current) return
    try {
      const serialized = JSON.parse(rig.boneriggingSerializedData) as SerializedRigData
      brEngineRef.current = new BoneRiggingPlaybackEngine(serialized)
      brEngineInitRef.current = dataHash
      console.log('[RiggedRenderer] BoneRigging playback engine initialized')
    } catch (err) {
      console.error('[RiggedRenderer] Failed to init bonerigging engine:', err)
      brEngineRef.current = null
    }
  }, [rig?.boneriggingSerializedData])

  // Keep the working mesh in sync with the store mesh (re-clone when mesh changes)
  useEffect(() => {
    if (!rig?.mesh) {
      workingMeshRef.current = null
      return
    }
    const version = `${rig.mesh.vertices.length}_${rig.mesh.triangles.length}`
    if (version !== meshVersionRef.current) {
      workingMeshRef.current = cloneMesh(rig.mesh)
      meshVersionRef.current = version
    }
  }, [rig?.mesh])

  // Load texture image
  useEffect(() => {
    if (!rig?.sourceImageUrl) return
    setTextureLoaded(false)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      textureRef.current = img
      setTextureLoaded(true) // triggers RAF loop effect to re-run
    }
    img.onerror = () => {
      console.error('[RiggedRenderer] Texture failed to load:', rig.sourceImageUrl)
    }
    img.src = rig.sourceImageUrl
  }, [rig?.sourceImageUrl])

  const renderFrame = useCallback((overridePose?: Record<string, { dx: number; dy: number; rotation: number }>) => {
    const canvas = canvasRef.current
    const texture = textureRef.current
    const workingMesh = workingMeshRef.current
    if (!canvas || !texture || !rig || !workingMesh) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use override pose (from playback interpolation) or read from store
    const currentPose = overridePose || useRigStore.getState().currentPose || rig.restPose

    const brEngine = brEngineRef.current
    if (brEngine) {
      // ── BoneRigging full-fidelity deformation path ──
      // Convert AutoStudio BonePose {dx, dy, rotation} to bonerigging {x, y} deltas
      const poseDeltas: Record<string, { x: number; y: number }> = {}
      for (const [jointId, state] of Object.entries(currentPose)) {
        // Map joint ID to joint name (bonerigging uses names, AutoStudio uses IDs)
        const joint = rig.skeleton.joints.find((j) => j.id === jointId)
        const key = joint?.name || jointId
        poseDeltas[key] = { x: state.dx, y: state.dy }
      }

      const deformedPositions = brEngine.getDeformedMeshForPose(poseDeltas)

      // Write bonerigging deformed positions back onto the working mesh vertices
      const len = Math.min(workingMesh.vertices.length, deformedPositions.length)
      for (let i = 0; i < len; i++) {
        workingMesh.vertices[i].deformedX = deformedPositions[i].x
        workingMesh.vertices[i].deformedY = deformedPositions[i].y
      }
    } else {
      // ── Standard LBS deformation path ──
      deformMesh(workingMesh, rig.skinning, rig.skeleton, rig.restPose, currentPose)
    }

    // Clear and render
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.resetTransform()

    renderMeshToCanvas(ctx, workingMesh, texture)

    // Optional wireframe overlay
    if (showWireframe && isRigMode) {
      ctx.resetTransform()
      renderMeshWireframe(ctx, workingMesh)
    }
  }, [rig, showWireframe, isRigMode])

  // Animation loop — renders deformed mesh every frame during playback.
  // When paused, subscribes to store changes so manual pose edits still render.
  useEffect(() => {
    if (!rig || !textureLoaded) return

    let animationId: number
    let running = true

    const loop = () => {
      if (!running) return

      const state = useTimelineStore.getState()
      if (state.isPlaying) {
        // During playback, get interpolated pose and render directly (no store update)
        const interpolatedPose = useRigStore.getState().getInterpolatedPoseAtFrame(characterId, state.currentFrame)
        renderFrame(interpolatedPose || undefined)
        animationId = requestAnimationFrame(loop)
      }
      // When not playing, stop the RAF loop — store subscription handles updates
    }

    // Render once immediately
    renderFrame()

    // Subscribe to store changes for paused-mode updates (joint dragging, pose edits)
    const unsubRig = useRigStore.subscribe(() => {
      if (!useTimelineStore.getState().isPlaying) {
        renderFrame()
      }
    })

    // Subscribe to timeline for play/pause transitions and scrubbing
    const unsubTimeline = useTimelineStore.subscribe((state, prev) => {
      if (state.isPlaying && !prev.isPlaying) {
        // Playback started — kick off RAF loop
        animationId = requestAnimationFrame(loop)
      }
      if (!state.isPlaying && state.currentFrame !== prev.currentFrame) {
        // Scrubbing while paused — render the interpolated pose at the new frame
        const interpolatedPose = useRigStore.getState().getInterpolatedPoseAtFrame(characterId, state.currentFrame)
        renderFrame(interpolatedPose || undefined)
      }
    })

    // Start RAF loop if already playing
    if (useTimelineStore.getState().isPlaying) {
      animationId = requestAnimationFrame(loop)
    }

    return () => {
      running = false
      cancelAnimationFrame(animationId)
      unsubRig()
      unsubTimeline()
    }
  }, [rig?.id, characterId, renderFrame, textureLoaded])

  // Recompute skinning weights once if they look too tight for the image size.
  // This handles rigs created before the adaptive influenceRadius fix.
  const skinningFixedRef = useRef(false)
  useEffect(() => {
    if (!rig || !rig.skinning || rig.skeleton.joints.length === 0) return
    if (skinningFixedRef.current) return // only run once
    // Check if most vertices are bound to just 1 joint (sign of too-tight radius)
    const singleBound = rig.skinning.filter((w) => w.length <= 1).length
    const ratio = singleBound / rig.skinning.length
    if (ratio > 0.8 && rig.skinning.length > 100) {
      skinningFixedRef.current = true
      // Likely using old default radius=80 on a large image — recompute
      useRigStore.getState().recomputeSkinning(rigId)
    }
  }, [rig?.skinning?.length, rig?.skeleton?.joints?.length, rigId])

  // Also re-render when renderFrame callback identity changes (e.g. wireframe toggled)
  useEffect(() => {
    renderFrame()
  }, [renderFrame])

  if (!rig) return null

  const canvasWidth = width || rig.imageWidth
  const canvasHeight = height || rig.imageHeight

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="max-w-none pointer-events-none"
      style={{
        width: canvasWidth,
        height: canvasHeight,
      }}
    />
  )
}
