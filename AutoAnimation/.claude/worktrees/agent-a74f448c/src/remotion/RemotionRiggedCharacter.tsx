import { useRef, useEffect, useCallback, useState } from 'react'
import { useFrame, useComposition } from '@/engine'
import type { RigExportData } from './types'
import type { BoneSkeleton, BonePose, MeshData, VertexSkinning } from '@/types/rig'
import { generateGridMesh, generateAlphaAwareMesh } from '@/services/meshGenerator'
import { computeSkinningWeights, deformMesh } from '@/services/meshDeformer'
import { renderMeshToCanvas, computeAffineTransform } from '@/services/meshRenderer'
import { getPoseAtFrame } from '@/services/poseInterpolation'
import { BoneRiggingPlaybackEngine } from '@/services/boneriggingPlayback'
import type { SerializedRigData } from '@bonerigging/core'
import type { BonePoseKeyframe } from '@/types/rig'
import type { EasingType } from '@/types/keyframes'

interface RemotionRiggedCharacterProps {
  rigData: RigExportData
}

/**
 * Remotion-compatible rigged character renderer.
 * Uses useCurrentFrame() to drive mesh deformation for video export.
 * Supports both standard LBS and full-fidelity bonerigging deformation.
 *
 * IMPORTANT: When bonerigging data is present, we use the bonerigging engine's
 * own mesh (vertices, UVs, triangles) — NOT the AutoStudio generateGridMesh.
 * The two mesh formats are incompatible (different vertex counts and layouts).
 */
export function RemotionRiggedCharacter({ rigData }: RemotionRiggedCharacterProps) {
  const frame = useFrame()
  const { fps } = useComposition()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textureRef = useRef<HTMLImageElement | null>(null)
  const [textureLoaded, setTextureLoaded] = useState(false)
  /** AutoStudio LBS mesh — only used when no bonerigging data */
  const meshRef = useRef<MeshData | null>(null)
  const skinningRef = useRef<VertexSkinning | null>(null)
  /** BoneRigging playback engine for full-fidelity deformation */
  const brEngineRef = useRef<BoneRiggingPlaybackEngine | null>(null)

  const hasBonerigging = !!rigData.boneriggingSerializedData

  // Build skeleton from export data (only needed for LBS fallback)
  const skeleton: BoneSkeleton = {
    joints: rigData.skeleton.joints.map((j) => ({
      id: j.id,
      name: j.name,
      parentId: j.parentId,
      restPosition: j.restPosition,
      category: j.category as any,
    })),
    rootJointId: rigData.skeleton.rootJointId,
  }

  const restPose: BonePose = rigData.restPose

  // Initialize BoneRigging playback engine if rig has bonerigging data
  useEffect(() => {
    if (!rigData.boneriggingSerializedData) {
      brEngineRef.current = null
      return
    }
    try {
      const serialized = JSON.parse(rigData.boneriggingSerializedData) as SerializedRigData
      brEngineRef.current = new BoneRiggingPlaybackEngine(serialized)
      console.log('[RemotionRig] BoneRigging playback engine initialized, animations:', brEngineRef.current.animationCount)
    } catch (err) {
      console.error('[RemotionRig] Failed to init bonerigging engine:', err)
      brEngineRef.current = null
    }
  }, [rigData.boneriggingSerializedData])

  // Load texture image (and generate LBS mesh only if not using bonerigging)
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      textureRef.current = img
      setTextureLoaded(true)
      if (!hasBonerigging) {
        // Generate alpha-aware mesh (only covers opaque pixels, no transparent stretching)
        // Pass imageData to skinning for alpha-barrier checks
        let mesh: MeshData
        let imgData: ImageData | undefined
        try {
          const tmpCanvas = document.createElement('canvas')
          tmpCanvas.width = img.naturalWidth
          tmpCanvas.height = img.naturalHeight
          const tmpCtx = tmpCanvas.getContext('2d')!
          tmpCtx.drawImage(img, 0, 0)
          imgData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height)
          mesh = generateAlphaAwareMesh(imgData, rigData.meshGridSpacing)
        } catch {
          mesh = generateGridMesh(rigData.imageWidth, rigData.imageHeight, rigData.meshGridSpacing)
        }
        meshRef.current = mesh
        const skinning = computeSkinningWeights(mesh, skeleton, undefined, imgData)
        skinningRef.current = skinning
      }
    }
    img.src = rigData.sourceImageUrl
  }, [rigData.sourceImageUrl, hasBonerigging])

  /**
   * Render bonerigging mesh directly to canvas.
   * Uses the bonerigging mesh's own vertices, UVs, and triangles
   * (NOT AutoStudio's generateGridMesh which has different vertex layout).
   */
  const renderBoneriggingMesh = useCallback((
    ctx: CanvasRenderingContext2D,
    brEngine: BoneRiggingPlaybackEngine,
    deformedPositions: { x: number; y: number }[],
    texture: HTMLImageElement,
  ) => {
    const brMesh = brEngine.getMeshData()
    if (!brMesh) return

    const imgW = texture.width
    const imgH = texture.height
    const { triangles, uvs } = brMesh

    for (const tri of triangles) {
      const i0 = tri.v0
      const i1 = tri.v1
      const i2 = tri.v2

      // Source triangle in texture space (from bonerigging UVs)
      const srcX0 = uvs[i0].u * imgW
      const srcY0 = uvs[i0].v * imgH
      const srcX1 = uvs[i1].u * imgW
      const srcY1 = uvs[i1].v * imgH
      const srcX2 = uvs[i2].u * imgW
      const srcY2 = uvs[i2].v * imgH

      // Destination triangle from deformed positions
      const dstX0 = deformedPositions[i0].x
      const dstY0 = deformedPositions[i0].y
      const dstX1 = deformedPositions[i1].x
      const dstY1 = deformedPositions[i1].y
      const dstX2 = deformedPositions[i2].x
      const dstY2 = deformedPositions[i2].y

      const transform = computeAffineTransform(
        srcX0, srcY0, srcX1, srcY1, srcX2, srcY2,
        dstX0, dstY0, dstX1, dstY1, dstX2, dstY2,
      )
      if (!transform) continue

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(dstX0, dstY0)
      ctx.lineTo(dstX1, dstY1)
      ctx.lineTo(dstX2, dstY2)
      ctx.closePath()
      ctx.clip()
      ctx.setTransform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)
      ctx.drawImage(texture, 0, 0)
      ctx.restore()
    }
  }, [])

  // Render on each frame (textureLoaded in deps ensures we re-run once image arrives)
  useEffect(() => {
    const canvas = canvasRef.current
    const texture = textureRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.resetTransform()

    const brEngine = brEngineRef.current
    if (brEngine) {
      // ── BoneRigging full-fidelity path ──
      // Use the bonerigging engine's own mesh and deformation pipeline.
      let deformedPositions: { x: number; y: number }[]

      if (brEngine.animationCount > 0) {
        // Play the first animation at the current frame time
        const time = frame / fps
        deformedPositions = brEngine.getDeformedMeshAtTime(0, time)
      } else {
        // No animations — render rest pose (all-zero deltas)
        deformedPositions = brEngine.getRestPositions()
      }

      renderBoneriggingMesh(ctx, brEngine, deformedPositions, texture)
    } else {
      // ── Standard LBS fallback ──
      const mesh = meshRef.current
      const skinning = skinningRef.current
      if (!mesh || !skinning) return

      // Get pose at current frame from exported pose tracks
      let currentPose = restPose
      if (rigData.poseTracks.length > 0) {
        const track = rigData.poseTracks[0]
        if (track.keyframes.length > 0) {
          const keyframes: BonePoseKeyframe[] = track.keyframes.map((kf, i) => ({
            id: `kf-${i}`,
            frame: kf.frame,
            pose: kf.pose,
            easing: (kf.easing || 'ease-in-out') as EasingType,
          }))
          const interpolated = getPoseAtFrame(keyframes, frame)
          if (interpolated) currentPose = interpolated
        }
      }

      deformMesh(mesh, skinning, skeleton, restPose, currentPose)
      renderMeshToCanvas(ctx, mesh, texture)
    }
  }, [frame, fps, textureLoaded, restPose, rigData.poseTracks, renderBoneriggingMesh])

  return (
    <canvas
      ref={canvasRef}
      width={rigData.imageWidth}
      height={rigData.imageHeight}
      style={{
        width: rigData.imageWidth,
        height: rigData.imageHeight,
        position: 'absolute',
      }}
    />
  )
}
