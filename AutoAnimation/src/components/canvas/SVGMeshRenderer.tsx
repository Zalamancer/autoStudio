import { useRef, useEffect, useCallback, useState, memo } from 'react'
import { useRigStore } from '@/stores/useRigStore'
import { useTimelineStore } from '@/stores'
import { deformMesh } from '@/services/meshDeformer'
import {
  SVG_NS,
  buildSVGTrianglePoints,
  buildSVGMatrix,
  computeAffineTransform,
} from '@/services/svgMeshRenderer'
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

interface SVGMeshRendererProps {
  rigId: string
  characterId: string // 'primary' or dialogue character id
  width?: number
  height?: number
}

/** Stored references to SVG DOM elements for imperative per-frame updates */
interface TriangleElements {
  polygon: SVGPolygonElement
  image: SVGImageElement
}

/**
 * SVG mesh renderer for a rigged 2D character.
 * Builds SVG clipPath+image elements for each triangle, then updates
 * polygon points and image transforms imperatively each frame via RAF.
 */
export const SVGMeshRenderer = memo(function SVGMeshRenderer({
  rigId,
  characterId,
  width,
  height,
}: SVGMeshRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  /** Array of per-triangle DOM element references for imperative updates */
  const triangleElementsRef = useRef<TriangleElements[]>([])
  /** Mutable working copy of the mesh — safe to write deformedX/Y on every frame */
  const workingMeshRef = useRef<MeshData | null>(null)
  /** Track which rig mesh version we cloned from */
  const meshVersionRef = useRef('')
  /** Track which SVG DOM version we built (to know when to rebuild) */
  const svgBuiltVersionRef = useRef('')
  /** State variable that tracks when SVG DOM is built (triggers animation loop) */
  const [svgBuiltVersion, setSvgBuiltVersion] = useState('')

  const rig = useRigStore((s) => s.rigs[rigId])

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

  // ── Build SVG DOM imperatively when mesh changes ────────────────────
  useEffect(() => {
    const svg = svgRef.current
    const workingMesh = workingMeshRef.current
    if (!svg || !rig || !workingMesh) return

    const version = `${workingMesh.vertices.length}_${workingMesh.triangles.length}`
    if (version === svgBuiltVersionRef.current) return

    // Clear existing SVG children
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }

    const { triangles, vertices, imageWidth, imageHeight } = workingMesh

    // Create <defs> with clipPaths
    const defs = document.createElementNS(SVG_NS, 'defs')

    // Create triangle elements
    const elements: TriangleElements[] = []

    for (let i = 0; i < triangles.length; i++) {
      const tri = triangles[i]
      const v0 = vertices[tri.a]
      const v1 = vertices[tri.b]
      const v2 = vertices[tri.c]

      // ClipPath with polygon
      const clipPath = document.createElementNS(SVG_NS, 'clipPath')
      clipPath.setAttribute('id', `ct-${i}`)
      const polygon = document.createElementNS(SVG_NS, 'polygon')
      polygon.setAttribute('points', buildSVGTrianglePoints(v0, v1, v2))
      clipPath.appendChild(polygon)
      defs.appendChild(clipPath)

      // Group clipped to the triangle, containing the transformed image
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('clip-path', `url(#ct-${i})`)

      const image = document.createElementNS(SVG_NS, 'image')
      image.setAttribute('href', rig.sourceImageUrl)
      image.setAttribute('width', String(imageWidth))
      image.setAttribute('height', String(imageHeight))
      // Initial transform = identity (will be updated on first frame)
      image.setAttribute('transform', 'matrix(1,0,0,1,0,0)')
      // Prevent image smoothing artifacts at triangle edges
      image.setAttribute('image-rendering', 'auto')
      g.appendChild(image)

      svg.appendChild(g)
      elements.push({ polygon, image })
    }

    // Insert defs at the beginning
    svg.insertBefore(defs, svg.firstChild)

    triangleElementsRef.current = elements
    svgBuiltVersionRef.current = version
    setSvgBuiltVersion(version)
  }, [rig?.mesh, rig?.sourceImageUrl])

  // ── Per-frame render function ───────────────────────────────────────
  const renderFrame = useCallback(() => {
    const workingMesh = workingMeshRef.current
    const elements = triangleElementsRef.current
    if (!workingMesh || !rig || elements.length === 0) return

    // Get current pose (always read fresh from store)
    const store = useRigStore.getState()
    const currentPose = store.currentPose || rig.restPose

    // Deform the mutable working mesh
    deformMesh(workingMesh, rig.skinning, rig.skeleton, rig.restPose, currentPose)

    const { vertices, triangles, imageWidth, imageHeight } = workingMesh

    // Update each triangle's polygon points and image transform
    for (let i = 0; i < triangles.length; i++) {
      const tri = triangles[i]
      const v0 = vertices[tri.a]
      const v1 = vertices[tri.b]
      const v2 = vertices[tri.c]

      const el = elements[i]
      if (!el) continue

      // Update clip polygon to deformed positions
      el.polygon.setAttribute('points', buildSVGTrianglePoints(v0, v1, v2))

      // Compute affine transform: source UV triangle → deformed triangle
      const srcX0 = v0.u * imageWidth
      const srcY0 = v0.v * imageHeight
      const srcX1 = v1.u * imageWidth
      const srcY1 = v1.v * imageHeight
      const srcX2 = v2.u * imageWidth
      const srcY2 = v2.v * imageHeight

      const transform = computeAffineTransform(
        srcX0, srcY0, srcX1, srcY1, srcX2, srcY2,
        v0.deformedX, v0.deformedY,
        v1.deformedX, v1.deformedY,
        v2.deformedX, v2.deformedY
      )

      if (transform) {
        el.image.setAttribute('transform', buildSVGMatrix(transform))
      }
    }
  }, [rig])

  // ── Animation loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (!rig || svgBuiltVersion === '') return

    let animationId: number
    let running = true

    const loop = () => {
      if (!running) return

      // Render current pose
      renderFrame()

      const isPlaying = useTimelineStore.getState().isPlaying
      if (isPlaying) {
        // During playback, get interpolated pose from pose tracks
        const frame = useTimelineStore.getState().currentFrame
        const interpolatedPose = useRigStore.getState().getInterpolatedPoseAtFrame(characterId, frame)
        if (interpolatedPose) {
          useRigStore.getState().setCurrentPose(interpolatedPose)
        }
      }

      animationId = requestAnimationFrame(loop)
    }

    animationId = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(animationId)
    }
  }, [rig?.id, characterId, renderFrame, svgBuiltVersion])

  // Recompute skinning weights once if they look too tight for the image size
  const skinningFixedRef = useRef(false)
  useEffect(() => {
    if (!rig || !rig.skinning || rig.skeleton.joints.length === 0) return
    if (skinningFixedRef.current) return
    const singleBound = rig.skinning.filter((w) => w.length <= 1).length
    const ratio = singleBound / rig.skinning.length
    if (ratio > 0.8 && rig.skinning.length > 100) {
      skinningFixedRef.current = true
      useRigStore.getState().recomputeSkinning(rigId)
    }
  }, [rig?.skinning?.length, rig?.skeleton?.joints?.length, rigId])

  // Re-render when renderFrame callback identity changes (e.g. rig data updated)
  useEffect(() => {
    renderFrame()
  }, [renderFrame])

  if (!rig) return null

  // Display size: use explicit props, otherwise scale the native image
  // down to a sensible canvas size (max 400px on the longest side).
  let svgWidth: number
  let svgHeight: number
  if (width || height) {
    svgWidth = width || rig.imageWidth
    svgHeight = height || rig.imageHeight
  } else {
    const MAX_DISPLAY = 400
    const aspect = rig.imageWidth / rig.imageHeight
    if (rig.imageWidth >= rig.imageHeight) {
      svgWidth = Math.min(rig.imageWidth, MAX_DISPLAY)
      svgHeight = svgWidth / aspect
    } else {
      svgHeight = Math.min(rig.imageHeight, MAX_DISPLAY)
      svgWidth = svgHeight * aspect
    }
  }

  return (
    <svg
      ref={svgRef}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${rig.imageWidth} ${rig.imageHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="max-w-none pointer-events-none"
      style={{
        width: svgWidth,
        height: svgHeight,
        overflow: 'hidden',
      }}
    />
  )
})
